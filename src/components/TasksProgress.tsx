'use client';

const segments = [
    { label: 'Não iniciada', percent: 20, color: '#94A3B8' },
    { label: 'Em progresso', percent: 8, color: '#3B82F6' },
    { label: 'Em revisão', percent: 12, color: '#F59E0B' },
    { label: 'Concluída', percent: 60, color: '#22C55E' },
];

export default function TasksProgress() {
    const total = 27;
    const size = 160;
    const strokeWidth = 20;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    let cumulativePercent = 0;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            padding: '20px',
            borderRadius: 16,
            background: 'white',
            border: '1px solid #F1F5F9',
        }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>Progresso das tasks</h3>

            {/* Donut chart */}
            <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    {segments.map((seg) => {
                        const offset = circumference * (1 - cumulativePercent / 100);
                        const dash = circumference * (seg.percent / 100);
                        cumulativePercent += seg.percent;
                        return (
                            <circle
                                key={seg.label}
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                fill="none"
                                stroke={seg.color}
                                strokeWidth={strokeWidth}
                                strokeDasharray={`${dash} ${circumference - dash}`}
                                strokeDashoffset={offset}
                                strokeLinecap="round"
                                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                                style={{ transition: 'stroke-dashoffset 1s ease' }}
                            />
                        );
                    })}
                </svg>
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                }}>
                    <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>Total task</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: '#0F172A' }}>{total}</div>
                </div>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {segments.map((seg) => (
                    <div key={seg.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 3, background: seg.color }} />
                            <span style={{ fontSize: 12.5, color: '#475569', fontWeight: 500 }}>{seg.label}</span>
                        </div>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: '#0F172A' }}>{seg.percent}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
