import dotenv from 'dotenv';
dotenv.config();

console.log('Parsed DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('Length:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 0);
