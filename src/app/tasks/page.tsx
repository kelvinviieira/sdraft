'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/store/AppContext';
import { useToast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import InlineTimer from '@/components/InlineTimer';
import { Plus, Search, Pencil, Trash2, List as ListIcon, LayoutDashboard, CheckCircle2, ChevronRight, CheckSquare } from 'lucide-react';
import type { Task, TaskStatus, Priority, TaskChecklist } from '@/types';
import { generateId } from '@/store/AppContext';
import { 
    DndContext, DragEndEvent, DragOverlay, DragStartEvent, 
    useDroppable, useDraggable, 
    PointerSensor, useSensor, useSensors 
} from '@dnd-kit/core';
import TaskTimer from '@/components/TaskTimer';
import ChecklistManager from '@/components/tasks/ChecklistManager';

const STATUS_ORDER: TaskStatus[] = ['A Fazer', 'Em Progresso', 'Revisão', 'Concluído'];
const STATUS_COLORS: Record<TaskStatus, string> = {
    'A Fazer': '#64748B',
    'Em Progresso': '#3B82F6',
    'Revisão': '#D97706',
    'Concluído': '#22C55E',
};

const formatDateBr = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    // If it's ISO like '2026-03-04T10:00:00Z', keep only date
    const d = dateStr.split('T')[0];
    const parts = d.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return d;
};

const COLUMNS: { status: TaskStatus; color: string }[] = [
    { status: 'A Fazer', color: '#64748B' },
    { status: 'Em Progresso', color: '#3B82F6' },
    { status: 'Revisão', color: '#D97706' },
    { status: 'Concluído', color: '#22C55E' },
];

function DroppableColumn({ id, title, color, count, children }: any) {
    const { setNodeRef } = useDroppable({ id });
    return (
        <div ref={setNodeRef} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px' }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: color }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{title}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', background: '#F1F5F9', padding: '1px 8px', borderRadius: 6 }}>
                    {count}
                </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 150, padding: 4, borderRadius: 8, background: 'rgba(241, 245, 249, 0.4)' }}>
                {children}
            </div>
        </div>
    );
}

function DraggableCard({ task, clients, members, openEdit, setDeleteId, onAdvance, onComplete, isOverlay = false }: any) {
    const isOverdue = task.deadline && !['Concluído'].includes(task.status) && new Date(task.deadline) < new Date(new Date().setHours(0,0,0,0));
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
        data: task
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.4 : 1,
    } : { opacity: isDragging ? 0.4 : 1 };

    if (isOverlay) {
        style.transform = 'none';
        style.opacity = 1;
    }

    const client = clients.find((c: any) => c.id === task.clientId);
    const assignee = members.find((m: any) => m.id === task.assigneeId);
    const isDone = task.status === 'Concluído';

    return (
        <div ref={setNodeRef} 
            onClick={() => openEdit(task)}
            {...listeners} {...attributes}
            style={{
            ...style, padding: '8px 10px', borderRadius: 8,
            background: isDone ? '#F0FDF4' : 'white',
            border: `1px solid ${isOverdue ? '#FCA5A5' : isDone ? '#BBF7D0' : '#E2E8F0'}`,
            boxShadow: isOverlay ? '0 10px 15px rgba(0,0,0,0.1)' : '0 1px 2px rgba(0,0,0,0.02)',
            display: 'flex', flexDirection: 'column', gap: 4, cursor: isDragging ? 'grabbing' : 'grab',
            zIndex: isOverlay ? 999 : 1, position: 'relative', opacity: isDone ? 0.75 : 1,
            transition: 'all 0.2s',
        }}>
            {isOverdue && (
                <div style={{ position: 'absolute', top: -6, right: 6, background: '#EF4444', color: 'white', padding: '0px 6px', borderRadius: 4, fontSize: 8, fontWeight: 800, zIndex: 10 }}>
                    ATRASADA
                </div>
            )}

            {/* Header: Client + Title */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                 {client && (
                    <span style={{ fontSize: 10, fontWeight: 800, color: client.color || '#64748B', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                        {client.name}
                    </span>
                )}
                <span style={{ fontSize: 13, fontWeight: 700, color: isDone ? '#64748B' : '#0F172A', lineHeight: 1.2, textDecoration: isDone ? 'line-through' : 'none' }}>
                    {task.title}
                </span>
            </div>

            {/* Meta Row: Dates + Priority */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#94A3B8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }} title="Data Final">
                        <span>📅</span>
                        <span style={{ color: isOverdue ? '#EF4444' : '#64748B', fontWeight: isOverdue ? 700 : 500 }}>{formatDateBr(task.deadline)}</span>
                    </div>
                </div>
                <div style={{ transform: 'scale(0.85)', transformOrigin: 'right center' }}>
                    <Badge label={task.priority} type="priority" />
                </div>
            </div>

            {/* Footer: Status + Timer + Assignee */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2, borderTop: '1px solid #F1F5F9', paddingTop: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button
                        onClick={e => { e.stopPropagation(); onComplete(task); }}
                        style={{
                            width: 14, height: 14, borderRadius: 3, cursor: 'pointer',
                            border: isDone ? 'none' : '1.5px solid #CBD5E1',
                            background: isDone ? '#22C55E' : 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        {isDone && <span style={{ fontSize: 8, color: 'white' }}>✓</span>}
                    </button>
                    {!isDone && (
                        <button
                            onClick={e => { e.stopPropagation(); onAdvance(task); }}
                            style={{ background: '#F1F5F9', border: 'none', borderRadius: 4, padding: '1px 4px', fontSize: 9, color: '#64748B', fontWeight: 600, cursor: 'pointer' }}
                        >
                            {task.status} ›
                        </button>
                    )}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <TaskTimer task={task} />
                    {assignee && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <div style={{ width: 14, height: 14, borderRadius: 6, background: assignee.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 800 }}>
                                {assignee.initial}
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>{assignee.name.split(' ')[0]}</span>
                        </div>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); setDeleteId(task.id); }} style={{ background: 'none', border: 'none', padding: 0, color: '#FDA4AF', cursor: 'pointer', marginLeft: 4 }}><Trash2 size={12} /></button>
                </div>
            </div>
        </div>
    );
}

export default function TasksPage() {
    const { tasks, clients, members, pipelineStages, addActivity, addTask, updateTask, deleteTask } = useApp();
    const { toast } = useToast();
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterClient, setFilterClient] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
    const [filterAssignee, setFilterAssignee] = useState('');
    const [filterClientStage, setFilterClientStage] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [showOverdueOnly, setShowOverdueOnly] = useState(false);
    const [hideCompleted, setHideCompleted] = useState(true);
    const [filterDate, setFilterDate] = useState('');

    const [modalOpen, setModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [activeDragTask, setActiveDragTask] = useState<Task | null>(null);

    // Form state
    const [form, setForm] = useState({
        title: '', description: '', clientId: '',
        assigneeId: '',
        priority: 'Média' as Priority,
        deadline: '', estimatedHours: 0, status: 'A Fazer' as TaskStatus,
        checklists: [] as TaskChecklist[],
    });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const filteredTasks = useMemo(() => {
        return tasks.filter(t => {
            if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            if (filterClient && t.clientId !== filterClient) return false;
            if (filterPriority && t.priority !== filterPriority) return false;
            if (filterAssignee && t.assigneeId !== filterAssignee) return false;
            if (filterStatus && t.status !== filterStatus) return false;
            if (filterClientStage) {
                const client = clients.find(c => c.id === t.clientId);
                if (client?.stage !== filterClientStage) return false;
            }
            if (showOverdueOnly) {
                const isOverdue = t.deadline && !['Concluído'].includes(t.status) && new Date(t.deadline) < new Date(new Date().setHours(0,0,0,0));
                if (!isOverdue) return false;
            }
            if (hideCompleted && t.status === 'Concluído') return false;
            if (filterDate && t.deadline !== filterDate) return false;
            return true;
        });
    }, [tasks, searchQuery, filterClient, filterPriority, filterAssignee, filterStatus, filterClientStage, showOverdueOnly, hideCompleted, filterDate]);

    const openCreate = () => {
        setEditingTask(null);
        setForm({ 
            title: '', description: '', clientId: clients[0]?.id || '', 
            assigneeId: '', priority: 'Média', deadline: '', estimatedHours: 0, status: 'A Fazer',
            checklists: [] 
        });
        setModalOpen(true);
    };

    const openEdit = (task: Task) => {
        setEditingTask(task);
        setForm({
            title: task.title, description: task.description, clientId: task.clientId,
            assigneeId: task.assigneeId || '',
            priority: task.priority, deadline: task.deadline, estimatedHours: task.estimatedHours, status: task.status,
            checklists: task.checklists || [],
        });
        setModalOpen(true);
    };

    const saveTask = () => {
        if (!form.title.trim()) return toast('Título é obrigatório', 'error');
        const project = clients.find(p => p.id === form.clientId);
        
        if (editingTask) {
            updateTask({ ...editingTask, ...form, stage: editingTask.stage });
            addActivity('Kelvin', 'K', '#7C5CFC', `Task "${form.title}" atualizada.`, project?.name || 'Geral');
            toast('Task atualizada!');
        } else {
            const newTask: Task = {
                id: generateId(), 
                ...form, 
                stage: project?.stage || 'A Fazer', // Define o estágio baseada no cliente
                tags: [], 
                startDate: new Date().toISOString().split('T')[0],
                loggedHours: 0, 
                createdAt: new Date().toISOString(),
                orderIndex: tasks.length
            };
            addTask(newTask);
            addActivity('Kelvin', 'K', '#7C5CFC', `Task "${form.title}" criada.`, project?.name || 'Geral');
            toast('Task criada!');
        }
        setModalOpen(false);
    };

    const handleDelete = () => {
        if (!deleteId) return;
        const task = tasks.find(t => t.id === deleteId);
        deleteTask(deleteId);
        const project = clients.find(p => p.id === task?.clientId);
        addActivity('Kelvin', 'K', '#7C5CFC', `Task "${task?.title}" deletada.`, project?.name || 'Geral');
        toast('Task deletada!');
        setDeleteId(null);
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveDragTask(tasks.find(t => t.id === event.active.id) || null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveDragTask(null);
        const { active, over } = event;
        if (!over) return;
        const taskId = active.id as string;
        const newStatus = over.id as TaskStatus;
        const task = tasks.find(t => t.id === taskId);
        if (task && task.status !== newStatus) {
            updateTask({ ...task, status: newStatus });
            toast(`Task movida para ${newStatus}`);
        }
    };

    const advanceStatus = (task: Task) => {
        const idx = STATUS_ORDER.indexOf(task.status);
        if (idx < STATUS_ORDER.length - 1) {
            const next = STATUS_ORDER[idx + 1];
            updateTask({ ...task, status: next });
            toast(`→ ${next}`);
        }
    };

    const toggleComplete = (task: Task) => {
        const next: TaskStatus = task.status === 'Concluído' ? 'Em Progresso' : 'Concluído';
        updateTask({ ...task, status: next });
        toast(next === 'Concluído' ? '✅ Task concluída!' : 'Task reaberta');
    };

    return (
        <div style={{ padding: '24px 28px', paddingLeft: 40, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A' }}>Tasks</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', background: '#F1F5F9', padding: 4, borderRadius: 8 }}>
                        <button onClick={() => setViewMode('kanban')} style={{
                            padding: '6px 12px', borderRadius: 6, border: 'none', display: 'flex', alignItems: 'center', gap: 6,
                            background: viewMode === 'kanban' ? 'white' : 'transparent',
                            color: viewMode === 'kanban' ? '#7C5CFC' : '#64748B',
                            fontWeight: viewMode === 'kanban' ? 600 : 500, cursor: 'pointer', boxShadow: viewMode === 'kanban' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                        }}><LayoutDashboard size={14} /> Kanban</button>
                        <button onClick={() => setViewMode('list')} style={{
                            padding: '6px 12px', borderRadius: 6, border: 'none', display: 'flex', alignItems: 'center', gap: 6,
                            background: viewMode === 'list' ? 'white' : 'transparent',
                            color: viewMode === 'list' ? '#7C5CFC' : '#64748B',
                            fontWeight: viewMode === 'list' ? 600 : 500, cursor: 'pointer', boxShadow: viewMode === 'list' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                        }}><ListIcon size={14} /> Lista</button>
                    </div>
                    <button onClick={openCreate} style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px',
                        borderRadius: 10, border: 'none', background: '#7C5CFC', color: 'white',
                        fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                        <Plus size={16} /> Nova Task
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
                    borderRadius: 10, border: '1px solid #E2E8F0', background: 'white', flex: 1, minWidth: 200,
                }}>
                    <Search size={16} style={{ color: '#94A3B8' }} />
                    <input
                        type="text" placeholder="Buscar tasks..."
                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: '#0F172A', width: '100%', fontFamily: 'inherit' }}
                    />
                </div>
                <select value={filterClient} onChange={(e) => setFilterClient(e.target.value)} style={{
                    padding: '8px 12px', borderRadius: 10, border: '1px solid #E2E8F0', background: 'white',
                    fontSize: 13, color: '#475569', cursor: 'pointer', fontFamily: 'inherit',
                }}>
                    <option value="">Cliente (Todos)</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)} style={{
                    padding: '8px 12px', borderRadius: 10, border: '1px solid #E2E8F0', background: 'white',
                    fontSize: 13, color: '#475569', cursor: 'pointer', fontFamily: 'inherit',
                }}>
                    <option value="">Responsável (Todos)</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} style={{
                    padding: '8px 12px', borderRadius: 10, border: '1px solid #E2E8F0', background: 'white',
                    fontSize: 13, color: '#475569', cursor: 'pointer', fontFamily: 'inherit',
                }}>
                    <option value="">Prioridade (Todas)</option>
                    <option value="Alta">Alta</option>
                    <option value="Média">Média</option>
                    <option value="Baixa">Baixa</option>
                </select>

                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{
                    padding: '8px 12px', borderRadius: 10, border: '1px solid #E2E8F0', background: 'white',
                    fontSize: 13, color: '#475569', cursor: 'pointer', fontFamily: 'inherit',
                }}>
                    <option value="">Etapa (Task)</option>
                    {STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                <select value={filterClientStage} onChange={(e) => setFilterClientStage(e.target.value)} style={{
                    padding: '8px 12px', borderRadius: 10, border: '1px solid #E2E8F0', background: 'white',
                    fontSize: 13, color: '#475569', cursor: 'pointer', fontFamily: 'inherit',
                }}>
                    <option value="">Estágio (Cliente)</option>
                    {pipelineStages.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>

                <button 
                  onClick={() => setShowOverdueOnly(!showOverdueOnly)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10,
                    border: '1px solid', borderColor: showOverdueOnly ? '#EF4444' : '#E2E8F0',
                    background: showOverdueOnly ? '#FEE2E2' : 'white',
                    color: showOverdueOnly ? '#EF4444' : '#475569',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                    🕒 Atrasadas
                </button>

                <button 
                  onClick={() => setHideCompleted(!hideCompleted)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10,
                    border: '1px solid', borderColor: hideCompleted ? '#E2E8F0' : '#22C55E',
                    background: hideCompleted ? 'white' : '#D1FAE5',
                    color: hideCompleted ? '#94A3B8' : '#059669',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                    {hideCompleted ? '👁️ Ver Concluídas' : '✅ Ocultar Concluídas'}
                </button>

                <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} style={{
                    padding: '7px 12px', borderRadius: 10, border: '1px solid #E2E8F0', background: 'white',
                    fontSize: 13, color: '#475569', fontFamily: 'inherit'
                }} title="Filtrar por Prazo" />
                {filterDate && <button onClick={() => setFilterDate('')} style={{ border: 'none', background: 'transparent', fontSize: 12, cursor: 'pointer', color: '#EF4444' }}>Limpar</button>}
            </div>

            {/* Kanban / List Toggle */}
            {viewMode === 'kanban' ? (
                <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                    <div style={{ display: 'flex', gap: 12, flex: 1, alignItems: 'start', overflowX: 'auto', paddingBottom: 20 }}>
                        {COLUMNS.map(col => {
                            const colTasks = filteredTasks.filter(t => t.status === col.status);
                            return (
                                <div key={col.status} style={{ minWidth: 300, maxWidth: 300, flex: 1 }}>
                                    <DroppableColumn id={col.status} title={col.status} color={col.color} count={colTasks.length}>
                                        {colTasks.map(task => (
                                            <DraggableCard key={task.id} task={task} clients={clients} members={members}
                                                openEdit={openEdit} setDeleteId={setDeleteId}
                                                onAdvance={advanceStatus} onComplete={toggleComplete}
                                            />
                                        ))}
                                    </DroppableColumn>
                                </div>
                            );
                        })}
                    </div>
                    <DragOverlay>
                        {activeDragTask ? <DraggableCard task={activeDragTask} clients={clients} members={members} openEdit={openEdit} setDeleteId={setDeleteId} onAdvance={advanceStatus} onComplete={toggleComplete} isOverlay /> : null}
                    </DragOverlay>
                </DndContext>
            ) : (
                <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: 12, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <th style={{ padding: '12px 8px 12px 16px', fontWeight: 600, width: 32 }}></th>
                                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Task</th>
                                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Prioridade</th>
                                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Cliente</th>
                                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Responsável</th>
                                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Data Inicial</th>
                                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Data Final</th>
                                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Timer</th>
                                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTasks.length === 0 ? (
                                <tr><td colSpan={9} style={{ padding: 20, textAlign: 'center', color: '#94A3B8' }}>Nenhuma tarefa encontrada.</td></tr>
                            ) : filteredTasks.map(task => {
                                const client = clients.find(c => c.id === task.clientId);
                                const assignee = members.find(m => m.id === task.assigneeId);
                                const isDone = task.status === 'Concluído';
                                const isOverdue = task.deadline && !isDone && new Date(task.deadline) < new Date(new Date().setHours(0,0,0,0));
                                const statusColor = STATUS_COLORS[task.status as TaskStatus] || '#64748B';
                                const nextStatus = STATUS_ORDER[STATUS_ORDER.indexOf(task.status as TaskStatus) + 1];
                                return (
                                    <tr key={task.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s', background: isDone ? '#F0FDF4' : isOverdue ? '#FFF1F2' : 'white', opacity: isDone ? 0.8 : 1 }}>
                                        {/* Complete toggle */}
                                        <td style={{ padding: '12px 8px 12px 16px', width: 32 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                {isOverdue && <span title="Atrasado" style={{ color: '#EF4444', fontSize: 12 }}>⚠️</span>}
                                                <button
                                                onClick={() => toggleComplete(task)}
                                                title={isDone ? 'Reabrir' : 'Concluir'}
                                                style={{
                                                    width: 20, height: 20, borderRadius: 10, cursor: 'pointer', flexShrink: 0,
                                                    border: isDone ? 'none' : '2px solid #CBD5E1',
                                                    background: isDone ? '#22C55E' : 'white',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: 10, color: 'white', fontWeight: 900, transition: 'all 0.2s',
                                                }}
                                            >
                                                </button>
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', textDecoration: isDone ? 'line-through' : 'none', opacity: isDone ? 0.6 : 1 }}>{task.title}</span>
                                        </td>
                                        {/* Clickable status badge */}
                                        <td style={{ padding: '12px 16px' }}>
                                            <button
                                                onClick={() => !isDone ? advanceStatus(task) : undefined}
                                                title={!isDone && nextStatus ? `Avançar para "${nextStatus}"` : 'Concluído'}
                                                style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                                    padding: '4px 10px', borderRadius: 6,
                                                    background: `${statusColor}12`, border: `1px solid ${statusColor}30`,
                                                    color: statusColor, fontSize: 12, fontWeight: 600,
                                                    cursor: !isDone ? 'pointer' : 'default',
                                                    transition: 'all 0.15s',
                                                }}
                                            >
                                                <div style={{ width: 6, height: 6, borderRadius: 3, background: statusColor }} />
                                                {task.status}
                                                {!isDone && <ChevronRight size={10} />}
                                            </button>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}><Badge label={task.priority} type="priority" /></td>
                                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>{client?.name || '-'}</td>
                                        <td style={{ padding: '12px 16px' }}>
                                            {assignee ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{ width: 24, height: 24, borderRadius: 12, background: assignee.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 'bold' }}>{assignee.initial}</div>
                                                    <span style={{ fontSize: 13, color: '#475569' }}>{assignee.name}</span>
                                                </div>
                                            ) : <span style={{ color: '#94A3B8', fontSize: 13 }}>Não atribuído</span>}
                                        </td>
                                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>{formatDateBr(task.startDate)}</td>
                                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>{formatDateBr(task.deadline)}</td>
                                        <td style={{ padding: '12px 16px' }}><TaskTimer task={task} /></td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                                                <button onClick={() => openEdit(task)} title="Editar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: '1px solid #E2E8F0', background: 'white', color: '#64748B', cursor: 'pointer' }}><Pencil size={14} /></button>
                                                <button onClick={() => setDeleteId(task.id)} title="Deletar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: '1px solid #FEE2E2', background: 'white', color: '#DC2626', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Task Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingTask ? 'Editar Task' : 'Nova Task'}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Título *</label>
                        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                            style={{ width: '100%', padding: '9px 14px', borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                            placeholder="Nome da task" />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Descrição</label>
                        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                            rows={3} style={{ width: '100%', padding: '9px 14px', borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical' }}
                            placeholder="Descreva a task..." />
                        
                        <ChecklistManager 
                            checklists={form.checklists}
                            onChange={(val) => setForm({ ...form, checklists: val })}
                        />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Cliente (Projeto) *</label>
                                <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                                    style={{ width: '100%', padding: '9px 14px', borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>
                                    <option value="">Sem cliente</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Responsável</label>
                                <select value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
                                    style={{ width: '100%', padding: '9px 14px', borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>
                                    <option value="">Não atribuído</option>
                                    {members.map(m => m && <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Prioridade</label>
                            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
                                style={{ width: '100%', padding: '9px 14px', borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>
                                <option value="Alta">Alta</option>
                                <option value="Média">Média</option>
                                <option value="Baixa">Baixa</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Prazo</label>
                            <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                                style={{ width: '100%', padding: '9px 14px', borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 13, fontFamily: 'inherit' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Estimativa (horas)</label>
                            <input type="number" min={0} value={form.estimatedHours} onChange={(e) => setForm({ ...form, estimatedHours: Number(e.target.value) })}
                                style={{ width: '100%', padding: '9px 14px', borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 13, fontFamily: 'inherit' }} />
                        </div>
                    </div>
                    {editingTask && (
                        <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Status</label>
                            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}
                                style={{ width: '100%', padding: '9px 14px', borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>
                                {COLUMNS.map(c => <option key={c.status} value={c.status}>{c.status}</option>)}
                            </select>
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                        <button onClick={() => setModalOpen(false)} style={{
                            padding: '9px 20px', borderRadius: 10, border: '1px solid #E2E8F0',
                            background: 'white', color: '#475569', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                        }}>Cancelar</button>
                        <button onClick={saveTask} style={{
                            padding: '9px 20px', borderRadius: 10, border: 'none',
                            background: '#7C5CFC', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        }}>{editingTask ? 'Salvar' : 'Criar Task'}</button>
                    </div>
                </div>
            </Modal>

            <ConfirmDialog
                isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
                title="Deletar Task" message="Tem certeza que deseja deletar esta task? Essa ação não pode ser desfeita."
                confirmLabel="Deletar"
            />
        </div>
    );
}

