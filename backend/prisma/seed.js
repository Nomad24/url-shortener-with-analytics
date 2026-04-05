import { prisma } from '../src/config/prisma.js';
import { hashPassword } from '../src/utils/hashPassword.js';
import { nanoid } from 'nanoid';

async function seed() {
  console.log('Seeding database...');

  const existingUser = await prisma.user.findUnique({
    where: { email: 'test@example.com' },
  });

  let user;
  if (!existingUser) {
    const hashedPassword = await hashPassword('password123');
    user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword,
      },
    });
    console.log('Created test user');
  } else {
    user = existingUser;
    console.log('Test user already exists');
  }

  const links = await prisma.link.findMany({
    where: { userId: user.id },
  });

  if (links.length === 0) {
    const link1 = await prisma.link.create({
      data: {
        shortCode: nanoid(6),
        originalUrl: 'https://google.com',
        title: 'Google',
        userId: user.id,
      },
    });

    const link2 = await prisma.link.create({
      data: {
        shortCode: nanoid(6),
        originalUrl: 'https://github.com',
        title: 'GitHub',
        userId: user.id,
      },
    });

    const link3 = await prisma.link.create({
      data: {
        shortCode: nanoid(6),
        originalUrl: 'https://stackoverflow.com',
        title: 'Stack Overflow',
        userId: user.id,
      },
    });

    console.log('Created 3 test links');

    const devices = ['desktop', 'mobile', 'tablet'];
    const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge'];
    const countries = ['United States', 'United Kingdom', 'Germany', 'France', 'Canada', 'Australia', 'Japan', 'Brazil'];

    for (const link of [link1, link2, link3]) {
      const clickCount = Math.floor(Math.random() * 30) + 10;
      
      for (let i = 0; i < clickCount; i++) {
        const daysAgo = Math.floor(Math.random() * 30);
        const hoursAgo = Math.floor(Math.random() * 24);
        const clickedAt = new Date();
        clickedAt.setDate(clickedAt.getDate() - daysAgo);
        clickedAt.setHours(clickedAt.getHours() - hoursAgo);

        await prisma.click.create({
          data: {
            linkId: link.id,
            ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            country: countries[Math.floor(Math.random() * countries.length)],
            city: `City${Math.floor(Math.random() * 100)}`,
            device: devices[Math.floor(Math.random() * devices.length)],
            browser: browsers[Math.floor(Math.random() * browsers.length)],
            os: Math.random() > 0.5 ? 'Windows' : 'macOS',
            referer: Math.random() > 0.3 ? 'https://google.com' : null,
            isUnique: Math.random() > 0.3,
            clickedAt,
          },
        });
      }
    }

    console.log('Created test clicks');
  } else {
    console.log('Test links already exist');
  }

  console.log('Seeding completed!');
}

seed()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
