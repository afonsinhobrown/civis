const pool = require('../backend/db_selector');

async function updateDb() {
    try {
        console.log('--- Iniciando Super-Reestruturação (RH, Caixas e Governança) ---');

        // 1. Gestão de Caixas e Contas Bancárias
        await pool.query(`
            CREATE TABLE IF NOT EXISTS contas_caixa (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(100) NOT NULL,
                tipo VARCHAR(20) DEFAULT 'Banco', -- Banco, Caixa Pequeno, Mobile Money
                saldo_atual DECIMAL(15,2) DEFAULT 0,
                ong_id INTEGER NOT NULL DEFAULT 1,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
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
        `);

        // 2. Extensão de RH (Colaboradores)
        // Adicionar campos no usuario para torná-lo um Colaborador rico
        try {
            await pool.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cargo VARCHAR(100);`);
            await pool.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS bi_nuit VARCHAR(50);`);
            await pool.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS data_contratacao DATE;`);
            await pool.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS salario_base DECIMAL(15,2);`);
        } catch (e) { console.log('Campos de RH já existem.'); }

        // Tabela de Vinculação Projeto-Colaborador
        await pool.query(`
            CREATE TABLE IF NOT EXISTS projeto_colaborador (
                id SERIAL PRIMARY KEY,
                projeto_id INTEGER REFERENCES projetos(id),
                usuario_id INTEGER REFERENCES usuarios(id),
                funcao VARCHAR(100),
                atribuido_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 3. Extensão de Relatórios de Atividades
        try {
            await pool.query(`ALTER TABLE atividades ADD COLUMN IF NOT EXISTS relatorio_progresso TEXT;`);
            await pool.query(`ALTER TABLE atividades ADD COLUMN IF NOT EXISTS status_execucao INTEGER DEFAULT 0; -- 0 a 100%`);
            await pool.query(`ALTER TABLE atividades ADD COLUMN IF NOT EXISTS data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);
        } catch (e) { console.log('Campos de atividades já existem.'); }

        // Inserir algumas contas padrão se não existirem
        const contas = await pool.query('SELECT count(*) FROM contas_caixa');
        if (contas.rows[0].count === '0') {
            await pool.query(`INSERT INTO contas_caixa (nome, tipo, saldo_atual) VALUES 
                ('Conta Principal BCI', 'Banco', 500000),
                ('Caixa Sede', 'Caixa Pequeno', 15000),
                ('M-Pesa Operacional', 'Mobile Money', 5000)`);
        }

        console.log('✅ Base de dados preparada para o sistema de alta performance.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Erro na atualização:', err);
        process.exit(1);
    }
}

updateDb();
