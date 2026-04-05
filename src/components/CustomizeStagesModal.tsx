'use client';

import React, { useState } from 'react';
import { useApp, generateId } from '@/store/AppContext';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import { Plus, Trash2, GripVertical, Check, X, Palette, Smile } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { PipelineStage } from '@/types';

interface CustomizeStagesModalProps {
    onClose: () => void;
}
import Picker from '@/components/ui/Picker';

const COLORS = ['#7C5CFC', '#3B82F6', '#22C55E', '#EAB308', '#F97316', '#EF4444', '#06B6D4', '#8B5CF6', '#EC4899', '#64748B'];

export default function CustomizeStagesModal({ onClose }: CustomizeStagesModalProps) {
    const { pipelineStages, dispatch } = useApp();
    const { toast } = useToast();
    
    // Filtramos stages de sistema (churned) que não devem ser editáveis/excluíveis pelo usuário comum
    const [stages, setStages] = useState<PipelineStage[]>(
        [...pipelineStages].sort((a, b) => a.orderIndex - b.orderIndex)
    );

    const [editingStageId, setEditingStageId] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [newStage, setNewStage] = useState<Partial<PipelineStage>>({
        label: '',
        emoji: '📁',
        color: '#7C5CFC',
    });

    const handleSaveStage = async (stage: PipelineStage) => {
        try {
            // Usa name como chave de lookup (id no app = name no DB)
            const { error } = await supabase
                .from('pipeline_stages')
                .update({
                    label: stage.label,
                    color: stage.color,
                    emoji: stage.emoji,
                    bg_light: `${stage.color}14`,
                    order_index: stage.orderIndex,
                    is_system: stage.isSystem || false,
                })
                .eq('name', stage.id);

            if (error) throw error;

            dispatch({ type: 'UPDATE_PIPELINE_STAGE', payload: { ...stage, bgLight: `${stage.color}14` } });
            setEditingStageId(null);
            toast('Etapa atualizada com sucesso!');
        } catch (err: any) {
            console.error('Erro ao salvar etapa:', err?.message ?? err?.code ?? JSON.stringify(err), err);
            toast('Erro ao salvar etapa.');
        }
    };

    const handleAddStage = async () => {
        if (!newStage.label) return;

        try {
            const id = generateId();
            const orderIndex = stages.length > 0 ? Math.max(...stages.map(s => s.orderIndex)) + 1 : 0;

            const stageData: PipelineStage = {
                id,
                name: id,
                label: newStage.label || 'Nova Etapa',
                color: newStage.color || '#7C5CFC',
                emoji: newStage.emoji || '📁',
                bgLight: `${newStage.color || '#7C5CFC'}14`,
                orderIndex,
                isSystem: false
            };

            const { error } = await supabase
                .from('pipeline_stages')
                .insert({
                    id: stageData.id,
                    name: stageData.id,
                    label: stageData.label,
                    color: stageData.color,
                    emoji: stageData.emoji,
                    bg_light: stageData.bgLight,
                    order_index: stageData.orderIndex,
                    is_system: false
                });

            if (error) throw error;

            dispatch({ type: 'ADD_PIPELINE_STAGE', payload: stageData });
            setStages([...stages, stageData]);
            setIsAdding(false);
            setNewStage({ label: '', emoji: '📁', color: '#7C5CFC' });
            toast('Nova etapa adicionada!');
        } catch (err: any) {
            console.error('Erro ao adicionar etapa:', err?.message ?? err?.code ?? JSON.stringify(err), err);
            toast('Erro ao adicionar etapa.');
        }
    };

    const handleDeleteStage = async (id: string) => {
        if (window.confirm('Tem certeza? Isso pode afetar clientes que estão nesta etapa.')) {
            try {
                // id no app = name no DB
                const { error } = await supabase
                    .from('pipeline_stages')
                    .delete()
                    .eq('name', id);

                if (error) throw error;

                dispatch({ type: 'DELETE_PIPELINE_STAGE', payload: id });
                setStages(stages.filter(s => s.id !== id));
                toast('Etapa excluída.');
            } catch (err: any) {
                console.error('Erro ao excluir etapa:', err?.message ?? err?.code ?? JSON.stringify(err), err);
                toast('Erro ao excluir etapa.');
            }
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Personalizar Etapas do Pipeline">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 450 }}>
                <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
                    Configure as etapas do seu processo comercial. Você pode renomear, mudar cores ou adicionar novas colunas ao seu Kanban.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {stages.map((stage) => (
                        <div 
                            key={stage.id} 
                            style={{ 
                                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', 
                                background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' 
                            }}
                        >
                            <GripVertical size={16} color="#CBD5E1" style={{ cursor: 'grab' }} />
                            
                            {editingStageId === stage.id ? (
                                <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: 8 }}>
                                    <Picker 
                                        value={stage.emoji} 
                                        onChange={(e) => setStages(stages.map(s => s.id === stage.id ? { ...s, emoji: e } : s))}
                                        type="emoji"
                                    />
                                    <input 
                                        value={stage.label} 
                                        onChange={(e) => setStages(stages.map(s => s.id === stage.id ? { ...s, label: e.target.value } : s))}
                                        style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13.5, fontWeight: 600 }}
                                    />
                                    <Picker 
                                        value={stage.color} 
                                        onChange={(c) => setStages(stages.map(s => s.id === stage.id ? { ...s, color: c } : s))}
                                        type="color"
                                    />
                                    <button onClick={() => handleSaveStage(stage)} style={{ background: '#22C55E', color: 'white', border: 'none', borderRadius: 6, padding: '6px', cursor: 'pointer' }}><Check size={16} /></button>
                                    <button onClick={() => setEditingStageId(null)} style={{ background: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: 6, padding: '6px', cursor: 'pointer' }}><X size={16} /></button>
                                </div>
                            ) : (
                                <>
                                    <span style={{ fontSize: 18 }}>{stage.emoji}</span>
                                    <div style={{ flex: 1 }}>
                                        <span style={{ fontSize: 14, fontWeight: 600, color: stage.color }}>{stage.label}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {!stage.isSystem && (
                                            <>
                                                <button 
                                                    onClick={() => setEditingStageId(stage.id)} 
                                                    style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4 }}
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteStage(stage.id)}
                                                    style={{ background: 'none', border: 'none', color: '#FDA4AF', cursor: 'pointer', padding: 4 }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                    
                    {isAdding ? (
                        <div style={{ 
                            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', 
                            background: '#fff', borderRadius: 12, border: '2px dashed #CBD5E1' 
                        }}>
                             <Picker 
                                value={newStage.emoji || '📁'} 
                                onChange={(e) => setNewStage({ ...newStage, emoji: e })}
                                type="emoji"
                            />
                            <input 
                                autoFocus
                                placeholder="Nome da Etapa..."
                                value={newStage.label} 
                                onChange={(e) => setNewStage({ ...newStage, label: e.target.value })}
                                style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13.5 }}
                            />
                            <Picker 
                                value={newStage.color || '#7C5CFC'} 
                                onChange={(c) => setNewStage({ ...newStage, color: c })}
                                type="color"
                            />
                            <button onClick={handleAddStage} style={{ background: '#7C5CFC', color: 'white', border: 'none', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Adicionar</button>
                            <button onClick={() => setIsAdding(false)} style={{ background: 'none', color: '#64748B', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setIsAdding(true)}
                            style={{ 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', 
                                border: '2px dashed #E2E8F0', borderRadius: 12, background: 'none', color: '#64748B', 
                                fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s'
                            }}
                        >
                            <Plus size={18} /> Adicionar Nova Etapa
                        </button>
                    )}
                </div>

                <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                        onClick={onClose} 
                        style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#7C5CFC', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                    >
                        Concluído
                    </button>
                </div>
            </div>
        </Modal>
    );
}

// Pequeno mock do Edit2 que faltou no import do linter se necessário
function Edit2({ size }: { size: number }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>;
}
