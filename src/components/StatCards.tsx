'use client';

import { ClipboardList, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface StatCardProps {
    icon: React.ElementType;
    label: string;
    value: number;
    change: string;
    changeType: 'up' | 'down';
    iconBg: string;
    iconColor: string;
}

const stats: StatCardProps[] = [
    {
        icon: ClipboardList,
        label: 'Total de tasks',
        value: 27,
        change: '+7% do mês passado',
        changeType: 'up',
        iconBg: '#F0EDFF',
        iconColor: '#7C5CFC',
    },
    {
        icon: RefreshCw,
        label: 'Em progresso',
        value: 3,
        change: '-3% do mês passado',
        changeType: 'down',
        iconBg: '#FEF3C7',
        iconColor: '#D97706',
    },
    {
        icon: CheckCircle2,
        label: 'Concluídas',
        value: 10,
        change: '+5% do mês passado',
        changeType: 'up',
        iconBg: '#D1FAE5',
        iconColor: '#059669',
    },
    {
        icon: AlertCircle,
        label: 'Atrasadas',
        value: 1,
        change: '-2% do mês passado',
        changeType: 'down',
        iconBg: '#FEE2E2',
        iconColor: '#DC2626',
    },
];

function StatCard({ icon: Icon, label, value, change, changeType, iconBg, iconColor }: StatCardProps) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            padding: '20px',
            borderRadius: 16,
            background: 'white',
            border: '1px solid #F1F5F9',
            flex: 1,
            minWidth: 0,
            transition: 'all 0.2s ease',
            cursor: 'default',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#64748B' }}>{label}</span>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: iconBg,
                }}>
                    <Icon size={16} strokeWidth={2} style={{ color: iconColor }} />
                </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: '#0F172A', lineHeight: 1 }}>{value}</span>
            </div>
            <span style={{
                fontSize: 11.5,
                fontWeight: 500,
                color: changeType === 'up' ? '#059669' : '#DC2626',
            }}>
                {changeType === 'up' ? '↑' : '↓'} {change}
            </span>
        </div>
    );
}

export default function StatCards() {
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 14,
        }}>
            {stats.map((stat) => (
                <StatCard key={stat.label} {...stat} />
            ))}
        </div>
    );
}
