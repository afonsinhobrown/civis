import React, { useEffect, useState } from 'react';
import axios from './api';

function Receitas() {
    const [receitas, setReceitas] = useState([]);
    const [projetos, setProjetos] = useState([]);
    const [form, setForm] = useState({ projeto_id: '', financiador_id: '', tipo_fundo: '', data: new Date().toISOString().split('T')[0], valor: '', moeda: 'MZN', taxa_cambio: '1', comprovativo_url: '' });
    const [msg, setMsg] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [rRec, rProj] = await Promise.all([
                    axios.get('/api/receita'),
                    axios.get('/api/projeto')
                ]);
                setReceitas(rRec.data);
                setProjetos(rProj.data);
            } catch (err) {
                console.error("Erro ao buscar dados:", err);
            }
        };
        fetchData();
    }, []);

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async e => {
        e.preventDefault();
        try {
            await axios.post('/api/receita', form);
            setMsg('✅ Receita registrada com sucesso!');
            // Recarregar lista
            const res = await axios.get('/api/receita');
            setReceitas(res.data);
            setForm({ projeto_id: '', financiador_id: '', tipo_fundo: '', data: new Date().toISOString().split('T')[0], valor: '', moeda: 'MZN', taxa_cambio: '1', comprovativo_url: '' });
        } catch {
            setMsg('❌ Erro ao registrar receita.');
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div className="card">
                <h2>Registrar Entrada de Fundos</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <label>Projeto Destino:</label>
                    <select name="projeto_id" value={form.projeto_id} onChange={handleChange} required>
                        <option value="">Selecione o Projeto...</option>
                        {projetos.map(p => (
                            <option key={p.id} value={p.id}>{p.nome} ({p.codigo_interno})</option>
                        ))}
                    </select>

                    <label>Tipo de Recurso:</label>
                    <input name="tipo_fundo" placeholder="Ex: Doação, Subsídio Ministerial, Venda de Serviços..." value={form.tipo_fundo} onChange={handleChange} required />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label>Valor:</label>
                            <input name="valor" type="number" placeholder="0.00" value={form.valor} onChange={handleChange} required />
                        </div>
                        <div>
                            <label>Moeda:</label>
                            <select name="moeda" value={form.moeda} onChange={handleChange}>
                                <option value="MZN">Metical (MZN)</option>
                                <option value="USD">Dólar (USD)</option>
                                <option value="ZAR">Rand (ZAR)</option>
                            </select>
                        </div>
                    </div>

                    <label>Data de Recebimento:</label>
                    <input name="data" type="date" value={form.data} onChange={handleChange} required />

                    <button type="submit" className="nav-button" style={{ background: 'var(--accent)', color: 'white', marginTop: '1rem' }}>Confirmar Entrada</button>
                    {msg && <p style={{ fontSize: '0.9rem', textAlign: 'center' }}>{msg}</p>}
                </form>
            </div>

            <div className="card">
                <h3>Rastreabilidade: Histórico por Projeto</h3>
                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    {receitas.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>Nenhuma movimentação registrada.</p> :
                        receitas.map(r => {
                            const p = projetos.find(proj => proj.id === r.projeto_id);
                            return (
                                <div key={r.id} style={{
                                    padding: '1rem',
                                    borderBottom: '1px solid var(--border)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <strong style={{ color: 'var(--accent)' }}>{Number(r.valor).toLocaleString()} {r.moeda}</strong>
                                        <br />
                                        <small style={{ fontWeight: 'bold' }}>{r.tipo_fundo}</small>
                                        <br />
                                        <small style={{ color: 'var(--text-muted)' }}>Projeto: {p ? p.nome : 'Geral / Não Vinculado'}</small>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <small style={{ display: 'block', color: 'var(--text-muted)' }}>{r.data}</small>
                                    </div>
                                </div>
                            );
                        })
                    }
                </div>
            </div>
        </div>
    );
}

export default Receitas;
