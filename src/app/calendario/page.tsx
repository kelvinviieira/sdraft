'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/store/AppContext';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import Badge from '@/components/ui/Badge';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const priorityColor: Record<string, string> = { Alta: '#DC2626', Média: '#D97706', Baixa: '#059669' };

export default function CalendarioPage() {
    const { tasks, clients } = useApp();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<string | null>(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const today = new Date().toISOString().split('T')[0];

    const tasksByDate = useMemo(() => {
        const map: Record<string, typeof tasks> = {};
        tasks.forEach(t => {
            if (t.deadline) {
                if (!map[t.deadline]) map[t.deadline] = [];
                map[t.deadline].push(t);
            }
        });
        return map;
    }, [tasks]);

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const selectedTasks = selectedDay ? tasksByDate[selectedDay] || [] : [];

    const calendarDays = [];
    for (let i = 0; i < firstDayOfWeek; i++) calendarDays.push(null);
    for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

    return (
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A' }}>Calendário</h1>

            <div style={{ display: 'flex', gap: 20, flex: 1 }}>
                {/* Calendar grid */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Month nav */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <button onClick={prevMonth} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, border: '1px solid #E2E8F0', background: 'white', cursor: 'pointer', color: '#475569' }}>
                            <ChevronLeft size={16} />
                        </button>
                        <span style={{ fontSize: 16, fontWeight: 600, color: '#0F172A' }}>{MONTHS[month]} {year}</span>
                        <button onClick={nextMonth} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, border: '1px solid #E2E8F0', background: 'white', cursor: 'pointer', color: '#475569' }}>
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* Day headers */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                        {DAYS.map(d => (
                            <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#94A3B8', padding: '8px 0' }}>{d}</div>
                        ))}
                    </div>

                    {/* Days */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, flex: 1 }}>
                        {calendarDays.map((day, i) => {
                            if (day === null) return <div key={`e${i}`} />;
                            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const dayTasks = tasksByDate[dateStr] || [];
                            const isToday = dateStr === today;
                            const isSelected = dateStr === selectedDay;

                            return (
                                <button
                                    key={dateStr}
                                    onClick={() => setSelectedDay(dateStr === selectedDay ? null : dateStr)}
                                    style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                                        padding: '8px 4px', borderRadius: 10, border: 'none', cursor: 'pointer',
                                        background: isSelected ? '#F0EDFF' : isToday ? '#FAFBFE' : 'transparent',
                                        transition: 'all 0.15s', minHeight: 70,
                                        outline: isToday ? '2px solid #7C5CFC' : 'none',
                                    }}
                                >
                                    <span style={{
                                        fontSize: 13, fontWeight: isToday ? 700 : 500,
                                        color: isToday ? '#7C5CFC' : '#0F172A',
                                    }}>{day}</span>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
                                        {dayTasks.slice(0, 3).map(t => (
                                            <div key={t.id} style={{
                                                width: 7, height: 7, borderRadius: 4,
                                                background: priorityColor[t.priority] || '#94A3B8',
                                            }} />
                                        ))}
                                        {dayTasks.length > 3 && (
                                            <span style={{ fontSize: 9, color: '#94A3B8', fontWeight: 600 }}>+{dayTasks.length - 3}</span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Side panel */}
                {selectedDay && (
                    <div style={{
                        width: 300, background: 'white', borderRadius: 16, border: '1px solid #F1F5F9',
                        padding: 20, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>
                                {new Date(selectedDay + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                            </span>
                            <button onClick={() => setSelectedDay(null)} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24,
                                borderRadius: 6, border: 'none', background: '#F1F5F9', cursor: 'pointer', color: '#64748B',
                            }}><X size={14} /></button>
                        </div>
                        {selectedTasks.length === 0 ? (
                            <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: 20 }}>Nenhuma task neste dia</p>
                        ) : (
                            selectedTasks.map(t => {
                                const project = clients.find(p => p.id === t.clientId);
                                return (
                                    <div key={t.id} style={{
                                        padding: 12, borderRadius: 10, border: '1px solid #F1F5F9',
                                        display: 'flex', flexDirection: 'column', gap: 6,
                                    }}>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{t.title}</span>
                                        {project && <span style={{ fontSize: 11, color: '#475569', fontWeight: 500 }}>{project.name}</span>}
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <Badge label={t.priority} type="priority" />
                                            <Badge label={t.status} />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
