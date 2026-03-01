const express = require('express');
const router = express.Router();
const pool = require('./db_selector');
const { autenticar, verificarToken, permitirPerfis } = require('./auth');
const { exportarExcel, exportarPDF } = require('./export');

// Aprovar despesa com parecer
router.post('/despesa/:id/aprovar', verificarToken, permitirPerfis('Administrador', 'Financeiro', 'Diretor'), async (req, res) => {
    const { parecer } = req.body;
    try {
        const result = await pool.query('UPDATE despesa SET estado = $1, parecer_coordenador = $2 WHERE id = $3 RETURNING *', ['aprovado', parecer, req.params.id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mandar despesa para revisão ou rejeitar
router.post('/despesa/:id/reconsiderar', verificarToken, permitirPerfis('Administrador', 'Financeiro', 'Diretor'), async (req, res) => {
    const { acao, parecer } = req.body; // acao: 'revisar' ou 'rejeitado'
    try {
        const result = await pool.query('UPDATE despesa SET estado = $1, parecer_coordenador = $2 WHERE id = $3 RETURNING *', [acao, parecer, req.params.id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Exportação de relatórios
router.get('/relatorio/:tipo/excel', verificarToken, async (req, res) => {
    await exportarExcel(req.params.tipo, res);
});
router.get('/relatorio/:tipo/pdf', verificarToken, async (req, res) => {
    await exportarPDF(req.params.tipo, res);
});

// Login
router.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    try {
        const result = await autenticar(email, senha);
        if (!result) return res.status(401).json({ error: 'Credenciais inválidas' });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Financiador
router.post('/financiador', verificarToken, permitirPerfis('Administrador', 'Financeiro'), async (req, res) => {
    const { nome, contato, ong_id } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO financiador (nome, contato, ong_id) VALUES ($1,$2,$3) RETURNING *',
            [nome, contato, ong_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/financiador', verificarToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM financiador');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Receita
router.post('/receita', verificarToken, permitirPerfis('Administrador', 'Financeiro'), async (req, res) => {
    const { projeto_id, financiador_id, tipo_fundo, data, valor, moeda, taxa_cambio, comprovativo_url } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO receita (projeto_id, financiador_id, tipo_fundo, data, valor, moeda, taxa_cambio, comprovativo_url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
            [projeto_id, financiador_id, tipo_fundo, data, valor, moeda, taxa_cambio, comprovativo_url]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/receita', verificarToken, async (req, res) => {
    try {
        let sql = `
            SELECT r.*, p.nome as projeto_nome, f.nome as financiador_nome 
            FROM receita r 
            LEFT JOIN projeto p ON r.projeto_id = p.id 
            LEFT JOIN financiador f ON r.financiador_id = f.id
        `;
        let params = [];

        if (req.usuario.perfil === 'Gestor de Projeto') {
            sql += ` WHERE p.ong_id = $1 AND (p.id IN (SELECT id FROM projeto WHERE ong_id = $1)) `; // Simplificado: gestores de uma ONG veem os dela. Idealmente um link gestor_projeto.
            params = [req.usuario.ong_id];
        }

        sql += ` ORDER BY r.data DESC `;
        const result = await pool.query(sql, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/despesa', verificarToken, permitirPerfis('Administrador', 'Financeiro', 'Gestor de Projeto'), async (req, res) => {
    const { projeto_id, atividade_id, justificativa, centro_custo_id, categoria, fornecedor, valor, moeda, metodo_pagamento, comprovativo_url, responsavel_id, estado } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO despesa (projeto_id, atividade_id, justificativa, centro_custo_id, categoria, fornecedor, valor, moeda, metodo_pagamento, comprovativo_url, responsavel_id, estado) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *',
            [projeto_id, atividade_id, justificativa, centro_custo_id, categoria, fornecedor, valor, moeda, metodo_pagamento, comprovativo_url, responsavel_id, estado || 'submetido']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/despesa', verificarToken, async (req, res) => {
    try {
        let sql = `
            SELECT d.*, p.nome as projeto_nome, u.nome as responsavel_nome, cc.nome as centro_custo_nome, a.nome as atividade_nome
            FROM despesa d
            LEFT JOIN projeto p ON d.projeto_id = p.id
            LEFT JOIN usuario u ON d.responsavel_id = u.id
            LEFT JOIN centro_custo cc ON d.centro_custo_id = cc.id
            LEFT JOIN atividade a ON d.atividade_id = a.id
        `;
        let params = [];

        if (req.usuario.perfil === 'Gestor de Projeto') {
            sql += ` WHERE d.responsavel_id = $1 OR p.id IN (SELECT id FROM projeto WHERE ong_id = $2) `;
            params = [req.usuario.id, req.usuario.ong_id];
        }

        sql += ` ORDER BY d.data_despesa DESC `;
        const result = await pool.query(sql, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Beneficiário
router.post('/beneficiario', verificarToken, permitirPerfis('Administrador', 'Gestor de Projeto'), async (req, res) => {
    const { tipo, numero_identificacao, provincia, distrito, projeto_id, historico, status } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO beneficiario (tipo, numero_identificacao, provincia, distrito, projeto_id, historico, status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
            [tipo, numero_identificacao, provincia, distrito, projeto_id, historico, status]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/beneficiario', verificarToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT b.*, p.nome as projeto_nome 
            FROM beneficiario b 
            LEFT JOIN projeto p ON b.projeto_id = p.id
            ORDER BY b.id DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Log de Auditoria
router.post('/log_auditoria', verificarToken, permitirPerfis('Administrador', 'Auditor'), async (req, res) => {
    const { usuario_id, ip, tipo_acao, registro_afetado, registro_id, detalhes } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO log_auditoria (usuario_id, ip, tipo_acao, registro_afetado, registro_id, detalhes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
            [usuario_id, ip, tipo_acao, registro_afetado, registro_id, detalhes]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/log_auditoria', verificarToken, permitirPerfis('Administrador', 'Auditor'), async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM log_auditoria');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ONG
router.post('/ong', verificarToken, permitirPerfis('Administrador'), async (req, res) => {
    const { nome, nuit_nif, endereco, contactos, pais, estatutos_url, certificado_url } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO ong (nome, nuit_nif, endereco, contactos, pais, estatutos_url, certificado_url) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
            [nome, nuit_nif, endereco, contactos, pais, estatutos_url, certificado_url]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get('/ong', verificarToken, permitirPerfis('Administrador', 'Diretor', 'Auditor'), async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM ong');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- GESTÃO DE CAIXA E BANCO ---
router.get('/conta_caixa', verificarToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM contas_caixa WHERE ong_id = $1', [req.usuario.ong_id]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/transferencia', verificarToken, permitirPerfis('Administrador', 'Financeiro'), async (req, res) => {
    const { origem_id, destino_id, valor, data, justificativa } = req.body;
    try {
        await pool.query('BEGIN');
        // Debitar origem
        await pool.query('UPDATE contas_caixa SET saldo_atual = saldo_atual - $1 WHERE id = $2', [valor, origem_id]);
        // Creditar destino
        await pool.query('UPDATE contas_caixa SET saldo_atual = saldo_atual + $1 WHERE id = $2', [valor, destino_id]);
        // Registrar log
        const result = await pool.query(
            'INSERT INTO transferencias (origem_id, destino_id, valor, data_transferencia, justificativa, usuario_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
            [origem_id, destino_id, valor, data, justificativa, req.usuario.id]
        );
        await pool.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (err) {
        await pool.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    }
});

// --- GESTÃO DE RECURSOS HUMANOS (EXTENSÃO) ---
router.post('/colaborador/projeto', verificarToken, permitirPerfis('Administrador', 'Gestor de Projeto'), async (req, res) => {
    const { projeto_id, usuario_id, funcao } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO projeto_colaborador (projeto_id, usuario_id, funcao) VALUES ($1,$2,$3) RETURNING *',
            [projeto_id, usuario_id, funcao]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/colaborador/pagamentos/:usuario_id', verificarToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT fp.*, p.nome as projeto_nome 
            FROM folha_pagamento fp 
            LEFT JOIN projeto p ON fp.projeto_id = p.id 
            WHERE fp.usuario_id = $1 ORDER BY data_pagamento DESC
        `, [req.params.usuario_id]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/atividade/:id/progresso', verificarToken, permitirPerfis('Administrador', 'Gestor de Projeto'), async (req, res) => {
    const { relatorio, progresso } = req.body;
    try {
        const result = await pool.query(
            'UPDATE atividade SET relatorio_progresso = $1, status_execucao = $2, data_atualizacao = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
            [relatorio, progresso, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Sobrescrever Usuário para incluir RH
router.get('/usuario', verificarToken, permitirPerfis('Administrador', 'Diretor', 'Financeiro'), async (req, res) => {
    try {
        // Query rica com join para saber projetos do colaborador
        const result = await pool.query(`
            SELECT u.*, 
            (SELECT json_agg(p.nome) FROM projeto_colaborador pc JOIN projeto p ON pc.projeto_id = p.id WHERE pc.usuario_id = u.id) as projetos
            FROM usuario u
        `);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Projeto
router.post('/projeto', verificarToken, permitirPerfis('Administrador', 'Gestor de Projeto'), async (req, res) => {
    const { nome, codigo_interno, orçamento_total, data_inicio, data_fim, objetivos, estado, ong_id } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO projeto (nome, codigo_interno, orçamento_total, data_inicio, data_fim, objetivos, estado, ong_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
            [nome, codigo_interno, orçamento_total, data_inicio, data_fim, objetivos, estado, ong_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get('/projeto', verificarToken, async (req, res) => {
    try {
        let sql = `
            SELECT p.*, u.nome as responsavel_nome 
            FROM projeto p 
            LEFT JOIN usuario u ON p.ong_id = u.ong_id AND u.perfil = 'Gestor de Projeto'
        `;
        let params = [];

        if (req.usuario.perfil === 'Gestor de Projeto') {
            sql += ` WHERE p.ong_id = $1 `;
            params = [req.usuario.ong_id];
        }

        sql += ` ORDER BY p.data_inicio DESC `;
        const result = await pool.query(sql, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Atividades
router.post('/atividade', verificarToken, permitirPerfis('Administrador', 'Gestor de Projeto'), async (req, res) => {
    const { projeto_id, nome, orcamento_previsto, responsavel_id, data_inicio, data_fim, status } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO atividade (projeto_id, nome, orcamento_previsto, responsavel_id, data_inicio, data_fim, status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
            [projeto_id, nome, orcamento_previsto, responsavel_id || req.usuario.id, data_inicio, data_fim, status || 'planeado']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/atividade', verificarToken, async (req, res) => {
    const { projeto_id } = req.query;
    try {
        let sql = 'SELECT * FROM atividade';
        let params = [];
        if (projeto_id) {
            sql += ' WHERE projeto_id = $1';
            params = [projeto_id];
        }
        const result = await pool.query(sql, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Folha de Pagamento (Salários)
router.get('/folha_pagamento', verificarToken, permitirPerfis('Administrador', 'Financeiro'), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT fp.*, u.nome as colaborador 
            FROM folha_pagamento fp 
            JOIN usuario u ON fp.usuario_id = u.id
            ORDER BY fp.ano_referencia DESC, fp.mes_referencia DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/folha_pagamento', verificarToken, permitirPerfis('Administrador', 'Financeiro'), async (req, res) => {
    const { usuario_id, projeto_id, mes_referencia, ano_referencia, salario_base, subsidios, desconto_inss, desconto_irps, salario_liquido, data_pagamento } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO folha_pagamento (usuario_id, projeto_id, mes_referencia, ano_referencia, salario_base, subsidios, desconto_inss, desconto_irps, salario_liquido, data_pagamento, estado) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, $10, $11) RETURNING *',
            [usuario_id, projeto_id, mes_referencia, ano_referencia, salario_base, subsidios, desconto_inss, desconto_irps, salario_liquido, data_pagamento, 'pago']
        );

        // Registrar como despesa AUTOMATICAMENTE vinculada ao projeto
        await pool.query(
            'INSERT INTO despesa (projeto_id, categoria, fornecedor, valor, moeda, estado, data_despesa) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [projeto_id, 'Salários', 'Colaborador ID: ' + usuario_id, Number(salario_base) + Number(subsidios), 'MZN', 'aprovado', data_pagamento]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Configuração (Impostos, Parâmetros)
router.get('/configuracao', verificarToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM configuracao');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/configuracao', verificarToken, permitirPerfis('Administrador'), async (req, res) => {
    const { chave, valor, descricao } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO configuracao (chave, valor, descricao) VALUES ($1, $2, $3) RETURNING *',
            [chave, valor, descricao]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Património (Gestão de Ativos)
router.get('/patrimonio', verificarToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM patrimonio');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/patrimonio', verificarToken, permitirPerfis('Administrador', 'Financeiro'), async (req, res) => {
    const { nome, tipo, codigo_ativo, data_aquisicao, valor_compra, estado_conservacao, localizacao, ong_id } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO patrimonio (nome, tipo, codigo_ativo, data_aquisicao, valor_compra, estado_conservacao, localizacao, ong_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
            [nome, tipo, codigo_ativo, data_aquisicao, valor_compra, estado_conservacao, localizacao, ong_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Processos de Inspecção
router.get('/processo_inspecao', verificarToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM processo_inspecao');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/processo_inspecao', verificarToken, permitirPerfis('Administrador', 'Auditor'), async (req, res) => {
    const { titulo, periodo_inicio, periodo_fim, ong_id } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO processo_inspecao (titulo, periodo_inicio, periodo_fim, ong_id) VALUES ($1,$2,$3,$4) RETURNING *',
            [titulo, periodo_inicio, periodo_fim, ong_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
