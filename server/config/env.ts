import dotenv from 'dotenv';

dotenv.config();

const toNumber = (value: string | undefined, fallback: number) => {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const env = {
  port: toNumber(process.env.PORT, 4000),
  mysqlHost: process.env.MYSQL_HOST || '127.0.0.1',
  mysqlPort: toNumber(process.env.MYSQL_PORT, 3306),
  mysqlUser: process.env.MYSQL_USER || 'root',
  mysqlPassword: process.env.MYSQL_PASSWORD || 'kendi_mySQL_sifrenizi_girin',
  mysqlDatabase: process.env.MYSQL_DATABASE || 'proje_yonetimi_app',
};
