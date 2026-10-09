import { PrismaClient } from '@prisma/client';

const password = encodeURIComponent('michaelClerans2802@#');
const user = 'postgres.mqmmzvcraitxdqepntbl';
const host = 'aws-0-ap-northeast-1.pooler.supabase.com';

const urls = [
  `postgresql://${user}:${password}@${host}:6543/postgres?pgbouncer=true&sslmode=require`,
  `postgresql://${user}:${password}@${host}:5432/postgres?sslmode=require`,
  `postgresql://${user}:${password}@${host}:6543/postgres?pgbouncer=true`,
];

for (const url of urls) {
  console.log('Testing url:', url.replace(password, '***'));
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    const result = await prisma.$queryRaw`SELECT 1 as connected`;
    console.log('>>> SUCCESS! Result:', result);
    await prisma.$disconnect();
    break;
  } catch (e) {
    console.log('Failed:', e.message.split('\n').filter(Boolean).slice(-2).join(' '));
    await prisma.$disconnect();
  }
}
