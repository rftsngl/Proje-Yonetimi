import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkTable() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });

  const [rows] = await connection.execute('DESCRIBE notifications');
  console.table(rows);
  await connection.end();
}

checkTable().catch(console.error);
