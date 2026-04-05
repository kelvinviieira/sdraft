'use client';

import { useState, useEffect } from 'react';
import { useApp, generateId } from '@/store/AppContext';
import { useToast } from '@/components/ui/Toast';
import { Plus, FileText, Trash2, Clock, Check } from 'lucide-react';
import type { ClientDocument } from '@/types';
import dynamic from 'next/dynamic';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';

// We must dynamically import the editor to prevent SSR issues with Prosemirror
const BlockNoteEditor = dynamic(() => import('./BlockNoteEditor'), { ssr: false });

export default function DocumentsTab({ clientId }: { clientId: string }) {
    const { documents, dispatch, updateDocument, addDocument, deleteDocument } = useApp();
    const { toast } = useToast();
    
    const clientDocs = documents.filter(d => d.clientId === clientId).sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    
    // We can open the first doc if none selected and docs exist
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!selectedDocId && clientDocs.length > 0) {
            setSelectedDocId(clientDocs[0].id);
        }
    }, [clientDocs, selectedDocId]);

    const activeDoc = clientDocs.find(d => d.id === selectedDocId);

    const handleCreateNew = () => {
        const newDoc: ClientDocument = {
            id: generateId(),
            clientId,
            title: 'Novo Documento',
            content: '', // Empty JSON
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        addDocument(newDoc);
        setSelectedDocId(newDoc.id);
        toast('Novo documento criado');
    };

    const handleDelete = (docId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if(confirm('Tem certeza que deseja deletar este documento?')) {
            deleteDocument(docId);
            if (selectedDocId === docId) setSelectedDocId(null);
            toast('Documento deletado');
        }
    };

    const updateDoc = (updatedFields: Partial<ClientDocument>) => {
        if (!activeDoc) return;
        setIsSaving(true);
        updateDocument({ ...activeDoc, ...updatedFields, updatedAt: new Date().toISOString() });
        setTimeout(() => setIsSaving(false), 800);
    };

    return (
        <div style={{ display: 'flex', height: '100%', minHeight: 600, background: 'white', borderRadius: 14, border: '1px solid #F1F5F9', overflow: 'hidden' }}>
            
            {/* Sidebar list */}
            <div style={{ width: 280, borderRight: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', background: '#FAFAF9' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Documentos ({clientDocs.length})
                    </span>
                    <button onClick={handleCreateNew} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26,
                        borderRadius: 6, border: 'none', background: '#7C5CFC', color: 'white', cursor: 'pointer'
                    }} title="Novo documento"><Plus size={14} /></button>
                </div>
                
                <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {clientDocs.length === 0 ? (
                        <div style={{ padding: 20, textAlign: 'center', color: '#94A3B8', fontSize: 12 }}>
                            Nenhum documento.<br/><br/>Comece clicando no <b style={{color:'#7C5CFC'}}>+</b> acima.
                        </div>
                    ) : clientDocs.map(doc => {
                        const isSelected = doc.id === selectedDocId;
                        return (
                            <div key={doc.id} onClick={() => setSelectedDocId(doc.id)} style={{
                                display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 14px',
                                borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
                                background: isSelected ? 'white' : 'transparent',
                                border: isSelected ? '1px solid #E2E8F0' : '1px solid transparent',
                                boxShadow: isSelected ? '0 1px 2px rgba(0,0,0,0.03)' : 'none'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                                        <FileText size={14} style={{ color: isSelected ? '#7C5CFC' : '#94A3B8', flexShrink: 0 }} />
                                        <span style={{ fontSize: 13, fontWeight: isSelected ? 600 : 500, color: isSelected ? '#0F172A' : '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {doc.title || 'Sem título'}
                                        </span>
                                    </div>
                                    <button onClick={(e) => handleDelete(doc.id, e)} style={{ border: 'none', background: 'transparent', color: '#CBD5E1', cursor: 'pointer', padding: 0 }} title="Excluir">
                                        <Trash2 size={13} className="hover-red" />
                                    </button>
                                </div>
                                <span style={{ fontSize: 11, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Clock size={10} /> {new Date(doc.updatedAt).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short', hour:'2-digit', minute:'2-digit'})}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Editor Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                {activeDoc ? (
                    <>
                        <div style={{ padding: '24px 40px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <input 
                                value={activeDoc.title}
                                onChange={(e) => updateDoc({ title: e.target.value })}
                                placeholder="Título do Documento..."
                                style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', border: 'none', outline: 'none', width: '100%', fontFamily: 'inherit', padding: 0 }}
                            />
                            {isSaving ? (
                                <span style={{ fontSize: 11, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12}/> Salvando...</span>
                            ) : (
                                <span style={{ fontSize: 11, color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}><Check size={12}/> Salvo</span>
                            )}
                        </div>
                        <div style={{ flex: 1, padding: '0 10px 40px', overflowY: 'auto' }}>
                            <BlockNoteEditor 
                                key={activeDoc.id}
                                initialContent={activeDoc.content} 
                                onChange={(content) => updateDoc({ content })}
                            />
                        </div>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
                        <div style={{ width: 64, height: 64, borderRadius: 16, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CBD5E1' }}>
                            <FileText size={32} />
                        </div>
                        <span style={{ fontSize: 14, color: '#94A3B8', fontWeight: 500 }}>Selecione ou crie um novo documento</span>
                    </div>
                )}
            </div>
            {/* Inject a small CSS for hover-red directly in the component for simplicity */}
            <style dangerouslySetInnerHTML={{__html: `
                .hover-red:hover { color: #EF4444 !important; transition: color 0.15s; }
                .bn-container { font-family: inherit !important; }
            `}} />
        </div>
    );
}
