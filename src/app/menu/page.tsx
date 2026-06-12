'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { IArticle, ICategory, ITable } from '@/lib/types';
import {
  ShoppingBag, Bell, Plus, Minus, Trash2, X, CheckCircle, AlertTriangle, Image as ImageIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';

function MenuPageContent() {
  const searchParams = useSearchParams();
  const tableNumStr = searchParams.get('table');

  const [table, setTable] = useState<ITable | null>(null);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [articles, setArticles] = useState<IArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<number | 'all'>('all');
  const [cart, setCart] = useState<{ article: IArticle; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [callingWaiter, setCallingWaiter] = useState(false);

  useEffect(() => {
    if (!tableNumStr || isNaN(parseInt(tableNumStr))) {
      setErrorMsg('Invalid or missing table parameter. Please scan the QR code on your table again.');
      setLoading(false);
      return;
    }
    const loadMenuData = async () => {
      try {
        const tableRes = await api.get(`/tables/by-number/${tableNumStr}`);
        if (!tableRes.data.success || !tableRes.data.data) {
          setErrorMsg(`Table #${tableNumStr} was not found. Please contact staff.`);
          setLoading(false);
          return;
        }
        setTable(tableRes.data.data);
        const [catsRes, artsRes] = await Promise.all([
          api.get('/categories?active=true'),
          api.get('/articles?active=true'),
        ]);
        if (catsRes.data.success && artsRes.data.success) {
          setCategories(catsRes.data.data.filter((c: any) => c.active));
          setArticles(artsRes.data.data.filter((a: any) => a.active));
        }
      } catch (err) {
        setErrorMsg('Unable to load menu. Check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };
    loadMenuData();
  }, [tableNumStr]);

  const handleCallWaiter = async () => {
    if (!tableNumStr) return;
    setCallingWaiter(true);
    try {
      await api.post('/notifications/call-waiter', { tableNumber: parseInt(tableNumStr) });
      toast.success('Waiter notified. Someone will be with you shortly.', { icon: '🔔', duration: 4000 });
    } catch {
      toast.error('Could not call waiter. Please raise your hand.');
    } finally {
      setCallingWaiter(false);
    }
  };

  const handleAddToCart = (article: IArticle) => {
    const alreadyInCart = cart.some((i) => i.article.id === article.id);
    toast.success(alreadyInCart ? `Updated ${article.name}` : `Added ${article.name}`);
    setCart((prev) => {
      const existing = prev.find((i) => i.article.id === article.id);
      if (existing) {
        return prev.map((i) => i.article.id === article.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { article, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (articleId: number, amount: number) => {
    setCart((prev) =>
      prev
        .map((i) => i.article.id === articleId ? { ...i, quantity: i.quantity + amount } : i)
        .filter((i) => i.quantity > 0) as any
    );
  };

  const handleRemoveFromCart = (articleId: number) => {
    setCart((prev) => prev.filter((i) => i.article.id !== articleId));
  };

  const handlePlaceOrder = async () => {
    if (!table || cart.length === 0) return;
    setIsOrdering(true);
    try {
      const response = await api.post('/orders', {
        tableId: table.id,
        items: cart.map((i) => ({ articleId: i.article.id, quantity: i.quantity })),
      });
      if (response.data.success) {
        setCart([]);
        setIsCartOpen(false);
        setOrderSuccess(true);
      }
    } catch {
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsOrdering(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div className="glass-card animate-fade-in" style={{ maxWidth: '420px', padding: '36px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <AlertTriangle style={{ color: 'var(--warning)', width: '44px', height: '44px', margin: '0 auto' }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.4rem' }}>Table Not Found</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.55 }}>{errorMsg}</p>
        </div>
      </div>
    );
  }

  const filteredArticles = activeCategory === 'all' ? articles : articles.filter((a) => a.categoryId === activeCategory);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart.reduce((s, i) => s + i.article.price * i.quantity, 0);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      background: 'var(--bg-base)',
      paddingBottom: cartCount > 0 ? '96px' : '24px',
    }}>

      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'var(--bg-card)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-solid)',
        padding: '0 20px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontWeight: 900,
            fontSize: '1.1rem',
            lineHeight: 1,
            marginBottom: '2px',
          }}>
            Aroma Cafe
          </h1>
          <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-body)' }}>
            Table #{tableNumStr}
          </span>
        </div>

        <button
          className="btn btn-secondary"
          style={{ padding: '7px 14px', fontSize: '0.78rem', gap: '6px', border: '1px solid var(--border-light)' }}
          onClick={handleCallWaiter}
          disabled={callingWaiter}
        >
          <Bell style={{ width: '13px', height: '13px', color: 'var(--primary)' }} />
          {callingWaiter ? 'Calling…' : 'Call Waiter'}
        </button>
      </header>

      {/* Brass accent line */}
      <div style={{ height: '2px', background: 'linear-gradient(to right, var(--primary), transparent 60%)', opacity: 0.45, flexShrink: 0 }} />

      {/* Welcome */}
      <div style={{ padding: '24px 20px 6px 20px' }}>
        <div className="accent-line" style={{ marginBottom: '10px' }} />
        <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 900, fontSize: '1.7rem', marginBottom: '5px' }}>
          Welcome
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
          Select your favourite and order right from your seat.
        </p>
      </div>

      {/* Category tabs — underline style */}
      <div
        className="no-scrollbar"
        style={{
          display: 'flex',
          gap: '0',
          overflowX: 'auto',
          padding: '14px 20px 0 20px',
          position: 'sticky',
          top: '62px',
          zIndex: 30,
          background: 'var(--bg-base)',
          borderBottom: '1px solid var(--border-solid)',
          marginBottom: '6px',
        }}
      >
        {[{ id: 'all' as const, name: 'All' }, ...categories].map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              style={{
                padding: '8px 16px',
                paddingBottom: '12px',
                background: 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: '0.84rem',
                fontWeight: isActive ? 600 : 400,
                whiteSpace: 'nowrap',
                borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                marginBottom: '-1px',
                transition: 'all var(--transition-fast)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Article list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', padding: '10px 16px' }}>
        {filteredArticles.length === 0 ? (
          <div className="glass-card" style={{ padding: '56px 20px', textAlign: 'center', color: 'var(--text-muted)', margin: '8px 0' }}>
            No items in this category.
          </div>
        ) : (
          filteredArticles.map((article) => {
            const imageUrl = article.image ? `http://localhost:5000${article.image}` : null;
            const inCart = cart.find((i) => i.article.id === article.id);
            return (
              <div
                key={article.id}
                className="surface-row animate-fade-in"
                style={{
                  display: 'flex',
                  padding: '14px',
                  gap: '14px',
                  alignItems: 'center',
                  marginBottom: '2px',
                }}
              >
                {/* Image */}
                <div style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: 'var(--bg-elevated)',
                  flexShrink: 0,
                  border: '1px solid var(--border-solid)',
                }}>
                  {imageUrl ? (
                    <img src={imageUrl} alt={article.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                      <ImageIcon style={{ width: '18px', height: '18px', color: 'var(--text-muted)' }} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <h4 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.98rem',
                    fontWeight: 700,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {article.name}
                  </h4>
                  <p style={{
                    fontSize: '0.76rem',
                    color: 'var(--text-muted)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: 1.4,
                  }}>
                    {article.description || 'Carefully prepared with quality ingredients.'}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <span className="stat-number" style={{ fontSize: '1.0rem', color: 'var(--primary)' }}>
                      ${article.price.toFixed(2)}
                    </span>
                    {inCart ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-base)', padding: '3px 6px', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                        <button onClick={() => handleUpdateQuantity(article.id, -1)} style={{ background: 'transparent', color: 'var(--text-secondary)', padding: '2px' }}>
                          <Minus style={{ width: '12px', height: '12px' }} />
                        </button>
                        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--primary)', minWidth: '16px', textAlign: 'center' }}>
                          {inCart.quantity}
                        </span>
                        <button onClick={() => handleUpdateQuantity(article.id, 1)} style={{ background: 'transparent', color: 'var(--text-secondary)', padding: '2px' }}>
                          <Plus style={{ width: '12px', height: '12px' }} />
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn btn-primary"
                        style={{ padding: '6px 14px', fontSize: '0.78rem', height: '32px' }}
                        onClick={() => handleAddToCart(article)}
                      >
                        <Plus style={{ width: '12px', height: '12px' }} />
                        Add
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating cart bar */}
      {cartCount > 0 && (
        <div
          className="animate-slide-up"
          style={{ position: 'fixed', bottom: '20px', left: '16px', right: '16px', zIndex: 50 }}
        >
          <button
            onClick={() => setIsCartOpen(true)}
            className="btn btn-primary pulse-primary"
            style={{
              width: '100%',
              padding: '16px 22px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 10px 36px rgba(194, 140, 50, 0.45)',
              fontSize: '0.9rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ background: 'rgba(10, 8, 6, 0.25)', padding: '3px 10px', borderRadius: '99px', fontSize: '0.82rem', fontWeight: 800 }}>
                {cartCount}
              </span>
              <span style={{ fontWeight: 600 }}>View Cart</span>
            </div>
            <span className="stat-number" style={{ fontSize: '1.05rem', color: '#0A0806' }}>
              ${cartTotal.toFixed(2)}
            </span>
          </button>
        </div>
      )}

      {/* Cart drawer */}
      {isCartOpen && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(10px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'flex-end',
          }}
          onClick={() => setIsCartOpen(false)}
        >
          <div
            className="glass-card animate-slide-up"
            style={{
              width: '100%',
              maxHeight: '82vh',
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              overflowY: 'auto',
              borderColor: 'rgba(194, 140, 50, 0.18)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer handle */}
            <div style={{ width: '40px', height: '3px', background: 'var(--border-solid)', borderRadius: '2px', margin: '0 auto -8px auto' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag style={{ color: 'var(--primary)', width: '18px', height: '18px' }} />
                <h3 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.2rem', fontWeight: 800 }}>
                  Your Selection
                </h3>
              </div>
              <button onClick={() => setIsCartOpen(false)} style={{ background: 'transparent', color: 'var(--text-muted)', padding: '4px' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <div className="divider" />

            {/* Cart items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '42vh' }}>
              {cart.map((item) => (
                <div
                  key={item.article.id}
                  className="surface-row"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px' }}
                >
                  <div style={{ minWidth: 0, flex: 1, paddingRight: '12px' }}>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-display)' }}>
                      {item.article.name}
                    </h4>
                    <span className="stat-number" style={{ fontSize: '0.86rem', color: 'var(--primary)' }}>
                      ${(item.article.price * item.quantity).toFixed(2)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-base)', padding: '4px 6px', borderRadius: '6px', border: '1px solid var(--border-solid)' }}>
                      <button onClick={() => handleUpdateQuantity(item.article.id, -1)} style={{ background: 'transparent', color: 'var(--text-secondary)', padding: '2px' }}>
                        <Minus style={{ width: '12px', height: '12px' }} />
                      </button>
                      <span style={{ minWidth: '18px', textAlign: 'center', fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {item.quantity}
                      </span>
                      <button onClick={() => handleUpdateQuantity(item.article.id, 1)} style={{ background: 'transparent', color: 'var(--text-secondary)', padding: '2px' }}>
                        <Plus style={{ width: '12px', height: '12px' }} />
                      </button>
                    </div>
                    <button onClick={() => handleRemoveFromCart(item.article.id)} style={{ background: 'transparent', color: 'var(--danger)', padding: '4px' }}>
                      <Trash2 style={{ width: '15px', height: '15px' }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total + CTA */}
            <div style={{ borderTop: '1px solid var(--border-solid)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-body)' }}>
                  Total
                </span>
                <span className="stat-number" style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>
                  ${cartTotal.toFixed(2)}
                </span>
              </div>
              <button
                onClick={handlePlaceOrder}
                className="btn btn-primary"
                style={{ width: '100%', padding: '15px', fontSize: '0.92rem', letterSpacing: '0.04em' }}
                disabled={isOrdering}
              >
                {isOrdering ? (
                  <>
                    <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px', borderTopColor: '#0A0806' }} />
                    Placing Order…
                  </>
                ) : 'Confirm & Place Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order success modal */}
      {orderSuccess && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0, 0, 0, 0.88)',
          backdropFilter: 'blur(12px)',
          zIndex: 110,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}>
          <div
            className="glass-card animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '360px',
              padding: '40px 32px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              borderColor: 'rgba(42, 153, 96, 0.3)',
            }}
          >
            <CheckCircle style={{ color: 'var(--success)', width: '52px', height: '52px', margin: '0 auto' }} />
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.55rem', fontWeight: 900, marginBottom: '10px' }}>
                Order Received!
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.55 }}>
                Your order is on its way to the kitchen. Sit back and relax while we brew your selection.
              </p>
            </div>
            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '13px' }}
              onClick={() => setOrderSuccess(false)}
            >
              Order More
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomerMenuPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    }>
      <MenuPageContent />
    </Suspense>
  );
}
