'use client';

import type { LucideIcon } from 'lucide-react';

interface ActionCardProps {
    icon: LucideIcon;
    iconBg: string;
    iconColor: string;
    title: string;
    description: string;
    label: string;
    delay?: string;
}

export default function ActionCard({
    icon: Icon,
    iconBg,
    iconColor,
    title,
    description,
    label,
    delay = 'delay-1',
}: ActionCardProps) {
    return (
        <div
            className={`animate-slide-up ${delay}`}
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                padding: '24px 24px 20px',
                borderRadius: 20,
                background: 'rgba(255, 255, 255, 0.85)',
                border: '1px solid rgba(226, 232, 240, 0.8)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 16px 40px rgba(124, 92, 252, 0.08), 0 0 0 1px rgba(124, 92, 252, 0.08)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
            }}
        >
            {/* Icon */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: iconBg,
                    transition: 'transform 0.3s ease',
                }}
            >
                <Icon size={24} strokeWidth={1.75} style={{ color: iconColor }} />
            </div>

            {/* Text */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#0F172A',
                    lineHeight: 1.5,
                }}>
                    {title}
                </p>
            </div>

            {/* Label */}
            <span style={{
                fontSize: 12,
                fontWeight: 500,
                color: '#94A3B8',
                marginTop: 'auto',
            }}>
                {label}
            </span>
        </div>
    );
}
