import { PrismaClient } from '@prisma/client';

const password = encodeURIComponent('michaelClerans2802@#');
const user = 'postgres.mqmmzvcraitxdqepntbl';
const host = 'aws-0-ap-northeast-1.pooler.supabase.com';

const directUrl = `postgresql://${user}:${password}@${host}:5432/postgres`;

console.log('Testing DIRECT_URL...');
const prisma = new PrismaClient({ datasources: { db: { url: directUrl } } });
try {
  const result = await prisma.$queryRaw`SELECT 1 as connected`;
  console.log('>>> SUCCESS DIRECT_URL! Result:', result);
} catch (e) {
  console.log('Direct failed:', e.message);
} finally {
  await prisma.$disconnect();
}
