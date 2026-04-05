'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useApp, generateId, addBusinessDays } from '@/store/AppContext';
import { useToast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Play, Pause, Square, Trash2, Plus, Clock, ChevronDown, Check } from 'lucide-react';
import type { Task } from '@/types';

function formatTime(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatDuration(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1px solid #E2E8F0', fontSize: 13, fontFamily: 'inherit', outline: 'none',
    background: 'white', color: '#0F172A',
};

export default function TimeTrackerPage() {
    const { tasks, clients, timeEntries, stageTaskTemplates, activeWorkspaceId, dispatch, addTask, updateTask, addTimeEntry, deleteTimeEntry, addActivity } = useApp();
    const { toast } = useToast();

    // ── Timer state ──
    const [isRunning, setIsRunning] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [notes, setNotes] = useState('');
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // ── Mode: existing task or create new ──
    const [mode, setMode] = useState<'existing' | 'new'>('existing');

    // For existing task mode
    const [selectedTaskId, setSelectedTaskId] = useState(tasks[0]?.id || '');

    // For new task mode (create on-the-fly)
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskClientId, setNewTaskClientId] = useState(clients[0]?.id || '');
    const [newTaskPriority, setNewTaskPriority] = useState<'Alta' | 'Média' | 'Baixa'>('Média');

    // ── Manual entry ──
    const [manualMode, setManualMode] = useState<'existing' | 'new'>('existing');
    const [manualTaskId, setManualTaskId] = useState(tasks[0]?.id || '');
    const [manualHours, setManualHours] = useState(0);
    const [manualMinutes, setManualMinutes] = useState(0);
    const [manualNotes, setManualNotes] = useState('');
    const [manualNewTitle, setManualNewTitle] = useState('');
    const [manualNewClientId, setManualNewClientId] = useState('');

    // Pre-fill when data loads
    useEffect(() => {
        if (clients.length > 0) {
            if (!newTaskClientId) setNewTaskClientId(clients[0].id);
            if (!manualNewClientId) setManualNewClientId(clients[0].id);
        }
    }, [clients, newTaskClientId, manualNewClientId]);

    useEffect(() => {
        if (!selectedTaskId && tasks.length > 0) setSelectedTaskId(tasks[0].id);
        if (!manualTaskId && tasks.length > 0) setManualTaskId(tasks[0].id);
    }, [tasks, selectedTaskId, manualTaskId]);

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isRunning]);

    // Create a quick task and return its id
    function createQuickTask(title: string, clientId: string, priority: 'Alta' | 'Média' | 'Baixa') {
        const client = clients.find(c => c.id === clientId);
        const id = generateId();
        const task: Task = {
            id, title: title.trim(),
            description: 'Criada via Time Tracker',
            clientId: clientId,
            stage: client?.stage || 'A Fazer',
            status: 'Em Progresso',
            priority,
            assigneeId: '',
            tags: [],
            startDate: new Date().toISOString().split('T')[0],
            deadline: new Date().toISOString().split('T')[0],
            estimatedHours: 0,
            loggedHours: 0,
            createdAt: new Date().toISOString(),
            orderIndex: 9999,
        };
        addTask(task);
        addActivity('Kelvin', 'K', '#7C5CFC', `Task "${task.title}" criada via Time Tracker.`, client?.name || 'Geral');
        return id;
    }

    const handleStart = () => {
        if (mode === 'new' && !newTaskTitle.trim()) {
            toast('Informe o nome da task', 'error'); return;
        }
        if (mode === 'existing' && !selectedTaskId) {
            toast('Selecione uma task', 'error'); return;
        }

        // If new task, create it first and select it
        if (mode === 'new') {
            const id = createQuickTask(newTaskTitle, newTaskClientId, newTaskPriority);
            setSelectedTaskId(id);
            setMode('existing');
            toast(`Task "${newTaskTitle}" criada!`);
            setNewTaskTitle('');
        }
        setIsRunning(true);
    };

    const handleStop = () => {
        if (elapsed < 60) { toast('Sessão deve ter pelo menos 1 minuto', 'error'); return; }
        
        let clientId = '';
        let taskId = selectedTaskId;
        
        // Search for task to get its project
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            clientId = task.clientId;
        } else if (mode === 'new') {
            // Fallback for new tasks just started
            clientId = newTaskClientId;
        }

        if (!clientId) {
            toast('Erro ao identificar projeto. Tente novamente.', 'error');
            return;
        }

        addTimeEntry({
            id: generateId(), taskId, clientId,
            duration: elapsed, notes, date: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString(),
        });

        if (task) {
            updateTask({ ...task, loggedHours: task.loggedHours + elapsed / 3600, status: 'Em Progresso' });
        }

        toast(`${formatDuration(elapsed)} registrado!`);
        setIsRunning(false);
        setElapsed(0);
        setNotes('');
    };

    const handleManualEntry = () => {
        const totalSeconds = (manualHours * 3600) + (manualMinutes * 60);
        if (totalSeconds <= 0) { toast('Informe o tempo', 'error'); return; }

        let taskId = manualTaskId;
        let clientId = '';

        if (manualMode === 'new') {
            if (!manualNewTitle.trim()) { toast('Informe o nome da task', 'error'); return; }
            clientId = manualNewClientId;
            taskId = createQuickTask(manualNewTitle, manualNewClientId, 'Média');
            toast(`Task "${manualNewTitle}" criada!`);
            setManualNewTitle('');
        } else {
            const task = tasks.find(t => t.id === taskId);
            clientId = task?.clientId || '';
        }

        if (!clientId) { toast('Selecione um projeto válido', 'error'); return; }

        addTimeEntry({
            id: generateId(), taskId, clientId,
            duration: totalSeconds, notes: manualNotes,
            date: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString(),
        });

        // Update task logged hours if it exists
        const taskObj = tasks.find(t => t.id === taskId);
        if (taskObj) {
            updateTask({ ...taskObj, loggedHours: taskObj.loggedHours + totalSeconds / 3600 });
        }

        toast(`${manualHours}h ${manualMinutes}m registrado!`);
        setManualHours(0);
        setManualMinutes(0);
        setManualNotes('');
    };

    const todayEntries = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return timeEntries.filter(e => e.date === today);
    }, [timeEntries]);

    const totalToday = todayEntries.reduce((sum, e) => sum + e.duration, 0);
    const last20 = [...timeEntries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 20);

    const selectedTask = tasks.find(t => t.id === selectedTaskId);
    const selectedClient = clients.find(c => c.id === selectedTask?.clientId);

    return (
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A' }}>Time Tracker</h1>
                {/* Today total pill */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 12, background: 'linear-gradient(135deg, #7C5CFC, #5B8DEF)', color: 'white' }}>
                    <Clock size={14} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Hoje: {formatDuration(totalToday)}</span>
                    <span style={{ fontSize: 11, opacity: 0.75 }}>· {todayEntries.length} sessões</span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* ── LEFT: Timer ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Timer card */}
                    <div style={{ padding: 28, borderRadius: 20, background: 'white', border: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center', boxShadow: '0 4px 24px rgba(124,92,252,0.06)' }}>

                        {/* Mode toggle */}
                        <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 10, padding: 3, width: '100%' }}>
                            <button
                                onClick={() => setMode('existing')}
                                style={{ flex: 1, padding: '7px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: mode === 'existing' ? 'white' : 'transparent', color: mode === 'existing' ? '#7C5CFC' : '#64748B', transition: 'all 0.15s' }}
                            >
                                Task existente
                            </button>
                            <button
                                onClick={() => setMode('new')}
                                style={{ flex: 1, padding: '7px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: mode === 'new' ? 'white' : 'transparent', color: mode === 'new' ? '#7C5CFC' : '#64748B', transition: 'all 0.15s' }}
                            >
                                + Criar nova task
                            </button>
                        </div>

                        {/* Task selector */}
                        {mode === 'existing' ? (
                            <div style={{ width: '100%' }}>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Task</label>
                                <select
                                    value={selectedTaskId}
                                    onChange={e => setSelectedTaskId(e.target.value)}
                                    style={{ ...inputStyle, cursor: 'pointer' }}
                                    disabled={isRunning}
                                >
                                    <option value="">Selecione uma task...</option>
                                    {tasks.map(t => {
                                        const p = clients.find(c => c.id === t.clientId);
                                        return <option key={t.id} value={t.id}>[{p?.name || 'Sem cliente'}] {t.title}</option>;
                                    })}
                                </select>
                                {selectedTask && (
                                    <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: `${selectedClient?.color || '#7C5CFC'}12`, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ fontSize: 14 }}>{selectedClient?.emoji || '📁'}</span>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: selectedClient?.color || '#7C5CFC' }}>{selectedClient?.name || 'Sem cliente'}</span>
                                        <span style={{ fontSize: 11, color: '#64748B', marginLeft: 4 }}>→ {selectedTask.title}</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Projeto (Cliente)</label>
                                    <select
                                        value={newTaskClientId}
                                        onChange={e => setNewTaskClientId(e.target.value)}
                                        style={{ ...inputStyle, cursor: 'pointer' }}
                                    >
                                        {clients.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nome da task *</label>
                                    <input
                                        value={newTaskTitle}
                                        onChange={e => setNewTaskTitle(e.target.value)}
                                        placeholder="Ex: Revisão do contrato..."
                                        style={inputStyle}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prioridade</label>
                                    <select
                                        value={newTaskPriority}
                                        onChange={e => setNewTaskPriority(e.target.value as any)}
                                        style={{ ...inputStyle, cursor: 'pointer' }}
                                    >
                                        <option value="Alta">Alta</option>
                                        <option value="Média">Média</option>
                                        <option value="Baixa">Baixa</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Big clock */}
                        <div style={{
                            fontSize: 60, fontWeight: 800, color: isRunning ? '#7C5CFC' : '#0F172A',
                            fontVariantNumeric: 'tabular-nums', letterSpacing: 3,
                            transition: 'color 0.3s',
                            textShadow: isRunning ? '0 0 40px rgba(124,92,252,0.25)' : 'none',
                        }}>
                            {formatTime(elapsed)}
                        </div>

                        {/* Controls */}
                        <div style={{ display: 'flex', gap: 10 }}>
                            {!isRunning ? (
                                <button onClick={handleStart} style={{
                                    display: 'flex', alignItems: 'center', gap: 8, padding: '12px 32px', borderRadius: 12,
                                    border: 'none', background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                                    color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(34,197,94,0.3)',
                                }}>
                                    <Play size={16} fill="white" /> Iniciar
                                </button>
                            ) : (
                                <>
                                    <button onClick={() => setIsRunning(false)} style={{
                                        display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12,
                                        border: 'none', background: '#F59E0B',
                                        color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                                    }}>
                                        <Pause size={16} fill="white" /> Pausar
                                    </button>
                                    <button onClick={handleStop} style={{
                                        display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12,
                                        border: 'none', background: '#DC2626',
                                        color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                                    }}>
                                        <Square size={16} fill="white" /> Finalizar
                                    </button>
                                </>
                            )}
                        </div>

                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Notas da sessão (opcional)..."
                            rows={2}
                            style={{ ...inputStyle, resize: 'none', textAlign: 'center', width: '100%' }}
                        />
                    </div>

                    {/* Manual entry card */}
                    <div style={{ padding: 20, borderRadius: 16, background: 'white', border: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Entrada manual</h3>

                        {/* Mode toggle mini */}
                        <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 8, padding: 3 }}>
                            <button onClick={() => setManualMode('existing')} style={{ flex: 1, padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500, background: manualMode === 'existing' ? 'white' : 'transparent', color: manualMode === 'existing' ? '#7C5CFC' : '#64748B' }}>
                                Task existente
                            </button>
                            <button onClick={() => setManualMode('new')} style={{ flex: 1, padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500, background: manualMode === 'new' ? 'white' : 'transparent', color: manualMode === 'new' ? '#7C5CFC' : '#64748B' }}>
                                Nova task
                            </button>
                        </div>

                        {manualMode === 'existing' ? (
                            <select value={manualTaskId} onChange={e => setManualTaskId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                                {tasks.map(t => {
                                    const p = clients.find(c => c.id === t.clientId);
                                    return <option key={t.id} value={t.id}>[{p?.name || 'Sem cliente'}] {t.title}</option>;
                                })}
                            </select>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <select value={manualNewClientId} onChange={e => setManualNewClientId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                                </select>
                                <input value={manualNewTitle} onChange={e => setManualNewTitle(e.target.value)} placeholder="Nome da nova task..." style={inputStyle} />
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 6 }}>Horas</label>
                                <input type="number" min={0} value={manualHours} onChange={e => setManualHours(Number(e.target.value))} style={inputStyle} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 6 }}>Minutos</label>
                                <input type="number" min={0} max={59} value={manualMinutes} onChange={e => setManualMinutes(Number(e.target.value))} style={inputStyle} />
                            </div>
                        </div>
                        <input value={manualNotes} onChange={e => setManualNotes(e.target.value)} placeholder="Notas..." style={inputStyle} />
                        <button onClick={handleManualEntry} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 18px',
                            borderRadius: 10, border: 'none', background: '#7C5CFC', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        }}>
                            <Plus size={14} /> Registrar
                        </button>
                    </div>
                </div>

                {/* ── RIGHT: History ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Histórico recente</h3>

                    {last20.length === 0 ? (
                        <div style={{ padding: 40, borderRadius: 16, background: 'white', border: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                            <Clock size={32} style={{ color: '#CBD5E1' }} />
                            <p style={{ fontSize: 13, color: '#94A3B8' }}>Nenhuma sessão registrada</p>
                        </div>
                    ) : last20.map(entry => {
                        const task = tasks.find(t => t.id === entry.taskId);
                        const project = clients.find(p => p.id === entry.clientId);
                        return (
                            <div key={entry.id} style={{
                                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                                borderRadius: 12, background: 'white', border: '1px solid #F1F5F9',
                                transition: 'box-shadow 0.15s',
                            }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                                    background: `${project?.color || '#94A3B8'}18`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 16,
                                }}>
                                    {project?.emoji || '⏱️'}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {task?.title || 'Task removida'}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                                        {project?.name || '—'} · {entry.date}
                                        {entry.notes && <span> · {entry.notes}</span>}
                                    </div>
                                </div>
                                <span style={{
                                    fontSize: 14, fontWeight: 700, color: '#7C5CFC', flexShrink: 0,
                                    padding: '4px 10px', borderRadius: 8, background: '#F0EDFF',
                                }}>
                                    {formatDuration(entry.duration)}
                                </span>
                                <button onClick={() => setDeleteId(entry.id)} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    width: 28, height: 28, borderRadius: 8, border: 'none',
                                    background: '#FEE2E2', color: '#DC2626', cursor: 'pointer', flexShrink: 0,
                                }}><Trash2 size={12} /></button>
                            </div>
                        );
                    })}
                </div>
            </div>

            <ConfirmDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={() => { deleteTimeEntry(deleteId!); toast('Sessão removida!'); setDeleteId(null); }}
                title="Remover sessão"
                message="Tem certeza que deseja remover esta sessão de tempo?"
                confirmLabel="Remover"
            />
        </div>
    );
}
