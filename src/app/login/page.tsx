'use client';

import { useState } from 'react';
import { useAuth } from '@/store/AuthContext';

export default function LoginPage() {
    const { signIn, signUp } = useAuth();
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [signupDone, setSignupDone] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (mode === 'login') {
            const { error } = await signIn(email, password);
            if (error) setError(error);
        } else {
            const { error } = await signUp(email, password);
            if (error) setError(error);
            else setSignupDone(true);
        }

        setLoading(false);
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 100%)',
            fontFamily: 'Inter, sans-serif',
        }}>
            <div style={{
                background: 'white', borderRadius: 20, padding: '48px 40px',
                width: '100%', maxWidth: 400, boxShadow: '0 4px 32px rgba(124,92,252,0.10)',
                border: '1px solid #F1F5F9',
            }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 14, background: '#7C5CFC',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px', fontSize: 22,
                    }}>✦</div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1E293B', margin: 0 }}>Sdraft</h1>
                    <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 6 }}>
                        {mode === 'login' ? 'Acesse sua conta' : 'Crie sua conta'}
                    </p>
                </div>

                {signupDone ? (
                    <div style={{ textAlign: 'center', color: '#22C55E', padding: '20px 0' }}>
                        <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
                        <p style={{ fontWeight: 600, marginBottom: 8 }}>Conta criada!</p>
                        <p style={{ fontSize: 13, color: '#64748B' }}>
                            Verifique seu email para confirmar o cadastro e depois faça login.
                        </p>
                        <button
                            onClick={() => { setMode('login'); setSignupDone(false); }}
                            style={{ marginTop: 16, color: '#7C5CFC', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                        >
                            Ir para login
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                placeholder="seu@email.com"
                                style={{
                                    width: '100%', padding: '10px 14px', borderRadius: 10,
                                    border: '1.5px solid #E2E8F0', fontSize: 14, outline: 'none',
                                    boxSizing: 'border-box', color: '#1E293B',
                                    transition: 'border-color 0.2s',
                                }}
                                onFocus={e => e.target.style.borderColor = '#7C5CFC'}
                                onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                            />
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                                Senha
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                minLength={6}
                                style={{
                                    width: '100%', padding: '10px 14px', borderRadius: 10,
                                    border: '1.5px solid #E2E8F0', fontSize: 14, outline: 'none',
                                    boxSizing: 'border-box', color: '#1E293B',
                                    transition: 'border-color 0.2s',
                                }}
                                onFocus={e => e.target.style.borderColor = '#7C5CFC'}
                                onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                            />
                        </div>

                        {error && (
                            <div style={{
                                background: '#FEF2F2', border: '1px solid #FCA5A5',
                                borderRadius: 8, padding: '10px 14px', marginBottom: 16,
                                fontSize: 13, color: '#DC2626',
                            }}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%', padding: '12px', borderRadius: 10,
                                background: loading ? '#C4B5FD' : '#7C5CFC',
                                color: 'white', fontWeight: 600, fontSize: 15,
                                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'background 0.2s',
                            }}
                        >
                            {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
                        </button>

                        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#64748B' }}>
                            {mode === 'login' ? 'Não tem conta?' : 'Já tem conta?'}{' '}
                            <button
                                type="button"
                                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
                                style={{ color: '#7C5CFC', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                            >
                                {mode === 'login' ? 'Criar conta' : 'Fazer login'}
                            </button>
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
}
