import { PrismaClient, Role, ArticleStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Cleaning database ---');
  await prisma.comment.deleteMany();
  await prisma.article.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log('--- Seeding ---');
  const salt = 10;
  const hashedPassword = await bcrypt.hash('password123', salt);

  const admin = await prisma.user.create({
    data: { login: 'admin', password: hashedPassword, role: Role.ADMIN },
  });

  const catTech = await prisma.category.create({
    data: { name: 'Technology', description: 'Tech related' },
  });

  const article1 = await prisma.article.create({
    data: {
      title: 'Prisma Guide',
      content: 'Content here...',
      status: ArticleStatus.PUBLISHED,
      authorId: admin.id,
      categoryId: catTech.id,
    },
  });

  console.log('--- Seed success ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
