const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const users = [
    { username: 'Imagee owner', password: 'gagan1112', displayName: 'IMAGEE OWNER', role: 'Owner' },
    { username: 'IMAGEERAJANI', password: '123456', displayName: 'IMAGEERAJANI', role: 'Reception' },
    { username: 'Imageemallesh', password: '2016143', displayName: 'imageemallesh', role: 'LabEntry' },
  ];

  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    
    await prisma.user.upsert({
      where: { username: u.username },
      update: {
        passwordHash,
        displayName: u.displayName,
        role: u.role,
        status: 'Active',
        labId: 1
      },
      create: {
        username: u.username,
        passwordHash,
        displayName: u.displayName,
        role: u.role,
        status: 'Active',
        labId: 1
      }
    });
  }
  
  console.log('Users seeded successfully');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
