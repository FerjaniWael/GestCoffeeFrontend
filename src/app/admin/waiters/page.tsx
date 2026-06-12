'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { IUser } from '@/lib/types';
import { Plus, Edit, Key, ToggleLeft, ToggleRight, X, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WaitersPage() {
  const [waiters, setWaiters] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [currentWaiter, setCurrentWaiter] = useState<IUser | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchWaiters = async () => {
    try {
      const response = await api.get('/users/waiters');
      if (response.data && response.data.success) {
        setWaiters(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load waiters', error);
      toast.error('Failed to retrieve waiters list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaiters();
  }, []);

  const openCreateModal = () => {
    setFormMode('create');
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setCurrentWaiter(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (waiter: IUser) => {
    setFormMode('edit');
    setName(waiter.name);
    setEmail(waiter.email);
    setCurrentWaiter(waiter);
    setIsFormModalOpen(true);
  };

  const openPasswordModal = (waiter: IUser) => {
    setPassword('');
    setConfirmPassword('');
    setCurrentWaiter(waiter);
    setIsPasswordModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error('Name and email are required');
      return;
    }

    if (formMode === 'create' && !password) {
      toast.error('Password is required for new accounts');
      return;
    }

    if (formMode === 'create' && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      if (formMode === 'create') {
        const response = await api.post('/users/waiters', { name, email, password });
        if (response.data.success) {
          toast.success('Waiter account created successfully');
          setIsFormModalOpen(false);
          fetchWaiters();
        }
      } else if (formMode === 'edit' && currentWaiter) {
        const response = await api.put(`/users/waiters/${currentWaiter.id}`, { name, email });
        if (response.data.success) {
          toast.success('Waiter account updated successfully');
          setIsFormModalOpen(false);
          fetchWaiters();
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error('Password is required');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!currentWaiter) return;

    setIsSubmitting(true);
    try {
      const response = await api.patch(`/users/waiters/${currentWaiter.id}/reset-password`, { password });
      if (response.data.success) {
        toast.success(`Password updated for ${currentWaiter.name}`);
        setIsPasswordModalOpen(false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      const response = await api.patch(`/users/waiters/${id}/toggle`);
      if (response.data.success) {
        toast.success(response.data.message || 'Status updated successfully');
        // Optimistic update
        setWaiters(prev =>
          prev.map(waiter => waiter.id === id ? { ...waiter, isActive: !waiter.isActive } : waiter)
        );
      }
    } catch (error) {
      console.error('Failed to toggle status', error);
      toast.error('Failed to update waiter account status');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '6px' }}>Waiter Management</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Add, edit, and configure access permissions for your coffee shop service staff.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal} style={{ display: 'flex', gap: '8px' }}>
          <Plus style={{ width: '18px', height: '18px' }} />
          Add Waiter
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', height: '40vh', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-medium)', background: 'rgba(255, 255, 255, 0.02)' }}>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600 }}>Waiter Info</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600 }}>Email</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {waiters.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No waiter accounts set up yet. Click 'Add Waiter' to create one.
                  </td>
                </tr>
              ) : (
                waiters.map((waiter) => (
                  <tr key={waiter.id} style={{ borderBottom: '1px solid var(--border-light)' }} className="waiter-row">
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: 'var(--primary-light)', padding: '8px', borderRadius: '50%', border: '1px solid var(--border-light)' }}>
                          <User style={{ color: 'var(--primary)', width: '18px', height: '18px' }} />
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '1rem', color: '#fff' }}>
                          {waiter.name}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>
                      {waiter.email}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <button 
                        onClick={() => handleToggleActive(waiter.id)}
                        style={{ background: 'transparent', display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        {waiter.isActive ? (
                          <>
                            <ToggleRight style={{ width: '32px', height: '32px', color: 'var(--success)' }} />
                            <span className="badge badge-served">Active</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft style={{ width: '32px', height: '32px', color: 'var(--text-muted)' }} />
                            <span className="badge badge-completed">Disabled</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '8px' }}
                          onClick={() => openEditModal(waiter)}
                          title="Edit Details"
                        >
                          <Edit style={{ width: '16px', height: '16px', color: 'var(--text-secondary)' }} />
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '8px' }}
                          onClick={() => openPasswordModal(waiter)}
                          title="Reset Password"
                        >
                          <Key style={{ width: '16px', height: '16px', color: 'var(--primary)' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {isFormModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }} onClick={() => setIsFormModalOpen(false)}>
          <div className="glass-card animate-fade-in" style={{
            width: '100%',
            maxWidth: '480px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>
                {formMode === 'create' ? 'Create Waiter Account' : 'Edit Waiter Details'}
              </h3>
              <button onClick={() => setIsFormModalOpen(false)} style={{ background: 'transparent', color: 'var(--text-secondary)' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label className="form-label" htmlFor="wtrName">Full Name *</label>
                <input
                  id="wtrName"
                  className="form-input"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <label className="form-label" htmlFor="wtrEmail">Email Address *</label>
                <input
                  id="wtrEmail"
                  type="email"
                  className="form-input"
                  placeholder="e.g. john@coffee.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>

              {formMode === 'create' && (
                <>
                  <div>
                    <label className="form-label" htmlFor="wtrPass">Temporary Password *</label>
                    <input
                      id="wtrPass"
                      type="password"
                      className="form-input"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label" htmlFor="wtrConfirm">Confirm Password *</label>
                    <input
                      id="wtrConfirm"
                      type="password"
                      className="form-input"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsFormModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Waiter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {isPasswordModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }} onClick={() => setIsPasswordModalOpen(false)}>
          <div className="glass-card animate-fade-in" style={{
            width: '100%',
            maxWidth: '440px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>
                Reset Password
              </h3>
              <button onClick={() => setIsPasswordModalOpen(false)} style={{ background: 'transparent', color: 'var(--text-secondary)' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Enter a new password for <strong>{currentWaiter?.name}</strong>.
            </p>

            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label className="form-label" htmlFor="newPass">New Password</label>
                <input
                  id="newPass"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <label className="form-label" htmlFor="newConfirm">Confirm Password</label>
                <input
                  id="newConfirm"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsPasswordModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        .waiter-row {
          transition: background-color var(--transition-fast);
        }
        .waiter-row:hover {
          background-color: rgba(255, 255, 255, 0.015);
        }
      `}</style>
    </div>
  );
}
