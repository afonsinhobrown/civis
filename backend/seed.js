const bcrypt = require('bcryptjs');
const pool = require('./db_selector');

async function seed() {
    try {
        console.log('Limpando banco de dados para novo seed...');
        // Ordem de exclusão: Filhos -> Pais
        await pool.query("DELETE FROM log_auditoria");
        await pool.query("DELETE FROM processo_inspecao");
        await pool.query("DELETE FROM patrimonio");
        await pool.query("DELETE FROM folha_pagamento");
        await pool.query("DELETE FROM beneficiario");
        await pool.query("DELETE FROM despesa");
        await pool.query("DELETE FROM receita");
        await pool.query("DELETE FROM centro_custo");
        await pool.query("DELETE FROM categoria_financeira");
        await pool.query("DELETE FROM usuario");
        await pool.query("DELETE FROM projeto");
        await pool.query("DELETE FROM financiador");
        await pool.query("DELETE FROM configuracao");
        await pool.query("DELETE FROM ong");

        // Criar ONG inicial
        const ongResult = await pool.query(
            "INSERT INTO ong (nome, nuit_nif, pais) VALUES ($1, $2, $3) RETURNING id",
            ['CIVIS Moçambique', '600123456', 'Moçambique']
        );
        const ongId = ongResult.rows[0].id;

        // Criar Usuário Admin
        const senhaHashAdmin = await bcrypt.hash('admin123', 10);
        const adminResult = await pool.query(
            "INSERT INTO usuario (nome, email, senha_hash, perfil, ativo, ong_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
            ['Administrador', 'admin@civis.org', senhaHashAdmin, 'Administrador', 1, ongId]
        );
        const adminId = adminResult.rows[0].id;

        // Criar Usuário Comum (Gestor de Projeto)
        const senhaHashUser = await bcrypt.hash('civis123', 10);
        await pool.query(
            "INSERT INTO usuario (nome, email, senha_hash, perfil, ativo, ong_id) VALUES ($1, $2, $3, $4, $5, $6)",
            ['Gestor de Projeto', 'gestor@civis.org', senhaHashUser, 'Gestor de Projeto', 1, ongId]
        );

        // Criar Projeto e Dados Financeiros
        const projResult = await pool.query(
            "INSERT INTO projeto (nome, codigo_interno, orcamento_total, estado, ong_id) VALUES ($1, $2, $3, $4, $5) RETURNING id",
            ['Educação para Todos', 'PROJ-001', 500000, 'Ativo', ongId]
        );
        const projId = projResult.rows[0].id;

        await pool.query(
            "INSERT INTO receita (projeto_id, tipo_fundo, valor, moeda, data_recebimento) VALUES ($1, $2, $3, $4, $5)",
            [projId, 'Subsídio do Estado', 250000, 'MZN', '2026-02-01']
        );

        await pool.query(
            "INSERT INTO despesa (projeto_id, categoria, fornecedor, valor, moeda, estado, data_despesa) VALUES ($1, $2, $3, $4, $5, $6, $7)",
            [projId, 'Material Escolar', 'Papelaria Central', 45000, 'MZN', 'aprovado', '2026-02-20']
        );

        await pool.query(
            "INSERT INTO despesa (projeto_id, categoria, fornecedor, valor, moeda, estado, data_despesa) VALUES ($1, $2, $3, $4, $5, $6, $7)",
            [projId, 'Consultoria Técnica', 'KPMG Moçambique', 120000, 'MZN', 'aprovado', '2026-02-25']
        );

        // --- DADOS REVOLUCIONÁRIOS ---
        // Configurações (Impostos)
        await pool.query("INSERT INTO configuracao (chave, valor, descricao) VALUES ('INSS_COLABORADOR', '0.03', 'Taxa de INSS do Colaborador (Moçambique)')");
        await pool.query("INSERT INTO configuracao (chave, valor, descricao) VALUES ('IRPS_RETENCAO', '0.10', 'Taxa média de retenção de IRPS')");

        // Património
        await pool.query(
            "INSERT INTO patrimonio (nome, tipo, codigo_ativo, data_aquisicao, valor_compra, estado_conservacao, localizacao, ong_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
            ['Toyota Hilux 4x4', 'Veículo', 'MOZ-ONG-001', '2024-05-10', 2500000, 'Bom', 'Sede Maputo', ongId]
        );

        // Beneficiários (Impacto Social)
        await pool.query(
            "INSERT INTO beneficiario (tipo, numero_identificacao, provincia, distrito, projeto_id) VALUES ($1,$2,$3,$4,$5)",
            ['Família', 'FAM-5001', 'Maputo', 'Matola', projId]
        );

        // --- REVOLUCIONÁRIO: Logs de Auditoria (Accountability Total) ---
        await pool.query(
            "INSERT INTO log_auditoria (usuario_id, ip, tipo_acao, tabela_afetada, registro_id, detalhes) VALUES ($1,$2,$3,$4,$5,$6)",
            [adminId, '192.168.1.10', 'LOGIN', 'auth', 0, 'Login efetuado com sucesso via Web']
        );
        await pool.query(
            "INSERT INTO log_auditoria (usuario_id, ip, tipo_acao, tabela_afetada, registro_id, detalhes) VALUES ($1,$2,$3,$4,$5,$6)",
            [adminId, '192.168.1.10', 'UPDATE', 'configuracao', 1, 'Alteração da taxa de INSS para 3% conforme Lei nº 23/2007']
        );

        // Projeto 2: Saúde Comunitária
        const proj2 = await pool.query(
            "INSERT INTO projeto (nome, codigo_interno, orcamento_total, estado, ong_id) VALUES ($1, $2, $3, $4, $5) RETURNING id",
            ['Saúde Materno-Infantil', 'PROJ-002', 800000, 'Planeado', ongId]
        );

        console.log('--- REVOLUÇÃO CIVIS ATIVADA ---');

        console.log('Seed finalizado com sucesso!');
        console.log('Usuário: admin@civis.org | Senha: admin123');
        process.exit(0);
    } catch (err) {
        console.error('Erro no seed:', err.message);
        process.exit(1);
    }
}

seed();
