// api/src/db.ts
import dotenv from 'dotenv';
dotenv.config({ path: '../infra/.env' });

const DB_HOST: string = process.env.DB_HOST ?? 'db';
const DB_PORT: string = process.env.DB_PORT ?? '5432';
const DB_USER: string = process.env.DB_USER ?? 'postgres';
const DB_PASSWORD: string = process.env.DB_PASSWORD ?? '';
const DB_NAME: string = process.env.DB_NAME ?? 'postgres';
const DB_URL: string = process.env.DB_URL ?? 'http://localhost:5432';
