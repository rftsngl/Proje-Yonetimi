import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function addCols() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });

  await connection.execute('ALTER TABLE notifications ADD COLUMN entity_type VARCHAR(32) DEFAULT NULL');
  await connection.execute('ALTER TABLE notifications ADD COLUMN entity_id VARCHAR(32) DEFAULT NULL');
  console.log('Columns added successfully');
  await connection.end();
}
addCols().catch(console.error);
