import React from 'react';

function Relatorios() {
    const reports = [
        { id: 'financeiro', name: 'Relatório Financeiro (Saídas)', desc: 'Detalhamento de todas as despesas aprovadas, categorias e centros de custo.' },
        { id: 'projeto', name: 'Execução Orçamental de Projetos', desc: 'Resumo por projeto: Orçamento Total vs Gasto Real vs Saldo Disponível.' },
        { id: 'receitas', name: 'Entradas e Financiamentos', desc: 'Histórico de fundos recebidos, distribuídos por financiador e projeto.' },
        { id: 'patrimonio', name: 'Inventário de Património', desc: 'Listagem de ativos, localização, estado de conservação e valor de aquisição.' },
        { id: 'rh', name: 'Quadro de Pessoal & RH', desc: 'Relatório de colaboradores ativos, cargos, salários base e vinculações.' }
    ];

    const generateReport = (type, format) => {
        const token = localStorage.getItem('token');
        fetch(`/api/relatorio/${type}/${format}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `relatorio_${type}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card" style={{ borderBottom: '2px solid var(--accent)' }}>
                <h2>Central de Inteligência & Relatórios Oficiais</h2>
                <p style={{ color: 'var(--text-muted)' }}>Gere documentos ricos para auditoria, inspeção e prestação de contas institucional.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {reports.map(r => (
                    <div key={r.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '4px solid var(--primary)' }}>
                        <div>
                            <h3 style={{ margin: 0 }}>{r.name}</h3>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '1rem 0' }}>{r.desc}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.5rem' }}>
                            <button className="nav-button" onClick={() => generateReport(r.id, 'pdf')} style={{ background: '#e74c3c', color: 'white', flex: 1 }}>📑 Gerar PDF</button>
                            <button className="nav-button" onClick={() => generateReport(r.id, 'excel')} style={{ background: '#27ae60', color: 'white', flex: 1 }}>📊 Gerar EXCEL</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Relatorios;
