import { useState, useEffect } from 'react';
import { useApp, generateId, addBusinessDays, STAGE_CONFIG } from '@/store/AppContext';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import type { Client, Task } from '@/types';

import Picker from '@/components/ui/Picker';

interface NewClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    clientToEdit?: Client | null;
}

export default function NewClientModal({ isOpen, onClose, clientToEdit }: NewClientModalProps) {
    const { stageTaskTemplates, stageSettings, activeWorkspaceId, pipelineStages, addClient, updateClient, addTask } = useApp();
    const { toast } = useToast();

    const firstStage = pipelineStages.filter(s => !s.isSystem).sort((a,b) => a.orderIndex - b.orderIndex)[0] || { id: 'contract' };
    const [form, setForm] = useState({
        name: '',
        company: '',
        email: '',
        phone: '',
        color: '#7C5CFC',
        emoji: '📁',
        contractDate: new Date().toISOString().split('T')[0],
        tags: '',
        notes: '',
    });

    useEffect(() => {
        if (clientToEdit && isOpen) {
            setForm({
                name: clientToEdit.name,
                company: clientToEdit.company,
                email: clientToEdit.email,
                phone: clientToEdit.phone,
                color: clientToEdit.color,
                emoji: clientToEdit.emoji,
                contractDate: clientToEdit.contractDate,
                tags: clientToEdit.tags.join(', '),
                notes: clientToEdit.notes,
            });
        } else if (isOpen) {
            resetForm();
        }
    }, [clientToEdit, isOpen]);

    const resetForm = () => {
        setForm({
            name: '', company: '', email: '', phone: '',
            color: '#7C5CFC', emoji: '📁',
            contractDate: new Date().toISOString().split('T')[0],
            tags: '', notes: '',
        });
    };

    const handleSave = () => {
        if (!form.name.trim()) return toast('Nome do cliente é obrigatório', 'error');
        if (!form.contractDate) return toast('Data do contrato é obrigatória', 'error');

        const now = new Date().toISOString();

        if (clientToEdit) {
            const updated: Client = {
                ...clientToEdit,
                name: form.name.trim(),
                company: form.company.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                color: form.color,
                emoji: form.emoji,
                contractDate: form.contractDate,
                notes: form.notes.trim(),
                tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
            };
            updateClient(updated);
            toast(`Cliente "${form.name}" atualizado com sucesso!`);
        } else {
            const clientId = generateId();
            const contractSetting = stageSettings.find(s => s.stage === firstStage.id);
            const contractDays = contractSetting?.businessDays || 2;

            const newClient: Client = {
                id: clientId,
                workspaceId: activeWorkspaceId,
                name: form.name.trim(),
                company: form.company.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                color: form.color,
                emoji: form.emoji,
                stage: firstStage.id,
                contractDate: form.contractDate,
                stageStartedAt: now,
                stageDueDate: contractDays > 0 ? addBusinessDays(form.contractDate, contractDays) : null,
                notes: form.notes.trim(),
                tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
                createdAt: now,
            };

            addClient(newClient);

            // Auto-create tasks from templates for first stage
            const templates = stageTaskTemplates.filter(t => t.stage === firstStage.id).sort((a, b) => a.orderIndex - b.orderIndex);
            templates.forEach((tpl, idx) => {
                const task: Task = {
                    id: generateId(),
                    clientId: clientId,
                    stage: firstStage.id,
                    title: tpl.title,
                    description: tpl.description,
                    status: 'A Fazer',
                    priority: 'Média',
                    assigneeId: 'm1',
                    tags: [],
                    startDate: now.split('T')[0],
                    estimatedHours: 1,
                    loggedHours: 0,
                    deadline: tpl.defaultDaysOffset > 0 ? addBusinessDays(form.contractDate, tpl.defaultDaysOffset) : form.contractDate.split('T')[0],
                    orderIndex: idx,
                    createdAt: now,
                };
                addTask(task);
            });

            toast(`Cliente "${form.name}" criado com sucesso!`);
        }
        
        onClose();
    };

    const inputStyle = { width: '100%', padding: '9px 14px', borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 13, fontFamily: 'inherit', outline: 'none' };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={clientToEdit ? "Editar Cliente" : "Novo Cliente"} width={520}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Nome do cliente *</label>
                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} placeholder="Nome do cliente" />
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Empresa</label>
                    <input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} style={inputStyle} placeholder="Nome da empresa" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Email</label>
                        <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} placeholder="email@exemplo.com" />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Telefone</label>
                        <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle} placeholder="(11) 99999-0000" />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Escolha uma Cor</label>
                        <Picker value={form.color} onChange={(c) => setForm({ ...form, color: c })} type="color" />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Escolha um Emoji</label>
                        <Picker value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e })} type="emoji" />
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Data do contrato *</label>
                    <input type="date" value={form.contractDate} onChange={e => setForm({ ...form, contractDate: e.target.value })} style={inputStyle} />
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Tags (separadas por vírgula)</label>
                    <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} style={inputStyle} placeholder="Vendas, CRM, Premium" />
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Notas iniciais</label>
                    <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Observações..." />
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                    <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 10, border: '1px solid #E2E8F0', background: 'white', color: '#475569', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Cancelar</button>
                    <button onClick={handleSave} style={{ padding: '9px 20px', borderRadius: 10, border: 'none', background: '#7C5CFC', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        {clientToEdit ? "Salvar Alterações" : "Criar Cliente"}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
