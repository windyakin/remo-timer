import { DataSource } from 'typeorm';
import { Schedule } from '../entities/Schedule';
import { ExecutionLog } from '../entities/ExecutionLog';
import { InitialSchema1704844800000 } from '../migrations/1704844800000-InitialSchema';
import dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  username: process.env.POSTGRES_USER || 'nature_timer',
  password: process.env.POSTGRES_PASSWORD || 'password',
  database: process.env.POSTGRES_DB || 'nature_timer',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: [Schedule, ExecutionLog],
  migrations: [InitialSchema1704844800000],
  subscribers: [],
});
