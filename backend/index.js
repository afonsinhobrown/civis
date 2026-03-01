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
        console.log('--- Iniciando Sincronização de Esquema Robusta ---');

        // Função auxiliar para rodar queries com log
        const run = async (sql) => {
            try { await pool.query(sql); } catch (e) { console.warn(`Aviso em query: ${e.message}`); }
        };

        // 1. Criar Tabelas Base (Estrutura mínima)
        await run(`CREATE TABLE IF NOT EXISTS ong (id SERIAL PRIMARY KEY, nome VARCHAR(255) NOT NULL)`);
        await run(`CREATE TABLE IF NOT EXISTS usuario (id SERIAL PRIMARY KEY, email VARCHAR(100) UNIQUE NOT NULL, senha_hash VARCHAR(255) NOT NULL)`);
        await run(`CREATE TABLE IF NOT EXISTS projeto (id SERIAL PRIMARY KEY, nome VARCHAR(255) NOT NULL)`);
        await run(`CREATE TABLE IF NOT EXISTS financiador (id SERIAL PRIMARY KEY, nome VARCHAR(100) NOT NULL)`);
        await run(`CREATE TABLE IF NOT EXISTS atividade (id SERIAL PRIMARY KEY, nome VARCHAR(255) NOT NULL)`);
        await run(`CREATE TABLE IF NOT EXISTS receita (id SERIAL PRIMARY KEY)`);
        await run(`CREATE TABLE IF NOT EXISTS despesa (id SERIAL PRIMARY KEY)`);
        await run(`CREATE TABLE IF NOT EXISTS beneficiario (id SERIAL PRIMARY KEY)`);
        await run(`CREATE TABLE IF NOT EXISTS patrimonio (id SERIAL PRIMARY KEY, nome VARCHAR(255))`);
        await run(`CREATE TABLE IF NOT EXISTS contas_caixa (id SERIAL PRIMARY KEY, nome VARCHAR(100) NOT NULL)`);
        await run(`CREATE TABLE IF NOT EXISTS transferencias (id SERIAL PRIMARY KEY)`);
        await run(`CREATE TABLE IF NOT EXISTS folha_pagamento (id SERIAL PRIMARY KEY)`);
        await run(`CREATE TABLE IF NOT EXISTS configuracao (id SERIAL PRIMARY KEY, chave VARCHAR(100) UNIQUE)`);
        await run(`CREATE TABLE IF NOT EXISTS centro_custo (id SERIAL PRIMARY KEY, nome VARCHAR(100) NOT NULL)`);
        await run(`CREATE TABLE IF NOT EXISTS projeto_colaborador (id SERIAL PRIMARY KEY)`);

        // 2. Garantir Colunas (ALTER TABLE IF NOT EXISTS - Resolvendo Erros 500 do Dashboard)
        // Usuário
        await run(`ALTER TABLE usuario ADD COLUMN IF NOT EXISTS nome VARCHAR(100), ADD COLUMN IF NOT EXISTS perfil VARCHAR(50), ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE, ADD COLUMN IF NOT EXISTS ong_id INTEGER, ADD COLUMN IF NOT EXISTS cargo VARCHAR(100), ADD COLUMN IF NOT EXISTS bi_nuit VARCHAR(50), ADD COLUMN IF NOT EXISTS salario_base DECIMAL(15,2)`);

        // Projeto
        await run(`ALTER TABLE projeto ADD COLUMN IF NOT EXISTS codigo_interno VARCHAR(50) UNIQUE, ADD COLUMN IF NOT EXISTS orcamento_total NUMERIC(15,2), ADD COLUMN IF NOT EXISTS ong_id INTEGER, ADD COLUMN IF NOT EXISTS data_inicio DATE, ADD COLUMN IF NOT EXISTS data_fim DATE, ADD COLUMN IF NOT EXISTS estado VARCHAR(20)`);

        // Receita (AQUI ESTAVA O ERRO 500)
        await run(`ALTER TABLE receita ADD COLUMN IF NOT EXISTS projeto_id INTEGER, ADD COLUMN IF NOT EXISTS financiador_id INTEGER, ADD COLUMN IF NOT EXISTS valor NUMERIC(15,2), ADD COLUMN IF NOT EXISTS data DATE DEFAULT CURRENT_DATE, ADD COLUMN IF NOT EXISTS tipo_fundo VARCHAR(50), ADD COLUMN IF NOT EXISTS moeda VARCHAR(10) DEFAULT 'MZN', ADD COLUMN IF NOT EXISTS taxa_cambio NUMERIC(18,6), ADD COLUMN IF NOT EXISTS comprovativo_url VARCHAR(255)`);

        // Despesa (AQUI TAMBÉM)
        await run(`ALTER TABLE despesa ADD COLUMN IF NOT EXISTS projeto_id INTEGER, ADD COLUMN IF NOT EXISTS atividade_id INTEGER, ADD COLUMN IF NOT EXISTS centro_custo_id INTEGER, ADD COLUMN IF NOT EXISTS categoria VARCHAR(100), ADD COLUMN IF NOT EXISTS fornecedor VARCHAR(100), ADD COLUMN IF NOT EXISTS valor NUMERIC(15,2), ADD COLUMN IF NOT EXISTS moeda VARCHAR(10) DEFAULT 'MZN', ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'submetido', ADD COLUMN IF NOT EXISTS responsavel_id INTEGER, ADD COLUMN IF NOT EXISTS data_despesa DATE DEFAULT CURRENT_DATE, ADD COLUMN IF NOT EXISTS justificativa TEXT, ADD COLUMN IF NOT EXISTS parecer_coordenador TEXT, ADD COLUMN IF NOT EXISTS metodo_pagamento VARCHAR(50), ADD COLUMN IF NOT EXISTS comprovativo_url VARCHAR(255)`);

        // Outros
        await run(`ALTER TABLE atividade ADD COLUMN IF NOT EXISTS projeto_id INTEGER, ADD COLUMN IF NOT EXISTS orcamento_previsto NUMERIC(15,2), ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'planeado', ADD COLUMN IF NOT EXISTS relatorio_progresso TEXT, ADD COLUMN IF NOT EXISTS status_execucao INTEGER DEFAULT 0`);
        await run(`ALTER TABLE beneficiario ADD COLUMN IF NOT EXISTS projeto_id INTEGER, ADD COLUMN IF NOT EXISTS tipo VARCHAR(20), ADD COLUMN IF NOT EXISTS distrito VARCHAR(50), ADD COLUMN IF NOT EXISTS provincia VARCHAR(50), ADD COLUMN IF NOT EXISTS numero_identificacao VARCHAR(50)`);
        await run(`ALTER TABLE folha_pagamento ADD COLUMN IF NOT EXISTS usuario_id INTEGER, ADD COLUMN IF NOT EXISTS projeto_id INTEGER, ADD COLUMN IF NOT EXISTS mes_referencia INTEGER, ADD COLUMN IF NOT EXISTS ano_referencia INTEGER, ADD COLUMN IF NOT EXISTS salario_base NUMERIC(15,2), ADD COLUMN IF NOT EXISTS salario_liquido NUMERIC(15,2), ADD COLUMN IF NOT EXISTS estado VARCHAR(20)`);
        await run(`ALTER TABLE contas_caixa ADD COLUMN IF NOT EXISTS saldo_atual DECIMAL(15,2) DEFAULT 0, ADD COLUMN IF NOT EXISTS ong_id INTEGER DEFAULT 1`);
        await run(`ALTER TABLE transferencias ADD COLUMN IF NOT EXISTS origem_id INTEGER, ADD COLUMN IF NOT EXISTS destino_id INTEGER, ADD COLUMN IF NOT EXISTS valor DECIMAL(15,2), ADD COLUMN IF NOT EXISTS data_transferencia DATE DEFAULT CURRENT_DATE, ADD COLUMN IF NOT EXISTS usuario_id INTEGER`);
        await run(`ALTER TABLE projeto_colaborador ADD COLUMN IF NOT EXISTS projeto_id INTEGER, ADD COLUMN IF NOT EXISTS usuario_id INTEGER, ADD COLUMN IF NOT EXISTS funcao VARCHAR(100)`);
        await run(`ALTER TABLE curso ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(255)`); // Para evitar erros em outros módulos se existirem

        console.log('--- Sincronização de Esquema Concluída ✅ ---');

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
