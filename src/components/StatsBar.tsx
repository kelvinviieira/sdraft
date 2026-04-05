'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, FolderOpen, Timer, TrendingUp } from 'lucide-react';

interface Stat {
    icon: React.ElementType;
    label: string;
    value: number;
    suffix: string;
    color: string;
}

const stats: Stat[] = [
    { icon: CheckCircle2, label: 'Tasks Concluídas', value: 128, suffix: '', color: '#34D399' },
    { icon: FolderOpen, label: 'Projetos Ativos', value: 12, suffix: '', color: '#5B8DEF' },
    { icon: Timer, label: 'Horas Rastreadas', value: 342, suffix: 'h', color: '#7C5CFC' },
    { icon: TrendingUp, label: 'Produtividade', value: 94, suffix: '%', color: '#FBBF24' },
];

function AnimatedNumber({ value, suffix }: { value: number; suffix: string }) {
    const [displayed, setDisplayed] = useState(0);

    useEffect(() => {
        let start = 0;
        const duration = 1200;
        const stepTime = 16;
        const steps = duration / stepTime;
        const increment = value / steps;

        const timer = setInterval(() => {
            start += increment;
            if (start >= value) {
                setDisplayed(value);
                clearInterval(timer);
            } else {
                setDisplayed(Math.floor(start));
            }
        }, stepTime);

        return () => clearInterval(timer);
    }, [value]);

    return (
        <span className="text-lg font-bold" style={{ color: '#0F172A' }}>
            {displayed}{suffix}
        </span>
    );
}

export default function StatsBar() {
    return (
        <div className="flex items-center justify-between px-8 py-5 border-t border-gray-100 animate-fade-in delay-5">
            <div className="flex items-center gap-8">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.label} className="flex items-center gap-3 group cursor-default">
                            <div
                                className="flex items-center justify-center w-9 h-9 rounded-lg transition-transform duration-200 group-hover:scale-110"
                                style={{ background: `${stat.color}15` }}
                            >
                                <Icon size={17} strokeWidth={1.75} style={{ color: stat.color }} />
                            </div>
                            <div className="flex flex-col">
                                <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                                <span className="text-[11px] font-medium" style={{ color: '#64748B' }}>{stat.label}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{ background: 'rgba(124, 92, 252, 0.06)', color: '#7C5CFC' }}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" />
                </svg>
                Powered by Sdraft AI
            </div>
        </div>
    );
}
