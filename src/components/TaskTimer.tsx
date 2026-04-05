'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square } from 'lucide-react';
import { useApp, generateId } from '@/store/AppContext';
import { useToast } from '@/components/ui/Toast';
import type { Task } from '@/types';

function formatTimeShort(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

interface TaskTimerProps {
    task: Task;
}

export default function TaskTimer({ task }: TaskTimerProps) {
    const { dispatch } = useApp();
    const { toast } = useToast();
    const [isRunning, setIsRunning] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isRunning]);

    const handleStop = () => {
        if (elapsed < 60) {
            toast('Sessão deve ter pelo menos 1 minuto', 'error');
            setIsRunning(false);
            setElapsed(0);
            return;
        }
        dispatch({
            type: 'ADD_TIME_ENTRY',
            payload: {
                id: generateId(),
                taskId: task.id,
                clientId: task.clientId || '',
                duration: elapsed,
                notes: '',
                date: new Date().toISOString().split('T')[0],
                createdAt: new Date().toISOString(),
            },
        });
        dispatch({
            type: 'UPDATE_TASK',
            payload: { ...task, loggedHours: task.loggedHours + elapsed / 3600, status: 'Em Progresso' },
        });
        const h = Math.floor(elapsed / 3600);
        const m = Math.floor((elapsed % 3600) / 60);
        toast(`${h > 0 ? `${h}h ` : ''}${m}m registrado em "${task.title}"!`);
        setIsRunning(false);
        setElapsed(0);
    };

    const isActive = isRunning || elapsed > 0;

    return (
        <div
            style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: isActive ? '4px 8px' : '4px 6px',
                borderRadius: 8,
                background: isActive ? (isRunning ? '#F0EDFF' : '#FEF3C7') : 'transparent',
                border: isActive ? `1px solid ${isRunning ? '#DDD6FE' : '#FDE68A'}` : '1px solid transparent',
                transition: 'all 0.2s ease',
            }}
            onClick={e => e.stopPropagation()}
        >
            {/* Elapsed display */}
            {isActive && (
                <span style={{
                    fontSize: 11, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                    color: isRunning ? '#7C5CFC' : '#D97706',
                    letterSpacing: 0.5, minWidth: elapsed >= 3600 ? 44 : 34,
                }}>
                    {formatTimeShort(elapsed)}
                </span>
            )}

            {/* Controls */}
            {!isRunning ? (
                <button
                    onClick={() => setIsRunning(true)}
                    title="Iniciar timer"
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 24, height: 24, borderRadius: 6, border: 'none', cursor: 'pointer',
                        background: isActive ? 'transparent' : '#F0FDF4',
                        color: '#22C55E',
                        transition: 'all 0.15s',
                    }}
                >
                    <Play size={11} fill="#22C55E" />
                </button>
            ) : (
                <>
                    <button
                        onClick={() => setIsRunning(false)}
                        title="Pausar"
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 24, height: 24, borderRadius: 6, border: 'none', cursor: 'pointer',
                            background: 'transparent', color: '#D97706',
                        }}
                    >
                        <Pause size={11} fill="#D97706" />
                    </button>
                    <button
                        onClick={handleStop}
                        title="Finalizar e registrar"
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 24, height: 24, borderRadius: 6, border: 'none', cursor: 'pointer',
                            background: 'transparent', color: '#EF4444',
                        }}
                    >
                        <Square size={10} fill="#EF4444" />
                    </button>
                </>
            )}
        </div>
    );
}
