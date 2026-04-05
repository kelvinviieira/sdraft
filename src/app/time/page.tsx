'use client';

import { useState } from 'react';
import { useApp } from '@/store/AppContext';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Plus, Trash2, Pencil, Users } from 'lucide-react';
import { generateId } from '@/store/AppContext';

export default function TeamPage() {
    const { members, dispatch, addMember, updateMember, deleteMember } = useApp();
    const { toast } = useToast();
    
    const [modalOpen, setModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<{id: string, name: string} | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [name, setName] = useState('');

    const openCreate = () => {
        setEditingMember(null);
        setName('');
        setModalOpen(true);
    };

    const openEdit = (member: {id: string, name: string}) => {
        setEditingMember(member);
        setName(member.name);
        setModalOpen(true);
    };

    const saveMember = () => {
        if (!name.trim()) return toast('Nome é obrigatório', 'error');
        
        const colors = ['#7C5CFC', '#5B8DEF', '#F59E0B', '#EF4444', '#10B981', '#6366F1'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const initial = name.charAt(0).toUpperCase();

        if (editingMember) {
            const memberToUpdate = members.find(m => m.id === editingMember.id);
            if(memberToUpdate) {
                updateMember({ ...memberToUpdate, name, initial });
                toast('Membro atualizado!');
            }
        } else {
            addMember({ id: generateId(), name, initial, color: randomColor });
            toast('Novo membro adicionado!');
        }
        setModalOpen(false);
    };

    const handleDelete = () => {
        if (!deleteId) return;
        deleteMember(deleteId);
        toast('Membro removido da equipe');
        setDeleteId(null);
    };

    return (
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Users size={24} style={{ color: '#7C5CFC' }} /> Minha Equipe
                </h1>
                <button onClick={openCreate} style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px',
                    borderRadius: 10, border: 'none', background: '#7C5CFC', color: 'white',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                }}>
                    <Plus size={16} /> Novo Membro
                </button>
            </div>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {members.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8' }}>Nenhum membro cadastrado na equipe.</div>
                ) : (
                    members.map(member => (
                        <div key={member.id} style={{
                            display: 'flex', alignItems: 'center', padding: '16px 20px',
                            background: 'white', borderRadius: 12, border: '1px solid #E2E8F0',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.02)', justifyContent: 'space-between'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: '50%',
                                    background: member.color, display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', color: 'white', fontWeight: 'bold'
                                }}>
                                    {member.initial}
                                </div>
                                <span style={{ fontSize: 15, fontWeight: 600, color: '#1E293B' }}>{member.name}</span>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <button onClick={() => openEdit(member)} title="Editar" style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    width: 32, height: 32, borderRadius: 8, border: '1px solid #E2E8F0',
                                    background: 'white', color: '#64748B', cursor: 'pointer',
                                }}><Pencil size={14} /></button>
                                <button onClick={() => setDeleteId(member.id)} title="Deletar" style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    width: 32, height: 32, borderRadius: 8, border: '1px solid #FEE2E2',
                                    background: 'white', color: '#DC2626', cursor: 'pointer',
                                }}><Trash2 size={14} /></button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingMember ? 'Editar Membro' : 'Novo Membro'}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Nome do Membro *</label>
                        <input value={name} onChange={(e) => setName(e.target.value)}
                            style={{ width: '100%', padding: '9px 14px', borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                            placeholder="Ex: Kelvin" autoFocus />
                    </div>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                        <button onClick={() => setModalOpen(false)} style={{
                            padding: '9px 20px', borderRadius: 10, border: '1px solid #E2E8F0',
                            background: 'white', color: '#475569', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                        }}>Cancelar</button>
                        <button onClick={saveMember} style={{
                            padding: '9px 20px', borderRadius: 10, border: 'none',
                            background: '#7C5CFC', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        }}>{editingMember ? 'Salvar' : 'Adicionar'}</button>
                    </div>
                </div>
            </Modal>

            <ConfirmDialog
                isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
                title="Remover Membro" message="Tem certeza que deseja remover este membro da equipe?"
                confirmLabel="Remover"
            />
        </div>
    );
}
