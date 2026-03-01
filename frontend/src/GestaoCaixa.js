import React, { useEffect, useState } from 'react';
import axios from './api';

function GestaoCaixa() {
    const [contas, setContas] = useState([]);
    const [transferencia, setTransferencia] = useState({ origem_id: '', destino_id: '', valor: '', justificativa: '', data: new Date().toISOString().split('T')[0] });
    const [msg, setMsg] = useState('');

    const fetchData = async () => {
        try {
            const res = await axios.get('/api/conta_caixa');
            setContas(res.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleTransfer = async e => {
        e.preventDefault();
        try {
            await axios.post('/api/transferencia', transferencia);
            setMsg('✅ Transferência interna realizada com sucesso!');
            setTransferencia({ origem_id: '', destino_id: '', valor: '', justificativa: '', data: new Date().toISOString().split('T')[0] });
            fetchData();
        } catch (err) { setMsg('❌ Erro: Saldo insuficiente ou conta inválida.'); }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card">
                <h2>Gestão Operational de Caixas & Bancos</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
                    {contas.map(c => (
                        <div key={c.id} style={{
                            padding: '1.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <div>
                                <small style={{ color: 'var(--text-muted)' }}>{c.tipo.toUpperCase()}</small>
                                <h3 style={{ margin: '5px 0' }}>{c.nome}</h3>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <small style={{ color: 'var(--accent)' }}>Saldo Atual:</small>
                                <br />
                                <strong style={{ fontSize: '1.2rem' }}>{Number(c.saldo_atual).toLocaleString()} MZN</strong>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="card" style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
                <h3>Efetuar Movimentação Interna (Transferência)</h3>
                <form onSubmit={handleTransfer} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <select value={transferencia.origem_id} onChange={e => setTransferencia({ ...transferencia, origem_id: e.target.value })} required>
                            <option value="">Conta Origem (Saída)</option>
                            {contas.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
                        </select>
                        <select value={transferencia.destino_id} onChange={e => setTransferencia({ ...transferencia, destino_id: e.target.value })} required>
                            <option value="">Conta Destino (Entrada)</option>
                            {contas.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
                        </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <input name="valor" type="number" placeholder="Valor (MZN)" value={transferencia.valor} onChange={e => setTransferencia({ ...transferencia, valor: e.target.value })} required />
                        <input name="data" type="date" value={transferencia.data} onChange={e => setTransferencia({ ...transferencia, data: e.target.value })} required />
                    </div>
                    <textarea placeholder="Justificativa da Auditoria para este movimento..." value={transferencia.justificativa} onChange={e => setTransferencia({ ...transferencia, justificativa: e.target.value })} required
                        style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.8rem' }} />
                    <button type="submit" className="nav-button" style={{ background: 'var(--accent)', color: 'white' }}>Confirmar Transferência Oficial</button>
                    {msg && <p style={{ color: 'var(--accent)', textAlign: 'center' }}>{msg}</p>}
                </form>
            </div>
        </div>
    );
}

export default GestaoCaixa;
