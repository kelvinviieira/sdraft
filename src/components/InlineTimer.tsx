'use client';

import { useState, useEffect, useRef } from 'react';
import { useApp, generateId } from '@/store/AppContext';
import { useToast } from '@/components/ui/Toast';
import { Timer } from 'lucide-react';

interface InlineTimerProps {
    taskId: string;
    clientId: string;
    compact?: boolean;
}

export default function InlineTimer({ taskId, clientId, compact }: InlineTimerProps) {
    const { activeTimerTaskId, dispatch } = useApp();
    const { toast } = useToast();
    const [expanded, setExpanded] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number | null>(null);

    const isRunning = activeTimerTaskId === taskId;

    useEffect(() => {
        if (isRunning && !intervalRef.current) {
            startTimeRef.current = Date.now() - elapsed * 1000;
            intervalRef.current = setInterval(() => {
                setElapsed(Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000));
            }, 1000);
        }
        return () => {
            if (!isRunning && intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isRunning]);

    // If another timer starts, this one should stop counting
    useEffect(() => {
        if (!isRunning && intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, [isRunning]);

    const start = () => {
        if (activeTimerTaskId && activeTimerTaskId !== taskId) {
            toast('Timer anterior pausado', 'info');
        }
        dispatch({ type: 'SET_ACTIVE_TIMER', payload: taskId });
        setExpanded(true);
        startTimeRef.current = Date.now() - elapsed * 1000;
        intervalRef.current = setInterval(() => {
            setElapsed(Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000));
        }, 1000);
    };

    const pause = () => {
        dispatch({ type: 'SET_ACTIVE_TIMER', payload: null });
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    };

    const stop = () => {
        if (elapsed > 0) {
            dispatch({
                type: 'ADD_TIME_ENTRY', payload: {
                    id: generateId(), taskId, clientId, duration: elapsed,
                    notes: 'Timer rápido', date: new Date().toISOString().split('T')[0],
                    createdAt: new Date().toISOString(),
                }
            });
            toast(`${formatTime(elapsed)} registrado!`);
        }
        dispatch({ type: 'SET_ACTIVE_TIMER', payload: null });
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
        setElapsed(0);
        setExpanded(false);
    };

    const formatTime = (s: number) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    const btnStyle = (bg: string, color: string) => ({
        width: 22, height: 22, borderRadius: 5, border: 'none',
        background: bg, color, cursor: 'pointer', display: 'flex' as const,
        alignItems: 'center' as const, justifyContent: 'center' as const, fontSize: 11,
    });

    if (!expanded && !isRunning) {
        return (
            <button onClick={(e) => { e.stopPropagation(); setExpanded(true); }} title="Timer rápido"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 5, border: '1px solid #E2E8F0', background: 'white', cursor: 'pointer', color: '#94A3B8', transition: 'all 0.15s' }}>
                <Timer size={11} />
            </button>
        );
    }

    return (
        <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 6px', borderRadius: 6, background: isRunning ? '#F0FDF4' : '#F8FAFC', border: `1px solid ${isRunning ? '#BBF7D0' : '#E2E8F0'}` }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: isRunning ? '#059669' : '#475569', fontFamily: 'monospace', letterSpacing: '-0.02em' }}>
                {formatTime(elapsed)}
            </span>
            {!isRunning ? (
                <button onClick={start} style={btnStyle('#22C55E', 'white')} title="Iniciar">▶</button>
            ) : (
                <button onClick={pause} style={btnStyle('#F59E0B', 'white')} title="Pausar">⏸</button>
            )}
            <button onClick={stop} style={btnStyle('#EF4444', 'white')} title="Parar e registrar">⏹</button>
            {isRunning && <div style={{ width: 6, height: 6, borderRadius: 3, background: '#22C55E', animation: 'pulse 1.5s infinite' }} />}
        </div>
    );
}
