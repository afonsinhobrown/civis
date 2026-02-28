// Configuração de conexão PostgreSQL (Supabase)
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Necessário para conexões externas ao Supabase
    }
});

module.exports = pool;
