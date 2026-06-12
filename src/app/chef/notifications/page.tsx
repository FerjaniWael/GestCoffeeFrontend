'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useSocket } from '@/context/SocketContext';
import { INotification } from '@/lib/types';
import { Bell, Check, Trash2, MailOpen, Mail, ChefHat, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ChefNotificationsPage() {
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
    } catch { toast.error('Failed to load notifications'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, []);

  useEffect(() => {
    if (!socket) return;
    const handle = (n: INotification) => setNotifications(prev => [n, ...prev]);
    socket.on('notification', handle);
    return () => { socket.off('notification', handle); };
  }, [socket]);

  const signalRead = () => window.dispatchEvent(new Event('notifications-read'));

  const handleMarkRead = async (id: number) => {
    await api.patch(`/notifications/${id}/read`).catch(() => toast.error('Failed'));
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    signalRead();
  };

  const handleMarkAll = async () => {
    await api.patch('/notifications/read-all').catch(() => toast.error('Failed'));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    signalRead();
    toast.success('All marked as read');
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/notifications/${id}`).catch(() => toast.error('Failed'));
    setNotifications(prev => prev.filter(n => n.id !== id));
    signalRead();
  };

  const fmt = (d?: string) => {
    if (!d) return '';
    const date = new Date(d);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const isKitchen = (n: INotification) => n.type === 'kitchen_ticket';
  const unread = notifications.filter(n => !n.read).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div className="accent-line" style={{ marginBottom: '10px' }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontStyle: 'italic', fontWeight: 800, marginBottom: '3px' }}>
            Notifications
          </h2>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {unread > 0 ? `${unread} unread` : 'All caught up'}
          </span>
        </div>
        {unread > 0 && (
          <button className="btn btn-secondary" onClick={handleMarkAll} style={{ gap: '7px', fontSize: '0.84rem' }}>
            <Check style={{ width: '14px', height: '14px' }} /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', height: '40vh', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>
      ) : notifications.length === 0 ? (
        <div className="glass-card" style={{ padding: '56px 20px', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
          <Bell style={{ width: '28px', height: '28px', opacity: 0.4 }} />
          <span>No notifications yet.</span>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {notifications.map(n => {
            const kitchen = isKitchen(n);
            const Icon = kitchen ? ChefHat : n.read ? MailOpen : Mail;
            return (
              <div key={n.id} className="animate-fade-in" style={{
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${kitchen && !n.read ? 'rgba(194,140,50,0.35)' : n.read ? 'var(--border-solid)' : 'rgba(194,140,50,0.2)'}`,
                background: kitchen && !n.read ? 'rgba(194,140,50,0.06)' : n.read ? 'var(--bg-subtle)' : 'rgba(194,140,50,0.04)',
                overflow: 'hidden',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '14px 16px' }}>
                  <div style={{ flexShrink: 0, marginTop: '2px' }}>
                    <Icon style={{ width: '17px', height: '17px', color: kitchen && !n.read ? 'var(--primary)' : n.read ? 'var(--text-muted)' : 'var(--primary)', strokeWidth: n.read ? 1.5 : 2 }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.88rem', fontWeight: n.read ? 400 : 600, color: n.read ? 'var(--text-secondary)' : 'var(--text-primary)', marginBottom: '5px', lineHeight: 1.45 }}>
                      {n.message}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{fmt(n.createdAt)}</span>
                      {n.metadata?.tableNumber && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--primary-light)', border: '1px solid var(--border-light)', color: 'var(--primary)', borderRadius: '4px', padding: '1px 7px', fontSize: '0.67rem', fontWeight: 700 }}>
                          Table #{n.metadata.tableNumber}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    {!n.read && (
                      <button className="btn btn-secondary" style={{ padding: '5px' }} onClick={() => handleMarkRead(n.id)} title="Mark as read">
                        <Check style={{ width: '13px', height: '13px' }} />
                      </button>
                    )}
                    <button className="btn btn-secondary" style={{ padding: '5px', background: 'var(--danger-light)', borderColor: 'rgba(192,56,40,0.2)' }} onClick={() => handleDelete(n.id)} title="Delete">
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
