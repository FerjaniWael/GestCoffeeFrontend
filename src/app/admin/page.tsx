'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { IOrder, ITable, IUser } from '@/lib/types';
import { ShoppingBag, DollarSign, Users, Smartphone, ArrowRight, Activity, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalOrders: 0, revenue: 0, activeWaiters: 0, occupiedTables: 0 });
  const [recentOrders, setRecentOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [ordersRes, tablesRes, waitersRes] = await Promise.all([
        api.get('/orders'),
        api.get('/tables'),
        api.get('/users/waiters'),
      ]);

      if (ordersRes.data.success && tablesRes.data.success && waitersRes.data.success) {
        const orders: IOrder[] = ordersRes.data.data;
        const tables: ITable[] = tablesRes.data.data;
        const waiters: IUser[] = waitersRes.data.data;

        const revenue = orders
          .filter((o) => o.status === 'completed')
          .reduce((sum, order) => {
            return sum + (order.OrderItems?.reduce((s, item) => s + (item.Article?.price || 0) * item.quantity, 0) || 0);
          }, 0);

        const activeWaiters = waiters.filter((w) => w.isActive && w.role === 'waiter').length;
        const activeOrderTableIds = new Set(orders.filter((o) => o.status !== 'completed').map((o) => o.tableId));
        const occupiedTables = tables.filter((t) => activeOrderTableIds.has(t.id)).length;

        setStats({ totalOrders: orders.length, revenue, activeWaiters, occupiedTables });

        const sorted = [...orders].sort(
          (a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
        );
        setRecentOrders(sorted.slice(0, 5));
      }
    } catch (error) {
      toast.error('Failed to fetch dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  const statCards = [
    { title: 'Orders',          value: String(stats.totalOrders),         sub: 'All time',          icon: ShoppingBag, accent: 'var(--primary)',  rgb: '194,140,50'  },
    { title: 'Revenue',         value: `$${stats.revenue.toFixed(0)}`,    sub: 'Completed sales',   icon: DollarSign,  accent: 'var(--success)', rgb: '42,153,96'   },
    { title: 'Active Waiters',  value: String(stats.activeWaiters),       sub: 'On duty',           icon: Users,       accent: 'var(--info)',    rgb: '40,88,184'   },
    { title: 'Occupied Tables', value: String(stats.occupiedTables),      sub: 'Currently serving', icon: Smartphone,  accent: 'var(--warning)', rgb: '196,120,32'  },
  ];

  const statusClass = (s: string) =>
    s === 'pending' ? 'badge-pending' : s === 'in_progress' ? 'badge-progress' : s === 'served' ? 'badge-served' : 'badge-completed';

  const formatStatus = (s: string) => s.replace('_', ' ');

  const relativeTime = (d?: string) => {
    if (!d) return '';
    const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    return `${Math.floor(m / 60)}h ago`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>

      {/* Page header */}
      <div>
        <div className="accent-line" style={{ marginBottom: '12px' }} />
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontStyle: 'italic', fontWeight: 900, marginBottom: '6px' }}>
          Overview
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Live status of Aroma Cafe operations.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className={`glass-card animate-stagger-${i + 1}`}
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                borderTop: `3px solid rgba(${card.rgb}, 0.5)`,
                borderRadius: 'var(--radius-md)',
              }}
            >
              {/* Icon + title row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.09em',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-body)',
                }}>
                  {card.title}
                </span>
                <div style={{
                  background: `rgba(${card.rgb}, 0.10)`,
                  padding: '8px',
                  borderRadius: '7px',
                  border: `1px solid rgba(${card.rgb}, 0.2)`,
                }}>
                  <Icon style={{ color: card.accent, width: '16px', height: '16px' }} />
                </div>
              </div>

              {/* Big number */}
              <span className="stat-number" style={{ fontSize: '2.4rem', color: 'var(--text-primary)' }}>
                {card.value}
              </span>

              {/* Sub-label */}
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                {card.sub}
              </span>
            </div>
          );
        })}
      </div>

      {/* Lower sections */}
      <div className="sections-grid">

        {/* Recent orders */}
        <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Activity style={{ color: 'var(--primary)', width: '18px', height: '18px' }} />
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700 }}>
                Recent Activity
              </h3>
            </div>
            <Link
              href="/admin/orders"
              style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              View all <ArrowRight style={{ width: '13px', height: '13px' }} />
            </Link>
          </div>

          <div className="divider" />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {recentOrders.length === 0 ? (
              <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                No recent orders.
              </div>
            ) : (
              recentOrders.map((order) => {
                const totalItems = order.OrderItems?.reduce((s, i) => s + i.quantity, 0) || 0;
                const totalPrice = order.OrderItems?.reduce((s, i) => s + (i.Article?.price || 0) * i.quantity, 0) || 0;
                return (
                  <div
                    key={order.id}
                    className="surface-row"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '13px 14px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>
                          Table #{order.Table?.tableNumber || order.tableId}
                        </span>
                        <span className={`badge ${statusClass(order.status)}`}>
                          {formatStatus(order.status)}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock style={{ width: '11px', height: '11px' }} />
                        {relativeTime(order.createdAt)} &bull; {totalItems} item{totalItems !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <span className="stat-number" style={{ fontSize: '1.05rem', color: 'var(--primary)' }}>
                      ${totalPrice.toFixed(2)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingUp style={{ color: 'var(--primary)', width: '18px', height: '18px' }} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700 }}>
              Quick Actions
            </h3>
          </div>

          <div className="divider" />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, justifyContent: 'center' }}>
            {[
              { label: 'Manage Menu & Prices', href: '/admin/articles' },
              { label: 'Generate QR Codes', href: '/admin/tables' },
              { label: 'Add Waiter Account', href: '/admin/waiters' },
            ].map((action, i) => (
              <Link
                key={action.href}
                href={action.href}
                className="btn btn-outline"
                style={{ padding: '13px 16px', justifyContent: 'space-between', display: 'flex' }}
              >
                <span>{action.label}</span>
                <ArrowRight style={{ width: '14px', height: '14px', opacity: 0.6 }} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
        }
        .sections-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
        }
        @media (max-width: 1200px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 1024px) {
          .sections-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .stats-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
