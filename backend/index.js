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
            -- TABELAS PRINCIPAIS (ESQUEMA COMPLETO)
            CREATE TABLE IF NOT EXISTS ong (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(255) NOT NULL,
                nuit_nif VARCHAR(50),
                endereco VARCHAR(255),
                contactos VARCHAR(100),
                pais VARCHAR(50) DEFAULT 'Moçambique',
                estatutos_url VARCHAR(255),
                certificado_url VARCHAR(255)
            );
            CREATE TABLE IF NOT EXISTS usuario (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                senha_hash VARCHAR(255) NOT NULL,
                perfil VARCHAR(50) NOT NULL,
                ativo BOOLEAN DEFAULT TRUE,
                ong_id INTEGER,
                cargo VARCHAR(100),
                bi_nuit VARCHAR(50),
                data_contratacao DATE,
                salario_base DECIMAL(15,2)
            );
            CREATE TABLE IF NOT EXISTS financiador (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(100) NOT NULL,
                contato VARCHAR(100),
                ong_id INTEGER
            );
            CREATE TABLE IF NOT EXISTS projeto (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(255) NOT NULL,
                codigo_interno VARCHAR(50) UNIQUE,
                orcamento_total NUMERIC(15,2),
                data_inicio DATE,
                data_fim DATE,
                objetivos TEXT,
                estado VARCHAR(20),
                ong_id INTEGER
            );
            CREATE TABLE IF NOT EXISTS centro_custo (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(100) NOT NULL,
                projeto_id INTEGER
            );
            CREATE TABLE IF NOT EXISTS atividade (
                id SERIAL PRIMARY KEY,
                projeto_id INTEGER,
                nome VARCHAR(255) NOT NULL,
                orcamento_previsto NUMERIC(15,2),
                data_inicio DATE,
                data_fim DATE,
                status VARCHAR(20) DEFAULT 'planeado',
                relatorio_progresso TEXT,
                status_execucao INTEGER DEFAULT 0,
                data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS receita (
                id SERIAL PRIMARY KEY,
                projeto_id INTEGER,
                financiador_id INTEGER,
                tipo_fundo VARCHAR(50),
                data DATE DEFAULT CURRENT_DATE,
                valor NUMERIC(15,2),
                moeda VARCHAR(10) DEFAULT 'MZN',
                taxa_cambio NUMERIC(18,6),
                comprovativo_url VARCHAR(255)
            );
            CREATE TABLE IF NOT EXISTS despesa (
                id SERIAL PRIMARY KEY,
                projeto_id INTEGER,
                atividade_id INTEGER,
                centro_custo_id INTEGER,
                categoria VARCHAR(100),
                fornecedor VARCHAR(100),
                valor NUMERIC(15,2),
                moeda VARCHAR(10) DEFAULT 'MZN',
                metodo_pagamento VARCHAR(50),
                comprovativo_url VARCHAR(255),
                responsavel_id INTEGER,
                estado VARCHAR(20) DEFAULT 'submetido',
                data_despesa DATE DEFAULT CURRENT_DATE,
                justificativa TEXT,
                parecer_coordenador TEXT
            );
            CREATE TABLE IF NOT EXISTS beneficiario (
                id SERIAL PRIMARY KEY,
                projeto_id INTEGER,
                tipo VARCHAR(20),
                numero_identificacao VARCHAR(50),
                provincia VARCHAR(50),
                distrito VARCHAR(50),
                historico TEXT,
                status VARCHAR(20)
            );
            CREATE TABLE IF NOT EXISTS patrimonio (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(255) NOT NULL,
                tipo VARCHAR(100),
                codigo_ativo VARCHAR(50),
                data_aquisicao DATE,
                valor_compra NUMERIC(15,2),
                estado_conservacao VARCHAR(50),
                localizacao VARCHAR(100),
                ong_id INTEGER
            );
            CREATE TABLE IF NOT EXISTS folha_pagamento (
                id SERIAL PRIMARY KEY,
                usuario_id INTEGER,
                projeto_id INTEGER,
                mes_referencia INTEGER,
                ano_referencia INTEGER,
                salario_base NUMERIC(15,2),
                subsidios NUMERIC(15,2),
                desconto_inss NUMERIC(15,2),
                desconto_irps NUMERIC(15,2),
                salario_liquido NUMERIC(15,2),
                data_pagamento DATE,
                estado VARCHAR(20)
            );
            CREATE TABLE IF NOT EXISTS configuracao (
                id SERIAL PRIMARY KEY,
                chave VARCHAR(100) UNIQUE,
                valor TEXT,
                descricao TEXT
            );
            CREATE TABLE IF NOT EXISTS contas_caixa (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(100) NOT NULL,
                tipo VARCHAR(20) DEFAULT 'Banco',
                saldo_atual DECIMAL(15,2) DEFAULT 0,
                ong_id INTEGER DEFAULT 1,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS transferencias (
                id SERIAL PRIMARY KEY,
                origem_id INTEGER,
                destino_id INTEGER,
                valor DECIMAL(15,2),
                data_transferencia DATE DEFAULT CURRENT_DATE,
                justificativa TEXT,
                usuario_id INTEGER
            );
            CREATE TABLE IF NOT EXISTS projeto_colaborador (
                id SERIAL PRIMARY KEY,
                projeto_id INTEGER,
                usuario_id INTEGER,
                funcao VARCHAR(100),
                atribuido_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
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
