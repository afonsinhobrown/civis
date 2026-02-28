// Conexão SQLite para testes locais
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'erp_social.sqlite');
const db = new sqlite3.Database(dbPath);

// Wrapper para simular a interface do pg (PostgreSQL)
db.query = (text, params = []) => {
    // Converter placeholders de $1, $2 para ? para SQLite se necessário
    // Embora o ideal fosse usar um builder, aqui faremos um replace simples para compatibilidade básica
    const sql = text.replace(/\$(\d+)/g, '?');

    return new Promise((resolve, reject) => {
        const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
        const hasReturning = sql.trim().toUpperCase().includes('RETURNING');

        if (isSelect || hasReturning) {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve({ rows });
            });
        } else {
            db.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve({
                    rows: this.lastID ? [{ id: this.lastID }] : [],
                    rowCount: this.changes
                });
            });
        }
    });
};

module.exports = db;
