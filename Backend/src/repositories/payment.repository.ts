import prisma from '../config/database.js';
import { Payment, PaymentMethod, PaymentStatus } from '@prisma/client';

export interface CreatePaymentDTO {
  orderId: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  amount: Float;
  currency?: string;
  gatewayProvider?: string;
  transactionId?: string;
  gatewayResponse?: any;
}

type Float = number;

export class PaymentRepository {
  async create(data: CreatePaymentDTO): Promise<Payment> {
    return prisma.payment.create({
      data: {
        orderId: data.orderId,
        paymentMethod: data.paymentMethod,
        status: data.status,
        amount: data.amount,
        currency: data.currency || 'LKR',
        gatewayProvider: data.gatewayProvider,
        transactionId: data.transactionId,
        gatewayResponse: data.gatewayResponse,
      },
    });
  }

  async findByOrderId(orderId: string): Promise<Payment[]> {
    return prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: PaymentStatus, transactionId?: string): Promise<Payment> {
    return prisma.payment.update({
      where: { id },
      data: {
        status,
        ...(transactionId && { transactionId }),
      },
    });
  }
}

export const paymentRepository = new PaymentRepository();
export default paymentRepository;
