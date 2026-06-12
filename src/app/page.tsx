'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        if (user.role === 'admin') {
          router.push('/admin');
        } else if (user.role === 'waiter') {
          router.push('/waiter');
        } else if (user.role === 'head_chef' || user.role === 'pastry_chef') {
          router.push('/chef');
        } else {
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f0d0c' }}>
      <div className="spinner"></div>
    </div>
  );
}
