import React, { useEffect, useState } from 'react';
import axios from './api';

function Configuracao() {
    const [configs, setConfigs] = useState([]);
    const [form, setForm] = useState({ chave: '', valor: '', descricao: '' });
    const [msg, setMsg] = useState('');

    const fetchConfigs = async () => {
        const res = await axios.get('/api/configuracao');
        setConfigs(res.data);
    };

    useEffect(() => {
        fetchConfigs();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/configuracao', form);
            setMsg('Configuração salva!');
            fetchConfigs();
        } catch {
            setMsg('Erro ao salvar.');
        }
    };

    return (
        <div className="card">
            <h2>Configurações do Sistema</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Especifique aqui as percentagens de impostos (INSS, IRPS) e outros parâmetros globais.</p>

            <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
                <input placeholder="Chave (ex: INSS_COLABORADOR)" value={form.chave} onChange={e => setForm({ ...form, chave: e.target.value })} required />
                <input placeholder="Valor (ex: 0.03)" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} required />
                <input placeholder="Descrição" value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
                <button type="submit" style={{ background: 'var(--primary)' }}>Salvar Parâmetro</button>
            </form>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                            <th style={{ padding: '0.8rem' }}>Parâmetro</th>
                            <th style={{ padding: '0.8rem' }}>Valor</th>
                            <th style={{ padding: '0.8rem' }}>Descrição</th>
                        </tr>
                    </thead>
                    <tbody>
                        {configs.map(c => (
                            <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '0.8rem' }}><code>{c.chave}</code></td>
                                <td style={{ padding: '0.8rem', fontWeight: 'bold' }}>{c.valor}</td>
                                <td style={{ padding: '0.8rem' }}>{c.descricao}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {msg && <p style={{ marginTop: '1rem', color: 'var(--accent)' }}>{msg}</p>}
        </div>
    );
}

export default Configuracao;
