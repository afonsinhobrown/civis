import React, { useState } from 'react';
import axios from './api';

function Login({ onLogin }) {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErro('');
        try {
            const res = await axios.post('/api/login', { email, senha });
            onLogin(res.data.token, res.data.user);
        } catch (err) {
            setErro('Credenciais inválidas');
        }
    };

    return (
        <div className="login-screen">
            <div className="login-card">
                <h2>CIVIS Social</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Governança e Transparência - Moçambique</p>
                <form onSubmit={handleSubmit}>
                    <input type="email" placeholder="Seu email corporativo" value={email} onChange={e => setEmail(e.target.value)} required />
                    <input type="password" placeholder="Sua senha segura" value={senha} onChange={e => setSenha(e.target.value)} required />
                    <button type="submit">Acessar Sistema</button>
                </form>
                {erro && <p style={{ color: 'var(--danger)', marginTop: '1rem' }}>{erro}</p>}
                <div style={{ marginTop: '2rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.2)' }}>
                    &copy; 2026 Tecnologia & Transparência
                </div>
            </div>
        </div>
    );
}

export default Login;
