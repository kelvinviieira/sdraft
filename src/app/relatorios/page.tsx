'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/store/AppContext';

const PERIODS = [
    { label: 'Última semana', days: 7 },
    { label: 'Último mês', days: 30 },
    { label: 'Últimos 3 meses', days: 90 },
];

export default function RelatoriosPage() {
    const { tasks, clients, timeEntries } = useApp();
    const [periodDays, setPeriodDays] = useState(30);

    const cutoff = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() - periodDays);
        return d.toISOString();
    }, [periodDays]);

    // Metrics
    const totalHours = useMemo(() => {
        const total = timeEntries.reduce((s, e) => s + e.duration, 0) / 3600;
        return Math.round(total * 10) / 10;
    }, [timeEntries]);
    const createdTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Concluído').length;
    const avgDaily = periodDays > 0 ? Math.round((completedTasks / periodDays) * 10) / 10 : 0;

    // Hours per project (bar chart data)
    const hoursByProject = useMemo(() => {
        const map: Record<string, number> = {};
        timeEntries.forEach(e => {
            const p = clients.find(pr => pr.id === e.clientId);
            const name = p?.name || 'Outro';
            map[name] = (map[name] || 0) + e.duration / 3600;
        });
        return Object.entries(map).map(([name, hours]) => ({ name, hours: Math.round(hours * 10) / 10 }));
    }, [timeEntries, clients]);

    const maxHours = Math.max(...hoursByProject.map(h => h.hours), 1);

    // Tasks per day (last 7 days)
    const tasksPerDay = useMemo(() => {
        const result = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayLabel = d.toLocaleDateString('pt-BR', { weekday: 'short' });
            const count = tasks.filter(t => t.status === 'Concluído' && t.deadline && t.deadline <= dateStr).length;
            result.push({ day: dayLabel, count });
        }
        return result;
    }, [tasks]);

    const maxCount = Math.max(...tasksPerDay.map(d => d.count), 1);

    // Project ranking
    const projectRanking = useMemo(() => {
        return clients.map(p => {
            const projectTasks = tasks.filter(t => t.clientId === p.id);
            const total = projectTasks.length;
            const completed = projectTasks.filter(t => t.status === 'Concluído').length;
            const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
            return { name: p.name, color: p.color, total, completed, rate };
        }).sort((a, b) => b.rate - a.rate);
    }, [clients, tasks]);

    const projectColors = ['#7C5CFC', '#5B8DEF', '#22C55E', '#F59E0B', '#EF4444'];

    const metrics = [
        { label: 'Total de horas', value: `${totalHours}h`, color: '#7C5CFC' },
        { label: 'Tasks criadas', value: createdTasks, color: '#5B8DEF' },
        { label: 'Concluídas', value: completedTasks, color: '#22C55E' },
        { label: 'Média diária', value: avgDaily, color: '#F59E0B' },
    ];

    return (
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A' }}>Relatórios</h1>
                <div style={{ display: 'flex', gap: 6 }}>
                    {PERIODS.map(p => (
                        <button key={p.days} onClick={() => setPeriodDays(p.days)} style={{
                            padding: '6px 14px', borderRadius: 8, border: '1px solid',
                            borderColor: periodDays === p.days ? '#7C5CFC' : '#E2E8F0',
                            background: periodDays === p.days ? '#F0EDFF' : 'white',
                            color: periodDays === p.days ? '#7C5CFC' : '#64748B',
                            fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                        }}>{p.label}</button>
                    ))}
                </div>
            </div>

            {/* Metric cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                {metrics.map(m => (
                    <div key={m.label} style={{
                        padding: 20, borderRadius: 16, background: 'white', border: '1px solid #F1F5F9',
                        display: 'flex', flexDirection: 'column', gap: 8,
                    }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#64748B' }}>{m.label}</span>
                        <span style={{ fontSize: 28, fontWeight: 700, color: m.color }}>{m.value}</span>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Bar chart: hours per project */}
                <div style={{ padding: 20, borderRadius: 16, background: 'white', border: '1px solid #F1F5F9' }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 16 }}>Horas por projeto</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {hoursByProject.map((h, i) => (
                            <div key={h.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontSize: 12, color: '#475569', width: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</span>
                                <div style={{ flex: 1, height: 24, background: '#F1F5F9', borderRadius: 6, overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${(h.hours / maxHours) * 100}%`, height: '100%',
                                        background: projectColors[i % projectColors.length],
                                        borderRadius: 6, transition: 'width 0.5s ease',
                                        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8,
                                    }}>
                                        <span style={{ fontSize: 11, fontWeight: 600, color: 'white' }}>{h.hours}h</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {hoursByProject.length === 0 && <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: 20 }}>Nenhum dado</p>}
                    </div>
                </div>

                {/* Line chart: tasks completed per day */}
                <div style={{ padding: 20, borderRadius: 16, background: 'white', border: '1px solid #F1F5F9' }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 16 }}>Tasks concluídas (últimos 7 dias)</h3>
                    <div style={{ height: 180, display: 'flex', alignItems: 'flex-end', gap: 8, padding: '0 4px' }}>
                        {tasksPerDay.map((d, i) => (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>{d.count}</span>
                                <div style={{
                                    width: '100%', maxWidth: 40, borderRadius: 6,
                                    background: 'linear-gradient(180deg, #7C5CFC, #5B8DEF)',
                                    height: `${Math.max((d.count / maxCount) * 140, 8)}px`,
                                    transition: 'height 0.5s ease',
                                }} />
                                <span style={{ fontSize: 10, color: '#94A3B8' }}>{d.day}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Ranking table */}
            <div style={{ padding: 20, borderRadius: 16, background: 'white', border: '1px solid #F1F5F9' }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 14 }}>Ranking de projetos</h3>
                <div style={{ borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 100px 100px 140px',
                        padding: '10px 16px', background: '#FAFBFC', borderBottom: '1px solid #F1F5F9',
                    }}>
                        {['Projeto', 'Total', 'Concluídas', 'Taxa de conclusão'].map(h => (
                            <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>{h}</span>
                        ))}
                    </div>
                    {projectRanking.map(p => (
                        <div key={p.name} style={{
                            display: 'grid', gridTemplateColumns: '1fr 100px 100px 140px',
                            padding: '12px 16px', borderBottom: '1px solid #F8FAFC', alignItems: 'center',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 8, height: 8, borderRadius: 3, background: p.color }} />
                                <span style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>{p.name}</span>
                            </div>
                            <span style={{ fontSize: 13, color: '#64748B' }}>{p.total}</span>
                            <span style={{ fontSize: 13, color: '#059669', fontWeight: 600 }}>{p.completed}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ flex: 1, height: 6, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                                    <div style={{ width: `${p.rate}%`, height: '100%', background: p.color, borderRadius: 3 }} />
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{p.rate}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
