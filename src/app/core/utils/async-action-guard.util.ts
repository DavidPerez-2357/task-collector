/**
 * Guards an async action against concurrent execution.
 *
 * Usage:
 *   readonly guard = new AsyncActionGuard();
 *   // In template: [disabled]="guard.isBusy"
 *   // In method: await this.guard.run(async () => { ... });
 */
export class AsyncActionGuard {
  private _busy = false;

  get isBusy(): boolean {
    return this._busy;
  }

  async run<T>(fn: () => Promise<T>): Promise<T | undefined> {
    if (this._busy) return undefined;
    this._busy = true;
    try {
      return await fn();
    } finally {
      this._busy = false;
    }
  }
}
