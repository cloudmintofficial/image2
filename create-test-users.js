const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const createUser = async (username, password, role) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        username,
        passwordHash: hashedPassword,
        role,
        status: 'Active'
      }
    });
  };

  // Create test users
  await createUser('Imagee owner', 'gagan1112', 'Admin');
  await createUser('IMAGEERAJANI', '123456', 'Reception');
  await createUser('Imageemallesh', '2016143', 'Lab');

  console.log('Test users created successfully');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });