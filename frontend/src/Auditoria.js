import React, { useEffect, useState } from 'react';
import axios from './api';

function Auditoria() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await axios.get('/api/log_auditoria');
                setLogs(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    if (loading) return <div className="card">Sincronizando Cadeia de Custódia Digital...</div>;

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2>🛡️ Log de Auditoria Imutável</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Rastreabilidade total de todas as ações críticas no sistema.</p>
                </div>
                <button className="nav-button" style={{ background: 'var(--accent)', color: 'black', fontWeight: 'bold' }}>Exportar para Inspecção (PDF)</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {logs.map((log, idx) => (
                    <div key={log.id} style={{
                        padding: '1rem',
                        background: 'rgba(255,255,255,0.02)',
                        borderLeft: `3px solid ${log.tipo_action === 'UPDATE' ? 'var(--primary)' : log.tipo_action === 'LOGIN' ? 'var(--accent)' : 'var(--danger)'}`,
                        borderRadius: '4px',
                        display: 'grid',
                        gridTemplateColumns: '150px 100px 1fr 150px',
                        alignItems: 'center',
                        fontSize: '0.9rem'
                    }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(log.data_hora).toLocaleString()}</span>
                        <span style={{
                            fontWeight: 'bold',
                            color: log.tipo_action === 'UPDATE' ? 'var(--primary)' : 'var(--accent)',
                            fontSize: '0.75rem'
                        }}>[{log.tipo_action}]</span>
                        <span>{log.detalhes}</span>
                        <span style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)' }}>IP: {log.ip}</span>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(244, 63, 94, 0.05)', borderRadius: '8px', border: '1px solid var(--danger)' }}>
                <small style={{ color: 'var(--danger)' }}>
                    <strong>Aviso de Segurança:</strong> Este log é gerado automaticamente pelo servidor e não pode ser editado nem por administradores. Cumpre com os requisitos da Lei de Transparência.
                </small>
            </div>
        </div>
    );
}

export default Auditoria;
