'use client';

import { use, useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useApp, generateId, STAGE_ORDER, STAGE_CONFIG, addBusinessDays, daysAgo, getNextStage, businessDaysBetween, formatDateBR, DEFAULT_STAGE_DAYS } from '@/store/AppContext';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Badge from '@/components/ui/Badge';
import { Plus, Settings, ChevronRight, Download, Activity as ActivityIcon, MoreVertical, Edit, Trash2 } from 'lucide-react';
import TasksBoard from '@/components/tasks/TasksBoard';
import type { ClientStage, Task } from '@/types';
import DocumentsTab from '@/components/clients/DocumentsTab';
import NewClientModal from '@/components/NewClientModal';

const TABS = ['Overview', 'Tasks', 'Planejamento', 'Documentos', 'Histórico'];

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const searchParams = useSearchParams();
    const tabParam = searchParams.get('tab');
    const { clients, tasks, clientStageHistory, stageSettings, stageTaskTemplates, updateClient, deleteClient, addStageHistory, updateStageHistory, addTask, updateStageSettings, activeWorkspaceId } = useApp();
    const { toast } = useToast();
    const router = useRouter();

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [showActions, setShowActions] = useState(false);
    const actionsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
                setShowActions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const client = clients.find(c => c.id === id);

    const handleDelete = async () => {
        if (!client) return;
        if (window.confirm('Tem certeza que deseja excluir este cliente? Todas as tarefas e arquivos serão removidos permanentemente.')) {
            await deleteClient(client.id);
            toast('Cliente removido com sucesso.');
            router.push('/pipeline');
        }
    };

    const initialTab = tabParam ? (
        tabParam === 'tasks' ? 'Tasks' :
            tabParam === 'planejamento' ? 'Planejamento' :
                tabParam === 'documentos' ? 'Documentos' :
                    tabParam === 'historico' ? 'Histórico' : 'Overview'
    ) : 'Overview';
    const [activeTab, setActiveTab] = useState(initialTab);
    const [advanceModal, setAdvanceModal] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    const stageTasks = useMemo(() => tasks.filter(t => t.clientId === id && t.stage === client?.stage), [tasks, id, client]);
    const allClientTasks = useMemo(() => tasks.filter(t => t.clientId === id), [tasks, id]);
    const history = useMemo(() => clientStageHistory.filter(h => h.clientId === id).sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()), [clientStageHistory, id]);

    if (!client) return <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Cliente não encontrado</div>;

    const cfg = STAGE_CONFIG[client.stage];
    const doneTasks = stageTasks.filter(t => t.status === 'Concluído').length;
    const totalTasks = stageTasks.length;
    const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
    const daysInStage = daysAgo(client.stageStartedAt);
    const isOverdue = client.stageDueDate ? new Date(client.stageDueDate) < new Date() : false;
    const nextStage = getNextStage(client.stage);



    const handleAdvanceStage = () => {
        if (!nextStage) return;
        const stageSetting = stageSettings.find(s => s.stage === client.stage);
        const plannedDays = stageSetting?.businessDays || 0;
        const actualDays = daysInStage;

        // Record history
        addStageHistory({
            id: generateId(), clientId: client.id, stage: client.stage,
            startedAt: client.stageStartedAt, completedAt: new Date().toISOString(),
            plannedDays, actualDays, notes: '',
        });

        // Calculate new due date
        const nextSetting = stageSettings.find(s => s.stage === nextStage);
        const today = new Date().toISOString().split('T')[0];
        const dueDate = nextSetting && nextSetting.businessDays > 0 ? addBusinessDays(today, nextSetting.businessDays) : null;

        // Update client
        updateClient({ ...client, stage: nextStage, stageStartedAt: new Date().toISOString(), stageDueDate: dueDate });

        // Create tasks from templates
        const templates = stageTaskTemplates.filter(t => t.stage === nextStage).sort((a, b) => a.orderIndex - b.orderIndex);
        templates.forEach((tpl, idx) => {
            const task: Task = {
                id: generateId(), clientId: client.id, stage: nextStage,
                title: tpl.title, description: tpl.description,
                status: 'A Fazer', priority: 'Média', assigneeId: 'm1', tags: [],
                startDate: today, deadline: tpl.defaultDaysOffset > 0 ? addBusinessDays(today, tpl.defaultDaysOffset) : today,
                estimatedHours: 1, loggedHours: 0, orderIndex: idx, createdAt: new Date().toISOString(),
            };
            addTask(task);
        });

        toast(`Cliente avançou para ${STAGE_CONFIG[nextStage].label}!`);
        setAdvanceModal(false);
    };



    const inputStyle = { width: '100%', padding: '9px 14px', borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 13, fontFamily: 'inherit', outline: 'none' };

    // Planning stage simulation data
    const planningStages = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        let currentDate = client.contractDate;
        return STAGE_ORDER.map(stage => {
            const setting = stageSettings.find(s => s.stage === stage);
            const days = setting ? setting.businessDays : (DEFAULT_STAGE_DAYS[stage] || 0);
            const hist = history.find(h => h.stage === stage);
            const isCurrent = client.stage === stage;
            const idx = STAGE_ORDER.indexOf(stage);
            const clientIdx = STAGE_ORDER.indexOf(client.stage);
            const isCompleted = idx < clientIdx;
            const isFuture = idx > clientIdx;

            const plannedStart = currentDate;
            const plannedEnd = days > 0 ? addBusinessDays(currentDate, days) : currentDate;
            const actualStart = hist?.startedAt?.split('T')[0] || (isCurrent ? client.stageStartedAt.split('T')[0] : null);
            const actualEnd = hist?.completedAt?.split('T')[0] || null;

            // Advance base date
            if (actualEnd) {
                currentDate = actualEnd;
            } else if (isCurrent || isFuture) {
                currentDate = plannedEnd;
            }

            return {
                stage, label: STAGE_CONFIG[stage].label, emoji: STAGE_CONFIG[stage].emoji,
                color: STAGE_CONFIG[stage].color, days, plannedStart, plannedEnd,
                actualStart, actualEnd, isCompleted, isCurrent, isFuture,
                actualDays: hist?.actualDays || null,
            };
        });
    }, [client, history, stageSettings]);

    return (
        <div style={{ padding: '24px 28px', paddingLeft: 40, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Link href="/pipeline" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: 13 }}>← Pipeline</Link>
                <span style={{ color: '#E2E8F0' }}>/</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{client.emoji}</span>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A' }}>{client.name}</h1>
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 600, background: cfg.bgLight, color: cfg.color }}>
                        {cfg.emoji} {cfg.label}
                    </span>
                    {isOverdue && (
                        <span className="pulse-badge" style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#FEE2E2', color: '#DC2626' }}>
                            ⚠️ Atrasado
                        </span>
                    )}
                </div>
                <div style={{ flex: 1 }} />

                <div style={{ position: 'relative' }} ref={actionsRef}>
                    <button 
                        onClick={() => setShowActions(!showActions)}
                        style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid #E2E8F0', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}
                    >
                        <MoreVertical size={16} />
                    </button>
                    {showActions && (
                        <div style={{ position: 'absolute', top: '110%', right: 0, zIndex: 100, background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 140, padding: 6 }}>
                            <button onClick={() => { setIsEditModalOpen(true); setShowActions(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#0F172A', fontSize: 13, fontWeight: 500 }}>
                                <Edit size={14} /> Editar
                            </button>
                            <button onClick={handleDelete} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#EF4444', fontSize: 13, fontWeight: 500 }}>
                                <Trash2 size={14} /> Excluir
                            </button>
                        </div>
                    )}
                </div>

                {nextStage && (
                    <button onClick={() => setAdvanceModal(true)} style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10,
                        border: 'none', background: '#22C55E', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}><ChevronRight size={14} /> Avançar Etapa</button>
                )}
            </div>

            <NewClientModal 
                isOpen={isEditModalOpen} 
                onClose={() => setIsEditModalOpen(false)} 
                clientToEdit={client} 
            />

            <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #F1F5F9', paddingBottom: 0 }}>
                {TABS.map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{
                        padding: '10px 18px', fontSize: 13, fontWeight: activeTab === tab ? 600 : 500,
                        color: activeTab === tab ? '#7C5CFC' : '#64748B', border: 'none', background: 'none',
                        borderBottom: activeTab === tab ? '2px solid #7C5CFC' : '2px solid transparent',
                        cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                    }}>{tab}</button>
                ))}
            </div>

            {activeTab === 'Overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ padding: 18, borderRadius: 14, background: 'white', border: '1px solid #F1F5F9' }}>
                            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 12 }}>Progresso do Pipeline</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {STAGE_ORDER.map((stage, i) => {
                                    const idx = STAGE_ORDER.indexOf(client.stage);
                                    const isComplete = i < idx;
                                    const isCurrent = i === idx;
                                    const sc = STAGE_CONFIG[stage];
                                    return (
                                        <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                                            <div style={{
                                                width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: isComplete ? '#D1FAE5' : isCurrent ? `${sc.color}20` : '#F1F5F9',
                                                fontSize: 14,
                                            }}>
                                                {isComplete ? '✅' : isCurrent ? '🔄' : '○'}
                                            </div>
                                            <span style={{ fontSize: 11, fontWeight: isCurrent ? 600 : 400, color: isCurrent ? sc.color : '#94A3B8' }}>{sc.label}</span>
                                            {i < STAGE_ORDER.length - 1 && <div style={{ flex: 1, height: 2, background: isComplete ? '#22C55E' : '#E2E8F0', borderRadius: 1 }} />}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div style={{ padding: 18, borderRadius: 14, background: 'white', border: '1px solid #F1F5F9' }}>
                            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 12 }}>Informações</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                {[
                                    { label: 'Empresa', value: client.company || '—' },
                                    { label: 'Email', value: client.email || '—' },
                                    { label: 'Telefone', value: client.phone || '—' },
                                    { label: 'Contrato', value: (
                                        <input 
                                            type="date" 
                                            value={client.contractDate}
                                            onClick={(e) => (e.target as any).showPicker?.()}
                                            onChange={(e) => updateClient({ ...client, contractDate: e.target.value })}
                                            style={{ border: '1px solid #E2E8F0', background: '#FAFBFC', padding: '2px 6px', borderRadius: 4, fontSize: 13, fontWeight: 500, color: '#0F172A', outline: 'none', cursor: 'pointer' }}
                                        />
                                    )},
                                ].map(item => (
                                    <div key={item.label}>
                                        <span style={{ fontSize: 11, color: '#94A3B8', display: 'block', marginBottom: 2 }}>{item.label}</span>
                                        <span style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>{item.value}</span>
                                    </div>
                                ))}
                            </div>
                            {client.notes && (
                                <div style={{ marginTop: 12 }}>
                                    <span style={{ fontSize: 11, color: '#94A3B8', display: 'block', marginBottom: 2 }}>Notas</span>
                                    <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>{client.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {client.stageDueDate && (
                            <div style={{
                                padding: 16, borderRadius: 14, background: isOverdue ? '#FEF2F2' : 'white',
                                border: `1px solid ${isOverdue ? '#FCA5A5' : '#F1F5F9'}`, textAlign: 'center',
                            }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: isOverdue ? '#DC2626' : '#64748B' }}>
                                    {isOverdue ? '⚠️ Prazo expirado' : '📅 Prazo da etapa'}
                                </span>
                                <input 
                                    type="date" 
                                    value={client.stageDueDate || ''}
                                    onClick={(e) => (e.target as any).showPicker?.()}
                                    onChange={(e) => updateClient({ ...client, stageDueDate: e.target.value })}
                                    style={{ 
                                        fontSize: 18, fontWeight: 700, border: '1px solid #E2E8F0', background: '#FAFBFC',
                                        padding: '4px', borderRadius: 8,
                                        color: isOverdue ? '#DC2626' : '#0F172A', marginTop: 4, width: '100%', textAlign: 'center', outline: 'none', cursor: 'pointer'
                                    }}
                                />
                            </div>
                        )}
                        
                        <div style={{
                            padding: 16, borderRadius: 14, background: 'white', border: '1px solid #E2E8F0',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                        }} onClick={() => setActiveTab('Documentos')}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F0EDFF', color: '#7C5CFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📄</div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Documentos</span>
                                    <span style={{ fontSize: 11, color: '#94A3B8' }}>Anotações da conta</span>
                                </div>
                            </div>
                            <span style={{ color: '#94A3B8', fontSize: 16 }}>→</span>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'Tasks' && (
                <div style={{ marginTop: -20, marginLeft: -24, marginRight: -24 }}>
                    <TasksBoard clientId={client.id} />
                </div>
            )}

            {activeTab === 'Planejamento' && (
                <div style={{ display: 'flex', gap: 20 }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>Planejamento de Etapas</h3>
                            <button onClick={() => setSettingsOpen(!settingsOpen)} style={{
                                display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 8,
                                border: '1px solid #E2E8F0', background: 'white', color: '#64748B', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                            }}><Settings size={13} /> Configurar Prazos</button>
                        </div>

                        <div style={{ borderRadius: 14, background: 'white', border: '1px solid #F1F5F9', overflow: 'hidden' }}>
                            {planningStages.map((ps) => {
                                const stTasks = allClientTasks.filter(t => t.stage === ps.stage);
                                const stDone = stTasks.filter(t => t.status === 'Concluído').length;
                                const stProg = stTasks.length > 0 ? Math.round((stDone / stTasks.length) * 100) : 0;
                                const delayDays = ps.isCompleted && ps.actualDays != null ? ps.actualDays - ps.days : 0;

                                return (
                                    <div key={ps.stage} style={{
                                        display: 'grid', gridTemplateColumns: '40px 1fr 90px 90px 80px 120px',
                                        padding: '12px 16px', borderBottom: '1px solid #F8FAFC', alignItems: 'center', gap: 8,
                                        background: ps.isCompleted ? '#F0FDF4' : ps.isCurrent && isOverdue ? '#FEF2F2' : 'white',
                                    }}>
                                        <div style={{ fontSize: 18, textAlign: 'center' }}>
                                            {ps.isCompleted ? '✅' : ps.isCurrent ? '🔄' : '○'}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                            <span style={{ fontSize: 13, fontWeight: 600, color: ps.isCompleted ? '#059669' : ps.isCurrent ? '#0F172A' : '#94A3B8' }}>
                                                {ps.emoji} {ps.label}
                                            </span>
                                            {(ps.isCompleted || ps.isCurrent) && stTasks.length > 0 && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <div style={{ width: 60, height: 4, background: '#F1F5F9', borderRadius: 2, overflow: 'hidden' }}>
                                                        <div style={{ width: `${stProg}%`, height: '100%', background: ps.color, borderRadius: 2 }} />
                                                    </div>
                                                    <span style={{ fontSize: 10, color: '#94A3B8' }}>{stDone}/{stTasks.length}</span>
                                                </div>
                                            )}
                                        </div>
                                        {/* Planned Start Date */}
                                        <div style={{ position: 'relative', width: 90 }}>
                                            <span style={{ fontSize: 11, color: ps.isFuture ? '#CBD5E1' : '#64748B' }}>
                                                {formatDateBR(ps.plannedStart)}
                                            </span>
                                            {/* Only allow editing start date for the very first stage (it updates contractDate) */}
                                            {ps.stage === STAGE_ORDER[0] && (
                                                <input 
                                                    type="date"
                                                    value={ps.plannedStart}
                                                    onChange={(e) => updateClient({ ...client, contractDate: e.target.value })}
                                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                                                    onClick={(e) => (e.target as any).showPicker?.()}
                                                />
                                            )}
                                        </div>

                                        {/* Planned End Date (Deadline) / Actual Completion Date */}
                                        <div style={{ position: 'relative', width: 90 }}>
                                            <span style={{ 
                                                fontSize: 11, 
                                                color: ps.actualEnd ? '#059669' : ps.isFuture ? '#94A3B8' : '#3B82F6',
                                                fontWeight: ps.actualEnd ? 600 : 500,
                                                textDecoration: 'underline dotted #CBD5E1'
                                            }}>
                                                {formatDateBR(ps.actualEnd || ps.plannedEnd)}
                                            </span>
                                            
                                            {/* Edit Actual End for completed stages */}
                                            {ps.isCompleted && ps.actualEnd && (
                                                <input 
                                                    type="date"
                                                    value={ps.actualEnd}
                                                    onChange={(e) => {
                                                        const newEnd = e.target.value;
                                                        const hist = history.find(h => h.stage === ps.stage);
                                                        if (hist) {
                                                            const newActualDays = businessDaysBetween(hist.startedAt, newEnd);
                                                            updateStageHistory({ ...hist, completedAt: newEnd, actualDays: newActualDays });
                                                            toast(`Data de conclusão de ${ps.label} atualizada.`);
                                                        }
                                                    }}
                                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                                                    onClick={(e) => (e.target as any).showPicker?.()}
                                                />
                                            )}

                                            {/* Edit Planned End for incomplete stages */}
                                            {!ps.isCompleted && (
                                                <input 
                                                    type="date"
                                                    value={ps.plannedEnd}
                                                    min={ps.plannedStart}
                                                    onChange={(e) => {
                                                        const newEnd = e.target.value;
                                                        const newDays = businessDaysBetween(ps.plannedStart, newEnd);
                                                        const updated = stageSettings.map(s => s.stage === ps.stage ? { ...s, businessDays: newDays } : s);
                                                        updateStageSettings(updated);
                                                        toast(`Prazo de ${ps.label} atualizado para ${newDays} dias.`);
                                                    }}
                                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                                                    onClick={(e) => (e.target as any).showPicker?.()}
                                                />
                                            )}
                                        </div>

                                        {/* Days */}
                                        <div style={{ width: 80 }}>
                                            <input 
                                                type="number" 
                                                min={0} 
                                                value={ps.days}
                                                onChange={(e) => {
                                                    const newDays = Number(e.target.value);
                                                    const existingS = stageSettings.find(s => s.stage === ps.stage);
                                                    let updated;
                                                    if (existingS) {
                                                        updated = stageSettings.map(s => s.stage === ps.stage ? { ...s, businessDays: newDays, updatedAt: new Date().toISOString() } : s);
                                                    } else {
                                                        updated = [...stageSettings, { id: generateId(), stage: ps.stage, businessDays: newDays, workspaceId: activeWorkspaceId, updatedAt: new Date().toISOString() }];
                                                    }
                                                    updateStageSettings(updated);
                                                    toast(`Prazo de ${ps.label} atualizado para ${newDays} dias.`);
                                                }}
                                                style={{ 
                                                    width: '100%', border: 'none', background: 'transparent', fontSize: 11, 
                                                    color: '#94A3B8', fontFamily: 'inherit', outline: 'none',
                                                    padding: '2px 0'
                                                }}
                                            />
                                        </div>
                                        {/* Delay badge */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-end' }}>
                                            {ps.isCompleted && ps.actualDays != null && (
                                                <span style={{
                                                    fontSize: 10, fontWeight: 600,
                                                    color: delayDays > 0 ? '#DC2626' : delayDays < 0 ? '#059669' : '#94A3B8',
                                                }}>
                                                    {delayDays > 0 ? `${delayDays} dias de atraso` : delayDays < 0 ? `${Math.abs(delayDays)} dias adiantado` : 'No prazo'}
                                                </span>
                                            )}
                                            {ps.isCurrent && (
                                                <span style={{ fontSize: 10, fontWeight: 600, color: isOverdue ? '#DC2626' : '#3B82F6' }}>
                                                    {isOverdue ? `${Math.abs(Math.ceil((new Date(client.stageDueDate!).getTime() - new Date().getTime()) / 86400000))} dias atrasado` : 'Em andamento'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Settings panel */}
                    {settingsOpen && (
                        <div style={{ width: 260, padding: 16, borderRadius: 14, background: 'white', border: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: 10, height: 'fit-content' }}>
                            <h4 style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Prazos padrão (dias úteis)</h4>
                            {STAGE_ORDER.map(stage => {
                                const setting = stageSettings.find(s => s.stage === stage);
                                const days = setting ? setting.businessDays : (DEFAULT_STAGE_DAYS[stage] || 0);
                                return (
                                    <div key={stage} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                        <span style={{ fontSize: 11, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{STAGE_CONFIG[stage].label}</span>
                                        <input type="number" min={0} max={30} value={days}
                                            onChange={(e) => {
                                                const newDays = Number(e.target.value);
                                                const existingS = stageSettings.find(s => s.stage === stage);
                                                let updated;
                                                if (existingS) {
                                                    updated = stageSettings.map(s => s.stage === stage ? { ...s, businessDays: newDays, updatedAt: new Date().toISOString() } : s);
                                                } else {
                                                    updated = [...stageSettings, { id: generateId(), stage, businessDays: newDays, workspaceId: activeWorkspaceId, updatedAt: new Date().toISOString() }];
                                                }
                                                updateStageSettings(updated);
                                            }}
                                            style={{ width: 50, padding: '4px 8px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 12, textAlign: 'center', fontFamily: 'inherit', outline: 'none' }}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ── Tab: Documentos ── */}
            {activeTab === 'Documentos' && (
                <div style={{ flex: 1, minHeight: 600 }}>
                    <DocumentsTab clientId={client.id} />
                </div>
            )}

            {/* ── Tab: Histórico ── */}
            {activeTab === 'Histórico' && (
                <div style={{ borderRadius: 14, background: 'white', border: '1px solid #F1F5F9', overflow: 'hidden' }}>
                    {history.length === 0 && allClientTasks.filter(t => t.status === 'Concluído').length === 0 ? (
                        <div style={{ padding: 24, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
                            Nenhum histórico registrado ainda
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {/* Stage advances */}
                            {history.map(h => (
                                <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: '1px solid #F8FAFC' }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>✅</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                                            Etapa "{STAGE_CONFIG[h.stage as ClientStage]?.label}" concluída
                                        </span>
                                        <span style={{ fontSize: 11, color: '#94A3B8' }}>
                                            {h.actualDays != null ? `${h.actualDays} dias (planejado: ${h.plannedDays})` : ''} — {h.completedAt?.split('T')[0]}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {/* Completed tasks */}
                            {allClientTasks.filter(t => t.status === 'Concluído').sort((a, b) => (b.deadline || '').localeCompare(a.deadline || '')).map(t => (
                                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: '1px solid #F8FAFC' }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>☑️</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                                        <span style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>Task concluída: {t.title}</span>
                                        <span style={{ fontSize: 11, color: '#94A3B8' }}>
                                            {STAGE_CONFIG[t.stage as ClientStage]?.label}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Stage Advance Modal ── */}
            <Modal isOpen={advanceModal} onClose={() => setAdvanceModal(false)} title="Avançar Etapa" width={440}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 48 }}>✅</div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>
                        Etapa "{cfg.label}" concluída!
                    </h3>
                    <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.5 }}>
                        Duração real: <strong>{daysInStage} dias</strong>
                        {client.stageDueDate && (
                            <> (planejado: {stageSettings.find(s => s.stage === client.stage)?.businessDays || 0} dias)</>
                        )}
                    </p>
                    {nextStage && (
                        <p style={{ fontSize: 14, color: '#475569' }}>
                            Avançar cliente para <strong>{STAGE_CONFIG[nextStage].label}</strong>?
                        </p>
                    )}
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 8 }}>
                        <button onClick={() => setAdvanceModal(false)} style={{ padding: '9px 20px', borderRadius: 10, border: '1px solid #E2E8F0', background: 'white', color: '#475569', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Cancelar</button>
                        <button onClick={handleAdvanceStage} style={{ padding: '9px 20px', borderRadius: 10, border: 'none', background: '#22C55E', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                            Avançar para {nextStage ? STAGE_CONFIG[nextStage].label : ''}
                        </button>
                    </div>
                </div>
            </Modal>


        </div>
    );
}
