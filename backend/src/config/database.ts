import { DataSource } from 'typeorm';
import { Schedule } from '../entities/Schedule';
import { ExecutionLog } from '../entities/ExecutionLog';
import { ApplianceCache } from '../entities/ApplianceCache';
import { InitialSchema1704844800000 } from '../migrations/1704844800000-InitialSchema';
import { AddApplianceCache1704844800001 } from '../migrations/1704844800001-AddApplianceCache';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const dbPath = process.env.SQLITE_PATH || path.join(__dirname, '../../data/database.sqlite');

export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: dbPath,
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: [Schedule, ExecutionLog, ApplianceCache],
  migrations: [InitialSchema1704844800000, AddApplianceCache1704844800001],
  subscribers: [],
});
