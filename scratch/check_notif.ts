import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkNotifications() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    });

    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM notifications');
    const count = (rows as any)[0].count;
    console.log(`Veritabanında şu an ${count} adet bildirim bulunuyor.`);
    
    if (count > 0) {
      const [list] = await connection.execute('SELECT title, created_at, is_read FROM notifications ORDER BY created_at DESC LIMIT 5');
      console.log('Son 5 bildirim:');
      console.table(list);
    }

    await connection.end();
  } catch (error) {
    console.error('Veritabanına bağlanırken hata oluştu:', error);
  }
}

checkNotifications();
