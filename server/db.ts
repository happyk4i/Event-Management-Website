import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

// Pastikan dotenv dimuat paling atas agar proses internal Node tahu nilai DATABASE_URL
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined. Set it in your .env file.');
}

const adapter = new PrismaPg({ connectionString });

export const prisma = new PrismaClient({ adapter });