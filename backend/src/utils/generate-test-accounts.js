import bcrypt from 'bcrypt';

// Generate password hashes for test accounts
const passwords = {
  admin: 'admin123',
  student: 'student123',
};

async function generateHashes() {
  console.log('Generating password hashes...\n');
  
  for (const [type, password] of Object.entries(passwords)) {
    const hash = await bcrypt.hash(password, 10);
    console.log(`${type.toUpperCase()} ACCOUNT:`);
    console.log(`Password: ${password}`);
    console.log(`Hash: ${hash}\n`);
  }
}

generateHashes();
