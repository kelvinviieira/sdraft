'use client';

interface Activity {
    user: string;
    initial: string;
    color: string;
    action: string;
    project: string;
    date: string;
}

const activities: Activity[] = [
    {
        user: 'David Silva',
        initial: 'D',
        color: '#EF4444',
        action: 'Task marcada como Iniciada.',
        project: 'SamCart Web Design',
        date: 'Hoje, 14:30',
    },
    {
        user: 'Liam Santos',
        initial: 'L',
        color: '#F59E0B',
        action: 'Task marcada como Concluída.',
        project: 'SamCart Web Design',
        date: 'Hoje, 12:15',
    },
    {
        user: 'Ethan Garcia',
        initial: 'E',
        color: '#22C55E',
        action: 'Task marcada como Concluída.',
        project: 'InstaSupply App Design',
        date: 'Hoje, 10:45',
    },
    {
        user: 'Noah Wilson',
        initial: 'N',
        color: '#3B82F6',
        action: 'Task marcada como Em Revisão.',
        project: 'Kuppi Dashboard Design',
        date: 'Ontem, 17:20',
    },
    {
        user: 'Mason Lima',
        initial: 'M',
        color: '#8B5CF6',
        action: 'Task marcada como Cancelada.',
        project: 'SamCart Web Design',
        date: 'Ontem, 15:00',
    },
    {
        user: 'Ana Martinez',
        initial: 'A',
        color: '#EC4899',
        action: 'Task marcada como Bloqueada.',
        project: 'SamCart Web Design',
        date: 'Ontem, 13:30',
    },
];

export default function LatestActivity() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            padding: '20px',
            borderRadius: 16,
            background: 'white',
            border: '1px solid #F1F5F9',
        }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>Atividade recente</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {activities.map((a, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 30,
                            height: 30,
                            borderRadius: 8,
                            background: `${a.color}18`,
                            color: a.color,
                            fontSize: 12,
                            fontWeight: 700,
                            flexShrink: 0,
                        }}>
                            {a.initial}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                            <p style={{ fontSize: 12.5, color: '#0F172A', lineHeight: 1.4 }}>
                                <span style={{ fontWeight: 600 }}>{a.user}</span>
                                {' — '}
                                {a.action}
                            </p>
                            <p style={{ fontSize: 11, color: '#94A3B8' }}>
                                Projeto: {a.project}
                            </p>
                            <p style={{ fontSize: 10.5, color: '#CBD5E1' }}>{a.date}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
