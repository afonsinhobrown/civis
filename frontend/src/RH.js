import React, { useEffect, useState } from 'react';
import axios from './api';

function RH() {
    const [colaboradores, setColaboradores] = useState([]);
    const [projetos, setProjetos] = useState([]);
    const [form, setForm] = useState({
        nome: '', email: '', senha_hash: 'civis123', perfil: 'Gestor de Projeto',
        cargo: '', bi_nuit: '', data_contratacao: '', salario_base: '', ong_id: 1
    });
    const [vinculo, setVinculo] = useState({ usuario_id: '', projeto_id: '', funcao: '' });
    const [selected, setSelected] = useState(null);
    const [pagamentos, setPagamentos] = useState([]);
    const [msg, setMsg] = useState('');

    const fetchData = async () => {
        try {
            const [uRes, pRes] = await Promise.all([
                axios.get('/api/usuario'),
                axios.get('/api/projeto')
            ]);
            setColaboradores(uRes.data);
            setProjetos(pRes.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmitColaborador = async e => {
        e.preventDefault();
        try {
            await axios.post('/api/usuario', form);
            setMsg('✅ Colaborador cadastrado com sucesso!');
            fetchData();
            setForm({ nome: '', email: '', senha_hash: 'civis123', perfil: 'Gestor de Projeto', cargo: '', bi_nuit: '', data_contratacao: '', salario_base: '', ong_id: 1 });
        } catch (err) { setMsg('❌ Erro no cadastro.'); }
    };

    const handleVincular = async e => {
        e.preventDefault();
        try {
            await axios.post('/api/colaborador/projeto', vinculo);
            alert('✅ Colaborador vinculado ao projeto!');
            fetchData();
        } catch (err) { alert('Erro ao vincular.'); }
    };

    const verHistorico = async (colab) => {
        setSelected(colab);
        try {
            const res = await axios.get(`/api/colaborador/pagamentos/${colab.id}`);
            setPagamentos(res.data);
        } catch (err) { setPagamentos([]); }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card">
                <h2>Gestão de Recursos Humanos (RH)</h2>
                <form onSubmit={handleSubmitColaborador} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <input name="nome" placeholder="Nome Completo" value={form.nome} onChange={handleChange} required />
                    <input name="email" placeholder="Email Corp." value={form.email} onChange={handleChange} required />
                    <input name="cargo" placeholder="Cargo/Função principal" value={form.cargo} onChange={handleChange} required />
                    <input name="bi_nuit" placeholder="BI / NUIT" value={form.bi_nuit} onChange={handleChange} />
                    <input name="salario_base" type="number" placeholder="Salário Base (MZN)" value={form.salario_base} onChange={handleChange} />
                    <input name="data_contratacao" type="date" value={form.data_contratacao} onChange={handleChange} />
                    <select name="perfil" value={form.perfil} onChange={handleChange}>
                        <option value="Gestor de Projeto">Gestor de Projeto</option>
                        <option value="Financeiro">Financeiro</option>
                        <option value="Administrador">Administrador</option>
                    </select>
                    <button type="submit" className="nav-button" style={{ background: 'var(--primary)', color: 'white' }}>Cadastrar no Sistema</button>
                </form>
                {msg && <p style={{ marginTop: '1rem', color: 'var(--accent)' }}>{msg}</p>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 300px', gap: '1.5rem' }}>
                <div className="card">
                    <h3>Lista de Colaboradores</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem' }}>
                        {colaboradores.map(u => (
                            <div key={u.id} style={{
                                padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border)',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer'
                            }} onClick={() => verHistorico(u)}>
                                <div>
                                    <strong>{u.nome}</strong><br />
                                    <small style={{ color: 'var(--text-muted)' }}>{u.cargo || 'Cargo não definido'} • {u.email}</small>
                                    <div style={{ marginTop: '5px' }}>
                                        {u.projetos?.map(p => (
                                            <span key={p} style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', marginRight: '5px' }}>{p}</span>
                                        ))}
                                    </div>
                                </div>
                                <button className="nav-button" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>Ver Histórico</button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <h3>Vincular a Projeto</h3>
                    <form onSubmit={handleVincular} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                        <select value={vinculo.usuario_id} onChange={e => setVinculo({ ...vinculo, usuario_id: e.target.value })} required>
                            <option value="">Selecionar Colaborador</option>
                            {colaboradores.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                        </select>
                        <select value={vinculo.projeto_id} onChange={e => setVinculo({ ...vinculo, projeto_id: e.target.value })} required>
                            <option value="">Selecionar Projeto</option>
                            {projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                        </select>
                        <input placeholder="Função no Projeto" value={vinculo.funcao} onChange={e => setVinculo({ ...vinculo, funcao: e.target.value })} required />
                        <button type="submit" className="nav-button" style={{ background: 'var(--accent)', color: 'white' }}>Vincular</button>
                    </form>
                </div>
            </div>

            {selected && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={() => setSelected(null)}>
                    <div className="card" style={{ width: '90%', maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <h2 style={{ margin: 0 }}>Histórico: {selected.nome}</h2>
                            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
                        </div>
                        <p style={{ color: 'var(--text-muted)' }}>Ficha Individual do Colaborador</p>
                        <hr style={{ border: '0.5px solid var(--border)', margin: '1rem 0' }} />

                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {pagamentos.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Sem histórico de pagamentos registado.</p>}
                            {pagamentos.map(p => (
                                <div key={p.id} style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                    <div>
                                        <strong>Projeto: {p.projeto_nome}</strong><br />
                                        <small>{p.mes_referencia}/{p.ano_referencia} • {p.data_pagamento}</small>
                                    </div>
                                    <strong style={{ color: 'var(--accent)' }}>{Number(p.salario_liquido).toLocaleString()} MZN</strong>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RH;
