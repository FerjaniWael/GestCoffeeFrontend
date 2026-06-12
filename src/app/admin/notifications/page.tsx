'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useSocket } from '@/context/SocketContext';
import { INotification, IUser } from '@/lib/types';
import {
  Bell, Check, Trash2, MailOpen, Mail,
  PhoneCall, Send, UserCheck, MapPin,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [waiters, setWaiters] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  // Tracks which notification has the dispatch widget open + selected waiter
  const [dispatching, setDispatching] = useState<Record<number, { open: boolean; waiterId: string; sending: boolean }>>({});
  const { socket } = useSocket();

  const fetchData = async () => {
    try {
      const [notifRes, waitersRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/users/waiters'),
      ]);
      if (notifRes.data?.success) {
        setNotifications(
          [...notifRes.data.data].sort(
            (a: INotification, b: INotification) =>
              new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
          )
        );
      }
      if (waitersRes.data?.success) {
        setWaiters(waitersRes.data.data.filter((w: IUser) => w.isActive));
      }
    } catch {
      toast.error('Failed to retrieve notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (!socket) return;
    const handleNew = (notif: INotification) => {
      setNotifications(prev => [notif, ...prev]);
    };
    socket.on('notification', handleNew);
    return () => { socket.off('notification', handleNew); };
  }, [socket]);

  const handleMarkRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch {
      toast.error('Failed to update notification');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to update notifications');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  const openDispatch = (id: number) => {
    setDispatching(prev => ({ ...prev, [id]: { open: true, waiterId: '', sending: false } }));
  };

  const closeDispatch = (id: number) => {
    setDispatching(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleDispatch = async (notif: INotification) => {
    const state = dispatching[notif.id];
    if (!state?.waiterId) {
      toast.error('Select a waiter first');
      return;
    }
    setDispatching(prev => ({ ...prev, [notif.id]: { ...prev[notif.id], sending: true } }));
    try {
      const { tableNumber, tableId, zoneName, zoneId } = notif.metadata || {};
      const res = await api.post('/notifications/dispatch-waiter', {
        waiterId: parseInt(state.waiterId),
        tableNumber,
        tableId,
        zoneName,
        zoneId,
      });
      if (res.data.success) {
        const waiter = waiters.find(w => w.id === parseInt(state.waiterId));
        toast.success(`${waiter?.name ?? 'Waiter'} dispatched to Table #${tableNumber}`);
        // Mark the original call notification as read
        await handleMarkRead(notif.id);
        closeDispatch(notif.id);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Dispatch failed');
      setDispatching(prev => ({ ...prev, [notif.id]: { ...prev[notif.id], sending: false } }));
    }
  };

  const getFormattedTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const isCallWaiter = (n: INotification) => n.type === 'call_waiter';

  const unreadCount = notifications.filter(n => !n.read).length;
  const callWaiterPending = notifications.filter(n => isCallWaiter(n) && !n.read).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div className="accent-line" style={{ marginBottom: '10px' }} />
          <h2 style={{ fontSize: '2rem', marginBottom: '6px' }}>Notifications</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            System activity, order alerts, and customer service calls.
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-secondary" onClick={handleMarkAllRead} style={{ gap: '8px' }}>
            <Check style={{ width: '14px', height: '14px' }} />
            Mark All Read
          </button>
        )}
      </div>

      {/* Pending service calls callout */}
      {callWaiterPending > 0 && (
        <div
          className="glass-card animate-fade-in"
          style={{
            padding: '14px 20px',
            borderLeft: '3px solid var(--warning)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <PhoneCall style={{ color: 'var(--warning)', width: '16px', height: '16px', flexShrink: 0 }} />
          <span style={{ color: 'var(--warning)', fontWeight: 600, fontSize: '0.88rem' }}>
            {callWaiterPending} table{callWaiterPending > 1 ? 's are' : ' is'} calling for service without an assigned waiter — dispatch below.
          </span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', height: '40vh', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner" />
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '16px', borderBottom: '1px solid var(--border-solid)' }}>
            <Bell style={{ color: 'var(--primary)', width: '18px', height: '18px' }} />
            <h3 style={{ fontSize: '1.1rem' }}>
              History — {notifications.length} total, {unreadCount} unread
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                No notifications yet.
              </div>
            ) : (
              notifications.map((notif) => {
                const isCall = isCallWaiter(notif);
                const dispatch = dispatching[notif.id];

                return (
                  <div
                    key={notif.id}
                    style={{
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${isCall && !notif.read ? 'rgba(196,120,32,0.35)' : notif.read ? 'var(--border-solid)' : 'rgba(194,140,50,0.2)'}`,
                      background: isCall && !notif.read
                        ? 'var(--warning-light)'
                        : notif.read
                        ? 'var(--bg-subtle)'
                        : 'rgba(194,140,50,0.04)',
                      overflow: 'hidden',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    {/* Main row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', gap: '12px' }}>
                      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                        {/* Icon */}
                        <div style={{ flexShrink: 0, marginTop: '2px' }}>
                          {isCall ? (
                            <PhoneCall style={{ width: '18px', height: '18px', color: notif.read ? 'var(--text-muted)' : 'var(--warning)' }} />
                          ) : notif.read ? (
                            <MailOpen style={{ width: '18px', height: '18px', color: 'var(--text-muted)', strokeWidth: 1.5 }} />
                          ) : (
                            <Mail className="pulse-primary" style={{ width: '18px', height: '18px', color: 'var(--primary)', strokeWidth: 2 }} />
                          )}
                        </div>

                        {/* Text */}
                        <div style={{ minWidth: 0 }}>
                          <p style={{
                            fontSize: '0.9rem',
                            fontWeight: notif.read ? 400 : 600,
                            color: isCall && !notif.read ? 'var(--warning)' : notif.read ? 'var(--text-secondary)' : 'var(--text-primary)',
                            marginBottom: '3px',
                            lineHeight: 1.45,
                          }}>
                            {notif.message}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {getFormattedTime(notif.createdAt)}
                            </span>
                            {/* Zone badge */}
                            {notif.metadata?.zoneName && (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                background: 'var(--primary-light)', border: '1px solid var(--border-light)',
                                color: 'var(--primary)', borderRadius: '4px', padding: '1px 7px',
                                fontSize: '0.68rem', fontWeight: 600, fontFamily: 'var(--font-body)',
                              }}>
                                <MapPin style={{ width: '9px', height: '9px' }} />
                                {notif.metadata.zoneName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'center' }}>
                        {/* Dispatch button — only for call_waiter type */}
                        {isCall && (
                          <button
                            className="btn btn-secondary"
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.78rem',
                              gap: '6px',
                              background: dispatch?.open ? 'var(--warning-light)' : undefined,
                              borderColor: dispatch?.open ? 'rgba(196,120,32,0.4)' : undefined,
                              color: 'var(--warning)',
                            }}
                            onClick={() => dispatch?.open ? closeDispatch(notif.id) : openDispatch(notif.id)}
                          >
                            <UserCheck style={{ width: '13px', height: '13px' }} />
                            Dispatch
                          </button>
                        )}
                        {!notif.read && (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px' }}
                            onClick={() => handleMarkRead(notif.id)}
                            title="Mark as read"
                          >
                            <Check style={{ width: '13px', height: '13px' }} />
                          </button>
                        )}
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px', background: 'var(--danger-light)', borderColor: 'rgba(192,56,40,0.2)' }}
                          onClick={() => handleDelete(notif.id)}
                          title="Delete"
                        >
                          <Trash2 style={{ width: '13px', height: '13px', color: 'var(--danger)' }} />
                        </button>
                      </div>
                    </div>

                    {/* Dispatch widget — inline, expands below the notification row */}
                    {isCall && dispatch?.open && (
                      <div
                        className="animate-fade-in"
                        style={{
                          borderTop: '1px solid rgba(196,120,32,0.2)',
                          background: 'var(--bg-card)',
                          padding: '14px 18px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <UserCheck style={{ color: 'var(--warning)', width: '15px', height: '15px', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          Send waiter to Table #{notif.metadata?.tableNumber}:
                        </span>
                        <select
                          className="form-input"
                          style={{ flex: 1, minWidth: '160px', maxWidth: '260px', padding: '8px 10px', fontSize: '0.82rem' }}
                          value={dispatch.waiterId}
                          onChange={e => setDispatching(prev => ({ ...prev, [notif.id]: { ...prev[notif.id], waiterId: e.target.value } }))}
                        >
                          <option value="" disabled>Select waiter…</option>
                          {waiters.map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                          ))}
                        </select>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '8px 16px', fontSize: '0.82rem', gap: '6px', flexShrink: 0 }}
                          onClick={() => handleDispatch(notif)}
                          disabled={!dispatch.waiterId || dispatch.sending}
                        >
                          {dispatch.sending ? (
                            <div className="spinner" style={{ width: '12px', height: '12px', borderWidth: '2px', borderTopColor: '#0A0806' }} />
                          ) : (
                            <Send style={{ width: '13px', height: '13px' }} />
                          )}
                          {dispatch.sending ? 'Sending…' : 'Send'}
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '8px 12px', fontSize: '0.82rem', flexShrink: 0 }}
                          onClick={() => closeDispatch(notif.id)}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
