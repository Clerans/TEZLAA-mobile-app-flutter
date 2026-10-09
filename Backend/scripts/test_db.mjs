import { PrismaClient } from '@prisma/client';

const regions = ['ap-southeast-1', 'ap-south-1', 'us-east-1', 'eu-central-1', 'ap-southeast-2', 'eu-west-1', 'us-west-1'];
const password = encodeURIComponent('michaelClerans2802@#');
const user = 'postgres.mqmmzvcraitxdqepntbl';

async function test() {
  for (const r of regions) {
    const url = `postgresql://${user}:${password}@aws-0-${r}.pooler.supabase.com:6543/postgres?pgbouncer=true`;
    const prisma = new PrismaClient({ datasources: { db: { url } } });
    try {
      console.log('Testing', r, '...');
      await prisma.$queryRaw`SELECT 1`;
      console.log('>>> SUCCESS with region:', r);
      await prisma.$disconnect();
      return r;
    } catch (e) {
      console.log(r, 'failed:', e.message ? e.message.split('\n')[0] : e);
      await prisma.$disconnect();
    }
  }
}

test();
