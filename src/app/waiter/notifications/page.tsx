'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useSocket } from '@/context/SocketContext';
import { INotification } from '@/lib/types';
import {
  Bell, Check, Trash2, MailOpen, Mail,
  PhoneCall, MapPin, UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';

const TYPE_STYLE: Record<string, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  call_waiter_direct: {
    icon: PhoneCall,
    color: 'var(--warning)',
    bg: 'var(--warning-light)',
    border: 'rgba(196,120,32,0.35)',
  },
  dispatch: {
    icon: UserCheck,
    color: 'var(--success)',
    bg: 'var(--success-light)',
    border: 'rgba(42,153,96,0.35)',
  },
};

export default function WaiterNotificationsPage() {
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data?.success) {
        setNotifications(
          [...res.data.data].sort(
            (a: INotification, b: INotification) =>
              new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
          )
        );
      }
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  useEffect(() => {
    if (!socket) return;
    const handle = (notif: INotification) => {
      setNotifications(prev => [notif, ...prev]);
    };
    socket.on('notification', handle);
    return () => { socket.off('notification', handle); };
  }, [socket]);

  // Tell the layout to refresh its unread badge
  const signalRead = () => {
    window.dispatchEvent(new Event('notifications-read'));
  };

  const handleMarkRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      signalRead();
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      signalRead();
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to update notifications');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      signalRead();
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  const fmt = (d?: string) => {
    if (!d) return '';
    const date = new Date(d);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div className="accent-line" style={{ marginBottom: '10px' }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontStyle: 'italic', fontWeight: 800, marginBottom: '3px' }}>
            Notifications
          </h2>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
            {unread > 0 ? `${unread} unread` : 'All caught up'}
          </span>
        </div>
        {unread > 0 && (
          <button className="btn btn-secondary" onClick={handleMarkAllRead} style={{ gap: '7px', fontSize: '0.84rem' }}>
            <Check style={{ width: '14px', height: '14px' }} />
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', height: '40vh', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="glass-card" style={{ padding: '56px 20px', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
          <Bell style={{ width: '28px', height: '28px', opacity: 0.4 }} />
          <span style={{ fontSize: '0.88rem' }}>No notifications yet.</span>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {notifications.map(notif => {
            const style = TYPE_STYLE[notif.type ?? ''];
            const Icon = style?.icon ?? (notif.read ? MailOpen : Mail);
            const isSpecial = !!style;

            return (
              <div
                key={notif.id}
                className="animate-fade-in"
                style={{
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${isSpecial && !notif.read ? style.border : notif.read ? 'var(--border-solid)' : 'rgba(194,140,50,0.2)'}`,
                  background: isSpecial && !notif.read ? style.bg : notif.read ? 'var(--bg-subtle)' : 'rgba(194,140,50,0.04)',
                  overflow: 'hidden',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '14px 16px' }}>
                  {/* Icon */}
                  <div style={{ flexShrink: 0, marginTop: '2px' }}>
                    <Icon
                      style={{
                        width: '17px',
                        height: '17px',
                        color: isSpecial && !notif.read ? style.color : notif.read ? 'var(--text-muted)' : 'var(--primary)',
                        strokeWidth: notif.read ? 1.5 : 2,
                      }}
                      className={!notif.read && !isSpecial ? 'pulse-primary' : undefined}
                    />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: '0.88rem',
                      fontWeight: notif.read ? 400 : 600,
                      color: isSpecial && !notif.read ? style.color : notif.read ? 'var(--text-secondary)' : 'var(--text-primary)',
                      marginBottom: '5px',
                      lineHeight: 1.45,
                    }}>
                      {notif.message}
                    </p>

                    {/* Metadata pills */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{fmt(notif.createdAt)}</span>
                      {notif.metadata?.tableNumber && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          background: 'var(--primary-light)', border: '1px solid var(--border-light)',
                          color: 'var(--primary)', borderRadius: '4px', padding: '1px 7px',
                          fontSize: '0.67rem', fontWeight: 700, fontFamily: 'var(--font-body)',
                        }}>
                          Table #{notif.metadata.tableNumber}
                        </span>
                      )}
                      {notif.metadata?.zoneName && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          background: 'var(--primary-light)', border: '1px solid var(--border-light)',
                          color: 'var(--primary)', borderRadius: '4px', padding: '1px 7px',
                          fontSize: '0.67rem', fontWeight: 700, fontFamily: 'var(--font-body)',
                        }}>
                          <MapPin style={{ width: '9px', height: '9px' }} />
                          {notif.metadata.zoneName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    {!notif.read && (
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '5px' }}
                        onClick={() => handleMarkRead(notif.id)}
                        title="Mark as read"
                      >
                        <Check style={{ width: '13px', height: '13px' }} />
                      </button>
                    )}
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '5px', background: 'var(--danger-light)', borderColor: 'rgba(192,56,40,0.2)' }}
                      onClick={() => handleDelete(notif.id)}
                      title="Delete"
                    >
                      <Trash2 style={{ width: '13px', height: '13px', color: 'var(--danger)' }} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
