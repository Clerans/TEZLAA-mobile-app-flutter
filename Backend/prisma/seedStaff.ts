declare const process: any;
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = 'Password@123';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // Get flagship branch for staff assignment
  const flagshipBranch = await prisma.branch.findFirst({
    where: { slug: 'tezlaa-malabe-flagship' },
  });

  // 1. Admin Account
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tezlaa.com' },
    update: {
      role: UserRole.ADMIN,
      passwordHash,
    },
    create: {
      email: 'admin@tezlaa.com',
      fullName: 'TEZLAA Master Administrator',
      phone: '+94770000001',
      role: UserRole.ADMIN,
      passwordHash,
      isVerified: true,
    },
  });

  // 2. Branch Manager Account (Assigned to Malabe Flagship)
  const manager = await prisma.user.upsert({
    where: { email: 'manager@tezlaa.com' },
    update: {
      role: UserRole.BRANCH_MANAGER,
      passwordHash,
      branchId: flagshipBranch?.id || null,
    },
    create: {
      email: 'manager@tezlaa.com',
      fullName: 'Malabe Branch Manager',
      phone: '+94770000002',
      role: UserRole.BRANCH_MANAGER,
      branchId: flagshipBranch?.id || null,
      passwordHash,
      isVerified: true,
    },
  });

  // 3. Branch Staff / Barista Account (Assigned to Malabe Flagship)
  const staff = await prisma.user.upsert({
    where: { email: 'staff@tezlaa.com' },
    update: {
      role: UserRole.BRANCH_STAFF,
      passwordHash,
      branchId: flagshipBranch?.id || null,
    },
    create: {
      email: 'staff@tezlaa.com',
      fullName: 'Head Barista & Kitchen Staff',
      phone: '+94770000003',
      role: UserRole.BRANCH_STAFF,
      branchId: flagshipBranch?.id || null,
      passwordHash,
      isVerified: true,
    },
  });

  // 4. Customer Account
  const customer = await prisma.user.upsert({
    where: { email: 'customer@tezlaa.com' },
    update: {
      role: UserRole.CUSTOMER,
      passwordHash,
    },
    create: {
      email: 'customer@tezlaa.com',
      fullName: 'Gourmet Customer',
      phone: '+94770000004',
      role: UserRole.CUSTOMER,
      passwordHash,
      isVerified: true,
      loyaltyAccount: {
        create: {
          points: 250,
          lifetimePoints: 350,
          tier: 'SILVER',
        },
      },
      addresses: {
        create: {
          label: 'Home',
          addressLine1: 'No 450, Kaduwela Road',
          city: 'Malabe',
          isDefault: true,
        },
      },
    },
  });

  // 5. Guest User (For guest checkout / login fallback)
  const guest = await prisma.user.upsert({
    where: { email: 'guest@tezlaa.com' },
    update: {
      role: UserRole.CUSTOMER,
      passwordHash,
    },
    create: {
      email: 'guest@tezlaa.com',
      fullName: 'Guest Gourmet',
      phone: '+94770000005',
      role: UserRole.CUSTOMER,
      passwordHash,
      isVerified: true,
      loyaltyAccount: {
        create: {
          points: 180,
          lifetimePoints: 250,
          tier: 'SILVER',
        },
      },
      addresses: {
        create: {
          label: 'Default Address',
          addressLine1: 'No 450, Kaduwela Road',
          city: 'Malabe',
          isDefault: true,
        },
      },
    },
  });

  console.log('✅ Staff, Admin & Customer credentials seeded:');
  console.log('----------------------------------------------------');
  console.log('1. Admin:    admin@tezlaa.com    / Password@123 (Role: ADMIN)');
  console.log('2. Manager:  manager@tezlaa.com  / Password@123 (Role: BRANCH_MANAGER)');
  console.log('3. Staff:    staff@tezlaa.com    / Password@123 (Role: BRANCH_STAFF)');
  console.log('4. Customer: customer@tezlaa.com / Password@123 (Role: CUSTOMER)');
  console.log('5. Guest:    guest@tezlaa.com    / Password@123 (Role: CUSTOMER)');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
