'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import { IOrder } from '@/lib/types';
import { Clock, Play, Check, CheckCircle, ShoppingBag, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WaiterDashboard() {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const { user } = useAuth();
  const { socket } = useSocket();

  const fetchMyOrders = async () => {
    try {
      const response = await api.get('/orders/my-orders');
      if (response.data?.success) setOrders(response.data.data);
    } catch (error) {
      toast.error('Failed to load your assigned orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMyOrders(); }, []);

  useEffect(() => {
    if (socket && user) {
      const handleOrderAssigned = (order: IOrder) => {
        setOrders((prev) => {
          if (prev.some((o) => o.id === order.id)) return prev.map((o) => (o.id === order.id ? { ...o, ...order } : o));
          return [order, ...prev];
        });
      };
      const handleStatusUpdate = (order: IOrder) => {
        setOrders((prev) => {
          if (prev.some((o) => o.id === order.id)) return prev.map((o) => (o.id === order.id ? { ...o, ...order } : o));
          if (order.assignedWaiterId === user.id) return [order, ...prev];
          return prev;
        });
      };
      socket.on('order-assigned', handleOrderAssigned);
      socket.on('order-status-update', handleStatusUpdate);
      return () => {
        socket.off('order-assigned', handleOrderAssigned);
        socket.off('order-status-update', handleStatusUpdate);
      };
    }
  }, [socket, user]);

  const handleUpdateStatus = async (id: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'pending' ? 'in_progress' : currentStatus === 'in_progress' ? 'served' : null;
    if (!nextStatus) return;
    try {
      const response = await api.patch(`/orders/${id}/status`, { status: nextStatus });
      if (response.data.success) {
        toast.success(`Moved to ${nextStatus.replace('_', ' ')}`);
        setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: nextStatus as any } : o)));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleCompleteOrder = async (id: number) => {
    try {
      const response = await api.patch(`/orders/${id}/complete`);
      if (response.data.success) {
        toast.success('Order completed');
        setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: 'completed' } : o)));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete order');
    }
  };

  const filteredOrders = orders.filter((o) => (showActiveOnly ? o.status !== 'completed' : true));

  const relativeTime = (d?: string) => {
    if (!d) return '';
    const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    return `${Math.floor(m / 60)}h ago`;
  };

  /* Status step indicator */
  const steps = ['pending', 'in_progress', 'served', 'completed'];
  const stepLabels = ['New', 'Prep', 'Served', 'Paid'];

  const statusColor = (s: string) =>
    s === 'pending' ? 'var(--warning)' : s === 'in_progress' ? 'var(--info)' : s === 'served' ? 'var(--success)' : 'var(--text-muted)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="accent-line" style={{ marginBottom: '10px' }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontStyle: 'italic', fontWeight: 800, marginBottom: '3px' }}>
            Your Orders
          </h2>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
            Manage service for assigned tables
          </span>
        </div>
        <button
          className="btn btn-secondary"
          style={{ padding: '8px 10px' }}
          onClick={() => { setLoading(true); fetchMyOrders(); }}
          title="Refresh"
        >
          <RefreshCw style={{ width: '15px', height: '15px' }} />
        </button>
      </div>

      {/* Filter toggle */}
      <div className="glass-card" style={{ display: 'flex', padding: '5px', gap: '4px', borderRadius: 'var(--radius-sm)' }}>
        {[{ label: 'Active', active: showActiveOnly }, { label: 'All', active: !showActiveOnly }].map((tab, i) => (
          <button
            key={tab.label}
            style={{
              flex: 1,
              padding: '9px',
              borderRadius: '4px',
              background: tab.active ? 'var(--primary)' : 'transparent',
              color: tab.active ? '#0A0806' : 'var(--text-secondary)',
              fontSize: '0.84rem',
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
            }}
            onClick={() => setShowActiveOnly(i === 0)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {loading ? (
        <div style={{ display: 'flex', height: '40vh', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          <ShoppingBag style={{ width: '28px', height: '28px', margin: '0 auto 10px auto', opacity: 0.4 }} />
          No assigned orders found.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredOrders.map((order) => {
            const totalPrice = order.OrderItems?.reduce((s, i) => s + (i.Article?.price || 0) * i.quantity, 0) || 0;
            const stepIndex = steps.indexOf(order.status);
            const accent = statusColor(order.status);

            return (
              <div
                key={order.id}
                className="glass-card animate-fade-in"
                style={{
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  borderLeft: `3px solid ${accent}`,
                }}
              >
                {/* Card header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, marginBottom: '3px' }}>
                      Table {order.Table?.tableNumber || order.tableId}
                    </h3>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock style={{ width: '11px', height: '11px' }} />
                      {relativeTime(order.createdAt)}
                    </span>
                  </div>
                  {/* Step indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {steps.map((s, si) => (
                      <React.Fragment key={s}>
                        <div style={{
                          width: si <= stepIndex ? '8px' : '6px',
                          height: si <= stepIndex ? '8px' : '6px',
                          borderRadius: '50%',
                          background: si <= stepIndex ? accent : 'var(--border-solid)',
                          transition: 'all var(--transition-fast)',
                          flexShrink: 0,
                        }} />
                        {si < 3 && (
                          <div style={{
                            width: '10px',
                            height: '1px',
                            background: si < stepIndex ? accent : 'var(--border-solid)',
                          }} />
                        )}
                      </React.Fragment>
                    ))}
                    <span style={{ fontSize: '0.62rem', color: accent, fontWeight: 700, marginLeft: '4px', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-body)' }}>
                      {stepLabels[stepIndex]}
                    </span>
                  </div>
                </div>

                {/* Order items */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.15)',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-solid)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px',
                }}>
                  {order.OrderItems?.map((item) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{item.quantity}×</span>{' '}
                        {item.Article?.name || `Item #${item.articleId}`}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                        ${((item.Article?.price || 0) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer: total + action */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
                      Total
                    </span>
                    <span className="stat-number" style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>
                      ${totalPrice.toFixed(2)}
                    </span>
                  </div>

                  {order.status === 'pending' && (
                    <button
                      className="btn btn-primary"
                      style={{ padding: '9px 16px', fontSize: '0.82rem' }}
                      onClick={() => handleUpdateStatus(order.id, 'pending')}
                    >
                      <Play style={{ width: '13px', height: '13px' }} />
                      Start Prep
                    </button>
                  )}
                  {order.status === 'in_progress' && (
                    <button
                      className="btn btn-primary"
                      style={{ padding: '9px 16px', fontSize: '0.82rem', background: 'var(--info)', boxShadow: '0 3px 12px rgba(40,88,184,0.3)' }}
                      onClick={() => handleUpdateStatus(order.id, 'in_progress')}
                    >
                      <Check style={{ width: '13px', height: '13px' }} />
                      Serve Order
                    </button>
                  )}
                  {order.status === 'served' && (
                    <button
                      className="btn btn-primary"
                      style={{ padding: '9px 16px', fontSize: '0.82rem', background: 'var(--success)', boxShadow: '0 3px 12px rgba(42,153,96,0.3)' }}
                      onClick={() => handleCompleteOrder(order.id)}
                    >
                      <CheckCircle style={{ width: '13px', height: '13px' }} />
                      Complete & Pay
                    </button>
                  )}
                  {order.status === 'completed' && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', fontFamily: 'var(--font-display)' }}>
                      Completed
                    </span>
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
