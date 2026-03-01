const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const pool = require('./db_selector');

async function obterDadosRelatorio(tipo) {
    let query = '';
    if (tipo === 'projeto') {
        query = `SELECT p.nome as projeto, p.codigo_interno, p.orcamento_total, 
                 COALESCE(SUM(d.valor), 0) as total_gasto,
                 (p.orcamento_total - COALESCE(SUM(d.valor), 0)) as saldo
                 FROM projeto p
                 LEFT JOIN despesa d ON d.projeto_id = p.id AND d.estado = 'aprovado'
                 GROUP BY p.id, p.nome, p.codigo_interno, p.orcamento_total`;
    } else if (tipo === 'financeiro') {
        query = `SELECT d.data_despesa, d.categoria, d.fornecedor, d.valor, d.moeda, d.justificativa, p.nome as projeto
                 FROM despesa d
                 JOIN projeto p ON d.projeto_id = p.id
                 WHERE d.estado = 'aprovado'
                 ORDER BY d.data_despesa DESC`;
    } else if (tipo === 'patrimonio') {
        query = `SELECT nome, tipo, codigo_ativo, data_aquisicao, valor_compra, estado_conservacao, localizacao FROM patrimonio`;
    } else if (tipo === 'rh') {
        query = `SELECT nome, email, perfil, cargo, data_contratacao, salario_base FROM usuario WHERE ativo = true`;
    } else if (tipo === 'receitas') {
        query = `SELECT r.data, f.nome as financiador, r.tipo_fundo, r.valor, r.moeda, p.nome as projeto
                 FROM receita r
                 LEFT JOIN financiador f ON r.financiador_id = f.id
                 LEFT JOIN projeto p ON r.projeto_id = p.id
                 ORDER BY r.data DESC`;
    }

    if (!query) return [];
    const result = await pool.query(query);
    return result.rows;
}

async function exportarExcel(tipo, res) {
    try {
        const dados = await obterDadosRelatorio(tipo);
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Relatório ' + tipo);

        if (dados.length > 0) {
            sheet.addRow(Object.keys(dados[0]).map(k => k.toUpperCase()));
            dados.forEach(row => sheet.addRow(Object.values(row)));
        } else {
            sheet.addRow(['Sem dados para este relatório']);
        }

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=relatorio_${tipo}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        res.status(500).send(err.message);
    }
}

async function exportarPDF(tipo, res) {
    try {
        const dados = await obterDadosRelatorio(tipo);
        const doc = new PDFDocument({ margin: 30, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=relatorio_${tipo}.pdf`);
        doc.pipe(res);

        // Cabeçalho Rico
        doc.fontSize(20).text('CIVIS SOCIAL - GOVERNANÇA INTEGRADA', { align: 'center' });
        doc.fontSize(10).text('Relatório Oficial de Auditoria e Transparência', { align: 'center' });
        doc.moveDown();
        doc.moveTo(30, doc.y).lineTo(565, doc.y).stroke();
        doc.moveDown();

        doc.fontSize(14).text(`Módulo: ${tipo.toUpperCase()}`, { underline: true });
        doc.fontSize(10).text(`Data de Geração: ${new Date().toLocaleString()}`);
        doc.moveDown();

        if (dados.length > 0) {
            const keys = Object.keys(dados[0]);
            const colWidth = 535 / keys.length;

            // Header da Tabela
            let currentY = doc.y;
            doc.rect(30, currentY, 535, 20).fill('#f0f0f0').stroke();
            doc.fillColor('black').fontSize(9);
            keys.forEach((k, i) => {
                doc.text(k.toUpperCase().replace('_', ' '), 35 + (i * colWidth), currentY + 5, { width: colWidth, truncate: true });
            });
            doc.moveDown();

            // Linhas
            dados.forEach((row, rowIndex) => {
                if (doc.y > 750) doc.addPage();
                let lineY = doc.y;
                let values = Object.values(row);
                values.forEach((v, i) => {
                    doc.text(String(v || 'N/A'), 35 + (i * colWidth), lineY, { width: colWidth });
                });
                doc.moveDown(0.5);
                doc.moveTo(30, doc.y).lineTo(565, doc.y).strokeColor('#eeeeee').stroke();
                doc.moveDown(0.5);
            });
        } else {
            doc.text('Não foram encontrados registos para este critério.');
        }

        doc.fontSize(8).text('Documento gerado eletronicamente pelo sistema CIVIS Social.', 30, 780, { align: 'center' });
        doc.end();
    } catch (err) {
        res.status(500).send(err.message);
    }
}

module.exports = { exportarExcel, exportarPDF };
