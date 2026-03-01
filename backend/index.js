const express = require('express');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurações do Swagger
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));

app.use(cors());
app.use(express.json());

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API Routes
const routes = require('./routes');
app.use('/api', routes);

// SERVIR FRONTEND CENTRALIZADO (Monólito)
const fs = require('fs');
const frontendPath = path.resolve(__dirname, '..', 'frontend', 'build');

console.log('--- Verificação de Deploy ---');
console.log('Buscando Frontend em:', frontendPath);
if (fs.existsSync(frontendPath)) {
    console.log('Diretório do frontend encontrado ✅');
    app.use(express.static(frontendPath));
} else {
    console.warn('Diretório do frontend NÃO encontrado ❌ (Verifique o build no Render)');
}

// 2. Rota curinga para o React (SPA) lidar com o roteamento interno
app.get('*', (req, res) => {
    // Se a rota não for /api, devolve o index.html do React
    if (!req.path.startsWith('/api')) {
        const indexPath = path.join(frontendPath, 'index.html');
        if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
        } else {
            res.status(404).json({
                error: "Página não encontrada",
                message: "O frontend não foi compilado ou index.html não existe.",
                path_attempted: indexPath
            });
        }
    }
});

// Migração de Banco de Dados (Auto-Run)
const runMigrations = async () => {
    const pool = require('./db_selector');
    try {
        console.log('--- Verificando Estrutura do BD ---');
        await pool.query(`
            -- TABELAS BASE SE NÃO EXISTIREM
            CREATE TABLE IF NOT EXISTS ong (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(255) NOT NULL,
                nuit_nif VARCHAR(50) NOT NULL,
                endereco VARCHAR(255),
                contactos VARCHAR(100),
                pais VARCHAR(50)
            );
            CREATE TABLE IF NOT EXISTS usuario (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                senha_hash VARCHAR(255) NOT NULL,
                perfil VARCHAR(50) NOT NULL,
                ativo BOOLEAN DEFAULT TRUE,
                ong_id INTEGER REFERENCES ong(id)
            );
            CREATE TABLE IF NOT EXISTS financiador (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(100) NOT NULL,
                contato VARCHAR(100),
                ong_id INTEGER REFERENCES ong(id)
            );
            CREATE TABLE IF NOT EXISTS projeto (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(255) NOT NULL,
                codigo_interno VARCHAR(50) UNIQUE,
                orcamento_total NUMERIC(15,2),
                ong_id INTEGER REFERENCES ong(id)
            );
            CREATE TABLE IF NOT EXISTS atividade (
                id SERIAL PRIMARY KEY,
                projeto_id INTEGER REFERENCES projeto(id),
                nome VARCHAR(255) NOT NULL,
                orcamento_previsto NUMERIC(15,2),
                status VARCHAR(20) DEFAULT 'planeado'
            );
            CREATE TABLE IF NOT EXISTS receita (
                id SERIAL PRIMARY KEY,
                projeto_id INTEGER REFERENCES projeto(id),
                financiador_id INTEGER REFERENCES financiador(id),
                valor NUMERIC(15,2),
                data DATE DEFAULT CURRENT_DATE
            );
            CREATE TABLE IF NOT EXISTS despesa (
                id SERIAL PRIMARY KEY,
                projeto_id INTEGER REFERENCES projeto(id),
                atividade_id INTEGER REFERENCES atividade(id),
                categoria VARCHAR(100),
                valor NUMERIC(15,2),
                estado VARCHAR(20) DEFAULT 'submetido',
                responsavel_id INTEGER REFERENCES usuario(id),
                data_despesa DATE DEFAULT CURRENT_DATE
            );
            CREATE TABLE IF NOT EXISTS beneficiario (
                id SERIAL PRIMARY KEY,
                projeto_id INTEGER REFERENCES projeto(id),
                tipo VARCHAR(20),
                distrito VARCHAR(50)
            );

            -- NOVAS TABELAS DE GOVERNANÇA
            CREATE TABLE IF NOT EXISTS contas_caixa (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(100) NOT NULL,
                tipo VARCHAR(20) DEFAULT 'Banco',
                saldo_atual DECIMAL(15,2) DEFAULT 0,
                ong_id INTEGER NOT NULL DEFAULT 1,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS transferencias (
                id SERIAL PRIMARY KEY,
                origem_id INTEGER REFERENCES contas_caixa(id),
                destino_id INTEGER REFERENCES contas_caixa(id),
                valor DECIMAL(15,2) NOT NULL,
                data_transferencia DATE NOT NULL,
                justificativa TEXT,
                usuario_id INTEGER,
                ong_id INTEGER DEFAULT 1
            );
            ALTER TABLE usuario ADD COLUMN IF NOT EXISTS cargo VARCHAR(100);
            ALTER TABLE usuario ADD COLUMN IF NOT EXISTS bi_nuit VARCHAR(50);
            ALTER TABLE usuario ADD COLUMN IF NOT EXISTS data_contratacao DATE;
            ALTER TABLE usuario ADD COLUMN IF NOT EXISTS salario_base DECIMAL(15,2);
            
            CREATE TABLE IF NOT EXISTS projeto_colaborador (
                id SERIAL PRIMARY KEY,
                projeto_id INTEGER REFERENCES projeto(id),
                usuario_id INTEGER REFERENCES usuario(id),
                funcao VARCHAR(100),
                atribuido_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            ALTER TABLE atividade ADD COLUMN IF NOT EXISTS relatorio_progresso TEXT;
            ALTER TABLE atividade ADD COLUMN IF NOT EXISTS status_execucao INTEGER DEFAULT 0;
            ALTER TABLE atividade ADD COLUMN IF NOT EXISTS data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
            ALTER TABLE despesa ADD COLUMN IF NOT EXISTS parecer_coordenador TEXT;
            ALTER TABLE despesa ADD COLUMN IF NOT EXISTS justificativa TEXT;
        `);

        // --- AUTO-SEED DO ADMINISTRADOR (Garante acesso ao sistema) ---
        const bcrypt = require('bcryptjs');
        const adminEmail = 'admin@civis.org';
        const checkAdmin = await pool.query('SELECT id FROM usuario WHERE email = $1', [adminEmail]);

        if (checkAdmin.rows.length === 0) {
            console.log('--- Criando Usuário Administrador de Emergência ---');
            const hash = await bcrypt.hash('admin123', 10);

            // Garantir que existe pelo menos uma ONG para o admin
            let ongId = 1;
            const checkOng = await pool.query('SELECT id FROM ong LIMIT 1');
            if (checkOng.rows.length > 0) {
                ongId = checkOng.rows[0].id;
            } else {
                const newOng = await pool.query("INSERT INTO ong (nome, nuit_nif, pais) VALUES ('CIVIS Principal', '000000000', 'Moçambique') RETURNING id");
                ongId = newOng.rows[0].id;
            }

            await pool.query(
                "INSERT INTO usuario (nome, email, senha_hash, perfil, ativo, ong_id) VALUES ($1, $2, $3, $4, $5, $6)",
                ['Administrador Principal', adminEmail, hash, 'Administrador', 1, ongId]
            );
            console.log('✅ Administrador criado: admin@civis.org / admin123');
        } else {
            // Opcional: Forçar reset de senha se houver problemas (pode ser comentado depois)
            const hash = await bcrypt.hash('admin123', 10);
            await pool.query("UPDATE usuario SET senha_hash = $1, ativo = 1 WHERE email = $2", [hash, adminEmail]);
            console.log('✅ Senha do Administrador sincronizada: admin123');
        }

        console.log('Banco de dados sincronizado ✅');
    } catch (err) {
        console.error('Erro na migração/seed:', err);
    }
};

runMigrations().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Servidor rodando em: http://0.0.0.0:${PORT}`);
    });
});
