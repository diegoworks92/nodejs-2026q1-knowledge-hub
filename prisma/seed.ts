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
  const password = await bcrypt.hash('password123', salt);

  const admin = await prisma.user.create({
    data: { login: 'admin', password, role: Role.ADMIN },
  });
  const editor = await prisma.user.create({
    data: { login: 'editor', password, role: Role.EDITOR },
  });

  const cat1 = await prisma.category.create({
    data: { name: 'Tech', description: 'Technology' },
  });
  const cat2 = await prisma.category.create({
    data: { name: 'Health', description: 'Health tips' },
  });
  const cat3 = await prisma.category.create({
    data: { name: 'Life', description: 'Lifestyle' },
  });

  const tags = await Promise.all([
    prisma.tag.create({ data: { name: 'NodeJS' } }),
    prisma.tag.create({ data: { name: 'Prisma' } }),
    prisma.tag.create({ data: { name: 'NestJS' } }),
    prisma.tag.create({ data: { name: 'Docker' } }),
    prisma.tag.create({ data: { name: 'Postgres' } }),
  ]);

  for (let i = 1; i <= 5; i++) {
    await prisma.article.create({
      data: {
        title: `Article ${i}`,
        content: `Interesting content for article ${i}`,
        status: i % 2 === 0 ? ArticleStatus.PUBLISHED : ArticleStatus.DRAFT,
        authorId: i % 2 === 0 ? admin.id : editor.id,
        categoryId: i <= 2 ? cat1.id : cat2.id,
        tags: { connect: [{ id: tags[0].id }, { id: tags[i - 1].id }] },
      },
    });
  }

  const firstArticle = await prisma.article.findFirst();
  if (firstArticle) {
    await prisma.comment.create({
      data: {
        content: 'Great!',
        articleId: firstArticle.id,
        authorId: editor.id,
      },
    });
    await prisma.comment.create({
      data: {
        content: 'Nice!',
        articleId: firstArticle.id,
        authorId: admin.id,
      },
    });
    await prisma.comment.create({
      data: {
        content: 'Thanks!',
        articleId: firstArticle.id,
        authorId: editor.id,
      },
    });
  }

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
