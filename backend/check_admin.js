const bcrypt = require('bcryptjs');
const pool = require('./db_selector');

async function checkUser() {
    try {
        const email = 'admin@civis.org';
        console.log(`Verificando usuário: ${email}`);

        const result = await pool.query('SELECT id, nome, email, senha_hash, perfil, ativo FROM usuario WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            console.log('❌ Usuário não encontrado no banco de dados!');
        } else {
            const user = result.rows[0];
            console.log('✅ Usuário encontrado:');
            console.log(`   ID: ${user.id}`);
            console.log(`   Nome: ${user.nome}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Perfil: ${user.perfil}`);
            console.log(`   Ativo: ${user.ativo === 1 || user.ativo === true ? 'SIM' : 'NÃO'}`);

            const match = await bcrypt.compare('admin123', user.senha_hash);
            console.log(`   Senha "admin123" confere? ${match ? 'SIM' : 'NÃO'}`);
        }
        process.exit(0);
    } catch (err) {
        console.error('❌ Erro durante a verificação:', err.message);
        process.exit(1);
    }
}

checkUser();
