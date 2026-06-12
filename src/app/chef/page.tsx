'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import { IKitchenTicket } from '@/lib/types';
import { ChefHat, Clock, Flame, CheckCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  pending:  { label: 'New',     color: 'var(--warning)',  bg: 'var(--warning-light)',  border: 'rgba(196,120,32,0.35)' },
  cooking:  { label: 'Cooking', color: 'var(--info)',     bg: 'var(--info-light)',     border: 'rgba(40,88,184,0.35)'  },
  ready:    { label: 'Ready',   color: 'var(--success)',  bg: 'var(--success-light)',  border: 'rgba(42,153,96,0.35)'  },
};

export default function ChefDashboard() {
  const [tickets, setTickets] = useState<IKitchenTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const { user } = useAuth();
  const { socket } = useSocket();

  const fetchTickets = async () => {
    try {
      const res = await api.get('/kitchen/tickets');
      if (res.data?.success) setTickets(res.data.data);
    } catch {
      toast.error('Failed to load kitchen tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNew = (ticket: any) => {
      setTickets(prev => {
        if (prev.some(t => t.id === ticket.id)) return prev;
        return [ticket, ...prev];
      });
    };

    const handleUpdate = (ticket: IKitchenTicket) => {
      if (ticket.status === 'ready') {
        setTickets(prev => prev.filter(t => t.id !== ticket.id));
      } else {
        setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, ...ticket } : t));
      }
    };

    socket.on('kitchen-new-ticket', handleNew);
    socket.on('kitchen-ticket-update', handleUpdate);
    return () => {
      socket.off('kitchen-new-ticket', handleNew);
      socket.off('kitchen-ticket-update', handleUpdate);
    };
  }, [socket]);

  const handleUpdateStatus = async (ticket: IKitchenTicket, nextStatus: 'cooking' | 'ready') => {
    setUpdatingId(ticket.id);
    try {
      const res = await api.patch(`/kitchen/tickets/${ticket.id}/status`, { status: nextStatus });
      if (res.data?.success) {
        if (nextStatus === 'ready') {
          setTickets(prev => prev.filter(t => t.id !== ticket.id));
          toast.success(`Table #${ticket.tableNumber} — marked as ready! Waiter notified.`);
        } else {
          setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status: nextStatus } : t));
          toast.success(`Started cooking for Table #${ticket.tableNumber}`);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update ticket');
    } finally {
      setUpdatingId(null);
    }
  };

  const relativeTime = (d?: string) => {
    if (!d) return '';
    const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    return `${Math.floor(m / 60)}h ago`;
  };

  const roleLabel = user?.role === 'head_chef' ? 'Head Chef' : 'Pastry Chef';
  const pendingCount = tickets.filter(t => t.status === 'pending').length;
  const cookingCount = tickets.filter(t => t.status === 'cooking').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="accent-line" style={{ marginBottom: '10px' }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontStyle: 'italic', fontWeight: 800, marginBottom: '3px' }}>
            Kitchen Dashboard
          </h2>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
            {roleLabel} · {pendingCount} new · {cookingCount} in progress
          </span>
        </div>
        <button
          className="btn btn-secondary"
          style={{ padding: '8px 10px' }}
          onClick={() => { setLoading(true); fetchTickets(); }}
          title="Refresh"
        >
          <RefreshCw style={{ width: '15px', height: '15px' }} />
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', height: '40vh', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="glass-card" style={{ padding: '56px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
          <ChefHat style={{ width: '32px', height: '32px', color: 'var(--text-muted)', opacity: 0.5 }} />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No pending tickets — kitchen is clear!</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {tickets.map(ticket => {
            const cfg = STATUS_CONFIG[ticket.status];
            const isUpdating = updatingId === ticket.id;
            const items = ticket.Order?.OrderItems ?? [];

            return (
              <div
                key={ticket.id}
                className="glass-card animate-fade-in"
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  borderLeft: `3px solid ${cfg.color}`,
                }}
              >
                {/* Ticket header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, marginBottom: '3px' }}>
                      Table #{ticket.tableNumber}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Clock style={{ width: '10px', height: '10px' }} />
                        {relativeTime(ticket.createdAt)}
                      </span>
                      <span style={{
                        background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color,
                        borderRadius: '4px', padding: '1px 8px',
                        fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-body)',
                      }}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                    #{ticket.id}
                  </span>
                </div>

                {/* Items to prepare */}
                <div style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-solid)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}>
                  {items.length === 0 ? (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No items</span>
                  ) : (
                    items.map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                          <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{item.quantity}×</span>{' '}
                          {item.Article?.name ?? `Item #${i + 1}`}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Action button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  {ticket.status === 'pending' && (
                    <button
                      className="btn btn-primary"
                      style={{ padding: '10px 20px', fontSize: '0.86rem', gap: '8px', background: 'var(--warning)', boxShadow: '0 3px 14px rgba(196,120,32,0.35)' }}
                      onClick={() => handleUpdateStatus(ticket, 'cooking')}
                      disabled={isUpdating}
                    >
                      {isUpdating ? <div className="spinner" style={{ width: '13px', height: '13px', borderWidth: '2px', borderTopColor: '#0A0806' }} /> : <Flame style={{ width: '15px', height: '15px' }} />}
                      Start Cooking
                    </button>
                  )}
                  {ticket.status === 'cooking' && (
                    <button
                      className="btn btn-primary"
                      style={{ padding: '10px 20px', fontSize: '0.86rem', gap: '8px', background: 'var(--success)', boxShadow: '0 3px 14px rgba(42,153,96,0.35)' }}
                      onClick={() => handleUpdateStatus(ticket, 'ready')}
                      disabled={isUpdating}
                    >
                      {isUpdating ? <div className="spinner" style={{ width: '13px', height: '13px', borderWidth: '2px', borderTopColor: '#fff' }} /> : <CheckCircle style={{ width: '15px', height: '15px' }} />}
                      Mark as Ready
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
