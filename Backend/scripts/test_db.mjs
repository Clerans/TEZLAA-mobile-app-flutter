import { PrismaClient } from '@prisma/client';

const password = encodeURIComponent('michaelClerans2802@#');
const user = 'postgres.mqmmzvcraitxdqepntbl';
const host = 'aws-0-ap-northeast-1.pooler.supabase.com';

const url = `postgresql://${user}:${password}@${host}:6543/postgres?pgbouncer=true`;

console.log('Connecting to:', host);
const prisma = new PrismaClient({ datasources: { db: { url } } });

try {
  const result = await prisma.$queryRaw`SELECT 1 as connected`;
  console.log('SUCCESS! Connected to Supabase:', result);
} catch (e) {
  console.error('Error connecting:', e);
} finally {
  await prisma.$disconnect();
}
