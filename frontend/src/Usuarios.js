import React, { useEffect, useState } from 'react';
import axios from './api';

function Usuarios() {
    const [usuarios, setUsuarios] = useState([]);
    const [form, setForm] = useState({ nome: '', email: '', senha_hash: '', perfil: 'Gestor de Projeto', ativo: true, ong_id: 1 });
    const [msg, setMsg] = useState('');

    const fetchUsuarios = async () => {
        try {
            const res = await axios.get('/api/usuario');
            setUsuarios(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchUsuarios();
    }, []);

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async e => {
        e.preventDefault();
        try {
            await axios.post('/api/usuario', form);
            setMsg('✅ Colaborador cadastrado com sucesso!');
            fetchUsuarios();
            setForm({ nome: '', email: '', senha_hash: '', perfil: 'Gestor de Projeto', ativo: true, ong_id: 1 });
        } catch {
            setMsg('❌ Erro: Email já cadastrado ou campos inválidos.');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card">
                <h2>Gestão de Colaboradores & Perfis</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                    Defina o nível de acesso e a vinculação institucional de cada membro da equipe.
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label>Nome Completo:</label>
                        <input name="nome" value={form.nome} onChange={handleChange} required />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label>Email Corporativo:</label>
                        <input name="email" type="email" value={form.email} onChange={handleChange} required />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label>Senha Provisória:</label>
                        <input name="senha_hash" type="password" value={form.senha_hash} onChange={handleChange} required />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label>Perfil de Acesso:</label>
                        <select name="perfil" value={form.perfil} onChange={handleChange}>
                            <option value="Administrador">Administrador (Audit)</option>
                            <option value="Diretor">Diretor Operacional (Reviewer)</option>
                            <option value="Gestor de Projeto">Gestor de Projeto (Executor)</option>
                            <option value="Financeiro">Financeiro (Controler)</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label>Vincular à ONG/Entidade:</label>
                        <input name="ong_id" type="number" value={form.ong_id} onChange={handleChange} required />
                    </div>
                    <button type="submit" className="nav-button" style={{ background: 'var(--accent)', color: 'white', marginTop: 'auto' }}>Cadastrar Acesso</button>
                </form>
                {msg && <p style={{ marginTop: '1rem', color: msg.includes('✅') ? 'var(--accent)' : 'var(--danger)', textAlign: 'center' }}>{msg}</p>}
            </div>

            <div className="card">
                <h3>Equipe & Governança</h3>
                <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {usuarios.map(u => (
                        <div key={u.id} style={{
                            padding: '1rem',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <strong style={{ fontSize: '1.1rem' }}>{u.nome}</strong>
                                <br />
                                <small style={{ color: 'var(--text-muted)' }}>{u.email}</small>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{
                                    fontSize: '0.75rem',
                                    padding: '4px 10px',
                                    borderRadius: '50px',
                                    background: u.perfil === 'Administrador' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                    color: 'white'
                                }}>{u.perfil.toUpperCase()}</span>
                                <small style={{ display: 'block', marginTop: '5px', color: 'var(--accent)' }}>Entidade ID: {u.ong_id}</small>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Usuarios;
