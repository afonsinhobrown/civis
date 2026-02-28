// Seleciona o banco conforme variável de ambiente DB_TYPE
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
let dbType = process.env.DB_TYPE || 'pg';

if (dbType === 'sqlite') {
    module.exports = require('./db_sqlite');
} else {
    module.exports = require('./db');
}
