const express = require('express');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3001; // Porta diferente para não conflitar com o sistema principal

app.use(cors());
app.use(express.json());

const pool = require('./db_selector');

app.get('/reset-admin', async (req, res) => {
    try {
        console.log('--- Iniciando Reset de Senha Admin ---');
        const email = 'admin@civis.org';
        const novaSenha = 'admin123';
        const hash = await bcrypt.hash(novaSenha, 10);

        // Verificar se usuário existe
        const check = await pool.query('SELECT id FROM usuario WHERE email = $1', [email]);

        if (check.rows.length === 0) {
            // Criar se não existir (garantindo que o seed falho não nos bloqueie)
            await pool.query(
                "INSERT INTO usuario (nome, email, senha_hash, perfil, ativo, ong_id) VALUES ($1, $2, $3, $4, $5, $6)",
                ['Administrador', email, hash, 'Administrador', 1, 1]
            );
            return res.send(`✅ Usuário ${email} criado com a senha ${novaSenha}.`);
        } else {
            // Atualizar senha e garantir que está ativo
            await pool.query(
                "UPDATE usuario SET senha_hash = $1, ativo = 1 WHERE email = $2",
                [hash, email]
            );
            return res.send(`✅ Senha do usuário ${email} resetada para ${novaSenha} e status definido como ATIVO.`);
        }
    } catch (err) {
        console.error(err);
        res.status(500).send(`❌ Erro: ${err.message}`);
    }
});

app.listen(PORT, () => {
    console.log(`Servidor de emergência rodando em http://localhost:${PORT}/reset-admin`);
});
