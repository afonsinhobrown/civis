import React, { useEffect, useState } from 'react';
import axios from './api';

function Receitas() {
    const [receitas, setReceitas] = useState([]);
    const [form, setForm] = useState({ projeto_id: '', financiador_id: '', tipo_fundo: '', data: '', valor: '', moeda: '', taxa_cambio: '', comprovativo_url: '' });
    const [msg, setMsg] = useState('');

    useEffect(() => {
        axios.get('/api/receita').then(res => setReceitas(res.data));
    }, []);

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async e => {
        e.preventDefault();
        try {
            await axios.post('/api/receita', form);
            setMsg('Receita cadastrada!');
        } catch {
            setMsg('Erro ao cadastrar.');
        }
    };

    return (
        <div className="card">
            <h2>Entrada de Fundos (Receitas)</h2>
            <form onSubmit={handleSubmit}>
                <input name="projeto_id" placeholder="ID do Projeto" value={form.projeto_id} onChange={handleChange} required />
                <input name="financiador_id" placeholder="ID do Financiador" value={form.financiador_id} onChange={handleChange} />
                <input name="tipo_fundo" placeholder="Tipo de Fundo (Doação, Subsídio...)" value={form.tipo_fundo} onChange={handleChange} />
                <input name="data" type="date" value={form.data} onChange={handleChange} />
                <input name="valor" placeholder="Valor Recebido" value={form.valor} onChange={handleChange} required />
                <select name="moeda" value={form.moeda} onChange={handleChange}>
                    <option value="MZN">Metical (MZN)</option>
                    <option value="USD">Dólar (USD)</option>
                </select>
                <button type="submit">Registrar Entrada</button>
            </form>
            {msg && <p style={{ color: 'var(--accent)', marginBottom: '1rem' }}>{msg}</p>}

            <div style={{ marginTop: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Histórico de Receitas</h3>
                <ul>
                    {receitas.map(r => (
                        <li key={r.id} style={{ borderLeftColor: 'var(--accent)' }}>
                            <div>
                                <strong style={{ display: 'block' }}>{r.tipo_fundo || 'Entrada Geral'}</strong>
                                <small style={{ color: 'var(--text-muted)' }}>{r.data}</small>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ fontWeight: '800', color: 'var(--accent)', fontSize: '1.1rem' }}>
                                    + {r.valor} {r.moeda}
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
export default Receitas;
