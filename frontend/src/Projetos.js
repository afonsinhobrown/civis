import React, { useEffect, useState } from 'react';
import axios from './api';

function Projetos() {
    const [projetos, setProjetos] = useState([]);
    const [form, setForm] = useState({ nome: '', codigo_interno: '', orçamento_total: '', data_inicio: '', data_fim: '', objetivos: '', estado: '', ong_id: '' });
    const [msg, setMsg] = useState('');

    useEffect(() => {
        axios.get('/api/projeto').then(res => setProjetos(res.data));
    }, []);

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async e => {
        e.preventDefault();
        try {
            await axios.post('/api/projeto', form);
            setMsg('Projeto cadastrado!');
        } catch {
            setMsg('Erro ao cadastrar.');
        }
    };

    return (
        <div>
            <h2>Projetos</h2>
            <form onSubmit={handleSubmit}>
                <input name="nome" placeholder="Nome" value={form.nome} onChange={handleChange} required />
                <input name="codigo_interno" placeholder="Código" value={form.codigo_interno} onChange={handleChange} required />
                <input name="orçamento_total" placeholder="Orçamento" value={form.orçamento_total} onChange={handleChange} required />
                <input name="data_inicio" type="date" value={form.data_inicio} onChange={handleChange} />
                <input name="data_fim" type="date" value={form.data_fim} onChange={handleChange} />
                <input name="objetivos" placeholder="Objetivos" value={form.objetivos} onChange={handleChange} />
                <input name="estado" placeholder="Estado" value={form.estado} onChange={handleChange} />
                <input name="ong_id" placeholder="ONG ID" value={form.ong_id} onChange={handleChange} required />
                <button type="submit">Cadastrar</button>
            </form>
            {msg && <p>{msg}</p>}
            <ul>
                {projetos.map(p => (
                    <li key={p.id}>{p.nome} ({p.codigo_interno})</li>
                ))}
            </ul>
        </div>
    );
}
export default Projetos;
