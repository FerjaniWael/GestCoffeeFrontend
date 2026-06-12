'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { IUser } from '@/lib/types';
import { Plus, Edit, Key, ToggleLeft, ToggleRight, X, ChefHat } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLE_LABEL: Record<string, string> = {
  head_chef: 'Head Chef',
  pastry_chef: 'Pastry Chef',
};

export default function ChefsPage() {
  const [chefs, setChefs] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [current, setCurrent] = useState<IUser | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'head_chef' | 'pastry_chef'>('head_chef');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchChefs = async () => {
    try {
      const res = await api.get('/users/chefs');
      if (res.data?.success) setChefs(res.data.data);
    } catch { toast.error('Failed to load chefs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchChefs(); }, []);

  const openCreate = () => {
    setFormMode('create'); setName(''); setEmail(''); setRole('head_chef');
    setPassword(''); setConfirmPassword(''); setCurrent(null); setIsFormOpen(true);
  };

  const openEdit = (chef: IUser) => {
    setFormMode('edit'); setName(chef.name); setEmail(chef.email);
    setRole(chef.role as any); setCurrent(chef); setIsFormOpen(true);
  };

  const openPassword = (chef: IUser) => {
    setPassword(''); setConfirmPassword(''); setCurrent(chef); setIsPasswordOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) { toast.error('Name and email required'); return; }
    if (formMode === 'create' && !password) { toast.error('Password required'); return; }
    if (formMode === 'create' && password !== confirmPassword) { toast.error('Passwords do not match'); return; }

    setSubmitting(true);
    try {
      if (formMode === 'create') {
        const res = await api.post('/users/chefs', { name, email, password, role });
        if (res.data.success) { toast.success('Chef account created'); setIsFormOpen(false); fetchChefs(); }
      } else if (current) {
        const res = await api.put(`/users/chefs/${current.id}`, { name, email });
        if (res.data.success) { toast.success('Chef updated'); setIsFormOpen(false); fetchChefs(); }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally { setSubmitting(false); }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) { toast.error('Password required'); return; }
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (!current) return;

    setSubmitting(true);
    try {
      const res = await api.patch(`/users/chefs/${current.id}/reset-password`, { password });
      if (res.data.success) { toast.success(`Password updated for ${current.name}`); setIsPasswordOpen(false); }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSubmitting(false); }
  };

  const handleToggle = async (id: number) => {
    try {
      const res = await api.patch(`/users/chefs/${id}/toggle`);
      if (res.data.success) setChefs(prev => prev.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));
    } catch { toast.error('Failed to toggle status'); }
  };

  const modalStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
    zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div className="accent-line" style={{ marginBottom: '10px' }} />
          <h2 style={{ fontSize: '2rem', marginBottom: '6px' }}>Kitchen Staff</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Manage head chefs and pastry chefs. Assign articles to their roles from the Menu Items page.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate} style={{ gap: '8px' }}>
          <Plus style={{ width: '16px', height: '16px' }} /> Add Chef
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', height: '40vh', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>
      ) : (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-medium)', background: 'var(--bg-subtle)' }}>
                {['Chef', 'Role', 'Email', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em', textAlign: h === 'Actions' ? 'right' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chefs.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>No chef accounts yet.</td></tr>
              ) : chefs.map(chef => (
                <tr key={chef.id} style={{ borderBottom: '1px solid var(--border-solid)' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ background: 'var(--primary-light)', padding: '7px', borderRadius: '50%', border: '1px solid var(--border-light)' }}>
                        <ChefHat style={{ color: 'var(--primary)', width: '16px', height: '16px' }} />
                      </div>
                      <span style={{ fontWeight: 600 }}>{chef.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ background: 'var(--primary-light)', border: '1px solid var(--border-light)', color: 'var(--primary)', borderRadius: '4px', padding: '2px 8px', fontSize: '0.74rem', fontWeight: 700 }}>
                      {ROLE_LABEL[chef.role] ?? chef.role}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{chef.email}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <button onClick={() => handleToggle(chef.id)} style={{ background: 'transparent', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {chef.isActive
                        ? <><ToggleRight style={{ width: '28px', height: '28px', color: 'var(--success)' }} /><span className="badge badge-served">Active</span></>
                        : <><ToggleLeft style={{ width: '28px', height: '28px', color: 'var(--text-muted)' }} /><span className="badge badge-completed">Disabled</span></>}
                    </button>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button className="btn btn-secondary" style={{ padding: '7px' }} onClick={() => openEdit(chef)} title="Edit"><Edit style={{ width: '14px', height: '14px' }} /></button>
                      <button className="btn btn-secondary" style={{ padding: '7px' }} onClick={() => openPassword(chef)} title="Reset password"><Key style={{ width: '14px', height: '14px', color: 'var(--primary)' }} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit modal */}
      {isFormOpen && (
        <div style={modalStyle} onClick={() => setIsFormOpen(false)}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '480px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '22px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--primary)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
                {formMode === 'create' ? 'Add Chef Account' : 'Edit Chef'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} style={{ background: 'transparent', color: 'var(--text-muted)' }}><X style={{ width: '18px', height: '18px' }} /></button>
            </div>
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div><label className="form-label">Full Name *</label><input className="form-input" placeholder="e.g. Marie Dupont" value={name} onChange={e => setName(e.target.value)} required /></div>
              <div><label className="form-label">Email *</label><input type="email" className="form-input" placeholder="chef@coffee.com" value={email} onChange={e => setEmail(e.target.value)} required /></div>
              {formMode === 'create' && (
                <div>
                  <label className="form-label">Role *</label>
                  <select className="form-input" value={role} onChange={e => setRole(e.target.value as any)}>
                    <option value="head_chef">Head Chef</option>
                    <option value="pastry_chef">Pastry Chef</option>
                  </select>
                </div>
              )}
              {formMode === 'create' && (
                <>
                  <div><label className="form-label">Password *</label><input type="password" className="form-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required /></div>
                  <div><label className="form-label">Confirm Password *</label><input type="password" className="form-input" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required /></div>
                </>
              )}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving…' : formMode === 'create' ? 'Create Chef' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password reset modal */}
      {isPasswordOpen && (
        <div style={modalStyle} onClick={() => setIsPasswordOpen(false)}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '22px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--primary)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>Reset Password</h3>
              <button onClick={() => setIsPasswordOpen(false)} style={{ background: 'transparent', color: 'var(--text-muted)' }}><X style={{ width: '18px', height: '18px' }} /></button>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>New password for <strong>{current?.name}</strong></p>
            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div><label className="form-label">New Password</label><input type="password" className="form-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required /></div>
              <div><label className="form-label">Confirm</label><input type="password" className="form-input" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required /></div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsPasswordOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Resetting…' : 'Reset Password'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
