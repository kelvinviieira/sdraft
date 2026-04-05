'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/store/AuthContext';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Clock,
  BarChart3,
  HelpCircle,
  Settings,
  Plus,
  Users,
  ClipboardList,
  Edit2,
  Check,
  Copy,
  Trash2,
  Layers,
  LogOut,
} from 'lucide-react';
import { useApp, STAGE_ORDER, STAGE_CONFIG, daysAgo } from '@/store/AppContext';
import type { ClientStage } from '@/types';

interface NavItem {
  icon: React.ElementType;
  id: string;
  label: string;
  href: string;
  badge?: number;
}

const overviewItems: NavItem[] = [
  { icon: LayoutDashboard, id: 'dashboard', label: 'Dashboard', href: '/' },
  { icon: CheckSquare, id: 'tasks', label: 'Tasks', href: '/tasks' },
  { icon: Calendar, id: 'calendario', label: 'Calendário', href: '/calendario' },
  { icon: Clock, id: 'time-tracker', label: 'Time Tracker', href: '/time-tracker' },
  { icon: BarChart3, id: 'relatorios', label: 'Relatórios', href: '/relatorios' },
  { icon: Users, id: 'time', label: 'Equipe', href: '/time' },
];

const bottomItems: NavItem[] = [
  { icon: HelpCircle, id: 'support', label: 'Suporte', href: '#' },
  { icon: Settings, id: 'settings', label: 'Configurações', href: '#' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { signOut, user } = useAuth();
  const { clients, workspaces, activeWorkspaceId, dispatch, updateWorkspace, addWorkspace, duplicateWorkspace, deleteWorkspace } = useApp();
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(null);
  const [tempWorkspaceName, setTempWorkspaceName] = useState('');
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);

  const activeWorkspace = useMemo(() =>
    workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0]
  , [workspaces, activeWorkspaceId]);

  // ── Workspace actions ──
  const startRename = () => {
    setTempWorkspaceName(activeWorkspace?.name || '');
    setEditingWorkspaceId(activeWorkspaceId);
    setShowWorkspaceMenu(false);
  };

  const saveRename = () => {
    if (tempWorkspaceName.trim() && activeWorkspace) {
      updateWorkspace({ ...activeWorkspace, name: tempWorkspaceName.trim() });
    }
    setEditingWorkspaceId(null);
  };

  const createWorkspace = () => {
    const newWs = { id: `ws_${Date.now()}`, name: 'Novo Workspace', createdAt: new Date().toISOString() };
    addWorkspace(newWs);
    setEditingWorkspaceId(newWs.id);
    setTempWorkspaceName(newWs.name);
    setShowWorkspaceMenu(false);
  };

  const handleDuplicateWorkspace = () => {
    if (activeWorkspaceId) duplicateWorkspace(activeWorkspaceId);
    setShowWorkspaceMenu(false);
  };

  const handleDeleteWorkspace = () => {
    if (workspaces.length > 1 && activeWorkspaceId && confirm(`Excluir workspace "${activeWorkspace?.name}"?`)) {
      deleteWorkspace(activeWorkspaceId);
    }
    setShowWorkspaceMenu(false);
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    return (
      <Link
        key={item.id}
        href={item.href}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          padding: '9px 14px',
          borderRadius: 10,
          textDecoration: 'none',
          transition: 'all 0.15s ease',
          background: active ? '#F0EDFF' : 'transparent',
          color: active ? '#7C5CFC' : '#64748B',
          fontSize: 13.5,
          fontWeight: active ? 600 : 500,
        }}
      >
        <Icon size={18} strokeWidth={active ? 2 : 1.5} />
        {item.label}
        {item.badge && (
          <span style={{
            marginLeft: 'auto',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minWidth: 20, height: 20, borderRadius: 10,
            background: '#EF4444', color: 'white', fontSize: 11, fontWeight: 600,
          }}>
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside style={{
      display: 'flex', flexDirection: 'column',
      width: 220, height: '100vh', padding: '16px 12px',
      background: 'rgba(255, 255, 255, 0.6)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderRight: '1px solid rgba(226, 232, 240, 0.5)',
      zIndex: 10, overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px 20px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 32, height: 32, borderRadius: 8,
          background: 'linear-gradient(135deg, #7C5CFC, #5B8DEF)',
          color: 'white', fontSize: 16, fontWeight: 800,
        }}>S</div>
        <span style={{ fontSize: 17, fontWeight: 700, color: '#0F172A' }}>Sdraft</span>
      </div>

      {/* ── WORKSPACE header ── */}
      <div style={{ marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px 6px', position: 'relative' }}>
          {editingWorkspaceId === activeWorkspaceId ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: '100%' }}>
              <input
                autoFocus
                value={tempWorkspaceName}
                onChange={e => setTempWorkspaceName(e.target.value)}
                onBlur={saveRename}
                onKeyDown={e => e.key === 'Enter' && saveRename()}
                style={{
                  fontSize: 11, fontWeight: 700, color: '#0F172A',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  background: 'none', border: '1px solid #7C5CFC',
                  borderRadius: 4, padding: '2px 4px', width: '100%', outline: 'none',
                }}
              />
              <button onClick={saveRename} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#22C55E', padding: 0 }}>
                <Check size={12} />
              </button>
            </div>
          ) : (
            <>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {activeWorkspace?.name || 'Workspace'}
              </span>
              <button
                onClick={() => setShowWorkspaceMenu(v => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 2, opacity: 0.6 }}
              >
                <Edit2 size={10} />
              </button>
            </>
          )}

          {/* Dropdown menu */}
          {showWorkspaceMenu && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, zIndex: 100,
              background: 'white', border: '1px solid #E2E8F0', borderRadius: 10,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: 170, padding: 6,
            }}>
              {/* Switch workspace list */}
              {workspaces.length > 1 && (
                <>
                  <div style={{ padding: '4px 10px', fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Trocar workspace
                  </div>
                  {workspaces.map(ws => (
                    <button
                      key={ws.id}
                      onClick={() => { dispatch({ type: 'SET_ACTIVE_WORKSPACE', payload: ws.id }); setShowWorkspaceMenu(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                        padding: '6px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', textAlign: 'left',
                        background: ws.id === activeWorkspaceId ? '#F0EDFF' : 'transparent',
                        color: ws.id === activeWorkspaceId ? '#7C5CFC' : '#0F172A', fontSize: 12.5, fontWeight: 500,
                      }}
                    >
                      <Layers size={12} />
                      {ws.name}
                    </button>
                  ))}
                  <div style={{ height: 1, background: '#F1F5F9', margin: '4px 0' }} />
                </>
              )}
              <button onClick={startRename} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', color: '#0F172A', fontSize: 12.5, fontWeight: 500 }}>
                <Edit2 size={12} /> Renomear
              </button>
              <button onClick={handleDuplicateWorkspace} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', color: '#0F172A', fontSize: 12.5, fontWeight: 500 }}>
                <Copy size={12} /> Duplicar
              </button>
              <button onClick={createWorkspace} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', color: '#0F172A', fontSize: 12.5, fontWeight: 500 }}>
                <Plus size={12} /> Novo Workspace
              </button>
              {workspaces.length > 1 && (
                <>
                  <div style={{ height: 1, background: '#F1F5F9', margin: '4px 0' }} />
                  <button onClick={handleDeleteWorkspace} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', color: '#EF4444', fontSize: 12.5, fontWeight: 500 }}>
                    <Trash2 size={12} /> Excluir workspace
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {overviewItems.map(renderNavItem)}
        </nav>
      </div>

      {/* ── PIPELINE ── */}
      <div style={{ marginTop: 16, marginBottom: 4 }}>
        <div style={{ padding: '0 14px 6px' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Pipeline
          </span>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Link
            href="/pipeline"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 14px', borderRadius: 10,
              textDecoration: 'none', transition: 'all 0.15s',
              background: pathname.startsWith('/pipeline') ? '#F0EDFF' : 'transparent',
              color: pathname.startsWith('/pipeline') ? '#7C5CFC' : '#64748B',
              fontSize: 13.5, fontWeight: pathname.startsWith('/pipeline') ? 600 : 500,
            }}
          >
            <span style={{ fontSize: 16 }}>👥</span>
            {activeWorkspace?.name || 'Pipeline'}
          </Link>
        </nav>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Bottom */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 8 }}>
        {bottomItems.map(renderNavItem)}
      </nav>

      {/* User */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px', borderRadius: 12,
        background: 'rgba(241, 245, 249, 0.6)',
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: 'linear-gradient(135deg, #7C5CFC, #5B8DEF)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontSize: 13, fontWeight: 700, flexShrink: 0,
        }}>
          {user?.email?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email ?? ''}
          </span>
        </div>
        <button
          onClick={signOut}
          title="Sair"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#94A3B8', padding: 4, borderRadius: 6,
            display: 'flex', alignItems: 'center', flexShrink: 0,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
          onMouseLeave={e => (e.currentTarget.style.color = '#94A3B8')}
        >
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  );
}
