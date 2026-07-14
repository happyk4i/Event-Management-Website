import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

export type ChatEvent = {
  id: string;
  name: string;
  category: string;
  price: number;
  date: string;
  time: string;
  location: string;
  description: string;
  availableSeats: number;
};

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is not defined. Set it in your .env file.');

const sql = neon(databaseUrl);

export async function findChatEvents(search: string): Promise<ChatEvent[]> {
  const term = `%${search.trim().slice(0, 240)}%`;
  const rows = await sql`
    SELECT id, name, category, price, date, time, location, description,
      "availableSeats" AS "availableSeats"
    FROM "Event"
    WHERE status = 'Active' AND "availableSeats" > 0
      AND (name ILIKE ${term} OR category ILIKE ${term} OR location ILIKE ${term}
        OR description ILIKE ${term} OR date ILIKE ${term})
    ORDER BY date ASC LIMIT 8
  `;
  return rows as ChatEvent[];
}
