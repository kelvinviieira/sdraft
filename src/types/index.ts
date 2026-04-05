// ── Core Types ──

export type Priority = 'Alta' | 'Média' | 'Baixa';
export type TaskStatus = 'A Fazer' | 'Em Progresso' | 'Revisão' | 'Concluído';

// ── Client Pipeline Types ──

export type ClientStage = string; // Agora é dinâmico, baseado no ID da etapa
export type ClientTaskStatus = 'todo' | 'in_progress' | 'done';

export interface PipelineStage {
    id: string;
    name: string;
    label: string;
    color: string;
    emoji: string;
    bgLight: string;
    orderIndex: number;
    isSystem?: boolean; // Se é uma etapa fixa do sistema (ex: churned)
}

export interface Workspace {
    id: string;
    name: string;
    createdAt: string;
}


export interface Client {
    id: string;
    workspaceId: string;
    name: string;
    company: string;
    email: string;
    phone: string;
    color: string;
    emoji: string;
    stage: ClientStage;
    contractDate: string;        // ISO date
    stageStartedAt: string;      // ISO datetime
    stageDueDate: string | null; // ISO date
    notes: string;
    tags: string[];
    createdAt: string;
}

export interface ClientStageHistory {
    id: string;
    clientId: string;
    stage: ClientStage;
    startedAt: string;
    completedAt: string | null;
    plannedDays: number;
    actualDays: number | null;
    notes: string;
}



export interface StageTaskTemplate {
    id: string;
    workspaceId: string;
    stage: ClientStage;
    title: string;
    description: string;
    orderIndex: number;
    defaultDaysOffset: number;
}

export interface StageSetting {
    id: string;
    workspaceId: string;
    stage: ClientStage;
    businessDays: number;
    updatedAt: string;
}



export interface ChecklistItem {
    id: string;
    title: string;
    completed: boolean;
}

export interface TaskChecklist {
    id: string;
    title: string;
    items: ChecklistItem[];
}

export interface Task {
    id: string;
    title: string;
    description: string;
    clientId: string;
    stage?: ClientStage;
    assigneeId?: string;
    status: TaskStatus;
    priority: Priority;
    tags: string[];
    startDate: string;
    deadline: string;
    estimatedHours: number;
    loggedHours: number;
    checklists?: TaskChecklist[];
    createdAt: string;
    orderIndex?: number;
}

export interface Member {
    id: string;
    name: string;
    initial: string;
    color: string;
}

export interface ClientDocument {
    id: string;
    clientId: string;
    title: string;
    content: string; // JSON de blocos do BlockNote
    updatedAt: string;
    createdAt: string;
}

export interface TimeEntry {
    id: string;
    taskId: string;
    clientId: string;
    duration: number;
    notes: string;
    date: string;
    createdAt: string;
}

export interface Activity {
    id: string;
    userId: string;
    userName: string;
    userInitial: string;
    userColor: string;
    action: string;
    projectName: string;
    timestamp: string;
}

// ── Store Types ──

export interface AppState {
    clients: Client[];
    tasks: Task[];
    clientStageHistory: ClientStageHistory[];
    stageTaskTemplates: StageTaskTemplate[];
    stageSettings: StageSetting[];
    timeEntries: TimeEntry[];
    activities: Activity[];
    members: Member[];
    documents: ClientDocument[];
    activeTimerTaskId: string | null;
    workspaces: Workspace[];
    activeWorkspaceId: string;
    pipelineStages: PipelineStage[];
}

export type AppAction =
    | { type: 'ADD_CLIENT'; payload: Client }
    | { type: 'UPDATE_CLIENT'; payload: Client }
    | { type: 'DELETE_CLIENT'; payload: string }
    | { type: 'ADD_STAGE_HISTORY'; payload: ClientStageHistory }
    | { type: 'UPDATE_STAGE_HISTORY'; payload: ClientStageHistory }
    | { type: 'UPDATE_STAGE_SETTINGS'; payload: StageSetting[] }
    | { type: 'UPDATE_STAGE_TEMPLATES'; payload: StageTaskTemplate[] }

    | { type: 'ADD_TASK'; payload: Task }
    | { type: 'UPDATE_TASK'; payload: Task }
    | { type: 'DELETE_TASK'; payload: string }
    | { type: 'MOVE_TASK'; payload: { id: string; status: TaskStatus } }
    | { type: 'ADD_TIME_ENTRY'; payload: TimeEntry }
    | { type: 'DELETE_TIME_ENTRY'; payload: string }
    | { type: 'ADD_ACTIVITY'; payload: Activity }
    | { type: 'ADD_MEMBER'; payload: Member }
    | { type: 'UPDATE_MEMBER'; payload: Member }
    | { type: 'DELETE_MEMBER'; payload: string }
    | { type: 'ADD_DOCUMENT'; payload: ClientDocument }
    | { type: 'UPDATE_DOCUMENT'; payload: ClientDocument }
    | { type: 'DELETE_DOCUMENT'; payload: string }
    | { type: 'SET_ACTIVE_TIMER'; payload: string | null }
    | { type: 'ADD_WORKSPACE'; payload: Workspace }
    | { type: 'UPDATE_WORKSPACE'; payload: Workspace }
    | { type: 'DELETE_WORKSPACE'; payload: string }
    | { type: 'DUPLICATE_WORKSPACE'; payload: string } // Payload is the ID of the workspace to duplicate
    | { type: 'SET_ACTIVE_WORKSPACE'; payload: string }
    | { type: 'ADD_PIPELINE_STAGE'; payload: PipelineStage }
    | { type: 'UPDATE_PIPELINE_STAGE'; payload: PipelineStage }
    | { type: 'DELETE_PIPELINE_STAGE'; payload: string }
    | { type: 'SET_INITIAL_DATA'; payload: Partial<AppState> };

