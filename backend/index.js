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
        `);
        console.log('Banco de dados sincronizado ✅');
    } catch (err) {
        console.error('Erro na migração:', err);
    }
};

runMigrations().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Servidor rodando em: http://0.0.0.0:${PORT}`);
    });
});
