import type { Priority, TaskStatus } from '@/types';

const priorityStyles: Record<Priority, { bg: string; text: string }> = {
    Alta: { bg: '#FEE2E2', text: '#DC2626' },
    Média: { bg: '#FEF3C7', text: '#D97706' },
    Baixa: { bg: '#D1FAE5', text: '#059669' },
};

const statusStyles: Record<string, { bg: string; text: string }> = {
    'A Fazer': { bg: '#F1F5F9', text: '#64748B' },
    'Em Progresso': { bg: '#DBEAFE', text: '#2563EB' },
    'Revisão': { bg: '#FEF3C7', text: '#D97706' },
    'Concluído': { bg: '#D1FAE5', text: '#059669' },
    'Não iniciado': { bg: '#F1F5F9', text: '#64748B' },
    'Em andamento': { bg: '#DBEAFE', text: '#2563EB' },
    'Atrasado': { bg: '#FEE2E2', text: '#DC2626' },
};

interface BadgeProps {
    label: string;
    type?: 'priority' | 'status';
}

export default function Badge({ label, type = 'status' }: BadgeProps) {
    const style = type === 'priority'
        ? priorityStyles[label as Priority] || { bg: '#F1F5F9', text: '#64748B' }
        : statusStyles[label] || { bg: '#F1F5F9', text: '#64748B' };

    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '3px 10px',
            borderRadius: 6,
            fontSize: 11.5,
            fontWeight: 600,
            background: style.bg,
            color: style.text,
            whiteSpace: 'nowrap',
        }}>
            {label}
        </span>
    );
}
