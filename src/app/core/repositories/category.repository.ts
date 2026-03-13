import { inject, Injectable } from '@angular/core';
import { DatabaseService } from '@core/services/database.service';
import { Category } from '@core/models/category.model';

@Injectable({
  providedIn: 'root',
})
export class CategoryRepository {
  private databaseService = inject(DatabaseService);

  formatDBRowToCategory(row: any): Category {
    return {
      id: Number(row.id),
      name: row.name,
      imageName: row.image_name,
    } as Category;
  }

  createCategory(name: string, imageName: string): Promise<void> {
    return this.databaseService.withConn(async (conn) => {
      await conn.run(
        `
        INSERT INTO category (name, image_name)
        VALUES (?, ?)
      `,
        [name, imageName],
      );
    });
  }

  async getAllCategories(): Promise<Category[]> {
    const res = await this.databaseService.withConn(async (conn) =>
      conn.query(`
        SELECT id, name, image_name
        FROM category
      `),
    );

    if (!res.values) {
      return [];
    }

    return res.values?.map((row: any) => this.formatDBRowToCategory(row));
  }
}
