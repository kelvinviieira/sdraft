'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect, useState } from 'react';
import type {
    AppState, AppAction, Client, ClientStageHistory,
    StageTaskTemplate, StageSetting, ClientStage, Task, TimeEntry, Activity,
    TaskStatus, Member, Workspace, ClientDocument, PipelineStage
} from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/store/AuthContext';

// ── Stage Configuration ──

const DEFAULT_STAGES: PipelineStage[] = [
    { id: 'contract', name: 'contract', label: 'Contrato Fechado', color: '#EAB308', emoji: '🟡', bgLight: '#FEF9C3', orderIndex: 0 },
    { id: 'onboarding', name: 'onboarding', label: 'Onboarding', color: '#3B82F6', emoji: '🔵', bgLight: '#DBEAFE', orderIndex: 1 },
    { id: 'implementation', name: 'implementation', label: 'Implementação', color: '#F97316', emoji: '🟠', bgLight: '#FED7AA', orderIndex: 2 },
    { id: 'final_tests', name: 'final_tests', label: 'Testes Finais', color: '#06B6D4', emoji: '🧪', bgLight: '#CFFAFE', orderIndex: 3 },
    { id: 'support', name: 'support', label: 'Suporte', color: '#22C55E', emoji: '🟢', bgLight: '#D1FAE5', orderIndex: 4 },
    { id: 'churned', name: 'churned', label: 'Churned', color: '#94A3B8', emoji: '⚪', bgLight: '#F1F5F9', orderIndex: 99, isSystem: true },
];

export const STAGE_ORDER: ClientStage[] = DEFAULT_STAGES.filter(s => !s.isSystem).sort((a, b) => a.orderIndex - b.orderIndex).map(s => s.id);
export const STAGE_CONFIG: Record<string, any> = DEFAULT_STAGES.reduce((acc, s) => ({ ...acc, [s.id]: s }), {});

export const DEFAULT_STAGE_DAYS: Record<string, number> = {
    contract: 2, onboarding: 5, implementation: 7, final_tests: 3, support: 0, churned: 0,
};

// ── Helpers ──

export function addBusinessDays(startDate: string, days: number): string {
    const d = new Date(startDate + 'T12:00:00');
    let added = 0;
    while (added < days) {
        d.setDate(d.getDate() + 1);
        const dow = d.getDay();
        if (dow !== 0 && dow !== 6) added++;
    }
    return d.toISOString().split('T')[0];
}

export function businessDaysBetween(start: string, end: string): number {
    const s = new Date(start + 'T12:00:00');
    const e = new Date(end + 'T12:00:00');
    let count = 0;
    const d = new Date(s);
    while (d < e) {
        d.setDate(d.getDate() + 1);
        const dow = d.getDay();
        if (dow !== 0 && dow !== 6) count++;
    }
    return count;
}

export function generateId() {
    return crypto.randomUUID();
}

export function daysAgo(dateStr: string): number {
    if (!dateStr) return 0;
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

export function formatDateBR(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    const [year, month, day] = dateStr.split('T')[0].split('-');
    if (!year || !month || !day) return dateStr;
    return `${day}/${month}/${year}`;
}

export function getNextStage(stage: ClientStage): ClientStage | null {
    const idx = STAGE_ORDER.indexOf(stage);
    if (idx < 0 || idx >= STAGE_ORDER.length - 1) return null;
    return STAGE_ORDER[idx + 1];
}

// ── Reducer ──

function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        case 'ADD_WORKSPACE': return { ...state, workspaces: [...state.workspaces, action.payload], activeWorkspaceId: action.payload.id };
        case 'UPDATE_WORKSPACE': return { ...state, workspaces: state.workspaces.map(w => w.id === action.payload.id ? action.payload : w) };
        case 'DELETE_WORKSPACE': 
            const newWorkspaces = state.workspaces.filter(w => w.id !== action.payload);
            return { ...state, workspaces: newWorkspaces, activeWorkspaceId: newWorkspaces[0]?.id || '' };
        case 'SET_ACTIVE_WORKSPACE': return { ...state, activeWorkspaceId: action.payload };
        case 'SET_INITIAL_DATA': return { ...state, ...action.payload, activeWorkspaceId: action.payload.activeWorkspaceId || (action.payload.workspaces?.[0]?.id || state.activeWorkspaceId) };
        case 'ADD_CLIENT': return { ...state, clients: [...state.clients, action.payload] };
        case 'UPDATE_CLIENT': return { ...state, clients: state.clients.map(c => c.id === action.payload.id ? action.payload : c) };
        case 'DELETE_CLIENT': return { ...state, clients: state.clients.filter(c => c.id !== action.payload) };
        case 'ADD_TASK': return { ...state, tasks: [...state.tasks, action.payload] };
        case 'UPDATE_TASK': return { ...state, tasks: state.tasks.map(t => t.id === action.payload.id ? action.payload : t) };
        case 'DELETE_TASK': return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) };
        case 'ADD_STAGE_HISTORY': return { ...state, clientStageHistory: [...state.clientStageHistory, action.payload] };
        case 'UPDATE_STAGE_HISTORY': return { ...state, clientStageHistory: state.clientStageHistory.map(h => h.id === action.payload.id ? action.payload : h) };
        case 'UPDATE_STAGE_SETTINGS': return { ...state, stageSettings: action.payload };
        case 'ADD_DOCUMENT': return { ...state, documents: [action.payload, ...state.documents] };
        case 'UPDATE_DOCUMENT': return { ...state, documents: state.documents.map(d => d.id === action.payload.id ? action.payload : d) };
        case 'DELETE_DOCUMENT': return { ...state, documents: state.documents.filter(d => d.id !== action.payload) };
        case 'ADD_ACTIVITY': return { ...state, activities: [action.payload, ...state.activities] };
        case 'ADD_MEMBER': return { ...state, members: [...state.members, action.payload] };
        case 'UPDATE_MEMBER': return { ...state, members: state.members.map(m => m.id === action.payload.id ? action.payload : m) };
        case 'DELETE_MEMBER': return { ...state, members: state.members.filter(m => m.id !== action.payload) };
        case 'ADD_TIME_ENTRY': return { ...state, timeEntries: [action.payload, ...state.timeEntries] };
        case 'DELETE_TIME_ENTRY': return { ...state, timeEntries: state.timeEntries.filter(e => e.id !== action.payload) };
        case 'UPDATE_STAGE_TEMPLATES': return { ...state, stageTaskTemplates: action.payload };
        default: return state;
    }
}

const initialState: AppState = {
    clients: [], clientStageHistory: [], stageTaskTemplates: [], stageSettings: [],
    tasks: [], timeEntries: [], activities: [], members: [], documents: [],
    activeTimerTaskId: null, workspaces: [], activeWorkspaceId: '',
    pipelineStages: DEFAULT_STAGES,
};

interface AppContextType extends AppState {
    activeWorkspace: Workspace | undefined;
    dispatch: React.Dispatch<AppAction>;
    getClient: (id: string) => Client | undefined;
    getClientTasks: (clientId: string, stage?: ClientStage) => Task[];
    getClientsInStage: (stage: ClientStage) => Client[];
    getStageHistory: (clientId: string) => ClientStageHistory[];
    getStageSetting: (stage: ClientStage) => number;
    addActivity: (userName: string, userInitial: string, userColor: string, action: string, projectName: string) => void;
    addClient: (client: Client) => Promise<void>;
    updateClient: (client: Client) => Promise<void>;
    deleteClient: (clientId: string) => Promise<void>;
    addTask: (task: Task) => Promise<void>;
    updateTask: (task: Task) => Promise<void>;
    deleteTask: (taskId: string) => Promise<void>;
    updateStageHistory: (history: ClientStageHistory) => Promise<void>;
    addStageHistory: (history: ClientStageHistory) => Promise<void>;
    updateStageSettings: (settings: StageSetting[]) => Promise<void>;
    addDocument: (doc: ClientDocument) => Promise<void>;
    updateDocument: (doc: ClientDocument) => Promise<void>;
    deleteDocument: (id: string) => Promise<void>;
    addWorkspace: (ws: Workspace) => Promise<void>;
    updateWorkspace: (ws: Workspace) => Promise<void>;
    deleteWorkspace: (id: string) => Promise<void>;
    duplicateWorkspace: (id: string) => Promise<void>;
    addMember: (m: Member) => Promise<void>;
    updateMember: (m: Member) => Promise<void>;
    deleteMember: (id: string) => Promise<void>;
    addTimeEntry: (entry: TimeEntry) => Promise<void>;
    deleteTimeEntry: (id: string) => Promise<void>;
    updateStageTemplates: (ts: StageTaskTemplate[]) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [state, dispatch] = useReducer(appReducer, initialState);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchInitialData() {
            try {
                // Provisiona workspace para o usuário (idempotente)
                await supabase.rpc('provision_user_workspace');

                const [
                    { data: clients }, { data: workspaces }, { data: members },
                    { data: tasks }, { data: history }, { data: templates },
                    { data: settings }, { data: entries }, { data: activities },
                    { data: docs }, { data: stages }
                ] = await Promise.all([
                    supabase.from('clients').select('*'),
                    supabase.from('workspaces').select('*'),
                    supabase.from('members').select('*'),
                    supabase.from('tasks').select('*'),
                    supabase.from('client_stage_history').select('*'),
                    supabase.from('stage_task_templates').select('*'),
                    supabase.from('stage_settings').select('*'),
                    supabase.from('time_entries').select('*'),
                    supabase.from('activities').select('*'),
                    supabase.from('client_documents').select('*'),
                    supabase.from('pipeline_stages').select('*').order('order_index')
                ]);

                dispatch({
                    type: 'SET_INITIAL_DATA',
                    payload: {
                        clients: (clients || []).map((c: any) => ({
                            ...c, workspaceId: c.workspace_id, contractDate: c.contract_date,
                            stageStartedAt: c.stage_started_at, stageDueDate: c.stage_due_date, createdAt: c.created_at
                        })),
                        workspaces: (workspaces || []).map((w: any) => ({ ...w, createdAt: w.created_at })),
                        members: (members || []).map((m: any) => ({ ...m, role: m.role || 'Member' })),
                        tasks: (tasks || []).map((t: any) => ({
                            ...t, clientId: t.client_id, assigneeId: t.assignee_id, startDate: t.start_date,
                            estimatedHours: Number(t.estimated_hours), loggedHours: Number(t.logged_hours),
                            checklists: t.checklists || [], orderIndex: t.order_index, createdAt: t.created_at
                        })),
                        clientStageHistory: (history || []).map((h: any) => ({
                            ...h, clientId: h.client_id, startedAt: h.started_at, completedAt: h.completed_at,
                            plannedDays: h.planned_days, actualDays: h.actual_days
                        })),
                        stageTaskTemplates: (templates || []).map((t: any) => ({
                            ...t, workspaceId: t.workspace_id, orderIndex: t.order_index, defaultDaysOffset: t.default_days_offset
                        })),
                        stageSettings: (settings || []).map((s: any) => ({
                            ...s, workspaceId: s.workspace_id, businessDays: s.business_days, updatedAt: s.updated_at
                        })),
                        timeEntries: (entries || []).map((e: any) => ({
                            ...e, taskId: e.task_id, clientId: e.client_id, createdAt: e.created_at
                        })),
                        activities: (activities || []).map((a: any) => ({
                            ...a, userId: a.user_id, userName: a.user_name, userInitial: a.user_initial, userColor: a.user_color, projectName: a.project_name
                        })),
                        documents: (docs || []).map((d: any) => ({
                            ...d, clientId: d.client_id, updatedAt: d.updated_at, createdAt: d.created_at
                        })),
                        pipelineStages: stages && stages.length > 0 ? (stages as any[]).map(s => ({
                            ...s,
                            id: s.name,        // name é o identificador semântico (ex: 'contract')
                            orderIndex: s.order_index,
                            bgLight: s.bg_light,
                            isSystem: s.is_system,
                        })) : DEFAULT_STAGES,
                        activeWorkspaceId: workspaces?.[0]?.id || ''
                    }
                });
            } catch (error) {
                console.error('Error fetching Supabase data:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchInitialData();
    }, []);

    const activeWorkspace = state.workspaces.find(w => w.id === state.activeWorkspaceId) || state.workspaces[0];
    const filteredClients = state.clients.filter(c => c.workspaceId === state.activeWorkspaceId);
    const activeClientIds = filteredClients.map(c => c.id);
    const filteredTasks = state.tasks.filter(t => activeClientIds.includes(t.clientId));
    const filteredDocuments = state.documents.filter(d => activeClientIds.includes(d.clientId));
    const filteredHistory = state.clientStageHistory.filter(h => activeClientIds.includes(h.clientId));
    const filteredTimeEntries = state.timeEntries.filter(e => activeClientIds.includes(e.clientId));

    const getClient = useCallback((id: string) => filteredClients.find(c => c.id === id), [filteredClients]);
    const getClientTasks = useCallback((clientId: string, stage?: ClientStage) => {
        let ts = filteredTasks.filter(t => t.clientId === clientId);
        if (stage) ts = ts.filter(t => t.stage === stage);
        return ts.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    }, [filteredTasks]);
    const getClientsInStage = useCallback((stage: ClientStage) => filteredClients.filter(c => c.stage === stage), [filteredClients]);
    const getStageHistory = useCallback((clientId: string) => filteredHistory.filter(h => h.clientId === clientId).sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()), [filteredHistory]);
    const getStageSetting = useCallback((stage: ClientStage) => {
        const s = state.stageSettings.find(ss => ss.stage === stage);
        return s ? s.businessDays : DEFAULT_STAGE_DAYS[stage];
    }, [state.stageSettings]);

    const addActivity = useCallback((userName: string, userInitial: string, userColor: string, action: string, projectName: string) => {
        const payload = { id: crypto.randomUUID(), userId: user?.id ?? '', userName, userInitial, userColor, action, projectName, timestamp: new Date().toISOString() };
        dispatch({ type: 'ADD_ACTIVITY', payload });
        supabase.from('activities').insert([{
            id: payload.id,
            user_id: payload.userId,
            user_name: payload.userName,
            user_initial: payload.userInitial,
            user_color: payload.userColor,
            action: payload.action,
            project_name: payload.projectName,
            workspace_id: state.activeWorkspaceId || null,
        }]).then();
    }, [user, state.activeWorkspaceId]);

    const addClient = async (client: Client) => {
        dispatch({ type: 'ADD_CLIENT', payload: client });
        await supabase.from('clients').insert([{ id: client.id, workspace_id: client.workspaceId, name: client.name, company: client.company, email: client.email, phone: client.phone, color: client.color, emoji: client.emoji, stage: client.stage, contract_date: client.contractDate, stage_started_at: client.stageStartedAt, stage_due_date: client.stageDueDate, notes: client.notes, tags: client.tags }]);
    };

    const updateClient = async (client: Client) => {
        dispatch({ type: 'UPDATE_CLIENT', payload: client });
        await supabase.from('clients').update({
            name: client.name, company: client.company, email: client.email, phone: client.phone, color: client.color, emoji: client.emoji, stage: client.stage, contract_date: client.contractDate, stage_started_at: client.stageStartedAt, stage_due_date: client.stageDueDate, notes: client.notes, tags: client.tags
        }).eq('id', client.id);
    };

    const deleteClient = async (clientId: string) => {
        dispatch({ type: 'DELETE_CLIENT', payload: clientId });
        await supabase.from('clients').delete().eq('id', clientId);
    };

    const addTask = async (task: Task) => {
        dispatch({ type: 'ADD_TASK', payload: task });
        await supabase.from('tasks').insert([{
            id: task.id,
            title: task.title,
            description: task.description,
            client_id: task.clientId,
            stage: task.stage,
            assignee_id: task.assigneeId,
            status: task.status,
            priority: task.priority,
            tags: task.tags,
            start_date: task.startDate,
            deadline: task.deadline,
            estimated_hours: task.estimatedHours,
            logged_hours: task.loggedHours,
            checklists: task.checklists,
            order_index: task.orderIndex
        }]);
    };

    const updateTask = async (task: Task) => {
        dispatch({ type: 'UPDATE_TASK', payload: task });
        await supabase.from('tasks').update({
            title: task.title,
            description: task.description,
            client_id: task.clientId,
            stage: task.stage,
            assignee_id: task.assigneeId,
            status: task.status,
            priority: task.priority,
            tags: task.tags,
            start_date: task.startDate,
            deadline: task.deadline,
            estimated_hours: task.estimatedHours,
            logged_hours: task.loggedHours,
            checklists: task.checklists,
            order_index: task.orderIndex
        }).eq('id', task.id);
    };

    const deleteTask = async (taskId: string) => {
        dispatch({ type: 'DELETE_TASK', payload: taskId });
        await supabase.from('tasks').delete().eq('id', taskId);
    };

    const updateStageHistory = async (h: ClientStageHistory) => {
        dispatch({ type: 'UPDATE_STAGE_HISTORY', payload: h });
        await supabase.from('client_stage_history').update({ completed_at: h.completedAt, actual_days: h.actualDays, notes: h.notes }).eq('id', h.id);
    };

    const addStageHistory = async (h: ClientStageHistory) => {
        dispatch({ type: 'ADD_STAGE_HISTORY', payload: h });
        await supabase.from('client_stage_history').insert([{ id: h.id, client_id: h.clientId, stage: h.stage, started_at: h.startedAt, completed_at: h.completedAt, planned_days: h.plannedDays, actual_days: h.actualDays, notes: h.notes }]);
    };

    const updateStageSettings = async (settings: StageSetting[]) => {
        dispatch({ type: 'UPDATE_STAGE_SETTINGS', payload: settings });
        for (const s of settings) {
            await supabase.from('stage_settings').upsert({
                id: s.id,
                workspace_id: s.workspaceId,
                stage: s.stage,
                business_days: s.businessDays,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });
        }
    };

    const addDocument = async (doc: ClientDocument) => {
        dispatch({ type: 'ADD_DOCUMENT', payload: doc });
        await supabase.from('client_documents').insert([{ id: doc.id, client_id: doc.clientId, title: doc.title, content: doc.content, created_at: doc.createdAt, updated_at: doc.updatedAt }]);
    };

    const updateDocument = async (doc: ClientDocument) => {
        dispatch({ type: 'UPDATE_DOCUMENT', payload: doc });
        await supabase.from('client_documents').update({ title: doc.title, content: doc.content, updated_at: new Date().toISOString() }).eq('id', doc.id);
    };

    const deleteDocument = async (id: string) => {
        dispatch({ type: 'DELETE_DOCUMENT', payload: id });
        await supabase.from('client_documents').delete().eq('id', id);
    };

    const addWorkspace = async (ws: Workspace) => {
        dispatch({ type: 'ADD_WORKSPACE', payload: ws });
        await supabase.from('workspaces').insert([{ id: ws.id, name: ws.name, created_at: ws.createdAt }]);
    };

    const updateWorkspace = async (ws: Workspace) => {
        dispatch({ type: 'UPDATE_WORKSPACE', payload: ws });
        await supabase.from('workspaces').update({ name: ws.name }).eq('id', ws.id);
    };

    const deleteWorkspace = async (id: string) => {
        dispatch({ type: 'DELETE_WORKSPACE', payload: id });
        await supabase.from('workspaces').delete().eq('id', id);
    };

    const duplicateWorkspace = async (id: string) => {
        const source = state.workspaces.find(w => w.id === id);
        if (!source) return;
        const newWs = { id: generateId(), name: `${source.name} (Cópia)`, createdAt: new Date().toISOString() };
        await addWorkspace(newWs);
    };

    const addMember = async (m: Member) => {
        dispatch({ type: 'ADD_MEMBER', payload: m });
        await supabase.from('members').insert([{ id: m.id, name: m.name, initial: m.initial, color: m.color }]);
    };

    const updateMember = async (m: Member) => {
        dispatch({ type: 'UPDATE_MEMBER', payload: m });
        await supabase.from('members').update({ name: m.name, initial: m.initial, color: m.color }).eq('id', m.id);
    };

    const deleteMember = async (id: string) => {
        dispatch({ type: 'DELETE_MEMBER', payload: id });
        await supabase.from('members').delete().eq('id', id);
    };

    const addTimeEntry = async (entry: TimeEntry) => {
        dispatch({ type: 'ADD_TIME_ENTRY', payload: entry });
        await supabase.from('time_entries').insert([{
            id: entry.id,
            task_id: entry.taskId,
            client_id: entry.clientId,
            duration: entry.duration,
            notes: entry.notes,
            date: entry.date,
            created_at: entry.createdAt
        }]);
    };

    const deleteTimeEntry = async (id: string) => {
        dispatch({ type: 'DELETE_TIME_ENTRY', payload: id });
        await supabase.from('time_entries').delete().eq('id', id);
    };

    const updateStageTemplates = async (ts: StageTaskTemplate[]) => {
        dispatch({ type: 'UPDATE_STAGE_TEMPLATES', payload: ts });
        if (ts.length > 0) {
            const stage = ts[0].stage;
            await supabase.from('stage_task_templates').delete().eq('stage', stage);
            for (const t of ts) {
                await supabase.from('stage_task_templates').insert([{
                    id: t.id, workspace_id: t.workspaceId, stage: t.stage, title: t.title,
                    description: t.description, order_index: t.orderIndex, default_days_offset: t.defaultDaysOffset
                }]);
            }
        }
    };

    const contextValue = {
        ...state, activeWorkspace, clients: filteredClients, tasks: filteredTasks, documents: filteredDocuments,
        clientStageHistory: filteredHistory, timeEntries: filteredTimeEntries, dispatch, getClient, getClientTasks,
        getClientsInStage, getStageHistory, getStageSetting, addActivity, addClient, updateClient, deleteClient, addTask, updateTask,
        deleteTask, updateStageHistory, addStageHistory, updateStageSettings, addDocument, updateDocument, deleteDocument, 
        addWorkspace, updateWorkspace, deleteWorkspace, duplicateWorkspace,
        addMember, updateMember, deleteMember, addTimeEntry, deleteTimeEntry, updateStageTemplates
    };

    if (loading) {
        return (
            <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', color: '#7C5CFC', fontFamily: 'Inter, sans-serif' }}>
                <div style={{ width: 40, height: 40, border: '3px solid #E2E8F0', borderTopColor: '#7C5CFC', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <span style={{ fontWeight: 600, fontSize: 14 }}>Sincronizando tudo com o Supabase...</span>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be inside AppProvider');
    return ctx;
}
