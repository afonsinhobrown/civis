const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const DATABASE_URL = 'postgresql://postgres.bmiziytqflurlxgkqhjw:pandorabox5229@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

async function run() {
    const pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('--- Conectando ao Banco Cloud ---');
        const hash = await bcrypt.hash('admin123', 10);

        // 1. Garantir que existe uma ONG
        let ongResult = await pool.query("SELECT id FROM ong LIMIT 1");
        let ongId;
        if (ongResult.rows.length === 0) {
            console.log('Criando ONG padrão...');
            const newOng = await pool.query("INSERT INTO ong (nome, nuit_nif, pais) VALUES ('CIVIS Cloud', '000000000', 'Moçambique') RETURNING id");
            ongId = newOng.rows[0].id;
        } else {
            ongId = ongResult.rows[0].id;
        }

        // 2. Inserir ou atualizar Admin
        console.log('Inserindo/Atualizando Admin...');
        const checkUser = await pool.query("SELECT id FROM usuario WHERE email = 'admin@civis.org'");

        if (checkUser.rows.length === 0) {
            await pool.query(
                "INSERT INTO usuario (nome, email, senha_hash, perfil, ativo, ong_id) VALUES ($1, $2, $3, $4, $5, $6)",
                ['Administrador Principal', 'admin@civis.org', hash, 'Administrador', true, ongId]
            );
            console.log('✅ Admin CRIADO com sucesso.');
        } else {
            await pool.query(
                "UPDATE usuario SET senha_hash = $1, ativo = true, perfil = 'Administrador' WHERE email = 'admin@civis.org'",
                [hash]
            );
            console.log('✅ Admin ATUALIZADO com sucesso.');
        }

    } catch (err) {
        console.error('❌ ERRO:', err.message);
    } finally {
        await pool.end();
    }
}

run();
