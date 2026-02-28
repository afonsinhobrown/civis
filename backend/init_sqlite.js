const fs = require('fs');
const path = require('path');
const dbFile = path.resolve(__dirname, 'erp_social.sqlite');

// Fechar e apagar se existir para garantir schema novo
if (fs.existsSync(dbFile)) {
    fs.unlinkSync(dbFile);
}

const db = require('./db_sqlite');
const schema = fs.readFileSync(__dirname + '/erp_social_schema_sqlite.sql', 'utf8');

db.exec(schema, (err) => {
    if (err) {
        console.error('Erro ao criar tabelas SQLite:', err.message);
        process.exit(1);
    } else {
        console.log('Banco de dados reinicializado com sucesso.');
        process.exit(0);
    }
});
