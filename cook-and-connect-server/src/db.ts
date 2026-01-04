import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Carga las variables del archivo .env para usarlas aquí
dotenv.config();

export const pool = mysql.createPool({
  // Busca la variable en el entorno, si no existe usa el valor por defecto ('localhost')
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '', // Si tu root no tiene contraseña, déjalo vacío en el .env
  database: process.env.DB_NAME || 'proyect_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Verificación rápida de conexión al iniciar
pool.getConnection()
  .then(conn => {
    console.log("✅ Conectado exitosamente a la base de datos MySQL");
    conn.release(); // Importante: liberar la conexión al pool
  })
  .catch(err => {
    console.error("❌ Error fatal conectando a la base de datos:", err.message);
  });