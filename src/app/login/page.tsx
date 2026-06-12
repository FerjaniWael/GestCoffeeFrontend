'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'admin') router.push('/admin');
      else if (user.role === 'waiter') router.push('/waiter');
      else if (user.role === 'head_chef' || user.role === 'pastry_chef') router.push('/chef');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }
    setIsSubmitting(true);
    try {
      const loggedUser = await login(email, password);
      toast.success(`Welcome back, ${loggedUser.name}!`);
      if (loggedUser.role === 'admin') router.push('/admin');
      else if (loggedUser.role === 'waiter') router.push('/waiter');
      else if (loggedUser.role === 'head_chef' || loggedUser.role === 'pastry_chef') router.push('/chef');
      else toast.error('Invalid role assignment');
    } catch (error: any) {
      toast.error(error.message || 'Login failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      width: '100vw',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Giant italic watermark */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        overflow: 'hidden',
      }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(100px, 22vw, 300px)',
          fontWeight: 900,
          fontStyle: 'italic',
          color: 'transparent',
          WebkitTextStroke: '1px rgba(194, 140, 50, 0.055)',
          letterSpacing: '-0.04em',
          userSelect: 'none',
          lineHeight: 0.9,
          whiteSpace: 'nowrap',
        }}>
          Aroma
        </span>
      </div>

      {/* Warm radial glow from top-center */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '700px',
        height: '700px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(194, 140, 50, 0.07) 0%, transparent 68%)',
        pointerEvents: 'none',
      }} />

      {/* Login card */}
      <div className="glass-card animate-fade-in" style={{
        width: '100%',
        maxWidth: '390px',
        padding: '48px 40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '30px',
        position: 'relative',
        zIndex: 1,
        borderColor: 'rgba(194, 140, 50, 0.18)',
      }}>

        {/* Left vertical accent bar */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: '44px',
          bottom: '44px',
          width: '2px',
          background: 'linear-gradient(to bottom, transparent, var(--primary) 35%, var(--primary) 65%, transparent)',
          borderRadius: '1px',
        }} />

        {/* Branding */}
        <div>
          <div className="accent-line" style={{ marginBottom: '16px' }} />
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2rem',
            fontWeight: 900,
            fontStyle: 'italic',
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
            marginBottom: '6px',
            lineHeight: 1.1,
          }}>
            Aroma Cafe
          </h1>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.73rem',
            color: 'var(--text-muted)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}>
            Staff Portal
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="admin@coffee.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', marginTop: '6px', fontSize: '0.88rem', letterSpacing: '0.06em' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
                Signing in…
              </>
            ) : 'Sign In'}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          borderTop: '1px solid var(--border-solid)',
          paddingTop: '18px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
            Customers — scan the QR code at your table to order.
          </p>
        </div>
      </div>
    </div>
  );
}
