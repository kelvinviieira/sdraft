'use client';

interface Task {
    id: string;
    name: string;
    date: string;
    priority: 'Alta' | 'Média' | 'Baixa';
    tags: string;
    status: 'Concluída' | 'Em progresso' | 'Em revisão' | 'Não iniciada';
}

const tasks: Task[] = [
    { id: '01', name: 'Analisar estratégias dos concorrentes', date: '05 Nov - 15 Nov', priority: 'Média', tags: 'Web Design', status: 'Concluída' },
    { id: '02', name: 'Desenvolver estratégia de conteúdo', date: '16 Nov - 30 Nov', priority: 'Baixa', tags: 'App Design', status: 'Em progresso' },
    { id: '03', name: 'Design do layout da homepage', date: '01 Dez - 10 Dez', priority: 'Alta', tags: 'Web Design', status: 'Em revisão' },
    { id: '04', name: 'Planejar campanha de marketing', date: '11 Dez - 20 Dez', priority: 'Alta', tags: 'Marketing', status: 'Em progresso' },
    { id: '05', name: 'Criar fluxo de autenticação', date: '21 Dez - 30 Dez', priority: 'Média', tags: 'Dashboard', status: 'Não iniciada' },
    { id: '06', name: 'Criar guia de marca', date: '01 Jan - 10 Jan', priority: 'Alta', tags: 'Design Review', status: 'Em revisão' },
    { id: '07', name: 'Finalizar componentes de UI', date: '11 Jan - 20 Jan', priority: 'Alta', tags: 'UI Design', status: 'Em progresso' },
    { id: '08', name: 'Conduzir sessões de feedback', date: '21 Jan - 31 Jan', priority: 'Baixa', tags: 'Produto', status: 'Concluída' },
    { id: '09', name: 'Auditoria de SEO do site', date: '01 Fev - 10 Fev', priority: 'Média', tags: 'SEO', status: 'Não iniciada' },
    { id: '10', name: 'Criar guia de branding', date: '11 Fev - 20 Fev', priority: 'Alta', tags: 'Produto', status: 'Concluída' },
];

const priorityColors: Record<string, { bg: string; text: string }> = {
    Alta: { bg: '#FEE2E2', text: '#DC2626' },
    Média: { bg: '#FEF3C7', text: '#D97706' },
    Baixa: { bg: '#D1FAE5', text: '#059669' },
};

const statusColors: Record<string, string> = {
    'Concluída': '#059669',
    'Em progresso': '#3B82F6',
    'Em revisão': '#D97706',
    'Não iniciada': '#64748B',
};

export default function TasksTable() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>Visão das tasks</h3>
            <div style={{
                borderRadius: 14,
                background: 'white',
                border: '1px solid #F1F5F9',
                overflow: 'hidden',
            }}>
                {/* Table header */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '48px 1fr 140px 80px 110px 110px',
                    padding: '12px 18px',
                    borderBottom: '1px solid #F1F5F9',
                    background: '#FAFBFC',
                }}>
                    {['#', 'Nome', 'Data', 'Prioridade', 'Tags', 'Status'].map((h) => (
                        <span key={h} style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{h}</span>
                    ))}
                </div>

                {/* Table rows */}
                {tasks.map((task) => (
                    <div
                        key={task.id}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '48px 1fr 140px 80px 110px 110px',
                            padding: '11px 18px',
                            borderBottom: '1px solid #F8FAFC',
                            alignItems: 'center',
                            transition: 'background 0.15s ease',
                            cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#FAFBFE'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                        <span style={{ fontSize: 12.5, color: '#94A3B8', fontWeight: 500 }}>{task.id}</span>
                        <span style={{ fontSize: 13, color: '#0F172A', fontWeight: 500 }}>{task.name}</span>
                        <span style={{ fontSize: 12, color: '#64748B' }}>{task.date}</span>
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '3px 10px',
                            borderRadius: 6,
                            fontSize: 11.5,
                            fontWeight: 600,
                            background: priorityColors[task.priority].bg,
                            color: priorityColors[task.priority].text,
                            width: 'fit-content',
                        }}>
                            {task.priority}
                        </span>
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '3px 10px',
                            borderRadius: 6,
                            fontSize: 11.5,
                            fontWeight: 500,
                            background: '#F1F5F9',
                            color: '#475569',
                            width: 'fit-content',
                        }}>
                            {task.tags}
                        </span>
                        <span style={{
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: statusColors[task.status],
                        }}>
                            {task.status}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
