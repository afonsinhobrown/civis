import React, { useEffect, useState } from 'react';
import axios from './api';

function Despesas({ user }) {
    const [despesas, setDespesas] = useState([]);
    const [form, setForm] = useState({ projeto_id: '', centro_custo_id: '', categoria: '', fornecedor: '', valor: '', moeda: 'MZN', metodo_pagamento: '', comprovativo_url: '', responsavel_id: '', estado: 'submetido' });
    const [msg, setMsg] = useState('');

    const fetchDespesas = () => {
        axios.get('/api/despesa').then(res => setDespesas(res.data));
    };

    useEffect(() => {
        fetchDespesas();
    }, []);

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async e => {
        e.preventDefault();
        try {
            await axios.post('/api/despesa', form);
            setMsg('Despesa submetida com sucesso!');
            fetchDespesas();
        } catch {
            setMsg('Erro ao submeter despesa.');
        }
    };

    const handleAprovar = async (id, acao) => {
        try {
            await axios.post(`/api/despesa/${id}/${acao}`);
            setMsg(`Despesa ${acao === 'aprovar' ? 'aprovada' : 'rejeitada'}!`);
            fetchDespesas();
        } catch {
            setMsg('Sem permissão para esta ação.');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2>Gestão de Despesas</h2>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => window.open('http://localhost:3000/api/relatorio/projeto/pdf', '_blank')} style={{ background: '#334155', fontSize: '0.8rem', padding: '0.5rem 1rem' }}>PDF</button>
                        <button onClick={() => window.open('http://localhost:3000/api/relatorio/projeto/excel', '_blank')} style={{ background: '#334155', fontSize: '0.8rem', padding: '0.5rem 1rem' }}>Excel</button>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <input name="projeto_id" placeholder="ID do Projeto" value={form.projeto_id} onChange={handleChange} required />
                    <input name="categoria" placeholder="Categoria" value={form.categoria} onChange={handleChange} />
                    <input name="fornecedor" placeholder="Fornecedor" value={form.fornecedor} onChange={handleChange} />
                    <input name="valor" placeholder="Valor" value={form.valor} onChange={handleChange} required />
                    <select name="moeda" value={form.moeda} onChange={handleChange}>
                        <option value="MZN">Metical (MZN)</option>
                        <option value="USD">Dólar (USD)</option>
                    </select>
                    <button type="submit">Submeter Despesa</button>
                </form>
                {msg && <p style={{ color: msg.includes('Erro') || msg.includes('permissão') ? 'var(--danger)' : 'var(--accent)', marginTop: '1rem' }}>{msg}</p>}
            </div>

            <div className="card">
                <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>Histórico e Aprovações</h3>
                <ul>
                    {despesas.map(d => (
                        <li key={d.id} style={{ borderLeftColor: d.estado === 'aprovado' ? 'var(--accent)' : d.estado === 'rejeitado' ? 'var(--danger)' : 'var(--primary)' }}>
                            <div style={{ flex: 1 }}>
                                <strong style={{ display: 'block' }}>{d.fornecedor || 'N/A'}</strong>
                                <small style={{ color: 'var(--text-muted)' }}>{d.categoria} • Proj: {d.projeto_id}</small>
                            </div>
                            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <span style={{ fontWeight: '800' }}>{Number(d.valor).toLocaleString()} {d.moeda}</span>

                                {user?.perfil === 'Administrador' && d.estado === 'submetido' && (
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => handleAprovar(d.id, 'aprovar')} style={{ background: 'var(--accent)', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Aprovar</button>
                                        <button onClick={() => handleAprovar(d.id, 'rejeitar')} style={{ background: 'var(--danger)', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Rejeitar</button>
                                    </div>
                                )}

                                <span style={{
                                    fontSize: '0.7rem',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: d.estado === 'aprovado' ? 'var(--accent)' : d.estado === 'rejeitado' ? 'var(--danger)' : 'var(--text-muted)',
                                    minWidth: '85px',
                                    textAlign: 'center'
                                }}>
                                    {d.estado.toUpperCase()}
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default Despesas;
