import React, { useEffect, useState } from 'react';
import axios from './api';

function Salarios() {
    const [usuarios, setUsuarios] = useState([]);
    const [folhas, setFolhas] = useState([]);
    const [form, setForm] = useState({ usuario_id: '', mes: 'Janeiro', ano: 2026, base: '', subsidios: 0 });
    const [msg, setMsg] = useState('');

    const fetchDados = async () => {
        const [resU, resF] = await Promise.all([
            axios.get('/api/usuario'),
            axios.get('/api/folha_pagamento')
        ]);
        setUsuarios(resU.data);
        setFolhas(resF.data);
    };

    useEffect(() => {
        fetchDados();
    }, []);

    const handleProcessar = async (e) => {
        e.preventDefault();
        const base = Number(form.base);
        const subsidios = Number(form.subsidios);
        const inss = base * 0.03; // INSS Moçambique (3% colaborador)
        const irps = base * 0.10; // Simplificado para teste
        const liquido = (base + subsidios) - (inss + irps);

        try {
            await axios.post('/api/folha_pagamento', {
                usuario_id: form.usuario_id,
                mes_referencia: form.mes,
                ano_referencia: form.ano,
                salario_base: base,
                subsidios: subsidios,
                desconto_inss: inss,
                desconto_irps: irps,
                salario_liquido: liquido,
                data_pagamento: new Date().toISOString().split('T')[0]
            });
            setMsg('Salário processado e pago!');
            fetchDados();
        } catch (err) {
            setMsg('Erro ao processar salário.');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card">
                <h2>Processamento de Salários (Folha/Payroll)</h2>
                <form onSubmit={handleProcessar} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                    <select value={form.usuario_id} onChange={e => setForm({ ...form, usuario_id: e.target.value })} required>
                        <option value="">Selecionar Colaborador</option>
                        {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                    </select>
                    <select value={form.mes} onChange={e => setForm({ ...form, mes: e.target.value })}>
                        {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                    <input type="number" placeholder="Salário Base" value={form.base} onChange={e => setForm({ ...form, base: e.target.value })} required />
                    <input type="number" placeholder="Subsídios" value={form.subsidios} onChange={e => setForm({ ...form, subsidios: e.target.value })} />
                    <button type="submit" style={{ background: 'var(--accent)' }}>Pagar Salário</button>
                </form>
                {msg && <p style={{ color: 'var(--accent)', marginTop: '1rem' }}>{msg}</p>}
            </div>

            <div className="card">
                <h3>Recibos e Histórico de Pagamentos</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                        <thead>
                            <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                                <th style={{ padding: '0.8rem' }}>Colaborador</th>
                                <th style={{ padding: '0.8rem' }}>Período</th>
                                <th style={{ padding: '0.8rem' }}>Bruto</th>
                                <th style={{ padding: '0.8rem' }}>Descontos (INSS/IRPS)</th>
                                <th style={{ padding: '0.8rem' }}>Líquido</th>
                            </tr>
                        </thead>
                        <tbody>
                            {folhas.map(f => (
                                <tr key={f.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '0.8rem' }}>{f.colaborador}</td>
                                    <td style={{ padding: '0.8rem' }}>{f.mes_referencia} / {f.ano_referencia}</td>
                                    <td style={{ padding: '0.8rem' }}>{(f.salario_base + f.subsidios).toLocaleString()} MT</td>
                                    <td style={{ padding: '0.8rem', color: 'var(--danger)' }}>
                                        - {(f.desconto_inss + f.desconto_irps).toLocaleString()} MT
                                    </td>
                                    <td style={{ padding: '0.8rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                                        {f.salario_liquido.toLocaleString()} MT
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Salarios;
