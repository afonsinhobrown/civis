const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const pool = require('./db_selector');
const fs = require('fs');

async function exportarRelatorioFinanceiro(tipo, res) {
    let query = '';
    if (tipo === 'projeto') {
        query = `SELECT p.nome as projeto, SUM(r.valor) as receitas, SUM(d.valor) as despesas
      FROM projeto p
      LEFT JOIN receita r ON r.projeto_id = p.id
      LEFT JOIN despesa d ON d.projeto_id = p.id
      GROUP BY p.nome`;
    } else if (tipo === 'financiador') {
        query = `SELECT f.nome as financiador, SUM(r.valor) as receitas
      FROM financiador f
      LEFT JOIN receita r ON r.financiador_id = f.id
      GROUP BY f.nome`;
    }
    const result = await pool.query(query);
    return result.rows;
}

async function exportarExcel(tipo, res) {
    const dados = await exportarRelatorioFinanceiro(tipo, res);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Relatório');
    sheet.addRow(Object.keys(dados[0] || {}));
    dados.forEach(row => sheet.addRow(Object.values(row)));
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=relatorio.xlsx');
    await workbook.xlsx.write(res);
    res.end();
}

async function exportarPDF(tipo, res) {
    const dados = await exportarRelatorioFinanceiro(tipo, res);
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=relatorio.pdf');
    doc.pipe(res);
    doc.fontSize(16).text('Relatório Financeiro', { align: 'center' });
    doc.moveDown();
    if (dados.length > 0) {
        Object.keys(dados[0]).forEach(k => doc.text(k, { continued: true, width: 150 }));
        doc.moveDown();
        dados.forEach(row => {
            Object.values(row).forEach(v => doc.text(String(v), { continued: true, width: 150 }));
            doc.moveDown();
        });
    } else {
        doc.text('Sem dados.');
    }
    doc.end();
}

module.exports = { exportarExcel, exportarPDF };
