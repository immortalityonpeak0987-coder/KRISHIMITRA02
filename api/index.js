import backendApp from '../backend/src/app.js';
import { connectDatabase } from '../backend/src/config/database.js';

let dbInitialized = false;

export default async function handler(req, res) {
  if (!dbInitialized) {
    dbInitialized = true;
    try {
      await connectDatabase();
    } catch (err) {
      console.warn('[KRISHI-MITRA Vercel Serverless] Running in deterministic seed mode:', err.message);
    }
  }
  return backendApp(req, res);
}
