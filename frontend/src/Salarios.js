import React, { useEffect, useState } from 'react';
import axios from './api';

function Salarios() {
    const [usuarios, setUsuarios] = useState([]);
    const [projetos, setProjetos] = useState([]);
    const [folhas, setFolhas] = useState([]);
    const [form, setForm] = useState({ usuario_id: '', projeto_id: '', mes: 'Janeiro', ano: 2026, base: '', subsidios: 0 });
    const [msg, setMsg] = useState('');

    const fetchDados = async () => {
        try {
            const [resU, resF, resP] = await Promise.all([
                axios.get('/api/usuario'),
                axios.get('/api/folha_pagamento'),
                axios.get('/api/projeto')
            ]);
            setUsuarios(resU.data);
            setFolhas(resF.data);
            setProjetos(resP.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchDados();
    }, []);

    const handleProcessar = async (e) => {
        e.preventDefault();
        const base = Number(form.base);
        const subsidios = Number(form.subsidios);
        const inss = base * 0.03;
        const irps = base * 0.10;
        const liquido = (base + subsidios) - (inss + irps);

        try {
            await axios.post('/api/folha_pagamento', {
                usuario_id: form.usuario_id,
                projeto_id: form.projeto_id,
                mes_referencia: form.mes,
                ano_referencia: form.ano,
                salario_base: base,
                subsidios: subsidios,
                desconto_inss: inss,
                desconto_irps: irps,
                salario_liquido: liquido,
                data_pagamento: new Date().toISOString().split('T')[0]
            });
            setMsg('✅ Salário processado e alocado ao projeto!');
            fetchDados();
            setForm({ ...form, usuario_id: '', base: '', subsidios: 0 });
        } catch (err) {
            setMsg('❌ Erro ao processar salário.');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card">
                <h2>Processamento de Salários & Alocação de Custos</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Garante que cada projeto suporte os seus próprios custos de recursos humanos.</p>

                <form onSubmit={handleProcessar} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label>Colaborador:</label>
                        <select value={form.usuario_id} onChange={e => setForm({ ...form, usuario_id: e.target.value })} required>
                            <option value="">Selecionar Colaborador</option>
                            {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                        </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label>Alocar ao Projeto:</label>
                        <select value={form.projeto_id} onChange={e => setForm({ ...form, projeto_id: e.target.value })} required>
                            <option value="">Selecionar Projeto...</option>
                            {projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                        </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label>Mês:</label>
                        <select value={form.mes} onChange={e => setForm({ ...form, mes: e.target.value })}>
                            {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label>Salário Base (Bruto):</label>
                        <input type="number" placeholder="MT" value={form.base} onChange={e => setForm({ ...form, base: e.target.value })} required />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label>Subsídios Extra:</label>
                        <input type="number" placeholder="MT" value={form.subsidios} onChange={e => setForm({ ...form, subsidios: e.target.value })} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button type="submit" className="nav-button" style={{ background: 'var(--accent)', color: 'white', width: '100%' }}>Processar Pagamento</button>
                    </div>
                </form>
                {msg && <p style={{ color: msg.includes('✅') ? 'var(--accent)' : 'var(--danger)', marginTop: '1.5rem', textAlign: 'center' }}>{msg}</p>}
            </div>

            <div className="card">
                <h3>Trilho de Auditoria: Folha de Pagamento por Projeto</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                        <thead>
                            <tr style={{ color: 'var(--text-muted)', borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                                <th style={{ padding: '1rem' }}>Colaborador</th>
                                <th style={{ padding: '1rem' }}>Projeto / Centro de Custo</th>
                                <th style={{ padding: '1rem' }}>Período</th>
                                <th style={{ padding: '1rem' }}>Valor Bruto</th>
                                <th style={{ padding: '1rem' }}>Impostos (3% + 10%)</th>
                                <th style={{ padding: '1rem' }}>Valor Líquido</th>
                            </tr>
                        </thead>
                        <tbody>
                            {folhas.map(f => {
                                const proj = projetos.find(p => p.id === f.projeto_id);
                                return (
                                    <tr key={f.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem' }}><strong>{f.colaborador}</strong></td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}>
                                                {proj ? proj.nome : 'Administrativo / Geral'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{f.mes_referencia} / {f.ano_referencia}</td>
                                        <td style={{ padding: '1rem' }}>{(Number(f.salario_base) + Number(f.subsidios)).toLocaleString()} MT</td>
                                        <td style={{ padding: '1rem', color: 'var(--danger)' }}>
                                            - {(Number(f.desconto_inss) + Number(f.desconto_irps)).toLocaleString()} MT
                                        </td>
                                        <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                                            {Number(f.salario_liquido).toLocaleString()} MT
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Salarios;
