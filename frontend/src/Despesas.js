import React, { useEffect, useState } from 'react';
import axios from './api';

function Despesas({ user }) {
    const [despesas, setDespesas] = useState([]);
    const [form, setForm] = useState({ projeto_id: '', centro_custo_id: '', categoria: '', fornecedor: '', valor: '', moeda: 'MZN', metodo_pagamento: '', comprovativo_url: '', responsavel_id: '', estado: 'submetido' });
    const [msg, setMsg] = useState('');

    const fetchDespesas = () => {
        axios.get('/api/despesa').then(res => setDespesas(res.data));
    };

    const [projetos, setProjetos] = useState([]);
    const [stats, setStats] = useState({ total_orcamento: 0, total_gasto: 0 });

    const fetchData = async () => {
        try {
            const [rDes, rProj] = await Promise.all([
                axios.get('/api/despesa'),
                axios.get('/api/projeto')
            ]);
            setDespesas(rDes.data);
            setProjetos(rProj.data);

            setStats({
                total_orcamento: rProj.data.reduce((acc, p) => acc + Number(p.orcamento_total || p.orçamento_total || 0), 0),
                total_gasto: rDes.data.filter(d => d.estado === 'aprovado').reduce((acc, d) => acc + Number(d.valor), 0)
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async e => {
        e.preventDefault();
        try {
            const payload = { ...form, responsavel_id: user?.id, data_despesa: new Date().toISOString().split('T')[0] };
            await axios.post('/api/despesa', payload);
            setMsg('✅ Despesa submetida para aprovação!');
            fetchData();
            setForm({ projeto_id: '', centro_custo_id: '', categoria: '', fornecedor: '', valor: '', moeda: 'MZN', metodo_pagamento: '', comprovativo_url: '', responsavel_id: '', estado: 'submetido' });
        } catch {
            setMsg('❌ Erro ao submeter despesa.');
        }
    };

    const handleAprovar = async (id, acao) => {
        try {
            await axios.post(`/api/despesa/${id}/${acao}`);
            setMsg(`✅ Despesa ${acao === 'aprovar' ? 'aprovada' : 'rejeitada'} com sucesso!`);
            fetchData();
        } catch {
            setMsg('⚠️ Ação não permitida para o seu perfil.');
        }
    };

    if (loading) return <div className="card">Consolidando Aplicações...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div className="card">
                    <h2>Registrar Saída (Despesa)</h2>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <label>Projeto Auditado:</label>
                        <select name="projeto_id" value={form.projeto_id} onChange={handleChange} required>
                            <option value="">Selecione o Projeto...</option>
                            {projetos.map(p => (
                                <option key={p.id} value={p.id}>{p.nome}</option>
                            ))}
                        </select>

                        <label>Fornecedor / Destinatário:</label>
                        <input name="fornecedor" placeholder="Ex: Papelaria, Empresa de Serviços..." value={form.fornecedor} onChange={handleChange} required />

                        <label>Categoria da Rubrica:</label>
                        <input name="categoria" placeholder="Ex: Material, RH, Aluguer..." value={form.categoria} onChange={handleChange} />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label>Valor:</label>
                                <input name="valor" type="number" value={form.valor} onChange={handleChange} required />
                            </div>
                            <div>
                                <label>Moeda:</label>
                                <select name="moeda" value={form.moeda} onChange={handleChange}>
                                    <option value="MZN">MZN</option>
                                    <option value="USD">USD</option>
                                </select>
                            </div>
                        </div>

                        <button type="submit" className="nav-button" style={{ background: 'var(--primary)', color: 'white', marginTop: '1rem' }}>Submeter para Revisão</button>
                        {msg && <p style={{ fontSize: '0.9rem', textAlign: 'center' }}>{msg}</p>}
                    </form>
                </div>

                <div className="card" style={{ background: 'rgba(244, 63, 94, 0.02)', border: '1px solid var(--danger)' }}>
                    <h3>Transparência de Execução</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Controlo de gastos reais versus orçamento planeado das ONGs.</p>
                    <div style={{ marginTop: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span>Execução Global</span>
                            <span>{((stats.total_gasto / (stats.total_orcamento || 1)) * 100).toFixed(1)}%</span>
                        </div>
                        <div style={{ width: '100%', height: '12px', background: '#1e293b', borderRadius: '6px' }}>
                            <div style={{ width: `${Math.min((stats.total_gasto / (stats.total_orcamento || 1)) * 100, 100)}%`, height: '100%', background: 'var(--danger)', borderRadius: '6px' }}></div>
                        </div>
                        <p style={{ fontSize: '0.8rem', marginTop: '15px' }}>Total Gasto: <strong>{stats.total_gasto.toLocaleString()} MT</strong></p>
                        <p style={{ fontSize: '0.8rem' }}>Orçamento Disponível: <strong>{(stats.total_orcamento - stats.total_gasto).toLocaleString()} MT</strong></p>
                    </div>
                </div>
            </div>

            <div className="card">
                <h3>Trilho de Auditoria de Despesas</h3>
                <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                    {despesas.map(d => (
                        <div key={d.id} style={{
                            padding: '1.2rem',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: d.estado === 'rejeitado' ? 'rgba(244, 63, 94, 0.05)' : 'transparent'
                        }}>
                            <div style={{ flex: 1 }}>
                                <strong style={{ fontSize: '1.1rem' }}>{d.fornecedor}</strong>
                                <br />
                                <small style={{ color: 'var(--primary)' }}>{d.categoria || 'Geral'}</small>
                                <br />
                                <small style={{ color: 'var(--text-muted)' }}>Projeto: <strong>{d.projeto_nome || 'Auditando...'}</strong></small>
                                <br />
                                <small style={{ color: 'var(--text-muted)' }}>Responsável: {d.responsavel_nome || 'N/D'}</small>
                            </div>
                            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '2rem' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: '1.2rem', fontWeight: '800', display: 'block' }}>{Number(d.valor).toLocaleString()} {d.moeda}</span>
                                    <span style={{
                                        fontSize: '0.65rem',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        background: d.estado === 'aprovado' ? 'var(--accent)' : d.estado === 'rejeitado' ? 'var(--danger)' : 'var(--primary)',
                                        color: 'white'
                                    }}>{d.estado.toUpperCase()}</span>
                                </div>

                                {user?.perfil === 'Administrador' && d.estado === 'submetido' && (
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => handleAprovar(d.id, 'aprovar')} className="nav-button" style={{ background: 'var(--accent)', padding: '5px 15px' }}>Aprovar</button>
                                        <button onClick={() => handleAprovar(d.id, 'rejeitar')} className="nav-button" style={{ background: 'var(--danger)', padding: '5px 15px' }}>Rejeitar</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Despesas;
