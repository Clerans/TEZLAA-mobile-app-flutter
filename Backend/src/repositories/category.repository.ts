import prisma from '../config/database.js';
import { Category } from '@prisma/client';

export class CategoryRepository {
  async findAllActive(): Promise<Category[]> {
    return prisma.category.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findById(id: string): Promise<(Category & { _count: { products: number } }) | null> {
    return prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async findBySlug(slug: string): Promise<Category | null> {
    return prisma.category.findUnique({
      where: { slug },
    });
  }
}

export const categoryRepository = new CategoryRepository();
export default categoryRepository;
