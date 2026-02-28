import React, { useEffect, useState } from 'react';
import axios from './api';

function Usuarios() {
    const [usuarios, setUsuarios] = useState([]);
    const [form, setForm] = useState({ nome: '', email: '', senha_hash: '', perfil: '', ativo: true, ong_id: '' });
    const [msg, setMsg] = useState('');

    useEffect(() => {
        axios.get('/api/usuario').then(res => setUsuarios(res.data));
    }, []);

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async e => {
        e.preventDefault();
        try {
            await axios.post('/api/usuario', form);
            setMsg('Usuário cadastrado!');
        } catch {
            setMsg('Erro ao cadastrar.');
        }
    };

    return (
        <div>
            <h2>Usuários</h2>
            <form onSubmit={handleSubmit}>
                <input name="nome" placeholder="Nome" value={form.nome} onChange={handleChange} required />
                <input name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
                <input name="senha_hash" placeholder="Senha" value={form.senha_hash} onChange={handleChange} required />
                <input name="perfil" placeholder="Perfil" value={form.perfil} onChange={handleChange} required />
                <input name="ong_id" placeholder="ONG ID" value={form.ong_id} onChange={handleChange} required />
                <button type="submit">Cadastrar</button>
            </form>
            {msg && <p>{msg}</p>}
            <ul>
                {usuarios.map(u => (
                    <li key={u.id}>{u.nome} ({u.email}) - {u.perfil}</li>
                ))}
            </ul>
        </div>
    );
}
export default Usuarios;
