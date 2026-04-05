'use client';

import { useState, useRef, useEffect } from 'react';

export const COLORS = [
    '#7C5CFC', '#3B82F6', '#22C55E', '#EF4444', '#F97316', '#EC4899', '#06B6D4', '#8B5CF6',
    '#1E293B', '#F59E0B', '#10B981', '#6366F1', '#D946EF', '#F43F5E', '#14B8A6', '#FACC15',
    '#FB923C', '#A855F7', '#64748B', '#475569', '#0F172A', '#059669', '#DC2626', '#2563EB'
];

export const EMOJIS = [
    '📂', '🏢', '🌐', '🚀', '💡', '🛡️', '⚖️', '🛒', '🛠️', '📱', '💻', '📈', '📦', '🏥', '🎓', '🏗️', 
    '🎨', '👔', '🔐', '📡', '💎', '🔥', '⭐️', '🎯', '🏦', '🏠', '🚜', '🚛', '⚙️', '💊', '🔋', '🎁', 
    '📅', '🎉', '💬', '📢', '🔔', '📧', '📍', '🗺️', '🔍', '🖇️', '📝', '📊', '📉', '📤', '📥', '🤝',
    '💸', '💰', '💳', '🏧', '🪙', '🩺', '🔬', '🔭', '🛰️', '⚡️', '🍏', '🍕', '☕️', '🎮', '🎧',
    '👓', '😎'
];

interface PickerProps {
    value: string;
    onChange: (val: string) => void;
    type: 'color' | 'emoji';
}

export default function Picker({ value, onChange, type }: PickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} style={{ position: 'relative' }}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: type === 'color' ? 36 : 42,
                    height: type === 'color' ? 36 : 42,
                    borderRadius: 10,
                    background: type === 'color' ? value : 'white',
                    border: '1px solid #E2E8F0',
                    fontSize: type === 'emoji' ? 20 : 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s',
                }}
            >
                {type === 'emoji' ? value : ''}
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '110%',
                    left: 0,
                    zIndex: 1000,
                    background: 'white',
                    border: '1px solid #E2E8F0',
                    borderRadius: 14,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                    padding: 12,
                    width: type === 'color' ? 220 : 280,
                    maxHeight: 250,
                    overflowY: 'auto',
                    display: 'grid',
                    gridTemplateColumns: `repeat(${type === 'color' ? 5 : 6}, 1fr)`,
                    gap: 6,
                }}>
                    {(type === 'color' ? COLORS : EMOJIS).map((item) => (
                        <button
                            key={item}
                            type="button"
                            onClick={() => {
                                onChange(item);
                                setIsOpen(false);
                            }}
                            style={{
                                width: '100%',
                                aspectRatio: '1',
                                background: type === 'color' ? item : 'white',
                                border: value === item ? `2px solid ${type === 'color' ? '#0F172A' : '#7C5CFC'}` : '1px solid #F1F5F9',
                                borderRadius: 8,
                                cursor: 'pointer',
                                fontSize: type === 'emoji' ? 20 : 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'transform 0.1s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            {type === 'emoji' ? item : ''}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
