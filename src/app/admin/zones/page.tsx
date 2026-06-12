'use client';

import React, { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import { IZone, ITable, IUser } from '@/lib/types';
import {
  MapPin, Plus, Pencil, Trash2, Save, X, Info,
  Users, Smartphone, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ZoneForm {
  name: string;
  description: string;
  tableIds: number[];
  waiterIds: number[];
}

const EMPTY_FORM: ZoneForm = { name: '', description: '', tableIds: [], waiterIds: [] };

export default function AdminZonesPage() {
  const [zones, setZones] = useState<IZone[]>([]);
  const [allTables, setAllTables] = useState<ITable[]>([]);
  const [allWaiters, setAllWaiters] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [form, setForm] = useState<ZoneForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadData = async () => {
    try {
      const [zonesRes, tablesRes, waitersRes] = await Promise.all([
        api.get('/zones'),
        api.get('/tables'),
        api.get('/users/waiters'),
      ]);
      if (zonesRes.data.success) setZones(zonesRes.data.data);
      if (tablesRes.data.success) setAllTables(tablesRes.data.data);
      if (waitersRes.data.success) setAllWaiters(waitersRes.data.data.filter((w: IUser) => w.isActive));
    } catch {
      toast.error('Failed to load zone data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Tables that belong to a DIFFERENT zone than the one currently being edited
  const takenTableMap = useMemo(() => {
    const map: Record<number, string> = {};
    const currentId = typeof editingId === 'number' ? editingId : null;
    for (const z of zones) {
      if (z.id === currentId) continue;
      for (const t of z.Tables || []) {
        map[t.id] = z.name;
      }
    }
    return map;
  }, [zones, editingId]);

  const assignedTableIds = useMemo(
    () => new Set(zones.flatMap(z => (z.Tables || []).map(t => t.id))),
    [zones]
  );

  const handleStartEdit = (zone: IZone) => {
    setForm({
      name: zone.name,
      description: zone.description || '',
      tableIds: (zone.Tables || []).map(t => t.id),
      waiterIds: (zone.Waiters || []).map(w => w.id),
    });
    setEditingId(zone.id);
  };

  const handleStartNew = () => {
    setForm(EMPTY_FORM);
    setEditingId('new');
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const toggleTableId = (id: number) => {
    setForm(f => ({
      ...f,
      tableIds: f.tableIds.includes(id) ? f.tableIds.filter(x => x !== id) : [...f.tableIds, id],
    }));
  };

  const toggleWaiterId = (id: number) => {
    setForm(f => ({
      ...f,
      waiterIds: f.waiterIds.includes(id) ? f.waiterIds.filter(x => x !== id) : [...f.waiterIds, id],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Zone name is required');
      return;
    }
    setSaving(true);
    try {
      if (editingId === 'new') {
        const res = await api.post('/zones', form);
        if (res.data.success) {
          setZones(prev => [...prev, res.data.data].sort((a, b) => a.name.localeCompare(b.name)));
          toast.success(`Zone "${res.data.data.name}" created`);
        }
      } else {
        const res = await api.put(`/zones/${editingId}`, form);
        if (res.data.success) {
          setZones(prev =>
            prev.map(z => z.id === editingId ? res.data.data : z)
              .sort((a, b) => a.name.localeCompare(b.name))
          );
          toast.success(`Zone "${res.data.data.name}" updated`);
        }
      }
      setEditingId(null);
      setForm(EMPTY_FORM);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save zone');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete zone "${name}"? Tables and waiter assignments will be removed. Orders are not affected.`)) return;
    setDeletingId(id);
    try {
      await api.delete(`/zones/${id}`);
      setZones(prev => prev.filter(z => z.id !== id));
      toast.success(`Zone "${name}" deleted`);
    } catch {
      toast.error('Failed to delete zone');
    } finally {
      setDeletingId(null);
    }
  };

  const totalAssigned = assignedTableIds.size;
  const totalUnzoned = allTables.length - totalAssigned;

  // ── Edit / New form card ──────────────────────────────────────────────────
  const renderEditCard = (zone?: IZone) => (
    <div
      className="glass-card animate-fade-in"
      style={{
        padding: '28px',
        borderColor: 'var(--border-medium)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      {/* Card header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <MapPin style={{ color: 'var(--primary)', width: '18px', height: '18px' }} />
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontStyle: 'italic' }}>
          {zone ? `Edit — ${zone.name}` : 'New Zone'}
        </h3>
      </div>

      {/* Name + Description */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label className="form-label">Zone Name *</label>
          <input
            className="form-input"
            placeholder="e.g. Zone A, Terrace, Indoor"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div>
          <label className="form-label">Description (optional)</label>
          <input
            className="form-input"
            placeholder="e.g. Ground floor, 4 tables"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
        </div>
      </div>

      {/* Tables picker */}
      <div>
        <label className="form-label" style={{ marginBottom: '10px' }}>
          Assign Tables ({form.tableIds.length} selected)
        </label>
        {allTables.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No tables found.</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {allTables
              .sort((a, b) => a.tableNumber - b.tableNumber)
              .map(table => {
                const checked = form.tableIds.includes(table.id);
                const takenBy = takenTableMap[table.id];
                return (
                  <button
                    key={table.id}
                    onClick={() => toggleTableId(table.id)}
                    title={takenBy ? `Currently in "${takenBy}" — will be moved` : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${checked ? 'var(--primary)' : takenBy ? 'var(--warning)' : 'var(--border-solid)'}`,
                      background: checked
                        ? 'var(--primary-light)'
                        : takenBy
                        ? 'var(--warning-light)'
                        : 'var(--bg-subtle)',
                      color: checked ? 'var(--primary)' : takenBy ? 'var(--warning)' : 'var(--text-secondary)',
                      fontSize: '0.82rem',
                      fontWeight: checked ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    {checked ? (
                      <CheckCircle2 style={{ width: '12px', height: '12px' }} />
                    ) : (
                      <Smartphone style={{ width: '12px', height: '12px' }} />
                    )}
                    Table {table.tableNumber}
                    {takenBy && !checked && (
                      <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>({takenBy})</span>
                    )}
                  </button>
                );
              })}
          </div>
        )}
        {Object.values(takenTableMap).some((_, i) =>
          form.tableIds.includes(allTables.find(t => takenTableMap[t.id])?.id ?? -1)
        ) && (
          <p style={{ color: 'var(--warning)', fontSize: '0.78rem', marginTop: '8px' }}>
            Tables from other zones will be moved here on save.
          </p>
        )}
      </div>

      {/* Waiters picker */}
      <div>
        <label className="form-label" style={{ marginBottom: '10px' }}>
          Assign Waiters ({form.waiterIds.length} selected)
        </label>
        {allWaiters.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No active waiters found.</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {allWaiters.map(waiter => {
              const checked = form.waiterIds.includes(waiter.id);
              return (
                <button
                  key={waiter.id}
                  onClick={() => toggleWaiterId(waiter.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${checked ? 'var(--primary)' : 'var(--border-solid)'}`,
                    background: checked ? 'var(--primary-light)' : 'var(--bg-subtle)',
                    color: checked ? 'var(--primary)' : 'var(--text-secondary)',
                    fontSize: '0.82rem',
                    fontWeight: checked ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {checked ? (
                    <CheckCircle2 style={{ width: '12px', height: '12px' }} />
                  ) : (
                    <Users style={{ width: '12px', height: '12px' }} />
                  )}
                  {waiter.name}
                </button>
              );
            })}
          </div>
        )}
        <p style={{ color: 'var(--text-muted)', fontSize: '0.76rem', marginTop: '8px' }}>
          A waiter can be assigned to multiple zones. Orders auto-assign to the first waiter listed here.
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px', borderTop: '1px solid var(--border-solid)' }}>
        <button className="btn btn-secondary" onClick={handleCancel} disabled={saving}>
          <X style={{ width: '14px', height: '14px' }} />
          Cancel
        </button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? (
            <div className="spinner" style={{ width: '13px', height: '13px', borderWidth: '2px', borderTopColor: '#0A0806' }} />
          ) : (
            <Save style={{ width: '14px', height: '14px' }} />
          )}
          {saving ? 'Saving…' : 'Save Zone'}
        </button>
      </div>
    </div>
  );

  // ── View card ─────────────────────────────────────────────────────────────
  const renderViewCard = (zone: IZone) => (
    <div
      key={zone.id}
      className="glass-card animate-fade-in"
      style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'var(--primary-light)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <MapPin style={{ color: 'var(--primary)', width: '14px', height: '14px' }} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
              {zone.name}
            </h3>
            {zone.description && (
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{zone.description}</span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '6px' }}
            onClick={() => handleStartEdit(zone)}
          >
            <Pencil style={{ width: '13px', height: '13px' }} />
            Edit
          </button>
          <button
            className="btn btn-secondary"
            style={{ padding: '6px', background: 'var(--danger-light)', borderColor: 'rgba(192,56,40,0.2)' }}
            onClick={() => handleDelete(zone.id, zone.name)}
            disabled={deletingId === zone.id}
          >
            <Trash2 style={{ width: '13px', height: '13px', color: 'var(--danger)' }} />
          </button>
        </div>
      </div>

      <div className="divider" />

      {/* Tables */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
          Tables ({(zone.Tables || []).length})
        </span>
        {(zone.Tables || []).length === 0 ? (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontStyle: 'italic' }}>No tables assigned</span>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {(zone.Tables || [])
              .sort((a, b) => a.tableNumber - b.tableNumber)
              .map(t => (
                <span
                  key={t.id}
                  style={{
                    background: 'var(--primary-light)',
                    border: '1px solid var(--border-light)',
                    color: 'var(--primary)',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  #{t.tableNumber}
                </span>
              ))}
          </div>
        )}
      </div>

      {/* Waiters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
          Waiters ({(zone.Waiters || []).length})
        </span>
        {(zone.Waiters || []).length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--warning)', fontSize: '0.82rem' }}>
            <AlertTriangle style={{ width: '13px', height: '13px' }} />
            No waiter assigned — admin will be alerted on new orders
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {(zone.Waiters || []).map(w => (
              <span
                key={w.id}
                style={{
                  background: 'var(--success-light)',
                  border: '1px solid rgba(42,153,96,0.28)',
                  color: 'var(--success)',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  fontFamily: 'var(--font-body)',
                }}
              >
                {w.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div className="accent-line" style={{ marginBottom: '10px' }} />
          <h2 style={{ fontSize: '2rem', marginBottom: '6px' }}>Zone Management</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Group tables into zones and assign waiters. Orders are auto-routed to the responsible waiter.
          </p>
        </div>
        {editingId !== 'new' && (
          <button className="btn btn-primary" onClick={handleStartNew} style={{ gap: '8px' }}>
            <Plus style={{ width: '15px', height: '15px' }} />
            New Zone
          </button>
        )}
      </div>

      {/* How-it-works callout */}
      <div
        className="glass-card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          gap: '14px',
          alignItems: 'flex-start',
          borderLeft: '3px solid var(--primary)',
        }}
      >
        <Info style={{ color: 'var(--primary)', width: '16px', height: '16px', flexShrink: 0, marginTop: '2px' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', lineHeight: 1.6, margin: 0 }}>
          When a customer places an order, the system finds the zone for their table and <strong style={{ color: 'var(--text-primary)' }}>auto-assigns the order to the first active waiter</strong> in that zone.
          All zone waiters are notified. If no zone or no waiter is configured, the <strong style={{ color: 'var(--text-primary)' }}>admin receives a notification</strong> and can assign manually from the Orders page.
        </p>
      </div>

      {/* Stats */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[
            { label: 'Zones', value: zones.length, icon: MapPin },
            { label: 'Tables in Zones', value: totalAssigned, icon: Smartphone },
            { label: 'Unzoned Tables', value: totalUnzoned, icon: AlertTriangle, warn: totalUnzoned > 0 },
          ].map(({ label, value, icon: Icon, warn }) => (
            <div
              key={label}
              className="glass-card"
              style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: '14px' }}
            >
              <div style={{
                background: warn ? 'var(--warning-light)' : 'var(--primary-light)',
                border: `1px solid ${warn ? 'rgba(196,120,32,0.28)' : 'var(--border-light)'}`,
                borderRadius: 'var(--radius-sm)',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Icon style={{ color: warn ? 'var(--warning)' : 'var(--primary)', width: '16px', height: '16px' }} />
              </div>
              <div>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', display: 'block', fontFamily: 'var(--font-body)' }}>
                  {label}
                </span>
                <span className="stat-number" style={{ fontSize: '1.6rem', color: warn ? 'var(--warning)' : 'var(--text-primary)' }}>
                  {value}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', height: '30vh', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* New zone form */}
          {editingId === 'new' && renderEditCard()}

          {/* Zone list */}
          {zones.length === 0 && editingId !== 'new' ? (
            <div
              className="glass-card"
              style={{ padding: '64px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center' }}
            >
              <MapPin style={{ color: 'var(--text-muted)', width: '36px', height: '36px' }} />
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', marginBottom: '6px' }}>No zones yet</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  Create your first zone to start routing orders automatically.
                </p>
              </div>
              <button className="btn btn-primary" onClick={handleStartNew} style={{ gap: '8px', marginTop: '4px' }}>
                <Plus style={{ width: '14px', height: '14px' }} />
                Create First Zone
              </button>
            </div>
          ) : (
            zones.map(zone =>
              editingId === zone.id
                ? <div key={zone.id}>{renderEditCard(zone)}</div>
                : renderViewCard(zone)
            )
          )}
        </div>
      )}
    </div>
  );
}
