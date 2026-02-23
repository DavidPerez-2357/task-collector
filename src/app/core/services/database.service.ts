import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Migration } from '@core/types/db.types';

@Injectable({ providedIn: 'root' })
export class DatabaseService {
  private http = inject(HttpClient);

  private sqlite = new SQLiteConnection(CapacitorSQLite);
  private conn?: SQLiteDBConnection;

  private readonly dbName = 'taskCollectorDB';
  private readonly dbVersion = 1;
  private readonly isWeb = Capacitor.getPlatform() === 'web';

  private opening?: Promise<void>;
  private initPromise?: Promise<void>;

  private _lock: Promise<void> = Promise.resolve();
  private async withLock<T>(fn: () => Promise<T>): Promise<T> {
    let release!: () => void;
    const prev = this._lock;
    this._lock = new Promise<void>((res) => (release = res));
    await prev;
    try {
      return await fn();
    } finally {
      release();
    }
  }

  private saveTimer: any = null;
  private saving = false;

  private txnDepth = 0;
  private detectTxnTokens(sql: string) {
    const s = sql.trim().toLowerCase();
    if (!s) return;
    if (/^begin\b/.test(s)) this.txnDepth++;
    if (/^(commit|rollback)\b/.test(s)) this.txnDepth = Math.max(0, this.txnDepth - 1);
  }

  private isWrite(sql: string) {
    return /^\s*(insert|update|delete|replace|create|alter|drop|vacuum|attach|detach|pragma\s+\w+\s*=\s*)\b/i.test(
      sql,
    );
  }

  private debounceSave(ms = 300) {
    if (!this.isWeb) return;
    if (this.txnDepth > 0) return;

    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(async () => {
      if (this.saving) return;
      try {
        this.saving = true;
        await this.withLock(() => this.saveWebStore());
      } finally {
        this.saving = false;
      }
    }, ms);
  }

  private readonly migrations: Migration[] = [
    {
      version: 1,
      sqlAssetPath: 'assets/db/migrations/001_init.sql',
      description: 'Init schema',
    },
    {
      version: 2,
      sqlAssetPath: 'assets/db/migrations/002_seed_data.sql',
      description: 'Seed initial data',
    },
  ];

  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      await this.open();
      await this.ensureMeta();
      await this.applyMigrations();
      if (this.isWeb) this.wrapForAutoPersist();
    })();

    try {
      await this.initPromise;
    } catch (e) {
      this.initPromise = undefined;
      throw e;
    }
  }

  async open(): Promise<void> {
    if (this.conn) return;
    if (this.opening) return this.opening;

    this.opening = this.openInternal();
    try {
      await this.opening;
    } finally {
      this.opening = undefined;
    }
  }

  private async openInternal(): Promise<void> {
    if (this.isWeb) {
      await customElements.whenDefined('jeep-sqlite').catch(() => void 0);
      const jeepEl = document.querySelector('jeep-sqlite') as any;
      if (jeepEl?.componentOnReady) await jeepEl.componentOnReady().catch(() => void 0);

      await CapacitorSQLite.initWebStore().catch(() => void 0);
    }

    await this.sqlite.checkConnectionsConsistency().catch(() => void 0);

    const { result } = await this.sqlite.isConnection(this.dbName, false);
    console.log('[DB] Connection exists:', result);
    if (result) {
      this.conn = await this.sqlite.retrieveConnection(this.dbName, false);
    } else {
      this.conn = await this.sqlite.createConnection(
        this.dbName,
        false,
        'no-encryption',
        this.dbVersion,
        false,
      );
    }

    await this.conn.open();
    await this.conn.execute('PRAGMA foreign_keys = ON;');
  }

  getConn(): SQLiteDBConnection {
    if (!this.conn) throw new Error('DB not opened. Call init() first.');
    return this.conn;
  }

  async withConn<T>(fn: (conn: SQLiteDBConnection) => Promise<T>): Promise<T> {
    await this.init();
    return fn(this.getConn());
  }

  //region Database Migrations
  private async ensureMeta(): Promise<void> {
    const conn = this.getConn();
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS schema_migrations(
        version INTEGER PRIMARY KEY NOT NULL,
        applied_at INTEGER NOT NULL
      );
    `);
  }

  private async getAppliedVersions(): Promise<Set<number>> {
    const conn = this.getConn();
    const res = await conn.query(`SELECT version FROM schema_migrations;`);
    const set = new Set<number>();
    for (const r of res.values ?? []) set.add(Number((r as any).version));
    return set;
  }

  private async applyMigrations(): Promise<void> {
    const conn = this.getConn();
    const applied = await this.getAppliedVersions();
    const sorted = [...this.migrations].sort((a, b) => a.version - b.version);

    // Serializa migraciones (muy importante en Web)
    await this.withLock(async () => {
      for (const m of sorted) {
        if (applied.has(m.version)) continue;

        const sql = await this.loadMigrationSql(m);

        // Nota clave: NO hacemos BEGIN/COMMIT aquí para evitar nested transactions.
        // Ejecutamos statements secuencialmente.
        await this.executeSqlScript(sql);

        // Marcamos como aplicada en una operación transaccional propia (transaction=true)
        await conn.run(
          `INSERT INTO schema_migrations(version, applied_at) VALUES(?, ?);`,
          [m.version, Date.now()],
          true,
        );

        // En Web, persiste tras migración (fuera de transacción)
        if (this.isWeb) await this.saveWebStore();
      }
    });
  }

  private async loadMigrationSql(m: Migration): Promise<string> {
    if (m.sqlInline?.trim()) return m.sqlInline;

    if (m.sqlAssetPath) {
      return await firstValueFrom(this.http.get(m.sqlAssetPath, { responseType: 'text' }));
    }

    throw new Error(`Migration ${m.version} has no SQL source.`);
  }

  private async executeSqlScript(script: string): Promise<void> {
    const conn = this.getConn();

    const cleaned = script
      .replace(/\r\n/g, '\n')
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n');

    const statements = cleaned
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      const lower = stmt.toLowerCase().trim();
      if (lower.startsWith('begin') || lower.startsWith('commit') || lower.startsWith('rollback')) {
        throw new Error(
          `Remove transaction statements (BEGIN/COMMIT/ROLLBACK) from migration scripts. Found: ${stmt}`,
        );
      }

      // Actualiza contador transacciones detectadas (por si alguien usa BEGIN en runtime)
      this.detectTxnTokens(stmt);

      await conn.execute(stmt + ';');
    }
  }
  //endregion

  //region Auto persist Web
  private wrapForAutoPersist(): void {
    const conn = this.getConn();

    const origRun = conn.run.bind(conn);
    const origExecute = conn.execute.bind(conn);
    const origQuery = conn.query.bind(conn);

    conn.run = async (statement: string, values?: any[]) =>
      this.withLock(async () => {
        const res = await origRun(statement, values ?? []);
        this.detectTxnTokens(statement);
        if (this.isWrite(statement) && this.txnDepth === 0) this.debounceSave();
        return res;
      });

    conn.execute = async (statements: string) =>
      this.withLock(async () => {
        const res = await origExecute(statements);

        const parts = statements
          .split(';')
          .map((s) => s.trim())
          .filter(Boolean);
        let hasWrite = false;
        for (const s of parts) {
          this.detectTxnTokens(s);
          if (this.isWrite(s)) hasWrite = true;
        }

        if (hasWrite && this.txnDepth === 0) this.debounceSave();
        return res;
      });

    conn.query = async (statement: string, values?: any[]) =>
      this.withLock(async () => {
        this.detectTxnTokens(statement);
        return origQuery(statement, values ?? []);
      });
  }

  private async saveWebStore(): Promise<void> {
    if (!this.isWeb) return;

    try {
      await CapacitorSQLite.saveToStore({ database: this.dbName });
    } catch (e) {
      console.warn('[DB] saveToStore error:', e);
    }
  }
  //endregion
}
