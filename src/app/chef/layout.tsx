'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import toast from 'react-hot-toast';
import { LogOut, ChefHat, Bell } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function ChefLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!loading) {
      if (!user || (user.role !== 'head_chef' && user.role !== 'pastry_chef')) {
        toast.error('Access denied. Chef access required.');
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const fetchUnread = async () => {
      try {
        const res = await api.get('/notifications/unread-count');
        if (res.data?.success) setUnreadCount(res.data.data.count);
      } catch { /* silent */ }
    };

    fetchUnread();

    const handleRead = () => fetchUnread();
    window.addEventListener('notifications-read', handleRead);

    if (socket) {
      const handleNotification = (notif: any) => {
        toast(notif.message, { icon: '🍽️', duration: 5000 });
        setUnreadCount(prev => prev + 1);
      };
      const handleNewTicket = (ticket: any) => {
        toast((t) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontWeight: 600, color: 'var(--primary)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
              New Order!
            </span>
            <span style={{ fontSize: '0.86rem' }}>
              Table #{ticket.tableNumber} — check your kitchen dashboard.
            </span>
            <button
              className="btn btn-primary"
              style={{ padding: '4px 10px', fontSize: '0.76rem' }}
              onClick={() => toast.dismiss(t.id)}
            >
              Okay
            </button>
          </div>
        ), { duration: 7000 });
      };

      socket.on('notification', handleNotification);
      socket.on('kitchen-new-ticket', handleNewTicket);
      return () => {
        socket.off('notification', handleNotification);
        socket.off('kitchen-new-ticket', handleNewTicket);
        window.removeEventListener('notifications-read', handleRead);
      };
    }

    return () => { window.removeEventListener('notifications-read', handleRead); };
  }, [socket, user]);

  if (loading || !user || (user.role !== 'head_chef' && user.role !== 'pastry_chef')) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  const roleLabel = user.role === 'head_chef' ? 'Head Chef' : 'Pastry Chef';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-base)' }}>

      {/* Sticky header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'var(--bg-card)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-solid)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        height: '60px',
      }}>
        {/* Brand + role */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ChefHat style={{ color: 'var(--primary)', width: '20px', height: '20px' }} />
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontWeight: 900,
              fontSize: '1.1rem',
              color: 'var(--text-primary)',
              lineHeight: 1,
              marginBottom: '1px',
            }}>
              Kitchen
            </h1>
            <span style={{ fontSize: '0.64rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-body)' }}>
              {user.name} · {roleLabel}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <ThemeToggle />

          {/* Notifications bell */}
          <Link href="/chef/notifications" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <Bell style={{ color: 'var(--text-muted)', width: '19px', height: '19px' }} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '-5px', right: '-5px',
                background: 'var(--primary)', color: '#0A0806',
                fontSize: '0.6rem', fontWeight: 800,
                padding: '1px 5px', borderRadius: '50%',
                lineHeight: 1.4, minWidth: '16px', textAlign: 'center',
                fontFamily: 'var(--font-body)',
              }}>
                {unreadCount}
              </span>
            )}
          </Link>

          <div style={{ width: '1px', height: '20px', background: 'var(--border-solid)' }} />

          <button
            onClick={logout}
            style={{ background: 'transparent', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: '4px' }}
            title="Sign Out"
          >
            <LogOut style={{ width: '17px', height: '17px' }} />
          </button>
        </div>
      </header>

      {/* Brass accent line */}
      <div style={{ height: '2px', background: 'linear-gradient(to right, var(--primary), transparent 60%)', opacity: 0.45, flexShrink: 0 }} />

      <main style={{ flex: 1, padding: '24px 20px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
