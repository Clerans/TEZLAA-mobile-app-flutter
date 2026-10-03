import prisma from '../config/database.js';
import { Branch } from '@prisma/client';

export class BranchRepository {
  async findAllActive(): Promise<Branch[]> {
    return prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<Branch | null> {
    return prisma.branch.findUnique({
      where: { id },
    });
  }

  async findBySlug(slug: string): Promise<Branch | null> {
    return prisma.branch.findUnique({
      where: { slug },
    });
  }
}

export const branchRepository = new BranchRepository();
export default branchRepository;
