'use client';

import { AuthProvider, useAuth } from '@/store/AuthContext';
import { AppProvider } from '@/store/AppContext';
import { ToastProvider } from '@/components/ui/Toast';
import Sidebar from '@/components/Sidebar';
import LoginPage from '@/app/login/page';

function AuthGate({ children }: { children: React.ReactNode }) {
    const { session, loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column',
                gap: 16, alignItems: 'center', justifyContent: 'center',
                background: '#F8FAFC', color: '#7C5CFC', fontFamily: 'Inter, sans-serif',
            }}>
                <div style={{
                    width: 40, height: 40, border: '3px solid #E2E8F0',
                    borderTopColor: '#7C5CFC', borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!session) {
        return <LoginPage />;
    }

    return (
        <AppProvider>
            <ToastProvider>
                <div className="app-layout">
                    <Sidebar />
                    <main className="main-panel">
                        {children}
                    </main>
                </div>
            </ToastProvider>
        </AppProvider>
    );
}

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <AuthGate>
                {children}
            </AuthGate>
        </AuthProvider>
    );
}
