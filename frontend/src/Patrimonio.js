import React, { useEffect, useState } from 'react';
import axios from './api';

function Patrimonio() {
    const [ativos, setAtivos] = useState([]);
    const [form, setForm] = useState({ nome: '', tipo: 'Equipamento', codigo_ativo: '', valor_compra: '', localizacao: '', estado_conservacao: 'Bom' });
    const [msg, setMsg] = useState('');

    const fetchAtivos = async () => {
        const res = await axios.get('/api/patrimonio');
        setAtivos(res.data);
    };

    useEffect(() => {
        fetchAtivos();
    }, []);

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async e => {
        e.preventDefault();
        try {
            await axios.post('/api/patrimonio', { ...form, ong_id: 1 });
            setMsg('Ativo registrado no património!');
            fetchAtivos();
        } catch {
            setMsg('Erro ao registrar.');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card">
                <h2>Gestão de Património (Ativos)</h2>
                <form onSubmit={handleSubmit}>
                    <input name="nome" placeholder="Nome do Ativo" value={form.nome} onChange={handleChange} required />
                    <select name="tipo" value={form.tipo} onChange={handleChange}>
                        <option value="Veículo">Veículo</option>
                        <option value="Imóvel">Imóvel</option>
                        <option value="Equipamento">Equipamento Informático</option>
                        <option value="Mobiliário">Mobiliário</option>
                    </select>
                    <input name="codigo_ativo" placeholder="Código de Inventário" value={form.codigo_ativo} onChange={handleChange} required />
                    <input name="valor_compra" type="number" placeholder="Valor de Aquisição" value={form.valor_compra} onChange={handleChange} />
                    <input name="localizacao" placeholder="Localização (Sede, Delegação...)" value={form.localizacao} onChange={handleChange} />
                    <button type="submit">Adicionar ao Inventário</button>
                </form>
                {msg && <p style={{ color: 'var(--accent)', marginTop: '1rem' }}>{msg}</p>}
            </div>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>Lista de Bens e Ativos</h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="nav-button" onClick={() => window.open('/api/relatorio/patrimonio/pdf', '_blank')} style={{ background: '#e74c3c', padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>📑 PDF Inventário</button>
                        <button className="nav-button" onClick={() => window.open('/api/relatorio/patrimonio/excel', '_blank')} style={{ background: '#27ae60', padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>📊 Excel</button>
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                        <thead>
                            <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                                <th style={{ padding: '0.8rem' }}>Ativo / Código</th>
                                <th style={{ padding: '0.8rem' }}>Tipo</th>
                                <th style={{ padding: '0.8rem' }}>Localização</th>
                                <th style={{ padding: '0.8rem' }}>Valor</th>
                                <th style={{ padding: '0.8rem' }}>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ativos.map(a => (
                                <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '0.8rem' }}>
                                        <strong>{a.nome}</strong><br />
                                        <small style={{ color: 'var(--text-muted)' }}>{a.codigo_ativo}</small>
                                    </td>
                                    <td style={{ padding: '0.8rem' }}>{a.tipo}</td>
                                    <td style={{ padding: '0.8rem' }}>{a.localizacao}</td>
                                    <td style={{ padding: '0.8rem' }}>{Number(a.valor_compra).toLocaleString()} MT</td>
                                    <td style={{ padding: '0.8rem' }}>
                                        <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                                            {a.estado_conservacao || 'Bom'}
                                        </span>
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

export default Patrimonio;
