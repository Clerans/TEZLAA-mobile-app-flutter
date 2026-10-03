import prisma from '../config/database.js';
import { Prisma } from '@prisma/client';

export interface ProductQueryFilters {
  categorySlug?: string;
  categoryId?: string;
  search?: string;
  isFeatured?: boolean;
  isRecommended?: boolean;
  isFreshToday?: boolean;
  isAvailable?: boolean;
  sort?: 'price_asc' | 'price_desc' | 'rating' | 'popular' | 'latest';
  page?: number;
  limit?: number;
}

export class ProductRepository {
  async findMany(filters: ProductQueryFilters) {
    const {
      categorySlug,
      categoryId,
      search,
      isFeatured,
      isRecommended,
      isFreshToday,
      isAvailable,
      sort = 'latest',
      page = 1,
      limit = 20,
    } = filters;

    const where: Prisma.ProductWhereInput = {};

    if (isAvailable !== undefined) {
      where.isAvailable = isAvailable;
    } else {
      where.isAvailable = true;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    } else if (categorySlug && categorySlug !== 'all') {
      where.category = {
        slug: categorySlug,
      };
    }

    if (isFeatured !== undefined) where.isFeatured = isFeatured;
    if (isRecommended !== undefined) where.isRecommended = isRecommended;
    if (isFreshToday !== undefined) where.isFreshToday = isFreshToday;

    if (search && search.trim().length > 0) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = { displayOrder: 'asc' };
    if (sort === 'price_asc') orderBy = { price: 'asc' };
    else if (sort === 'price_desc') orderBy = { price: 'desc' };
    else if (sort === 'rating') orderBy = { rating: 'desc' };
    else if (sort === 'popular') orderBy = { ratingCount: 'desc' };
    else if (sort === 'latest') orderBy = { createdAt: 'desc' };

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          variants: {
            where: { isAvailable: true },
            orderBy: { price: 'asc' },
          },
          addons: {
            orderBy: { price: 'asc' },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: {
          where: { isAvailable: true },
          orderBy: { price: 'asc' },
        },
        addons: {
          orderBy: { price: 'asc' },
        },
      },
    });
  }

  async findBySlug(slug: string) {
    return prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        variants: {
          where: { isAvailable: true },
          orderBy: { price: 'asc' },
        },
        addons: {
          orderBy: { price: 'asc' },
        },
      },
    });
  }

  async findFeatured(limit = 6) {
    return prisma.product.findMany({
      where: { isFeatured: true, isAvailable: true },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: true,
        addons: true,
      },
      take: limit,
      orderBy: { rating: 'desc' },
    });
  }

  async findFreshToday(limit = 6) {
    return prisma.product.findMany({
      where: { isFreshToday: true, isAvailable: true },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: true,
        addons: true,
      },
      take: limit,
      orderBy: { displayOrder: 'asc' },
    });
  }
}

export const productRepository = new ProductRepository();
export default productRepository;
