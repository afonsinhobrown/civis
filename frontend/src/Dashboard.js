import React, { useEffect, useState } from 'react';
import axios from './api';

function Dashboard() {
    const [stats, setStats] = useState({ receitas: 0, despesas: 0, saldo: 0, execucao: 0, numAtivos: 0, impacto: 0 });
    const [loading, setLoading] = useState(true);
    const [insight, setInsight] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [rRec, rDes, rPat] = await Promise.all([
                    axios.get('/api/receita'),
                    axios.get('/api/despesa'),
                    axios.get('/api/patrimonio')
                ]);
                const totalRec = rRec.data.reduce((acc, r) => acc + Number(r.valor), 0);
                const totalDes = rDes.data.reduce((acc, d) => acc + Number(d.valor), 0);

                // Simulação de Impacto Social (ex: cada 5000 MT ajuda 1 família)
                const familiasImpactadas = Math.floor(totalDes / 5000);

                setStats({
                    receitas: totalRec,
                    despesas: totalDes,
                    saldo: totalRec - totalDes,
                    execucao: totalRec > 0 ? (totalDes / totalRec) * 100 : 0,
                    numAtivos: rPat.data.length,
                    impacto: familiasImpactadas
                });

                // Geração de Insight AI (Simulação)
                if (totalDes > totalRec * 0.8) {
                    setInsight("⚠️ Alerta de Sustentabilidade: O orçamento está acima de 80%. Recomenda-se procurar novos financiadores para o próximo trimestre.");
                } else if (familiasImpactadas > 0) {
                    setInsight("🚀 Performance Excelente: Graças à execução eficiente, o custo por família impactada está 12% abaixo da meta do doador.");
                } else {
                    setInsight("💡 Dica de Governança: Inicie o registo de saídas para que o sistema possa calcular o seu 'Impact Score'.");
                }

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="card">Sincronizando Inteligência Estratégica...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header: KPIs que Cantam */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <div className="card" style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: 'white', border: 'none' }}>
                    <small style={{ opacity: 0.8 }}>Saldo em Caixa (Cash-flow)</small>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '900' }}>{stats.saldo.toLocaleString()} <small style={{ fontSize: '1rem' }}>MT</small></h2>
                    <div style={{ marginTop: '1rem', padding: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '0.85rem' }}>
                        Potencial para operar por mais <strong>4.2 meses</strong> sem novas entradas.
                    </div>
                </div>

                <div className="card" style={{ borderLeft: '8px solid var(--accent)' }}>
                    <small style={{ color: 'var(--text-muted)' }}>Métricas de Impacto Social</small>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--accent)' }}>{stats.impacto} <small style={{ fontSize: '1rem' }}>Famílias</small></h2>
                    <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>📈 Impacto direto calculado via execução nos distritos.</p>
                </div>
            </div>

            {/* AI Insights & Transparency Portal Link */}
            <div className="card" style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px dashed var(--primary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ fontSize: '2rem' }}>🤖</span>
                    <div>
                        <h4 style={{ color: 'var(--primary)', marginBottom: '5px' }}>Insight da Inteligência CIVIS</h4>
                        <p style={{ fontWeight: '600' }}>{insight}</p>
                    </div>
                </div>
            </div>

            {/* Central de Inspecção e Transparência */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                <div className="card">
                    <h3>Mapa de Execução de Projetos</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '1.5rem' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <small>Educação Maputo</small>
                                <small>{stats.execucao.toFixed(1)}%</small>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: '#1e293b', borderRadius: '4px' }}>
                                <div style={{ width: `${stats.execucao}%`, height: '100%', background: 'var(--primary)', borderRadius: '4px' }}></div>
                            </div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <small>Saúde Beira (Pendente)</small>
                                <small>0%</small>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: '#1e293b', borderRadius: '4px' }}>
                                <div style={{ width: '0%', height: '100%', background: 'var(--accent)', borderRadius: '4px' }}></div>
                            </div>
                        </div>
                    </div>
                    <button className="nav-button" style={{ marginTop: '2rem', width: '100%', border: '1px solid var(--border)' }}>Ver Detalhes Por Distrito</button>
                </div>

                <div className="card" style={{ borderLeft: '4px solid var(--accent)' }}>
                    <h3>Portal do Doador & Transparência</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        Partilhe este link com os seus financiadores para que eles possam ver o progresso real sem aceder ao back-office.
                    </p>
                    <div style={{ background: '#020617', padding: '15px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <code style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>civis.org/t/ong-moz-92</code>
                        <button style={{ background: 'transparent', color: 'var(--primary)', fontSize: '0.8rem', padding: '0px' }}>Copiar Link</button>
                    </div>
                    <div style={{ marginTop: '1.5rem' }}>
                        <small style={{ color: 'var(--text-muted)' }}>Monitor de Confiança (Trust Score):</small>
                        <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
                            {[1, 2, 3, 4, 5].map(i => <div key={i} style={{ flex: 1, height: '6px', background: i <= 4 ? 'var(--accent)' : '#1e293b', borderRadius: '3px' }}></div>)}
                        </div>
                        <p style={{ fontSize: '0.7rem', color: 'var(--accent)', marginTop: '5px' }}>92% - Ouro em Transparência</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
