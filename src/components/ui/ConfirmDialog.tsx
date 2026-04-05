'use client';

import Modal from './Modal';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    danger?: boolean;
}

export default function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Confirmar',
    danger = true,
}: ConfirmDialogProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} width={400}>
            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, marginBottom: 24 }}>
                {message}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                    onClick={onClose}
                    style={{
                        padding: '8px 18px',
                        borderRadius: 10,
                        border: '1px solid #E2E8F0',
                        background: 'white',
                        color: '#475569',
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                    }}
                >
                    Cancelar
                </button>
                <button
                    onClick={() => { onConfirm(); onClose(); }}
                    style={{
                        padding: '8px 18px',
                        borderRadius: 10,
                        border: 'none',
                        background: danger ? '#DC2626' : '#7C5CFC',
                        color: 'white',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                    }}
                >
                    {confirmLabel}
                </button>
            </div>
        </Modal>
    );
}
