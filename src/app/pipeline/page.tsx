'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp, generateId, addBusinessDays, daysAgo, formatDateBR } from '@/store/AppContext';
import { useToast } from '@/components/ui/Toast';
import NewClientModal from '@/components/NewClientModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Badge from '@/components/ui/Badge';
import { 
    Plus, LayoutList, Columns3, ChevronLeft, ChevronRight, Eye, 
    ArrowRight, Edit2, Trash2, Check, Copy, ChevronDown, Settings 
} from 'lucide-react';
import type { Client, ClientStage } from '@/types';
import CustomizeStagesModal from '@/components/CustomizeStagesModal';

function getDeadlineStatus(client: Client): 'green' | 'yellow' | 'red' | 'none' {
    if (!client.stageDueDate) return 'none';
    const daysLeft = Math.ceil((new Date(client.stageDueDate).getTime() - Date.now()) / 86400000);
    if (daysLeft < 0) return 'red';
    if (daysLeft <= 3) return 'yellow';
    return 'green';
}

const deadlineColors = {
    green: '#22C55E',
    yellow: '#EAB308',
    red: '#EF4444',
    none: '#94A3B8',
};

export default function PipelinePage() {
    const { 
        activeWorkspace, workspaces, activeWorkspaceId, clients, tasks, clientStageHistory, stageSettings, pipelineStages, 
        dispatch, updateWorkspace, addWorkspace, addStageHistory, updateClient, deleteClient, duplicateWorkspace 
    } = useApp();
    const { toast } = useToast();
    const [viewMode, setViewMode] = useState<'kanban' | 'lista'>('kanban');
    const [modalOpen, setModalOpen] = useState(false);
    const [editClient, setEditClient] = useState<Client | null>(null);
    const [customizeOpen, setCustomizeOpen] = useState(false);
    const [moveConfirm, setMoveConfirm] = useState<{ client: Client; toStage: ClientStage } | null>(null);
    const [sortField, setSortField] = useState<string>('name');
    const [sortDir, setSortDir] = useState<1 | -1>(1);

    const handleDelete = async (clientId: string, name: string) => {
        if (window.confirm(`Tem certeza que deseja excluir o cliente "${name}"? Todas as tarefas vinculadas serão removidas.`)) {
            await deleteClient(clientId);
            toast(`Cliente "${name}" excluído.`);
        }
    };
    
    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStage, setFilterStage] = useState('');
    const [showOverdueOnly, setShowOverdueOnly] = useState(false);
    const [filterDate, setFilterDate] = useState('');

    // Dynamic stage configuration
    const orderedStages = useMemo(() => 
        [...pipelineStages].filter(s => !s.isSystem).sort((a, b) => a.orderIndex - b.orderIndex),
    [pipelineStages]);
    
    const stageOrderIds = useMemo(() => orderedStages.map(s => s.id), [orderedStages]);
    
    const stageConfigMap = useMemo(() => 
        pipelineStages.reduce((acc, s) => ({ ...acc, [s.id]: s }), {} as Record<string, any>),
    [pipelineStages]);

    // Workspace rename state
    const [isRenamingWs, setIsRenamingWs] = useState(false);
    const [wsNameDraft, setWsNameDraft] = useState('');
    const [showWsMenu, setShowWsMenu] = useState(false);

    const saveWsName = () => {
        if (wsNameDraft.trim() && activeWorkspace) {
            updateWorkspace({ ...activeWorkspace, name: wsNameDraft.trim() });
        }
        setIsRenamingWs(false);
    };

    const handleNewWorkspace = () => {
        const newWs = { id: crypto.randomUUID(), name: 'Novo Workspace', createdAt: new Date().toISOString() };
        addWorkspace(newWs);
        setShowWsMenu(false);
    };

    const handleDuplicate = () => {
        if (activeWorkspaceId) duplicateWorkspace(activeWorkspaceId);
        setShowWsMenu(false);
    };

    const activeClients = useMemo(() => {
        return clients.filter(c => {
            if (c.stage === 'churned') return false;
            if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            if (filterStage && c.stage !== filterStage) return false;
            if (showOverdueOnly) {
                const now = new Date();
                const isOverdue = c.stageDueDate && new Date(c.stageDueDate) < now;
                if (!isOverdue) return false;
            }
            if (filterDate && c.stageDueDate !== filterDate) return false;
            return true;
        });
    }, [clients, searchQuery, filterStage, showOverdueOnly, filterDate]);

    const stats = useMemo(() => {
        const now = new Date();
        const overdue = activeClients.filter(c => c.stageDueDate && new Date(c.stageDueDate) < now).length;
        const thisMonth = clientStageHistory.filter(h => {
            if (!h.completedAt) return false;
            const d = new Date(h.completedAt);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length;
        const avgDays = clientStageHistory.filter(h => h.actualDays != null).length > 0
            ? Math.round(clientStageHistory.filter(h => h.actualDays != null).reduce((s, h) => s + (h.actualDays || 0), 0) / clientStageHistory.filter(h => h.actualDays != null).length)
            : 0;
        return [
            { label: 'Clientes ativos', value: activeClients.length, color: '#7C5CFC' },
            { label: 'Em atraso', value: overdue, color: '#DC2626' },
            { label: 'Concluídos mês', value: thisMonth, color: '#22C55E' },
            { label: 'Tempo médio/etapa', value: `${avgDays}d`, color: '#3B82F6' },
        ];
    }, [activeClients, clientStageHistory]);

    const getClientProgress = (clientId: string, stage: ClientStage) => {
        const tsks = tasks.filter(t => t.clientId === clientId && t.stage === stage);
        const done = tsks.filter(t => t.status === 'Concluído').length;
        return { total: tsks.length, done, percent: tsks.length > 0 ? Math.round((done / tsks.length) * 100) : 0 };
    };

    const handleMoveConfirm = () => {
        if (!moveConfirm) return;
        const { client, toStage } = moveConfirm;
        const stageSetting = stageSettings.find(s => s.stage === client.stage);
        const plannedDays = stageSetting?.businessDays || 0;
        const actualDays = daysAgo(client.stageStartedAt);

        addStageHistory({
            id: generateId(), clientId: client.id, stage: client.stage,
            startedAt: client.stageStartedAt, completedAt: new Date().toISOString(),
            plannedDays, actualDays, notes: '',
        });

        const nextStageSetting = stageSettings.find(s => s.stage === toStage);
        const dueDate = nextStageSetting && nextStageSetting.businessDays > 0
            ? addBusinessDays(new Date().toISOString().split('T')[0], nextStageSetting.businessDays)
            : null;

        updateClient({ ...client, stage: toStage, stageStartedAt: new Date().toISOString(), stageDueDate: dueDate });

        toast(`Cliente movido para ${stageConfigMap[toStage]?.label || toStage}!`);
        setMoveConfirm(null);
    };

    const handleSort = (field: string) => {
        if (sortField === field) setSortDir(d => d === 1 ? -1 : 1);
        else { setSortField(field); setSortDir(1); }
    };

    const sortedClients = useMemo(() => {
        return [...activeClients].sort((a, b) => {
            let cmp = 0;
            switch (sortField) {
                case 'name': cmp = a.name.localeCompare(b.name); break;
                case 'stage': cmp = stageOrderIds.indexOf(a.stage) - stageOrderIds.indexOf(b.stage); break;
                case 'due': cmp = (a.stageDueDate || '9999').localeCompare(b.stageDueDate || '9999'); break;
                default: cmp = 0;
            }
            return cmp * sortDir;
        });
    }, [activeClients, sortField, sortDir, stageOrderIds]);

    return (
        <div style={{ padding: '24px 28px', paddingLeft: 40, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
                    {isRenamingWs ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <input
                                autoFocus
                                value={wsNameDraft}
                                onChange={e => setWsNameDraft(e.target.value)}
                                onBlur={saveWsName}
                                onKeyDown={e => { if (e.key === 'Enter') saveWsName(); if (e.key === 'Escape') setIsRenamingWs(false); }}
                                style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', border: 'none', borderBottom: '2px solid #7C5CFC', outline: 'none', background: 'transparent', width: 220 }}
                            />
                            <button onClick={saveWsName} style={{ background: '#7C5CFC', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                                <Check size={13} /> Salvar
                            </button>
                        </div>
                    ) : (
                        <>
                            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                                {activeWorkspace?.name || 'Pipeline'}
                            </h1>
                            <button
                                onClick={() => setShowWsMenu(v => !v)}
                                style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: 7, padding: '4px 8px', cursor: 'pointer', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                            >
                                <ChevronDown size={13} />
                            </button>
                        </>
                    )}

                    {showWsMenu && (
                        <div style={{ position: 'absolute', top: '110%', left: 0, zIndex: 200, background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 200, padding: 8 }}>
                            {workspaces.map(ws => (
                                <button key={ws.id} onClick={() => { dispatch({ type: 'SET_ACTIVE_WORKSPACE', payload: ws.id }); setShowWsMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: ws.id === activeWorkspaceId ? '#F0EDFF' : 'transparent', color: ws.id === activeWorkspaceId ? '#7C5CFC' : '#0F172A', fontSize: 13, fontWeight: 500, textAlign: 'left' }}>
                                    {ws.id === activeWorkspaceId ? '👥' : '📁'} {ws.name}
                                </button>
                            ))}
                            <div style={{ height: 1, background: '#F1F5F9', margin: '4px 0' }} />
                            <button onClick={() => { setWsNameDraft(activeWorkspace?.name || ''); setIsRenamingWs(true); setShowWsMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#0F172A', fontSize: 13, fontWeight: 500 }}>
                                <Edit2 size={14} /> Renomear
                            </button>
                            <button onClick={handleDuplicate} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#0F172A', fontSize: 13, fontWeight: 500 }}>
                                <Copy size={14} /> Duplicar workspace
                            </button>
                            <button onClick={handleNewWorkspace} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#0F172A', fontSize: 13, fontWeight: 500 }}>
                                <Plus size={14} /> Novo workspace
                            </button>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ display: 'flex', borderRadius: 8, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                        <button onClick={() => setViewMode('kanban')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', border: 'none', background: viewMode === 'kanban' ? '#F0EDFF' : 'white', color: viewMode === 'kanban' ? '#7C5CFC' : '#64748B', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                            <Columns3 size={14} /> Kanban
                        </button>
                        <button onClick={() => setViewMode('lista')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', border: 'none', borderLeft: '1px solid #E2E8F0', background: viewMode === 'lista' ? '#F0EDFF' : 'white', color: viewMode === 'lista' ? '#7C5CFC' : '#64748B', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                            <LayoutList size={14} /> Lista
                        </button>
                    </div>
                    
                    <button onClick={() => setCustomizeOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 10, border: 'none', background: '#F1F5F9', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        <Settings size={15} /> Personalizar Etapas
                    </button>

                    <button onClick={() => setModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 10, border: 'none', background: '#7C5CFC', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        <Plus size={15} /> Novo Cliente
                    </button>
                </div>
            </div>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {stats.map(s => (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 14, background: 'white', border: '1px solid #F1F5F9', height: 68 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${s.color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</span>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#64748B' }}>{s.label}</span>
                    </div>
                ))}
            </div>

            {/* Filters Bar */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', background: 'white', padding: '12px 18px', borderRadius: 14, border: '1px solid #F1F5F9' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
                    borderRadius: 10, border: '1px solid #E2E8F0', background: '#F8FAFC', flex: 1, minWidth: 200,
                }}>
                    <span style={{ color: '#94A3B8', fontSize: 16 }}>🔍</span>
                    <input
                        type="text" placeholder="Buscar cliente..."
                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: '#0F172A', width: '100%', fontFamily: 'inherit' }}
                    />
                </div>
                
                <select value={filterStage} onChange={(e) => setFilterStage(e.target.value)} style={{
                    padding: '8px 12px', borderRadius: 10, border: '1px solid #E2E8F0', background: 'white',
                    fontSize: 13, color: '#475569', cursor: 'pointer', fontFamily: 'inherit',
                }}>
                    <option value="">Estágio (Todos)</option>
                    {orderedStages.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>

                <button 
                  onClick={() => setShowOverdueOnly(!showOverdueOnly)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10,
                    border: '1px solid', borderColor: showOverdueOnly ? '#EF4444' : '#E2E8F0',
                    background: showOverdueOnly ? '#FEE2E2' : 'white',
                    color: showOverdueOnly ? '#EF4444' : '#475569',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                    🚩 Atrasados
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>Prazo:</span>
                    <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} style={{
                        padding: '7px 12px', borderRadius: 10, border: '1px solid #E2E8F0', background: 'white',
                        fontSize: 13, color: '#475569', fontFamily: 'inherit'
                    }} title="Filtrar por Prazo" />
                    {filterDate && <button onClick={() => setFilterDate('')} style={{ border: 'none', background: 'transparent', fontSize: 12, cursor: 'pointer', color: '#EF4444' }}>Limpar</button>}
                </div>
            </div>

            {/* Kanban View */}
            {viewMode === 'kanban' && (
                <div style={{ display: 'flex', gap: 12, flex: 1, overflowX: 'auto', paddingBottom: 10 }}>
                    {stageOrderIds.map((stageId, colIdx) => {
                        const cfg = stageConfigMap[stageId] || { label: stageId, color: '#94A3B8', emoji: '📁', bgLight: '#F1F5F9' };
                        const stageClients = activeClients.filter(c => c.stage === stageId);
                        return (
                            <div key={stageId} style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {/* Column header */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 10, background: `${cfg.color}10` }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ fontSize: 14 }}>{cfg.emoji}</span>
                                        <span style={{ fontSize: 11.5, fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{cfg.label}</span>
                                        <span style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', background: '#F1F5F9', padding: '1px 6px', borderRadius: 4 }}>{stageClients.length}</span>
                                    </div>
                                </div>

                                {/* Cards */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minHeight: 80, overflowY: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
                                    {stageClients.map(client => {
                                        const progress = getClientProgress(client.id, stageId);
                                        const deadlineStatus = getDeadlineStatus(client);
                                        const days = daysAgo(client.stageStartedAt);
                                        const daysLeft = client.stageDueDate ? Math.ceil((new Date(client.stageDueDate).getTime() - Date.now()) / 86400000) : null;

                                        return (
                                            <div key={client.id} style={{ padding: '12px 14px', borderRadius: 10, background: 'white', border: `1px solid ${deadlineStatus === 'red' ? '#FCA5A5' : '#F1F5F9'}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                <Link href={`/clientes/${client.id}`} style={{ textDecoration: 'none' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <div style={{ width: 8, height: 8, borderRadius: 3, background: client.color }} />
                                                        <span style={{ fontSize: 13 }}>{client.emoji}</span>
                                                        <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{client.name}</span>
                                                    </div>
                                                </Link>
                                                <span style={{ fontSize: 11, color: '#94A3B8' }}>há {days} dias</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <div style={{ flex: 1, height: 5, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                                                        <div style={{ width: `${progress.percent}%`, height: '100%', background: cfg.color, borderRadius: 3 }} />
                                                    </div>
                                                    <span style={{ fontSize: 10, fontWeight: 600, color: '#64748B' }}>{progress.done}/{progress.total}</span>
                                                </div>
                                                {client.stageDueDate && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                                                        <span style={{ width: 8, height: 8, borderRadius: 4, background: deadlineColors[deadlineStatus] }} />
                                                        <span style={{ color: deadlineColors[deadlineStatus], fontWeight: 500 }}>
                                                            {daysLeft != null && (daysLeft < 0 ? `${Math.abs(daysLeft)} dias atrasado` : daysLeft === 0 ? 'Vence hoje' : `${daysLeft} dias restantes`)}
                                                        </span>
                                                    </div>
                                                )}
                                                <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                                                    {colIdx > 0 && (
                                                        <button onClick={() => setMoveConfirm({ client, toStage: stageOrderIds[colIdx - 1] })} style={{ width: 22, height: 22, borderRadius: 5, border: '1px solid #E2E8F0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}><ChevronLeft size={12} /></button>
                                                    )}
                                                    <button onClick={() => setEditClient(client)} style={{ width: 22, height: 22, borderRadius: 5, border: '1px solid #E2E8F0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}><Edit2 size={11} /></button>
                                                    <button onClick={() => handleDelete(client.id, client.name)} style={{ width: 22, height: 22, borderRadius: 5, border: '1px solid #E2E8F0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}><Trash2 size={11} /></button>
                                                    {colIdx < stageOrderIds.length - 1 && (
                                                        <button onClick={() => setMoveConfirm({ client, toStage: stageOrderIds[colIdx + 1] })} style={{ width: 22, height: 22, borderRadius: 5, border: '1px solid #E2E8F0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}><ChevronRight size={12} /></button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Lista View */}
            {viewMode === 'lista' && (
                <div style={{ borderRadius: 14, background: 'white', border: '1px solid #F1F5F9', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 100px 100px 90px 80px 100px 110px', padding: '10px 18px', background: '#FAFBFC', borderBottom: '1px solid #F1F5F9', alignItems: 'center' }}>
                         {[
                            { label: 'Cliente', field: 'name' },
                            { label: 'Etapa', field: 'stage' },
                            { label: 'Início', field: '' },
                            { label: 'Prazo', field: 'due' },
                            { label: 'Dias rest.', field: '' },
                            { label: 'Tasks', field: '' },
                            { label: 'Progresso', field: '' },
                            { label: 'Ações', field: '' },
                        ].map(h => (
                            <span key={h.label} onClick={() => h.field && handleSort(h.field)} style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', cursor: h.field ? 'pointer' : 'default' }}>
                                {h.label} {sortField === h.field ? (sortDir === 1 ? '↑' : '↓') : ''}
                            </span>
                        ))}
                    </div>
                    {sortedClients.map(client => {
                        const cfg = stageConfigMap[client.stage] || { label: client.stage, color: '#94A3B8', emoji: '📁', bgLight: '#F1F5F9' };
                        const progress = getClientProgress(client.id, client.stage);
                        const deadlineStatus = getDeadlineStatus(client);
                        const daysLeft = client.stageDueDate ? Math.ceil((new Date(client.stageDueDate).getTime() - Date.now()) / 86400000) : null;

                        return (
                            <div key={client.id} style={{ display: 'grid', gridTemplateColumns: '1fr 130px 100px 100px 90px 80px 100px 110px', padding: '12px 18px', borderBottom: '1px solid #F8FAFC', alignItems: 'center' }}>
                                <Link href={`/clientes/${client.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                                    <span style={{ fontSize: 14 }}>{client.emoji}</span>
                                    <span style={{ fontSize: 13.5, fontWeight: 600, color: '#0F172A' }}>{client.name}</span>
                                </Link>
                                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 600, background: cfg.bgLight, color: cfg.color, whiteSpace: 'nowrap', width: 'fit-content' }}>
                                    {cfg.emoji} {cfg.label}
                                </span>
                                <input type="date" value={client.stageStartedAt.split('T')[0]} onClick={(e) => (e.target as any).showPicker?.()} onChange={(e) => { updateClient({ ...client, stageStartedAt: `${e.target.value}T00:00:00Z` }); toast(`Início de "${client.name}" atualizado!`); }} style={{ border: '1px solid #E2E8F0', background: '#FAFBFC', padding: '4px 8px', borderRadius: 6, fontSize: 12, color: '#64748B', outline: 'none', cursor: 'pointer', width: 105 }} />
                                <input type="date" value={client.stageDueDate || ''} onClick={(e) => (e.target as any).showPicker?.()} onChange={(e) => { updateClient({ ...client, stageDueDate: e.target.value }); toast(`Prazo de "${client.name}" atualizado!`); }} style={{ fontSize: 12, color: deadlineColors[deadlineStatus], border: '1px solid #E2E8F0', background: '#FAFBFC', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', outline: 'none', width: 105 }} />
                                <span style={{ fontSize: 12, color: deadlineColors[deadlineStatus], fontWeight: 500 }}>{daysLeft != null ? (daysLeft < 0 ? `${Math.abs(daysLeft)} atraso` : `${daysLeft} dias`) : '∞'}</span>
                                <span style={{ fontSize: 12, color: '#64748B' }}>{progress.done}/{progress.total}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ flex: 1, height: 5, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                                        <div style={{ width: `${progress.percent}%`, height: '100%', background: cfg.color, borderRadius: 3 }} />
                                    </div>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>{progress.percent}%</span>
                                </div>
                                <div style={{ display: 'flex', gap: 4 }}>
                                    <Link href={`/clientes/${client.id}`} title="Ver ficha" style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid #E2E8F0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', textDecoration: 'none' }}><Eye size={12} /></Link>
                                    <button onClick={() => setEditClient(client)} title="Editar" style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid #E2E8F0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}><Edit2 size={12} /></button>
                                    <button onClick={() => handleDelete(client.id, client.name)} title="Excluir" style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid #E2E8F0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}><Trash2 size={12} /></button>
                                    {stageOrderIds.indexOf(client.stage) < stageOrderIds.length - 1 && (
                                        <button onClick={() => setMoveConfirm({ client, toStage: stageOrderIds[stageOrderIds.indexOf(client.stage) + 1] })} title="Avançar" style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid #E2E8F0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22C55E' }}><ArrowRight size={12} /></button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {modalOpen && <NewClientModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />}
            {editClient && <NewClientModal isOpen={!!editClient} onClose={() => setEditClient(null)} clientToEdit={editClient} />}
            {customizeOpen && <CustomizeStagesModal onClose={() => setCustomizeOpen(false)} />}

            <ConfirmDialog isOpen={!!moveConfirm} onClose={() => setMoveConfirm(null)} onConfirm={handleMoveConfirm} title="Mover Cliente" message={moveConfirm ? `Mover "${moveConfirm.client.name}" para ${stageConfigMap[moveConfirm.toStage]?.label || moveConfirm.toStage}?` : ''} confirmLabel="Mover" danger={false} />
        </div>
    );
}
