'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';

export default function DashboardHeader() {
    const [time, setTime] = useState<string | null>(null);

    useEffect(() => {
        const update = () => {
            const now = new Date();
            setTime(
                now.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                })
            );
        };
        update();
        const interval = setInterval(update, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <header className="animate-fade-in" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 32px 12px',
        }}>
            {/* Left - Version chip */}
            <button style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 9999,
                border: '1px solid #E2E8F0',
                background: 'white',
                color: '#475569',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
            }}>
                <Sparkles size={14} strokeWidth={2} style={{ color: '#7C5CFC' }} />
                Sdraft v1.0
                <ChevronDown size={14} style={{ color: '#94A3B8' }} />
            </button>

            {/* Center - App name + time */}
            <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>
                Daily Sdraft
            </span>

            {/* Right - Upgrade button */}
            <button style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 18px',
                borderRadius: 9999,
                border: 'none',
                background: '#0F172A',
                color: 'white',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
            }}>
                <Sparkles size={14} strokeWidth={2} />
                Upgrade
            </button>
        </header>
    );
}
