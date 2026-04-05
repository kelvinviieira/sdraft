'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Check, X, ChevronDown, ChevronRight, MoreHorizontal, GripVertical } from 'lucide-react';
import { TaskChecklist, ChecklistItem } from '@/types';
import { generateId } from '@/store/AppContext';

interface ChecklistManagerProps {
    checklists: TaskChecklist[];
    onChange: (checklists: TaskChecklist[]) => void;
}

export default function ChecklistManager({ checklists, onChange }: ChecklistManagerProps) {
    const [expandedChecklists, setExpandedChecklists] = useState<Record<string, boolean>>(
        checklists.reduce((acc, c) => ({ ...acc, [c.id]: true }), {})
    );

    const addChecklist = () => {
        const newChecklist: TaskChecklist = {
            id: generateId(),
            title: 'Checklist',
            items: []
        };
        const updated = [...checklists, newChecklist];
        onChange(updated);
        setExpandedChecklists(prev => ({ ...prev, [newChecklist.id]: true }));
    };

    const removeChecklist = (id: string) => {
        onChange(checklists.filter(c => c.id !== id));
    };

    const updateChecklistTitle = (id: string, title: string) => {
        onChange(checklists.map(c => c.id === id ? { ...c, title } : c));
    };

    const addItem = (checklistId: string) => {
        onChange(checklists.map(c => {
            if (c.id === checklistId) {
                return {
                    ...c,
                    items: [...c.items, { id: generateId(), title: '', completed: false }]
                };
            }
            return c;
        }));
    };

    const updateItem = (checklistId: string, itemId: string, updates: Partial<ChecklistItem>) => {
        onChange(checklists.map(c => {
            if (c.id === checklistId) {
                return {
                    ...c,
                    items: c.items.map(item => item.id === itemId ? { ...item, ...updates } : item)
                };
            }
            return c;
        }));
    };

    const removeItem = (checklistId: string, itemId: string) => {
        onChange(checklists.map(c => {
            if (c.id === checklistId) {
                return {
                    ...c,
                    items: c.items.filter(item => item.id !== itemId)
                };
            }
            return c;
        }));
    };

    const toggleExpand = (id: string) => {
        setExpandedChecklists(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const totalItems = checklists.reduce((acc, c) => acc + c.items.length, 0);
    const completedItems = checklists.reduce((acc, c) => acc + c.items.filter(i => i.completed).length, 0);
    const overallProgress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 10 }}>
            {/* Overall Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', margin: 0 }}>Checklists</h3>
                    {totalItems > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 80, height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ width: `${overallProgress}%`, height: '100%', background: '#7C5CFC', transition: 'width 0.3s' }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>{completedItems}/{totalItems}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Checklists List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {checklists.map((checklist) => {
                    const isExpanded = expandedChecklists[checklist.id];
                    const itemsCount = checklist.items.length;
                    const doneCount = checklist.items.filter(i => i.completed).length;

                    return (
                        <div key={checklist.id} style={{ 
                            border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden',
                            background: 'white', transition: 'all 0.2s'
                        }}>
                            {/* Checklist Header */}
                            <div style={{ 
                                padding: '10px 14px', background: '#F8FAFC', borderBottom: isExpanded ? '1px solid #E2E8F0' : 'none',
                                display: 'flex', alignItems: 'center', gap: 10
                            }}>
                                <button 
                                    onClick={() => toggleExpand(checklist.id)}
                                    style={{ background: 'none', border: 'none', padding: 0, color: '#94A3B8', cursor: 'pointer', display: 'flex' }}
                                >
                                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                </button>
                                
                                <input 
                                    value={checklist.title}
                                    onChange={(e) => updateChecklistTitle(checklist.id, e.target.value)}
                                    style={{ 
                                        flex: 1, background: 'none', border: 'none', outline: 'none',
                                        fontSize: 12, fontWeight: 700, color: '#475569', padding: '2px 4px'
                                    }}
                                    placeholder="Nome do Checklist..."
                                />

                                <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', marginRight: 4 }}>
                                    {doneCount} de {itemsCount}
                                </div>

                                <button 
                                    onClick={() => removeChecklist(checklist.id)}
                                    style={{ background: 'none', border: 'none', color: '#FDA4AF', cursor: 'pointer', padding: 4 }}
                                    title="Remover Checklist"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            {/* Items List */}
                            {isExpanded && (
                                <div style={{ padding: '8px 0', display: 'flex', flexDirection: 'column' }}>
                                    {checklist.items.map((item) => (
                                        <div key={item.id} style={{ 
                                            display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px',
                                            transition: 'background 0.1s'
                                        }}>
                                            <button 
                                                onClick={() => updateItem(checklist.id, item.id, { completed: !item.completed })}
                                                style={{ 
                                                    width: 18, height: 18, borderRadius: 9, border: `2px solid ${item.completed ? '#7C5CFC' : '#CBD5E1'}`,
                                                    background: item.completed ? '#7C5CFC' : 'white', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                                                    transition: 'all 0.15s'
                                                }}
                                            >
                                                {item.completed && <Check size={12} color="white" />}
                                            </button>

                                            <input 
                                                value={item.title}
                                                onChange={(e) => updateItem(checklist.id, item.id, { title: e.target.value })}
                                                style={{ 
                                                    flex: 1, border: 'none', outline: 'none', fontSize: 13,
                                                    color: item.completed ? '#94A3B8' : '#334155',
                                                    textDecoration: item.completed ? 'line-through' : 'none',
                                                    background: 'none', padding: '4px 0'
                                                }}
                                                placeholder="Novo item..."
                                            />

                                            <button 
                                                onClick={() => removeItem(checklist.id, item.id)}
                                                style={{ background: 'none', border: 'none', color: '#E2E8F0', cursor: 'pointer', padding: 4 }}
                                                className="hover-show"
                                            >
                                                <X size={14} />
                                            </button>
                                            
                                            <style>{`.hover-show:hover { color: #FDA4AF !important; }`}</style>
                                        </div>
                                    ))}

                                    <button 
                                        onClick={() => addItem(checklist.id)}
                                        style={{ 
                                            margin: '8px 14px 4px', padding: '6px 0', borderRadius: 8,
                                            border: 'none', background: 'none', color: '#7C5CFC',
                                            fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: 6, width: 'fit-content'
                                        }}
                                    >
                                        <Plus size={14} /> Adicionar item
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <button 
                onClick={addChecklist}
                style={{ 
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
                    borderRadius: 12, border: '2px dashed #E2E8F0', background: 'white',
                    color: '#64748B', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.2s', marginTop: 4
                }}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = '#7C5CFC', e.currentTarget.style.color = '#7C5CFC')}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = '#E2E8F0', e.currentTarget.style.color = '#64748B')}
            >
                <Plus size={16} /> Adicionar checklist
            </button>
        </div>
    );
}
