import { inject, Injectable, isDevMode } from '@angular/core';
import { ItemRepository } from '@core/repositories/item.repository';
import { TaskRepository } from '@core/repositories/task.repository';
import { Task, TaskEffort, TaskFrequency } from '@core/models/task.model';
import { CategoryRepository } from '@core/repositories/category.repository';

/**
 * Development-only service for seeding and resetting app state during local testing.
 * All methods are guarded by isDevMode() and are no-ops in production builds.
 */
@Injectable({
  providedIn: 'root',
})
export class DevToolsService {
  private itemRepository = inject(ItemRepository);
  private taskRepository = inject(TaskRepository);
  private categoryRepository = inject(CategoryRepository);

  async addTestItemsToInventory(): Promise<void> {
    if (!isDevMode()) {
      return;
    }

    // Lista completa (IDs únicos) tomada del seed SQL
    const itemIds = [
      1, 15, 26, 27, 55, 65, 67, 101, 106, 116, 117, 118, 124, 128, 206, 207, 222, 223, 225, 226,
      227, 228, 229, 230, 231, 349, 350, 351, 355, 356, 357, 374, 375, 376, 447, 548, 551, 554, 558,
      565, 568, 592, 1441, 1445, 1457, 1462, 1466, 1477, 1482, 1484, 1493, 1506, 1597, 1598, 1684,
      1685, 1689, 1728, 1737, 1805, 1806, 1811, 1812, 1813, 1837, 1838, 1839, 1840, 1846, 1906,
      1907, 1909, 1911, 1922, 1923, 1925, 1927, 1938, 1939, 1941, 1943, 1960, 1961, 1962, 1963,
      1964, 1976, 1977, 1978, 1979, 1980, 1992, 1993, 1994, 1995, 1996,
    ];

    // Añade cada item con cantidad 1
    for (const id of itemIds) {
      await this.itemRepository.addItemToInventory(id, false, 1);
    }
  }

  async createTestCategories(): Promise<void> {
    if (!isDevMode()) {
      return;
    }

    const testCategories = [
      { name: 'Categoría 1', imageName: 'categoria1.png' },
      { name: 'Categoría 2', imageName: 'categoria2.png' },
      { name: 'Categoría 3', imageName: 'categoria3.png' },
      { name: 'Categoría 4', imageName: 'categoria4.png' },
    ];

    for (const category of testCategories) {
      await this.categoryRepository.createCategory(category.name, category.imageName);
    }
  }

  async createTestTasks(): Promise<void> {
    if (!isDevMode()) {
      return;
    }

    const testTasks: Omit<Task, 'id'>[] = [
      {
        name: 'Tarea de prueba 1',
        frequency: TaskFrequency.No_repeat,
        interval: 2,
        effort: TaskEffort.Medium,
        category: { id: 1, name: 'Categoría 1', imageName: 'categoria1.png' },
        resetOnCycle: false,
      },
      {
        name: 'Tarea de prueba 2',
        frequency: TaskFrequency.Daily,
        interval: 1,
        effort: TaskEffort.High,
        category: { id: 2, name: 'Categoría 2', imageName: 'categoria2.png' },
        resetOnCycle: true,
      },
      {
        name: 'Tarea de prueba 3',
        frequency: TaskFrequency.Weekly,
        interval: 1,
        effort: TaskEffort.Low,
        category: { id: 3, name: 'Categoría 3', imageName: 'categoria3.png' },
        resetOnCycle: true,
      },
      {
        name: 'Tarea de prueba 4',
        frequency: TaskFrequency.Monthly,
        interval: 1,
        effort: TaskEffort.Very_high,
        category: { id: 4, name: 'Categoría 4', imageName: 'categoria4.png' },
        resetOnCycle: true,
      },
    ];

    for (const task of testTasks) {
      await this.taskRepository.createTask(task);
    }
  }
}
