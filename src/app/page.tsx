'use client';

import { useMemo } from 'react';
import { useApp, STAGE_CONFIG, STAGE_ORDER, daysAgo, formatDateBR } from '@/store/AppContext';
import Badge from '@/components/ui/Badge';
import { ClipboardList, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const { tasks, clients, timeEntries, activities } = useApp();

  const totalTasks = tasks.length;
  const inProgress = tasks.filter(t => t.status === 'Em Progresso').length;
  const completed = tasks.filter(t => t.status === 'Concluído').length;
  const overdue = tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'Concluído').length;

  const stats = [
    { icon: ClipboardList, label: 'Total de tasks', value: totalTasks, change: `${totalTasks} registradas`, changeType: 'up' as const, iconBg: '#F0EDFF', iconColor: '#7C5CFC' },
    { icon: RefreshCw, label: 'Em progresso', value: inProgress, change: `${inProgress} ativas`, changeType: 'up' as const, iconBg: '#FEF3C7', iconColor: '#D97706' },
    { icon: CheckCircle2, label: 'Concluídas', value: completed, change: `${Math.round((completed / Math.max(totalTasks, 1)) * 100)}% do total`, changeType: 'up' as const, iconBg: '#D1FAE5', iconColor: '#059669' },
    { icon: AlertCircle, label: 'Atrasadas', value: overdue, change: overdue > 0 ? 'Atenção!' : 'Tudo em dia', changeType: overdue > 0 ? 'down' as const : 'up' as const, iconBg: '#FEE2E2', iconColor: '#DC2626' },
  ];

  // Task segments for donut
  const segments = useMemo(() => {
    const aFazer = tasks.filter(t => t.status === 'A Fazer').length;
    const emProg = tasks.filter(t => t.status === 'Em Progresso').length;
    const revisao = tasks.filter(t => t.status === 'Revisão').length;
    const concl = tasks.filter(t => t.status === 'Concluído').length;
    const total = Math.max(totalTasks, 1);
    return [
      { label: 'A Fazer', percent: Math.round((aFazer / total) * 100), color: '#94A3B8', count: aFazer },
      { label: 'Em progresso', percent: Math.round((emProg / total) * 100), color: '#3B82F6', count: emProg },
      { label: 'Em revisão', percent: Math.round((revisao / total) * 100), color: '#F59E0B', count: revisao },
      { label: 'Concluída', percent: Math.round((concl / total) * 100), color: '#22C55E', count: concl },
    ];
  }, [tasks, totalTasks]);

  // Clients in attention (overdue)
  const attentionClients = useMemo(() => {
    return clients
      .filter(c => c.stage !== 'churned' && c.stageDueDate && new Date(c.stageDueDate) < new Date())
      .sort((a, b) => new Date(a.stageDueDate!).getTime() - new Date(b.stageDueDate!).getTime());
  }, [clients]);

  return (
    <div style={{ padding: '24px 28px', paddingLeft: 40, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A' }}>Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: -6 }}>
          {['#7C5CFC', '#5B8DEF', '#F59E0B'].map((c, i) => (
            <div key={i} style={{
              width: 32, height: 32, borderRadius: 10, background: c,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: 12, fontWeight: 600, border: '2px solid #FAFBFC',
              marginLeft: i > 0 ? -6 : 0, position: 'relative', zIndex: 3 - i,
            }}>{['K', 'A', 'M'][i]}</div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{ padding: 20, borderRadius: 16, background: 'white', border: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#64748B' }}>{s.label}</span>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: s.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} strokeWidth={2} style={{ color: s.iconColor }} />
                </div>
              </div>
              <span style={{ fontSize: 28, fontWeight: 700, color: '#0F172A', lineHeight: 1 }}>{s.value}</span>
              <span style={{ fontSize: 11.5, fontWeight: 500, color: s.changeType === 'up' ? '#059669' : '#DC2626' }}>
                {s.changeType === 'up' ? '↑' : '↓'} {s.change}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Clientes em Atenção */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>Clientes em Atenção</h3>
            {attentionClients.length === 0 ? (
              <div style={{ padding: 18, borderRadius: 14, background: 'white', border: '1px solid #F1F5F9' }}>
                <p style={{ fontSize: 13, color: '#94A3B8' }}>✅ Nenhum cliente em atraso</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(attentionClients.length, 3)}, 1fr)`, gap: 14 }}>
                {attentionClients.slice(0, 3).map(client => {
                  const cfg = STAGE_CONFIG[client.stage];
                  const cTasks = tasks.filter(t => t.clientId === client.id && t.stage === client.stage);
                  const done = cTasks.filter(t => t.status === 'Concluído').length;
                  const prog = cTasks.length > 0 ? Math.round((done / cTasks.length) * 100) : 0;
                  const daysOverdue = Math.abs(Math.ceil((new Date(client.stageDueDate!).getTime() - Date.now()) / 86400000));

                  return (
                    <Link key={client.id} href={`/clientes/${client.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{
                        padding: 18, borderRadius: 14, background: 'white',
                        border: '1px solid #FCA5A5', display: 'flex', flexDirection: 'column', gap: 10,
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 16 }}>{client.emoji}</span>
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{client.name}</span>
                        </div>
                        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: cfg.bgLight, color: cfg.color, width: 'fit-content' }}>
                          {cfg.emoji} {cfg.label}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#F1F5F9', overflow: 'hidden' }}>
                            <div style={{ width: `${prog}%`, height: '100%', borderRadius: 3, background: cfg.color }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{prog}%</span>
                        </div>
                        <span className="pulse-badge" style={{ fontSize: 11, fontWeight: 600, color: '#DC2626' }}>
                          ⚠️ {daysOverdue} dias de atraso
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tasks table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>Visão das tasks</h3>
            <div style={{ borderRadius: 14, background: 'white', border: '1px solid #F1F5F9', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr 100px 90px 100px 110px 100px', padding: '12px 18px', borderBottom: '1px solid #F1F5F9', background: '#FAFBFC' }}>
                {['#', 'Task', 'Prazo', 'Prioridade', 'Responsável', 'Projeto', 'Status'].map(h => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{h}</span>
                ))}
              </div>
              {tasks.slice(0, 10).map((task, idx) => {
                const client = clients.find(c => c.id === task.clientId);
                const member = useApp().members.find(m => m.id === task.assigneeId);
                return (
                  <div key={task.id} style={{
                    display: 'grid', gridTemplateColumns: '48px 1fr 100px 90px 100px 110px 100px',
                    padding: '11px 18px', borderBottom: '1px solid #F8FAFC', alignItems: 'center',
                  }}>
                    <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>{String(idx + 1).padStart(2, '0')}</span>
                    <span style={{ fontSize: 13, color: '#0F172A', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
                    <span style={{ fontSize: 12, color: '#64748B' }}>{formatDateBR(task.deadline)}</span>
                    <div style={{ transform: 'scale(0.85)', transformOrigin: 'left center' }}>
                      <Badge label={task.priority} type="priority" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {member && (
                        <>
                          <div style={{ width: 22, height: 22, borderRadius: 6, background: `${member.color}20`, color: member.color, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {member.initial}
                          </div>
                          <span style={{ fontSize: 12, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.name}</span>
                        </>
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {client?.name || '-'}
                    </span>
                    <div style={{ transform: 'scale(0.85)', transformOrigin: 'left center' }}>
                      <Badge label={task.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Donut */}
          <div style={{ padding: 20, borderRadius: 16, background: 'white', border: '1px solid #F1F5F9' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', marginBottom: 14 }}>Progresso das tasks</h3>
            <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
              <svg width={160} height={160} viewBox="0 0 160 160">
                {(() => {
                  const radius = 60;
                  const circ = 2 * Math.PI * radius;
                  let cum = 0;
                  return segments.map(seg => {
                    const offset = circ * (1 - cum / 100);
                    const dash = circ * (seg.percent / 100);
                    cum += seg.percent;
                    return (<circle key={seg.label} cx="80" cy="80" r={radius} fill="none" stroke={seg.color} strokeWidth="18"
                      strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 80 80)" />);
                  });
                })()}
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>Total</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#0F172A' }}>{totalTasks}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
              {segments.map(seg => (
                <div key={seg.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: seg.color }} />
                    <span style={{ fontSize: 12.5, color: '#475569', fontWeight: 500 }}>{seg.label}</span>
                  </div>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: '#0F172A' }}>{seg.percent}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity */}
          <div style={{ padding: 20, borderRadius: 16, background: 'white', border: '1px solid #F1F5F9' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', marginBottom: 14 }}>Atividade recente</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {activities.slice(0, 6).map(a => (
                <div key={a.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: `${a.userColor}18`, color: a.userColor, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{a.userInitial}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                    <p style={{ fontSize: 12.5, color: '#0F172A', lineHeight: 1.4 }}><span style={{ fontWeight: 600 }}>{a.userName}</span> — {a.action}</p>
                    <p style={{ fontSize: 11, color: '#94A3B8' }}>{a.projectName}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
