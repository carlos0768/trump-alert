import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Initial tags
  const tags = [
    'Election',
    'Trial',
    'Tariff',
    'Immigration',
    'Vance',
    'Musk',
    'Biden',
    'DeSantis',
    'Policy',
    'Economy',
    'ForeignPolicy',
    'Rally',
    'TruthSocial',
    'Media',
    'Legal',
  ];

  for (const name of tags) {
    await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log(`Created ${tags.length} tags`);
  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
