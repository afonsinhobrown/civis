const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('./db_selector');

const JWT_SECRET = process.env.JWT_SECRET || 'erp_secret';

async function autenticar(email, senha) {
    const result = await pool.query('SELECT * FROM usuario WHERE email = $1 AND ativo = TRUE', [email]);
    const user = result.rows[0];
    if (!user) return null;
    const match = await bcrypt.compare(senha, user.senha_hash);
    if (!match) return null;
    const token = jwt.sign({ id: user.id, perfil: user.perfil, ong_id: user.ong_id }, JWT_SECRET, { expiresIn: '8h' });
    return { token, user };
}

function verificarToken(req, res, next) {
    const auth = req.headers['authorization'];
    if (!auth) return res.status(401).json({ error: 'Token ausente' });
    const token = auth.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Token inválido' });
        req.usuario = decoded;
        next();
    });
}

function permitirPerfis(...perfis) {
    return (req, res, next) => {
        if (!req.usuario || !perfis.includes(req.usuario.perfil)) {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        next();
    };
}

module.exports = { autenticar, verificarToken, permitirPerfis };
