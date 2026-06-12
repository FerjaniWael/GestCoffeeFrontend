'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import toast from 'react-hot-toast';
import { LogOut, Bell } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function WaiterLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!loading) {
      if (!user || (user.role !== 'waiter' && user.role !== 'admin')) {
        toast.error('Access denied. Waiter access required.');
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const response = await api.get('/notifications/unread-count');
        if (response.data?.success) setUnreadCount(response.data.data.count);
      } catch (err) {
        console.error('Failed to load notification count', err);
      }
    };

    fetchNotifications();

    // Refresh badge when the notifications page marks items as read
    const handleRead = () => fetchNotifications();
    window.addEventListener('notifications-read', handleRead);

    if (socket) {
      const handleOrderAssigned = (order: any) => {
        toast((t) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontWeight: 600, color: 'var(--primary)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
              New Order Assigned
            </span>
            <span style={{ fontSize: '0.86rem' }}>
              Table #{order.Table?.tableNumber || order.tableId} needs service.
            </span>
            <button
              className="btn btn-primary"
              style={{ padding: '4px 10px', fontSize: '0.76rem' }}
              onClick={() => toast.dismiss(t.id)}
            >
              Okay
            </button>
          </div>
        ), { duration: 6000 });
        setUnreadCount((prev) => prev + 1);
      };

      const handleStatusUpdate = (order: any) => {
        if (order.assignedWaiterId === user.id) {
          toast.success(`Order status: ${order.status.replace('_', ' ')}`);
        }
      };

      const handleNotification = (notif: any) => {
        toast(notif.message, { icon: '🔔' });
        setUnreadCount((prev) => prev + 1);
      };

      socket.on('order-assigned', handleOrderAssigned);
      socket.on('order-status-update', handleStatusUpdate);
      socket.on('notification', handleNotification);
      return () => {
        socket.off('order-assigned', handleOrderAssigned);
        socket.off('order-status-update', handleStatusUpdate);
        socket.off('notification', handleNotification);
        window.removeEventListener('notifications-read', handleRead);
      };
    }
  }, [socket, user]);

  if (loading || !user || (user.role !== 'waiter' && user.role !== 'admin')) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-base)' }}>

      {/* Sticky top header */}
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
        {/* Brand */}
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontWeight: 900,
            fontSize: '1.15rem',
            color: 'var(--text-primary)',
            lineHeight: 1,
            marginBottom: '1px',
          }}>
            Aroma
          </h1>
          <span style={{
            fontSize: '0.66rem',
            color: 'var(--text-muted)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontFamily: 'var(--font-body)',
          }}>
            {user.name}
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Bell with badge — links to notifications page */}
          <Link href="/waiter/notifications" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <Bell style={{ color: 'var(--text-muted)', width: '19px', height: '19px' }} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                background: 'var(--primary)',
                color: '#0A0806',
                fontSize: '0.6rem',
                fontWeight: 800,
                padding: '1px 5px',
                borderRadius: '50%',
                lineHeight: 1.4,
                minWidth: '16px',
                textAlign: 'center',
                fontFamily: 'var(--font-body)',
              }}>
                {unreadCount}
              </span>
            )}
          </Link>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Divider */}
          <div style={{ width: '1px', height: '20px', background: 'var(--border-solid)' }} />

          {/* Logout */}
          <button
            onClick={logout}
            style={{
              background: 'transparent',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              fontFamily: 'var(--font-body)',
              padding: '4px',
            }}
            title="Sign Out"
          >
            <LogOut style={{ width: '17px', height: '17px' }} />
          </button>
        </div>
      </header>

      {/* Thin brass accent line below header */}
      <div style={{
        height: '2px',
        background: 'linear-gradient(to right, var(--primary), transparent 60%)',
        opacity: 0.5,
        flexShrink: 0,
      }} />

      <main style={{ flex: 1, padding: '24px 20px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
