import mysql, { Pool } from 'mysql2/promise';
import { env } from '../config/env.js';

let pool: Pool | null = null;

const baseConfig = {
  host: env.mysqlHost,
  port: env.mysqlPort,
  user: env.mysqlUser,
  password: env.mysqlPassword,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true,
  charset: 'utf8mb4',
  timezone: '+00:00',
} as const;

export const ensureDatabaseExists = async () => {
  const connection = await mysql.createConnection(baseConfig);
  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${env.mysqlDatabase}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await connection.end();
};

export const getPool = () => {
  if (!pool) {
    pool = mysql.createPool({
      ...baseConfig,
      database: env.mysqlDatabase,
    });
  }

  return pool;
};
