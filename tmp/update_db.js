const pool = require('../backend/db_selector');

async function updateDb() {
    try {
        console.log('--- Iniciando Reestruturação de Governança ---');

        // 1. Criar Tabela de Atividades (Planos de Ação)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS atividade (
                id SERIAL PRIMARY KEY,
                projeto_id INTEGER REFERENCES projeto(id),
                nome VARCHAR(255) NOT NULL,
                orcamento_previsto DECIMAL(15,2) DEFAULT 0,
                responsavel_id INTEGER REFERENCES usuario(id),
                data_inicio DATE,
                data_fim DATE,
                status VARCHAR(50) DEFAULT 'planeado'
            )
        `);

        // 2. Adicionar Colunas de Governança em Despesa
        // Verificar se as colunas já existem antes de adicionar
        const colsResult = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'despesa'
        `);
        const columns = colsResult.rows.map(r => r.column_name);

        if (!columns.includes('atividade_id')) {
            await pool.query('ALTER TABLE despesa ADD COLUMN atividade_id INTEGER REFERENCES atividade(id)');
        }
        if (!columns.includes('justificativa')) {
            await pool.query('ALTER TABLE despesa ADD COLUMN justificativa TEXT');
        }
        if (!columns.includes('parecer_coordenador')) {
            await pool.query('ALTER TABLE despesa ADD COLUMN parecer_coordenador TEXT');
        }

        console.log('--- Governança de Dados Atualizada com Sucesso ---');
        process.exit(0);
    } catch (err) {
        console.error('Erro na atualização:', err);
        process.exit(1);
    }
}

updateDb();
