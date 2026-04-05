'use client';

import { createContext, useContext, useState, useCallback } from 'react';

interface ToastMsg {
    id: number | string;
    text: string;
    type: 'success' | 'error' | 'info';
}

interface ToastCtx {
    toast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastCtx>({ toast: () => { } });

export function useToast() {
    return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastMsg[]>([]);

    const toast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
        const id = `${Date.now()}-${Math.random()}`;
        setToasts(prev => [...prev, { id, text, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    const colors = {
        success: { bg: '#D1FAE5', border: '#059669', text: '#065F46' },
        error: { bg: '#FEE2E2', border: '#DC2626', text: '#991B1B' },
        info: { bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF' },
    };

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            {/* Toast container */}
            <div style={{
                position: 'fixed',
                top: 20,
                right: 20,
                zIndex: 200,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                pointerEvents: 'none',
            }}>
                {toasts.map(t => (
                    <div
                        key={t.id}
                        style={{
                            padding: '12px 20px',
                            borderRadius: 12,
                            background: colors[t.type].bg,
                            borderLeft: `3px solid ${colors[t.type].border}`,
                            color: colors[t.type].text,
                            fontSize: 13,
                            fontWeight: 500,
                            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                            animation: 'toast-in 0.3s ease-out',
                            pointerEvents: 'auto',
                            fontFamily: 'inherit',
                        }}
                    >
                        {t.text}
                    </div>
                ))}
            </div>
            <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
        </ToastContext.Provider>
    );
}
