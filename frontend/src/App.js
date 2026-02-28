import React, { useState } from 'react';

import Dashboard from './Dashboard';
import Projetos from './Projetos';
import Usuarios from './Usuarios';
import Despesas from './Despesas';
import Receitas from './Receitas';
import Auditoria from './Auditoria';
import Login from './Login';
import GestaoFinanceira from './GestaoFinanceira';
import Salarios from './Salarios';
import Patrimonio from './Patrimonio';
import Configuracao from './Configuracao';

function App() {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

    const handleLogin = (jwt, userData) => {
        setToken(jwt);
        setUser(userData);
        localStorage.setItem('token', jwt);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const handleLogout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    const [modulo, setModulo] = useState('dashboard');

    if (!token) {
        return <Login onLogin={handleLogin} />;
    }

    return (
        <div className="app-container">
            <header>
                <h1>CIVIS Social</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{user ? user.nome : 'Usuário'}</span>
                    <button className="logout-btn" onClick={handleLogout}>Sair</button>
                </div>
            </header>

            <nav style={{ flexWrap: 'wrap', gap: '5px' }}>
                <button className={modulo === 'dashboard' ? 'active' : ''} onClick={() => setModulo('dashboard')}>Dashboard</button>
                <button className={modulo === 'financeiro' ? 'active' : ''} onClick={() => setModulo('financeiro')}>Financeiro</button>
                <button className={modulo === 'salarios' ? 'active' : ''} onClick={() => setModulo('salarios')}>Salários</button>
                <button className={modulo === 'patrimonio' ? 'active' : ''} onClick={() => setModulo('patrimonio')}>Património</button>
                <button className={modulo === 'projetos' ? 'active' : ''} onClick={() => setModulo('projetos')}>Projetos</button>
                <button className={modulo === 'usuarios' ? 'active' : ''} onClick={() => setModulo('usuarios')}>Utilizadores</button>
                <button className={modulo === 'receitas' ? 'active' : ''} onClick={() => setModulo('receitas')}>Entradas</button>
                <button className={modulo === 'despesas' ? 'active' : ''} onClick={() => setModulo('despesas')}>Saídas</button>
                <button className={modulo === 'auditoria' ? 'active' : ''} onClick={() => setModulo('auditoria')}>🛡️ Auditoria</button>
                <button className={modulo === 'config' ? 'active' : ''} onClick={() => setModulo('config')}>⚙️</button>
            </nav>

            <main className="main-content">
                {modulo === 'dashboard' && <Dashboard user={user} />}
                {modulo === 'financeiro' && <GestaoFinanceira user={user} />}
                {modulo === 'salarios' && <Salarios user={user} />}
                {modulo === 'patrimonio' && <Patrimonio user={user} />}
                {modulo === 'projetos' && <Projetos user={user} />}
                {modulo === 'usuarios' && <Usuarios user={user} />}
                {modulo === 'receitas' && <Receitas user={user} />}
                {modulo === 'despesas' && <Despesas user={user} />}
                {modulo === 'auditoria' && <Auditoria user={user} />}
                {modulo === 'config' && <Configuracao user={user} />}
            </main>
        </div>
    );
}

export default App;
