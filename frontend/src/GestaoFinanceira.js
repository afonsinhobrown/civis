import React, { useEffect, useState } from 'react';
import axios from './api';

function GestaoFinanceira() {
    const [stats, setStats] = useState({ receitas: 0, despesas: 0, projetos: [] });
    const [extrato, setExtrato] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFinanceData = async () => {
            try {
                const [rRec, rDes, rProj] = await Promise.all([
                    axios.get('/api/receita'),
                    axios.get('/api/despesa'),
                    axios.get('/api/projeto')
                ]);

                const projData = rProj.data.map(p => {
                    const rec = rRec.data.filter(r => r.projeto_id === p.id).reduce((acc, curr) => acc + Number(curr.valor), 0);
                    const des = rDes.data.filter(d => d.projeto_id === p.id).reduce((acc, curr) => acc + Number(curr.valor), 0);
                    return { ...p, totalRec: rec, totalDes: des, saldo: rec - des };
                });

                const recs = rRec.data.map(r => ({ ...r, tipo: 'RECEITA', label: r.tipo_fundo || 'Receita' }));
                const dess = rDes.data.map(d => ({ ...d, tipo: 'DESPESA', label: d.fornecedor || 'Despesa' }));
                const unificado = [...recs, ...dess].sort((a, b) => new Date(b.data) - new Date(a.data));

                setStats({
                    receitas: rRec.data.reduce((acc, r) => acc + Number(r.valor), 0),
                    despesas: rDes.data.reduce((acc, d) => acc + Number(d.valor), 0),
                    projetos: projData
                });
                setExtrato(unificado);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchFinanceData();
    }, []);

    if (loading) return <div className="card">Sincronizando Fluxos Financeiros...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Command Bars */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <div className="card" style={{ borderLeft: '10px solid var(--accent)', background: 'rgba(45, 212, 191, 0.05)' }}>
                    <small style={{ color: 'var(--text-muted)' }}>Captação de Recursos (Total)</small>
                    <h2 style={{ fontSize: '2.2rem', color: 'var(--accent)' }}>{stats.receitas.toLocaleString()} <small>MT</small></h2>
                </div>
                <div className="card" style={{ borderLeft: '10px solid var(--danger)', background: 'rgba(244, 63, 94, 0.05)' }}>
                    <small style={{ color: 'var(--text-muted)' }}>Aplicação de Fundos (Auditado)</small>
                    <h2 style={{ fontSize: '2.2rem', color: 'var(--danger)' }}>{stats.despesas.toLocaleString()} <small>MT</small></h2>
                </div>
            </div>

            {/* Balancete por Projeto - Onde os números cantam */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3>Balancete Dinâmico por Projeto</h3>
                    <button className="nav-button" style={{ background: 'var(--primary)', color: 'white' }}>Gerar Relatório de Governança</button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ color: 'var(--text-muted)', borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                                <th style={{ padding: '1rem' }}>Projeto / Rubrica</th>
                                <th style={{ padding: '1rem' }}>Orçamento</th>
                                <th style={{ padding: '1rem' }}>Executado</th>
                                <th style={{ padding: '1rem' }}>Disponível</th>
                                <th style={{ padding: '1rem' }}>Saúde</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.projetos.map(p => {
                                const ratio = (p.totalDes / p.orçamento_total) * 100;
                                return (
                                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <strong>{p.nome}</strong><br />
                                            <code style={{ fontSize: '0.75rem' }}>{p.codigo_interno}</code>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{p.orçamento_total.toLocaleString()} MT</td>
                                        <td style={{ padding: '1rem', color: 'var(--danger)' }}>{p.totalDes.toLocaleString()} MT</td>
                                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{(p.totalRec - p.totalDes).toLocaleString()} MT</td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ width: '100px', height: '10px', background: '#1e293b', borderRadius: '5px', overflow: 'hidden' }}>
                                                <div style={{ width: `${Math.min(ratio, 100)}%`, height: '100%', background: ratio > 90 ? 'var(--danger)' : 'var(--accent)' }}></div>
                                            </div>
                                            <small style={{ fontSize: '0.65rem' }}>{ratio.toFixed(1)}% utilizado</small>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Extrato de Moçambique */}
            <div className="card" style={{ background: 'var(--bg-card)' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>Registro de Movimentações (Cash-Flow)</h3>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {extrato.map((item, idx) => (
                        <div key={idx} style={{
                            padding: '1rem',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'
                        }}>
                            <div>
                                <span style={{
                                    fontSize: '0.7rem',
                                    color: item.tipo === 'RECEITA' ? 'var(--accent)' : 'var(--danger)',
                                    fontWeight: 'bold',
                                    border: `1px solid ${item.tipo === 'RECEITA' ? 'var(--accent)' : 'var(--danger)'}`,
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    marginRight: '10px'
                                }}>{item.tipo}</span>
                                <strong>{item.label}</strong>
                                <br />
                                <small style={{ color: 'var(--text-muted)' }}>{item.data || 'Data N/D'}</small>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{
                                    fontSize: '1.2rem',
                                    fontWeight: '800',
                                    color: item.tipo === 'RECEITA' ? 'var(--accent)' : 'var(--text-main)'
                                }}>
                                    {item.tipo === 'RECEITA' ? '+' : '-'} {Number(item.valor).toLocaleString()} MT
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default GestaoFinanceira;
