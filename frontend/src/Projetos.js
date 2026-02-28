import React, { useEffect, useState } from 'react';
import axios from './api';

function Projetos() {
    const [projetos, setProjetos] = useState([]);
    const [form, setForm] = useState({ nome: '', codigo_interno: '', orçamento_total: '', data_inicio: '', data_fim: '', objetivos: '', estado: 'planeamento', ong_id: 1 });
    const [msg, setMsg] = useState('');

    const [selected, setSelected] = useState(null);
    const [atividades, setAtividades] = useState([]);
    const [atividadeForm, setAtividadeForm] = useState({ nome: '', orcamento_previsto: '' });

    const fetchData = async () => {
        try {
            const [rProj, rDes] = await Promise.all([
                axios.get('/api/projeto'),
                axios.get('/api/despesa')
            ]);

            const projetosComKPI = rProj.data.map(p => {
                const gastos = rDes.data.filter(d => d.projeto_id === p.id && d.estado === 'aprovado').reduce((acc, d) => acc + Number(d.valor), 0);
                return { ...p, gastos };
            });

            setProjetos(projetosComKPI);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchAtividades = async (projId) => {
        try {
            const res = await axios.get(`/api/atividade?projeto_id=${projId}`);
            setAtividades(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (selected) {
            fetchAtividades(selected.id);
        }
    }, [selected]);

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async e => {
        e.preventDefault();
        try {
            await axios.post('/api/projeto', form);
            setMsg('🚀 Projeto lançado com sucesso!');
            fetchData();
            setForm({ nome: '', codigo_interno: '', orçamento_total: '', data_inicio: '', data_fim: '', objetivos: '', estado: 'planeamento', ong_id: 1 });
        } catch {
            setMsg('❌ Erro ao lançar projeto.');
        }
    };

    const handleAddAtividade = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/atividade', { ...atividadeForm, projeto_id: selected.id });
            setAtividadeForm({ nome: '', orcamento_previsto: '' });
            fetchAtividades(selected.id);
        } catch (err) {
            alert('Erro ao criar atividade.');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card">
                <h2>Lançamento de Novo Desafio (Projeto)</h2>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <input name="nome" placeholder="Nome do Projeto" value={form.nome} onChange={handleChange} required />
                    <input name="codigo_interno" placeholder="Código (Ex: PROJ-001)" value={form.codigo_interno} onChange={handleChange} required />
                    <input name="orçamento_total" type="number" placeholder="Orçamento Total (MT)" value={form.orçamento_total} onChange={handleChange} required />
                    <input name="data_inicio" type="date" value={form.data_inicio} onChange={handleChange} required />
                    <input name="data_fim" type="date" value={form.data_fim} onChange={handleChange} required />
                    <textarea name="objetivos" placeholder="Objetivos Principais" style={{ gridColumn: 'span 2', padding: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border)' }} value={form.objetivos} onChange={handleChange} />
                    <button type="submit" className="nav-button" style={{ background: 'var(--primary)', color: 'white' }}>Lançar Projeto</button>
                </form>
                {msg && <p style={{ marginTop: '1rem', color: 'var(--accent)' }}>{msg}</p>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                {projetos.map(p => {
                    const orcamento = Number(p.orcamento_total || p.orçamento_total || 1);
                    const percent = Math.min((p.gastos / orcamento) * 100, 100);

                    return (
                        <div key={p.id} className="card" style={{
                            cursor: 'pointer',
                            borderLeft: `5px solid ${percent > 90 ? 'var(--danger)' : 'var(--accent)'}`,
                            transition: 'transform 0.2s'
                        }} onClick={() => setSelected(p)}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{ margin: 0 }}>{p.nome}</h3>
                                    <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.codigo_interno}</code>
                                </div>
                                <span style={{
                                    fontSize: '0.7rem',
                                    padding: '4px 8px',
                                    borderRadius: '50px',
                                    background: 'rgba(255,255,255,0.05)'
                                }}>{p.estado.toUpperCase()}</span>
                            </div>

                            <div style={{ marginTop: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '5px' }}>
                                    <span>Execução Orçamental</span>
                                    <span>{percent.toFixed(1)}%</span>
                                </div>
                                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                                    <div style={{ width: `${percent}%`, height: '100%', background: percent > 90 ? 'var(--danger)' : 'var(--accent)', borderRadius: '4px' }}></div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem', fontSize: '0.85rem' }}>
                                <div>
                                    <small style={{ color: 'var(--text-muted)' }}>Responsável:</small><br />
                                    <strong>{p.responsavel_nome || 'N/D'}</strong>
                                </div>
                                <div>
                                    <small style={{ color: 'var(--text-muted)' }}>Orçamento:</small><br />
                                    <strong>{orcamento.toLocaleString()} MT</strong>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {selected && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={() => setSelected(null)}>
                    <div className="card" style={{ width: '95%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <h2>{selected.nome} <small style={{ color: 'var(--text-muted)' }}>({selected.codigo_interno})</small></h2>
                            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
                        </div>
                        <hr style={{ border: '0.5px solid var(--border)', margin: '1.5rem 0' }} />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div>
                                <h4 style={{ color: 'var(--primary)' }}>Informações Gerais</h4>
                                <small style={{ color: 'var(--text-muted)' }}>Objetivos:</small>
                                <p style={{ fontSize: '0.9rem' }}>{selected.objetivos || 'Sem objetivos descritos.'}</p>
                                <small style={{ color: 'var(--text-muted)' }}>Duração:</small>
                                <p style={{ fontSize: '0.9rem' }}>{selected.data_inicio} até {selected.data_fim}</p>

                                <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                                    <h4>Financeiro & Auditoria</h4>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                                        <span>Gasto Real:</span>
                                        <strong style={{ color: 'var(--danger)' }}>{selected.gastos.toLocaleString()} MT</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                                        <span>Saldo:</span>
                                        <strong style={{ color: 'var(--accent)' }}>{(Number(selected.orcamento_total || selected.orçamento_total) - selected.gastos).toLocaleString()} MT</strong>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 style={{ color: 'var(--primary)' }}>Plano de Atividades</h4>
                                <form onSubmit={handleAddAtividade} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                    <input placeholder="Nova Atividade" value={atividadeForm.nome} onChange={e => setAtividadeForm({ ...atividadeForm, nome: e.target.value })} required />
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input type="number" placeholder="Orçamento (MT)" value={atividadeForm.orcamento_previsto} onChange={e => setAtividadeForm({ ...atividadeForm, orcamento_previsto: e.target.value })} required />
                                        <button type="submit" style={{ background: 'var(--accent)', border: 'none', borderRadius: '4px', padding: '0 1rem', cursor: 'pointer' }}>+</button>
                                    </div>
                                </form>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    {atividades.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nenhuma atividade cadastrada.</p>}
                                    {atividades.map(a => (
                                        <div key={a.id} style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <span style={{ fontSize: '0.9rem', display: 'block' }}>{a.nome}</span>
                                                <small style={{ color: 'var(--text-muted)' }}>Status: {a.status}</small>
                                            </div>
                                            <strong style={{ fontSize: '0.85rem' }}>{Number(a.orcamento_previsto).toLocaleString()} MT</strong>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Projetos;
