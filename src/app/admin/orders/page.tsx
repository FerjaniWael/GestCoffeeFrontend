'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useSocket } from '@/context/SocketContext';
import { IOrder, IUser, ITable } from '@/lib/types';
import { 
  Clock, 
  User, 
  UserCheck, 
  Check, 
  Trash2, 
  AlertCircle,
  Play,
  CheckCircle,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [waiters, setWaiters] = useState<IUser[]>([]);
  const [tables, setTables] = useState<ITable[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tableFilter, setTableFilter] = useState<string>('all');
  
  const { socket } = useSocket();

  const fetchData = async () => {
    try {
      const [ordersRes, waitersRes, tablesRes] = await Promise.all([
        api.get('/orders'),
        api.get('/users/waiters'),
        api.get('/tables')
      ]);

      if (ordersRes.data.success && waitersRes.data.success && tablesRes.data.success) {
        setOrders(ordersRes.data.data);
        setWaiters(waitersRes.data.data.filter((w: IUser) => w.isActive));
        setTables(tablesRes.data.data);
      }
    } catch (error) {
      console.error('Failed to load orders management data', error);
      toast.error('Failed to retrieve orders data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Listen to Socket.IO real-time order updates
  useEffect(() => {
    if (socket) {
      // New order placed
      const handleNewOrder = (newOrder: IOrder) => {
        // Double check if already added
        setOrders(prev => {
          if (prev.some(o => o.id === newOrder.id)) return prev;
          return [newOrder, ...prev];
        });
      };

      // Order status updated
      const handleStatusUpdate = (updatedOrder: IOrder) => {
        setOrders(prev =>
          prev.map(o => o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o)
        );
      };

      // Order assigned to waiter
      const handleOrderAssigned = (assignedOrder: IOrder) => {
        setOrders(prev =>
          prev.map(o => o.id === assignedOrder.id ? { ...o, ...assignedOrder } : o)
        );
      };

      socket.on('new-order', handleNewOrder);
      socket.on('order-status-update', handleStatusUpdate);
      socket.on('order-assigned', handleOrderAssigned);

      return () => {
        socket.off('new-order', handleNewOrder);
        socket.off('order-status-update', handleStatusUpdate);
        socket.off('order-assigned', handleOrderAssigned);
      };
    }
  }, [socket]);

  const handleUpdateStatus = async (id: number, currentStatus: string) => {
    let nextStatus = '';
    if (currentStatus === 'pending') nextStatus = 'in_progress';
    else if (currentStatus === 'in_progress') nextStatus = 'served';
    else if (currentStatus === 'served') nextStatus = 'completed';
    else return;

    try {
      const response = await api.patch(`/orders/${id}/status`, { status: nextStatus });
      if (response.data.success) {
        toast.success(`Order moved to ${nextStatus.replace('_', ' ')}`);
        // Socket event will also trigger, but we update locally immediately for responsiveness
        setOrders(prev =>
          prev.map(o => o.id === id ? { ...o, status: nextStatus as any } : o)
        );
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update order status');
    }
  };

  const handleAssignWaiter = async (orderId: number, waiterIdStr: string) => {
    if (!waiterIdStr) return;
    const waiterId = parseInt(waiterIdStr);

    try {
      const response = await api.patch(`/orders/${orderId}/assign`, { waiterId });
      if (response.data.success) {
        const assignedWaiter = waiters.find(w => w.id === waiterId);
        toast.success(`Assigned to ${assignedWaiter?.name}`);
        // Locally update
        setOrders(prev =>
          prev.map(o => o.id === orderId ? { ...o, assignedWaiterId: waiterId, Waiter: assignedWaiter } : o)
        );
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to assign waiter');
    }
  };

  const handleCompleteOrder = async (id: number) => {
    try {
      const response = await api.patch(`/orders/${id}/complete`);
      if (response.data.success) {
        toast.success('Order completed successfully');
        setOrders(prev =>
          prev.map(o => o.id === id ? { ...o, status: 'completed' } : o)
        );
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete order');
    }
  };

  const handleDeleteOrder = async (id: number) => {
    if (!confirm('Are you sure you want to delete/cancel this order?')) {
      return;
    }

    try {
      const response = await api.delete(`/orders/${id}`);
      if (response.data.success) {
        toast.success('Order cancelled and deleted');
        setOrders(prev => prev.filter(o => o.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete order', error);
      toast.error('Failed to cancel order');
    }
  };

  const getRelativeTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const diffMs = new Date().getTime() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    return `${diffHours} hours ago`;
  };

  const getStatusLabelColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'in_progress': return '#3b82f6';
      case 'served': return '#10b981';
      case 'completed': return '#78716c';
      default: return '#fff';
    }
  };

  // Filter & Search Logic
  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesTable = tableFilter === 'all' || order.tableId.toString() === tableFilter;
    return matchesStatus && matchesTable;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '6px' }}>Real-Time Orders</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Track and manage orders, assign waiters, and transition statuses in real time.</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-card" style={{ padding: '16px 24px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter style={{ color: 'var(--primary)', width: '18px', height: '18px' }} />
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Filters:</span>
        </div>

        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['all', 'pending', 'in_progress', 'served', 'completed'].map(status => (
            <button
              key={status}
              className={`btn ${statusFilter === status ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 16px', fontSize: '0.85rem', textTransform: 'capitalize' }}
              onClick={() => setStatusFilter(status)}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }} className="table-filter-wrapper">
          <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }} htmlFor="tblFilter">Filter by Table:</label>
          <select
            id="tblFilter"
            className="form-input"
            style={{ width: '140px', padding: '10px' }}
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
          >
            <option value="all">All Tables</option>
            {tables.map(t => (
              <option key={t.id} value={t.id}>Table {t.tableNumber}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', height: '40vh', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="orders-grid">
          {filteredOrders.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '80px 0', textAlign: 'center', color: 'var(--text-muted)' }} className="glass-card">
              No orders matching selection criteria.
            </div>
          ) : (
            filteredOrders.map((order) => {
              const totalItems = order.OrderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
              const totalPrice = order.OrderItems?.reduce((sum, item) => {
                return sum + (item.Article?.price || 0) * item.quantity;
              }, 0) || 0;

              return (
                <div key={order.id} className="glass-card order-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px', borderLeft: `4px solid ${getStatusLabelColor(order.status)}` }}>
                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <h3 style={{ fontSize: '1.25rem', color: '#fff' }}>Table #{order.Table?.tableNumber || order.tableId}</h3>
                        <span className={`badge ${
                          order.status === 'pending' ? 'badge-pending' :
                          order.status === 'in_progress' ? 'badge-progress' :
                          order.status === 'served' ? 'badge-served' : 'badge-completed'
                        }`}>
                          {order.status.replace('_', ' ')}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock style={{ width: '12px', height: '12px' }} />
                        {getRelativeTime(order.createdAt)}
                      </span>
                    </div>

                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '6px', background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.1)' }}
                      onClick={() => handleDeleteOrder(order.id)}
                      title="Cancel Order"
                    >
                      <Trash2 style={{ width: '14px', height: '14px', color: 'var(--danger)' }} />
                    </button>
                  </div>

                  {/* Order Items */}
                  <div style={{ borderTop: '1px solid var(--border-glass)', borderBottom: '1px solid var(--border-glass)', padding: '12px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {order.OrderItems?.map((item) => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        <span>
                          <strong style={{ color: 'var(--primary)' }}>{item.quantity}x</strong> {item.Article?.name || `Item #${item.articleId}`}
                        </span>
                        <span>${((item.Article?.price || 0) * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Total pricing */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700 }}>
                    <span>Total Amount:</span>
                    <span style={{ color: 'var(--primary)', fontSize: '1.25rem' }}>${totalPrice.toFixed(2)}</span>
                  </div>

                  {/* Waiter Assignment */}
                  <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                    {order.assignedWaiterId ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                        <UserCheck style={{ color: 'var(--success)', width: '16px', height: '16px' }} />
                        <span>Waiter: <strong>{order.Waiter?.name || `Staff #${order.assignedWaiterId}`}</strong></span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b' }}>
                          <AlertCircle style={{ width: '16px', height: '16px' }} />
                          <span>Unassigned Order</span>
                        </div>
                        <select
                          className="form-input"
                          style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                          onChange={(e) => handleAssignWaiter(order.id, e.target.value)}
                          defaultValue=""
                        >
                          <option value="" disabled>Assign to Waiter...</option>
                          {waiters.map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Transition actions */}
                  {order.status !== 'completed' && (
                    <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                      {order.status === 'pending' && (
                        <button
                          className="btn btn-primary"
                          style={{ width: '100%', display: 'flex', gap: '8px' }}
                          onClick={() => handleUpdateStatus(order.id, 'pending')}
                        >
                          <Play style={{ width: '16px', height: '16px' }} />
                          Prepare Order
                        </button>
                      )}
                      {order.status === 'in_progress' && (
                        <button
                          className="btn btn-primary"
                          style={{ width: '100%', display: 'flex', gap: '8px', background: '#3b82f6', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
                          onClick={() => handleUpdateStatus(order.id, 'in_progress')}
                        >
                          <Check style={{ width: '16px', height: '16px' }} />
                          Mark Served
                        </button>
                      )}
                      {order.status === 'served' && (
                        <button
                          className="btn btn-primary"
                          style={{ width: '100%', display: 'flex', gap: '8px', background: '#10b981', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}
                          onClick={() => handleCompleteOrder(order.id)}
                        >
                          <CheckCircle style={{ width: '16px', height: '16px' }} />
                          Complete & Paid
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      <style jsx>{`
        .orders-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .order-card {
          transition: transform var(--transition-normal), box-shadow var(--transition-normal);
        }
        .order-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.15), var(--shadow-lg);
        }
        @media (max-width: 1200px) {
          .orders-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 768px) {
          .orders-grid {
            grid-template-columns: 1fr;
          }
          .table-filter-wrapper {
            margin-left: 0 !important;
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  );
}
