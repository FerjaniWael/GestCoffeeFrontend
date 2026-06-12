'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import toast from 'react-hot-toast';
import {
  LayoutDashboard,
  Utensils,
  BookOpen,
  Smartphone,
  ShoppingBag,
  Users,
  Bell,
  LogOut,
  Menu,
  X,
  Settings,
  MapPin,
  ChefHat,
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'admin') {
        toast.error('Access denied. Administrator privileges required.');
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    const fetchUnreadCount = async () => {
      try {
        const response = await api.get('/notifications');
        if (response.data && response.data.success) {
          const unread = response.data.data.filter((n: any) => !n.read).length;
          setUnreadNotifications(unread);
        }
      } catch (err) {
        console.error('Failed to load notifications count', err);
      }
    };

    fetchUnreadCount();

    if (socket) {
      const handleNewOrder = (order: any) => {
        toast((t) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontWeight: 600, color: 'var(--primary)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
              New Order!
            </span>
            <span style={{ fontSize: '0.88rem' }}>
              Table #{order.Table?.tableNumber || order.tableId} placed an order.
            </span>
            <button
              className="btn btn-primary"
              style={{ padding: '5px 12px', fontSize: '0.78rem' }}
              onClick={() => { toast.dismiss(t.id); router.push('/admin/orders'); }}
            >
              View Orders
            </button>
          </div>
        ), { duration: 6000 });
        setUnreadNotifications((prev) => prev + 1);
      };

      const handleNotification = (notif: any) => {
        toast(notif.message, { icon: '🔔' });
        setUnreadNotifications((prev) => prev + 1);
      };

      socket.on('new-order', handleNewOrder);
      socket.on('notification', handleNotification);
      return () => {
        socket.off('new-order', handleNewOrder);
        socket.off('notification', handleNotification);
      };
    }
  }, [socket, user, router]);

  if (loading || !user || user.role !== 'admin') {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  const menuItems = [
    { name: 'Dashboard',      path: '/admin',               icon: LayoutDashboard },
    { name: 'Orders',         path: '/admin/orders',        icon: ShoppingBag },
    { name: 'Categories',     path: '/admin/categories',    icon: Utensils },
    { name: 'Menu Items',     path: '/admin/articles',      icon: BookOpen },
    { name: 'Tables',         path: '/admin/tables',        icon: Smartphone },
    { name: 'Zones',          path: '/admin/zones',         icon: MapPin },
    { name: 'Kitchen Staff',  path: '/admin/chefs',         icon: ChefHat },
    { name: 'Waiters',        path: '/admin/waiters',       icon: Users },
    { name: 'Notifications',  path: '/admin/notifications', icon: Bell,     badge: unreadNotifications },
    { name: 'Settings',       path: '/admin/settings',      icon: Settings },
  ];

  const sidebarContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '28px 18px' }}>

      {/* Brand */}
      <div style={{ padding: '0 6px', marginBottom: '36px' }}>
        <div className="accent-line" style={{ marginBottom: '14px' }} />
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.55rem',
          fontWeight: 900,
          fontStyle: 'italic',
          letterSpacing: '-0.02em',
          color: 'var(--text-primary)',
          lineHeight: 1,
          marginBottom: '5px',
        }}>
          Aroma
        </h1>
        <span style={{
          fontSize: '0.65rem',
          color: 'var(--text-muted)',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          fontFamily: 'var(--font-body)',
        }}>
          Admin Console
        </span>
      </div>

      {/* Section label */}
      <span style={{
        fontSize: '0.62rem',
        color: 'var(--text-muted)',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.14em',
        padding: '0 6px',
        marginBottom: '6px',
        fontFamily: 'var(--font-body)',
      }}>
        Navigation
      </span>

      {/* Nav items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          const num = String(index + 1).padStart(2, '0');
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 10px',
                borderRadius: 'var(--radius-sm)',
                background: isActive ? 'var(--primary-light)' : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                transition: 'all var(--transition-fast)',
                fontWeight: isActive ? 600 : 400,
                fontSize: '0.88rem',
                borderLeft: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                textDecoration: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                <span style={{
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-body)',
                  minWidth: '16px',
                  letterSpacing: '0.02em',
                }}>
                  {num}
                </span>
                <Icon style={{ width: '15px', height: '15px', flexShrink: 0 }} />
                <span>{item.name}</span>
              </div>
              {item.badge && item.badge > 0 ? (
                <span style={{
                  background: 'var(--primary)',
                  color: '#0A0806',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '99px',
                  minWidth: '20px',
                  textAlign: 'center',
                  fontFamily: 'var(--font-body)',
                }}>
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* User panel */}
      <div style={{
        padding: '11px 12px',
        marginBottom: '10px',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--bg-subtle)',
        border: '1px solid var(--border-solid)',
      }}>
        <span style={{
          display: 'block',
          fontSize: '0.62rem',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontWeight: 700,
          marginBottom: '3px',
          fontFamily: 'var(--font-body)',
        }}>
          Signed in as
        </span>
        <span style={{ fontSize: '0.86rem', color: 'var(--text-primary)', fontWeight: 500 }}>
          {user.name}
        </span>
      </div>

      {/* Bottom actions */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={logout}
          className="btn btn-secondary"
          style={{ flex: 1, justifyContent: 'flex-start', gap: '10px', padding: '10px 12px', fontSize: '0.84rem' }}
        >
          <LogOut style={{ width: '15px', height: '15px' }} />
          Sign Out
        </button>
        <ThemeToggle />
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', background: 'var(--bg-base)' }}>

      {/* Desktop Sidebar */}
      <aside className="glass-card admin-sidebar" style={{
        width: '250px',
        position: 'fixed',
        top: '16px',
        bottom: '16px',
        left: '16px',
        borderRadius: 'var(--radius-md)',
        flexDirection: 'column',
        zIndex: 40,
        overflowY: 'auto',
        borderColor: 'rgba(194, 140, 50, 0.12)',
      }}>
        {sidebarContent}
      </aside>

      {/* Mobile Backdrop + Drawer */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(6px)', zIndex: 50,
          }}
          onClick={() => setMobileOpen(false)}
        >
          <div
            style={{
              width: '268px', height: '100%',
              background: 'var(--bg-base)',
              borderRight: '1px solid var(--border-light)',
              boxShadow: 'var(--shadow-lg)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px 16px' }}>
              <button
                onClick={() => setMobileOpen(false)}
                style={{ background: 'transparent', color: 'var(--text-muted)', padding: '4px' }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="admin-content-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Mobile Header */}
        <header className="glass-card admin-mobile-header" style={{
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          margin: '16px 16px 0 16px',
          borderRadius: 'var(--radius-sm)',
          borderColor: 'rgba(194, 140, 50, 0.12)',
        }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontWeight: 800,
            fontSize: '1.15rem',
            color: 'var(--text-primary)',
          }}>
            Aroma
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(true)}
              style={{ background: 'transparent', color: 'var(--text-secondary)', padding: '4px' }}
            >
              <Menu style={{ width: '22px', height: '22px' }} />
            </button>
          </div>
        </header>

        <main className="admin-main-view" style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
