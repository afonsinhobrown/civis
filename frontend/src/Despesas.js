import React, { useEffect, useState } from 'react';
import axios from './api';

function Despesas({ user }) {
    const [despesas, setDespesas] = useState([]);
    const [projetos, setProjetos] = useState([]);
    const [atividades, setAtividades] = useState([]);
    const [form, setForm] = useState({ projeto_id: '', atividade_id: '', justificativa: '', centro_custo_id: '', categoria: '', fornecedor: '', valor: '', moeda: 'MZN', metodo_pagamento: '', comprovativo_url: '', responsavel_id: '', estado: 'submetido' });
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total_orcamento: 0, total_gasto: 0 });
    const [parecerForm, setParecerForm] = useState({ id: null, texto: '', acao: '' });

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

    // Buscar atividades quando o projeto muda
    useEffect(() => {
        if (form.projeto_id) {
            axios.get(`/api/atividade?projeto_id=${form.projeto_id}`)
                .then(res => setAtividades(res.data))
                .catch(err => console.error(err));
        } else {
            setAtividades([]);
        }
    }, [form.projeto_id]);

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async e => {
        e.preventDefault();
        try {
            const payload = { ...form, responsavel_id: user?.id, data_despesa: new Date().toISOString().split('T')[0] };
            await axios.post('/api/despesa', payload);
            setMsg('✅ Despesa submetida com sucesso!');
            fetchData();
            setForm({ projeto_id: '', atividade_id: '', justificativa: '', centro_custo_id: '', categoria: '', fornecedor: '', valor: '', moeda: 'MZN', metodo_pagamento: '', comprovativo_url: '', responsavel_id: '', estado: 'submetido' });
        } catch {
            setMsg('❌ Erro: Verifique os campos obrigatórios (Atividade/Justificativa).');
        }
    };

    const handleGovernançaAction = async (id, acao) => {
        const url = acao === 'aprovar' ? `/api/despesa/${id}/aprovar` : `/api/despesa/${id}/reconsiderar`;
        const payload = acao === 'aprovar' ? { parecer: parecerForm.texto } : { acao, parecer: parecerForm.texto };

        try {
            await axios.post(url, payload);
            setMsg(`✅ Despesa atualizada: ${acao.toUpperCase()}`);
            setParecerForm({ id: null, texto: '', acao: '' });
            fetchData();
        } catch {
            setMsg('⚠️ Erro na governação. Verifique permissões.');
        }
    };

    if (loading) return <div className="card">Consolidando Aplicações...</div>;

    const canApprove = ['Administrador', 'Financeiro', 'Diretor'].includes(user?.perfil);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem' }}>
                <div className="card">
                    <h2>Requisição de Fundos (Despesa)</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Toda despesa deve estar vinculada a uma atividade do plano operacional.</p>

                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label>Projeto:</label>
                            <select name="projeto_id" value={form.projeto_id} onChange={handleChange} required>
                                <option value="">Selecione...</option>
                                {projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                            </select>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label>Atividade do Plano:</label>
                            <select name="atividade_id" value={form.atividade_id} onChange={handleChange} required>
                                <option value="">Selecione a atividade...</option>
                                {atividades.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                            </select>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label>Fornecedor:</label>
                            <input name="fornecedor" placeholder="Ex: Papelaria, Empresa..." value={form.fornecedor} onChange={handleChange} required />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label>Categoria:</label>
                            <input name="categoria" placeholder="Ex: RH, Operacional..." value={form.categoria} onChange={handleChange} />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label>Valor:</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input name="valor" type="number" style={{ flex: 1 }} value={form.valor} onChange={handleChange} required />
                                <select name="moeda" value={form.moeda} onChange={handleChange}>
                                    <option value="MZN">MZN</option>
                                    <option value="USD">USD</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: 'span 2' }}>
                            <label>Justificativa da Despesa (Auditoria):</label>
                            <textarea name="justificativa" placeholder="Descreva o propósito desta despesa no âmbito da atividade..." rows="3" style={{ padding: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border)' }} value={form.justificativa} onChange={handleChange} required />
                        </div>

                        <button type="submit" className="nav-button" style={{ gridColumn: 'span 2', background: 'var(--primary)', color: 'white', marginTop: '1rem' }}>Submeter Requisição</button>
                    </form>
                    {msg && <p style={{ fontSize: '0.9rem', textAlign: 'center', marginTop: '1rem', color: msg.includes('✅') ? 'var(--accent)' : 'var(--danger)' }}>{msg}</p>}
                </div>

                <div className="card" style={{ background: 'rgba(244, 63, 94, 0.02)', border: '1px solid var(--danger)' }}>
                    <h3>Barômetro de Execução</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Controlo de compliance: Orçamento vs Gastos Aprovados.</p>
                    <div style={{ marginTop: '2.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '1.2rem', fontWeight: 'bold' }}>
                            <span>Execução Global</span>
                            <span style={{ color: 'var(--danger)' }}>{((stats.total_gasto / (stats.total_orcamento || 1)) * 100).toFixed(1)}%</span>
                        </div>
                        <div style={{ width: '100%', height: '15px', background: '#1e293b', borderRadius: '8px' }}>
                            <div style={{ width: `${Math.min((stats.total_gasto / (stats.total_orcamento || 1)) * 100, 100)}%`, height: '100%', background: 'var(--danger)', borderRadius: '8px' }}></div>
                        </div>
                        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Total Gasto:</span>
                                <strong>{stats.total_gasto.toLocaleString()} MT</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Orçamento Disponível:</span>
                                <strong style={{ color: 'var(--accent)' }}>{(stats.total_orcamento - stats.total_gasto).toLocaleString()} MT</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <h3>Trilho de Auditoria de Despesas & Governação</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                    {despesas.map(d => (
                        <div key={d.id} style={{
                            padding: '1.5rem',
                            borderRadius: '12px',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h4 style={{ margin: 0 }}>{d.fornecedor} <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--primary)' }}>({d.categoria || 'Geral'})</span></h4>
                                    <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '5px' }}>
                                        Projeto: <strong>{d.projeto_nome}</strong> | Responsável: {d.responsavel_nome}
                                    </small>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--accent)', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '4px', marginTop: '8px', display: 'inline-block' }}>
                                        Atividade: {d.atividade_nome || 'Ateção: Sem Atividade Vinc.'}
                                    </span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: '1.3rem', fontWeight: '800', display: 'block' }}>{Number(d.valor).toLocaleString()} {d.moeda}</span>
                                    <span style={{
                                        fontSize: '0.7rem',
                                        padding: '4px 10px',
                                        borderRadius: '50px',
                                        background: d.estado === 'aprovado' ? 'var(--accent)' : d.estado === 'revisar' ? '#f59e0b' : d.estado === 'rejeitado' ? 'var(--danger)' : 'var(--primary)',
                                        color: 'white',
                                        marginTop: '5px',
                                        display: 'inline-block'
                                    }}>{d.estado.toUpperCase()}</span>
                                </div>
                            </div>

                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem' }}>
                                <small style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>JUSTIFICATIVA DE AUDITORIA:</small>
                                <p style={{ margin: '5px 0' }}>{d.justificativa || 'Sem justificativa fornecida.'}</p>

                                {d.parecer_coordenador && (
                                    <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
                                        <small style={{ color: d.estado === 'aprovado' ? 'var(--accent)' : 'var(--danger)', fontWeight: 'bold' }}>PARECER DA COORDENAÇÃO:</small>
                                        <p style={{ margin: '5px 0', fontStyle: 'italic' }}>{d.parecer_coordenador}</p>
                                    </div>
                                )}
                            </div>

                            {canApprove && (d.estado === 'submetido' || d.estado === 'revisar') && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '0.5rem' }}>
                                    {parecerForm.id === d.id ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                            <textarea placeholder="Escreva o parecer para o gestor..." value={parecerForm.texto} onChange={e => setParecerForm({ ...parecerForm, texto: e.target.value })} style={{ padding: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: 'white' }} />
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button onClick={() => handleGovernançaAction(d.id, 'aprovar')} className="nav-button" style={{ background: 'var(--accent)', flex: 1 }}>Confirmar Aprovação</button>
                                                <button onClick={() => handleGovernançaAction(d.id, 'revisar')} className="nav-button" style={{ background: '#f59e0b', flex: 1 }}>Mandar Refazer</button>
                                                <button onClick={() => handleGovernançaAction(d.id, 'rejeitado')} className="nav-button" style={{ background: 'var(--danger)', flex: 1 }}>Rejeitar Totalmente</button>
                                                <button onClick={() => setParecerForm({ id: null, texto: '', acao: '' })} className="nav-button" style={{ background: 'gray' }}>Cancelar</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button onClick={() => setParecerForm({ id: d.id, texto: '', acao: '' })} className="nav-button" style={{ background: 'var(--accent)' }}>Analisar e Dar Parecer</button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Despesas;
