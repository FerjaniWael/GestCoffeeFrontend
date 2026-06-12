'use client';

import React, { useState } from 'react';
import { Settings, Globe, Database, Bell, Shield, Coffee, Save, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface SettingSection {
  title: string;
  icon: React.ElementType;
  fields: SettingField[];
}

interface SettingField {
  label: string;
  key: string;
  type: 'text' | 'number' | 'toggle' | 'select';
  description?: string;
  options?: string[];
}

const defaultSettings: Record<string, any> = {
  restaurantName: 'Aroma Cafe',
  restaurantTagline: 'Premium Coffee & Bites',
  frontendUrl: 'http://localhost:3000',
  backendUrl: 'http://localhost:5000',
  currency: 'USD',
  currencySymbol: '$',
  ordersAutoRefresh: true,
  notificationsSound: true,
  notificationsDesktop: false,
  sessionTimeout: 60,
  maxTablesPerPage: 12,
  defaultOrderStatus: 'pending',
};

const sections: SettingSection[] = [
  {
    title: 'Restaurant Identity',
    icon: Coffee,
    fields: [
      { label: 'Restaurant Name', key: 'restaurantName', type: 'text', description: 'Displayed in header, QR print, and login page.' },
      { label: 'Tagline / Subtitle', key: 'restaurantTagline', type: 'text', description: 'Short description shown on the login portal.' },
    ],
  },
  {
    title: 'Application URLs',
    icon: Globe,
    fields: [
      { label: 'Frontend URL', key: 'frontendUrl', type: 'text', description: 'Base URL for QR code generation (e.g. http://localhost:3000).' },
      { label: 'Backend API URL', key: 'backendUrl', type: 'text', description: 'API server base URL used by the frontend.' },
    ],
  },
  {
    title: 'Currency & Display',
    icon: Database,
    fields: [
      { label: 'Currency Code', key: 'currency', type: 'select', options: ['USD', 'EUR', 'GBP', 'DZD', 'MAD', 'TND', 'CAD', 'AUD'], description: 'Currency identifier for formatting.' },
      { label: 'Currency Symbol', key: 'currencySymbol', type: 'text', description: 'Symbol shown next to prices (e.g. $, €, £, DA).' },
      { label: 'Max Tables Per Page', key: 'maxTablesPerPage', type: 'number', description: 'Grid rows visible in the Tables management view.' },
    ],
  },
  {
    title: 'Notifications',
    icon: Bell,
    fields: [
      { label: 'Auto-refresh Orders', key: 'ordersAutoRefresh', type: 'toggle', description: 'Automatically refresh the orders list every 30 seconds.' },
      { label: 'Notification Sound', key: 'notificationsSound', type: 'toggle', description: 'Play a sound when a new order arrives.' },
      { label: 'Desktop Notifications', key: 'notificationsDesktop', type: 'toggle', description: 'Show browser desktop notifications for new orders (requires permission).' },
    ],
  },
  {
    title: 'Security & Session',
    icon: Shield,
    fields: [
      { label: 'Session Timeout (minutes)', key: 'sessionTimeout', type: 'number', description: 'Automatically log out staff after this period of inactivity.' },
    ],
  },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, any>>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // In a full implementation this would POST to /api/settings
      await new Promise(resolve => setTimeout(resolve, 600));
      setHasChanges(false);
      toast.success('Settings saved successfully');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    setHasChanges(false);
    toast('Settings reset to defaults', { icon: '↩' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '6px' }}>System Settings</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Configure application preferences, display options, and notification behaviour.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {hasChanges && (
            <button className="btn btn-secondary" onClick={handleReset} style={{ display: 'flex', gap: '8px' }}>
              <RefreshCw style={{ width: '16px', height: '16px' }} />
              Reset
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            style={{ display: 'flex', gap: '8px', opacity: !hasChanges ? 0.5 : 1 }}
          >
            {isSaving ? (
              <>
                <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                Saving...
              </>
            ) : (
              <>
                <Save style={{ width: '16px', height: '16px' }} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Settings Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {sections.map(section => {
          const Icon = section.icon;
          return (
            <div key={section.title} className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Section Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid var(--border-glass)' }}>
                <div style={{ background: 'var(--primary-light)', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                  <Icon style={{ color: 'var(--primary)', width: '18px', height: '18px' }} />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>{section.title}</h3>
              </div>

              {/* Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {section.fields.map(field => (
                  <div key={field.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <label className="form-label" style={{ marginBottom: '4px' }}>{field.label}</label>
                      {field.description && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4 }}>{field.description}</p>
                      )}
                    </div>

                    <div style={{ width: '280px', flexShrink: 0 }}>
                      {field.type === 'toggle' ? (
                        <button
                          onClick={() => handleChange(field.key, !settings[field.key])}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            background: 'transparent',
                            padding: '8px 0',
                          }}
                        >
                          <div style={{
                            width: '44px',
                            height: '24px',
                            borderRadius: '12px',
                            background: settings[field.key] ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                            position: 'relative',
                            transition: 'background var(--transition-fast)',
                            border: `1px solid ${settings[field.key] ? 'var(--primary)' : 'var(--border-glass)'}`,
                            flexShrink: 0,
                          }}>
                            <div style={{
                              position: 'absolute',
                              top: '2px',
                              left: settings[field.key] ? '22px' : '2px',
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              background: '#fff',
                              transition: 'left var(--transition-fast)',
                              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                            }} />
                          </div>
                          <span style={{ fontSize: '0.9rem', color: settings[field.key] ? 'var(--success)' : 'var(--text-muted)', fontWeight: 500 }}>
                            {settings[field.key] ? 'Enabled' : 'Disabled'}
                          </span>
                        </button>
                      ) : field.type === 'select' ? (
                        <select
                          className="form-input"
                          value={settings[field.key]}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                          style={{ padding: '10px 14px' }}
                        >
                          {field.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          className="form-input"
                          value={settings[field.key]}
                          onChange={(e) => handleChange(field.key, field.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value)}
                          style={{ padding: '10px 14px' }}
                          min={field.type === 'number' ? 1 : undefined}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Banner */}
      <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px', borderColor: 'rgba(59, 130, 246, 0.2)', background: 'rgba(59, 130, 246, 0.04)' }}>
        <Settings style={{ color: '#3b82f6', width: '20px', height: '20px', flexShrink: 0 }} />
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          URL and database settings require a server restart to take effect. Changes to restaurant name and display preferences apply immediately after saving.
        </p>
      </div>
    </div>
  );
}
