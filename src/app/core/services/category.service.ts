import { inject, Injectable } from '@angular/core';
import { CategoryRepository } from '@core/repositories/category.repository';
import { Category } from '@core/models/category.model';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private categoryRepository = inject(CategoryRepository);

  async getAllCategories(): Promise<Category[]> {
    return await this.categoryRepository.getAllCategories();
  }
}
