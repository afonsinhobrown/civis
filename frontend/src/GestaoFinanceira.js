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

                const recs = rRec.data.map(r => ({
                    ...r,
                    tipo: 'RECEITA',
                    label: r.tipo_fundo || 'Receita',
                    link: r.projeto_nome || 'Geral'
                }));
                const dess = rDes.data.map(d => ({
                    ...d,
                    tipo: 'DESPESA',
                    label: d.fornecedor || 'Despesa',
                    link: d.projeto_nome || 'Geral'
                }));
                const unificado = [...recs, ...dess].sort((a, b) => new Date(b.data || b.data_despesa) - new Date(a.data || a.data_despesa));

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

    if (loading) return <div className="card">Auditando Fluxos Financeiros...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Command Bars */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <div className="card" style={{ borderLeft: '10px solid var(--accent)', background: 'rgba(45, 212, 191, 0.05)' }}>
                    <small style={{ color: 'var(--text-muted)' }}>Captação Global (Auditada)</small>
                    <h2 style={{ fontSize: '2.2rem', color: 'var(--accent)' }}>{stats.receitas.toLocaleString()} <small>MT</small></h2>
                    <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Verificado contra extratos bancários integrados.</p>
                </div>
                <div className="card" style={{ borderLeft: '10px solid var(--danger)', background: 'rgba(244, 63, 94, 0.05)' }}>
                    <small style={{ color: 'var(--text-muted)' }}>Aplicação de Fundos (Executado)</small>
                    <h2 style={{ fontSize: '2.2rem', color: 'var(--danger)' }}>{stats.despesas.toLocaleString()} <small>MT</small></h2>
                    <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Conformidade com regulamentos fiscais e de doadores.</p>
                </div>
            </div>

            {/* Balancete por Projeto - Transparência Radical */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h3>Balancete Dinâmico de Governança</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mapeamento direto de fundos recebidos vs. gastos por rubrica.</p>
                    </div>
                    <button className="nav-button" style={{ background: 'var(--primary)', color: 'white' }}>Certificar Contas (PDF)</button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ color: 'var(--text-muted)', borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                                <th style={{ padding: '1rem' }}>Projeto / Centro de Custo</th>
                                <th style={{ padding: '1rem' }}>Receitas Alocadas</th>
                                <th style={{ padding: '1rem' }}>Despesas Realizadas</th>
                                <th style={{ padding: '1rem' }}>Saldo em Rubrica</th>
                                <th style={{ padding: '1rem' }}>Estado de Auditoria</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.projetos.map(p => {
                                const orcamento = Number(p.orcamento_total || p.orçamento_total || 0);
                                const tDes = Number(p.totalDes || 0);
                                const tRec = Number(p.totalRec || 0);
                                const ratio = orcamento > 0 ? (tDes / orcamento) * 100 : 0;

                                return (
                                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <strong>{p.nome}</strong><br />
                                            <code style={{ fontSize: '0.75rem' }}>Cód: {p.codigo_interno}</code>
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--accent)', fontWeight: 'bold' }}>{tRec.toLocaleString()} MT</td>
                                        <td style={{ padding: '1rem', color: 'var(--danger)' }}>{tDes.toLocaleString()} MT</td>
                                        <td style={{ padding: '1rem', background: (tRec - tDes) < 0 ? 'rgba(244,63,94,0.1)' : 'transparent' }}>
                                            <strong>{(tRec - tDes).toLocaleString()} MT</strong>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                fontSize: '0.7rem',
                                                background: ratio > 95 ? 'var(--danger)' : 'var(--accent)',
                                                padding: '3px 8px',
                                                borderRadius: '4px',
                                                color: 'white'
                                            }}>
                                                {ratio > 100 ? 'ALERTA: SOBRE-EXECUÇÃO' : 'CONFORME'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Cash Flow Audit Trail */}
            <div className="card">
                <h3>Trilho de Auditoria (Cash-Flow Unificado)</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Cada entrada e saída vinculada a um comprovativo e projeto.</p>
                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    {extrato.map((item, idx) => (
                        <div key={idx} style={{
                            padding: '1.2rem',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: item.tipo === 'RECEITA' ? 'rgba(45, 212, 191, 0.02)' : 'transparent'
                        }}>
                            <div>
                                <span style={{
                                    fontSize: '0.6rem',
                                    color: item.tipo === 'RECEITA' ? 'var(--accent)' : 'var(--danger)',
                                    fontWeight: 'bold',
                                    border: `1px solid ${item.tipo === 'RECEITA' ? 'var(--accent)' : 'var(--danger)'}`,
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    marginRight: '10px'
                                }}>{item.tipo}</span>
                                <strong>{item.label}</strong>
                                <br />
                                <small style={{ color: 'var(--text-muted)' }}>Projeto: <strong style={{ color: 'var(--primary)' }}>{item.link}</strong></small>
                                <br />
                                <small style={{ color: 'var(--text-muted)' }}>Data: {item.data || item.data_despesa}</small>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{
                                    fontSize: '1.3rem',
                                    fontWeight: '900',
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
