import prisma from '../config/database.js';
import { Address } from '@prisma/client';

export interface CreateAddressDTO {
  userId: string;
  label: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  deliveryNotes?: string;
  isDefault?: boolean;
}

export class AddressRepository {
  async findByUserId(userId: string): Promise<Address[]> {
    return prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findById(id: string, userId?: string): Promise<Address | null> {
    return prisma.address.findFirst({
      where: {
        id,
        ...(userId && { userId }),
      },
    });
  }

  async create(data: CreateAddressDTO): Promise<Address> {
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: data.userId },
        data: { isDefault: false },
      });
    }

    return prisma.address.create({
      data,
    });
  }

  async update(id: string, userId: string, data: Partial<CreateAddressDTO>): Promise<Address> {
    const existing = await this.findById(id, userId);
    if (!existing) {
      throw new Error('Address not found or unauthorized');
    }

    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    return prisma.address.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.findById(id, userId);
    if (!existing) {
      throw new Error('Address not found or unauthorized');
    }

    await prisma.address.delete({
      where: { id },
    });
  }

  async setDefault(id: string, userId: string): Promise<Address> {
    const existing = await this.findById(id, userId);
    if (!existing) {
      throw new Error('Address not found or unauthorized');
    }

    await prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });

    return prisma.address.update({
      where: { id },
      data: { isDefault: true },
    });
  }
}

export const addressRepository = new AddressRepository();
export default addressRepository;
