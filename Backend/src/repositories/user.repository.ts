import { prisma } from '../config/database.js';
import { User, Prisma } from '@prisma/client';

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
      include: {
        loyaltyAccount: true,
        addresses: {
          where: { isDefault: true }
        }
      }
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        loyaltyAccount: true
      }
    });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { phone }
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({
      data: {
        ...data,
        email: data.email.toLowerCase(),
        loyaltyAccount: {
          create: {
            points: 50, // Welcome points
            lifetimePoints: 50,
            tier: 'BRONZE'
          }
        }
      },
      include: {
        loyaltyAccount: true
      }
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
      include: {
        loyaltyAccount: true
      }
    });
  }

  async setOtp(email: string, otpCode: string, expiresAt: Date): Promise<void> {
    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: {
        otpCode,
        otpExpiresAt: expiresAt
      }
    });
  }
}

export const userRepository = new UserRepository();
