'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { IArticle, ICategory } from '@/lib/types';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, X, Search, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ArticlesPage() {
  const [articles, setArticles] = useState<IArticle[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentArticle, setCurrentArticle] = useState<IArticle | null>(null);
  
  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [chefRole, setChefRole] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [articlesRes, categoriesRes] = await Promise.all([
        api.get('/articles'),
        api.get('/categories')
      ]);

      if (articlesRes.data.success && categoriesRes.data.success) {
        setArticles(articlesRes.data.data);
        setCategories(categoriesRes.data.data.filter((c: ICategory) => c.active));
      }
    } catch (error) {
      console.error('Failed to load articles data', error);
      toast.error('Failed to retrieve items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleCategoryFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategoryFilter(e.target.value);
  };

  const openCreateModal = () => {
    setModalMode('create');
    setName('');
    setDescription('');
    setPrice('');
    setCategoryId(categories[0]?.id.toString() || '');
    setChefRole('');
    setImageFile(null);
    setImagePreview(null);
    setCurrentArticle(null);
    setIsModalOpen(true);
  };

  const openEditModal = (article: IArticle) => {
    setModalMode('edit');
    setName(article.name);
    setDescription(article.description);
    setPrice(article.price.toString());
    setCategoryId(article.categoryId.toString());
    setChefRole(article.chefRole ?? '');
    setImageFile(null);
    setImagePreview(article.image ? `http://localhost:5000${article.image}` : null);
    setCurrentArticle(article);
    setIsModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !categoryId) {
      toast.error('Name, price, and category are required');
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('categoryId', categoryId);
    if (chefRole) formData.append('chefRole', chefRole);
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      if (modalMode === 'create') {
        const response = await api.post('/articles', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (response.data.success) {
          toast.success('Article created successfully');
          setIsModalOpen(false);
          fetchData();
        }
      } else if (modalMode === 'edit' && currentArticle) {
        const response = await api.put(`/articles/${currentArticle.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (response.data.success) {
          toast.success('Article updated successfully');
          setIsModalOpen(false);
          fetchData();
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      const response = await api.patch(`/articles/${id}/toggle`);
      if (response.data.success) {
        toast.success('Article status updated');
        setArticles(prev =>
          prev.map(art => art.id === id ? { ...art, active: !art.active } : art)
        );
      }
    } catch (error) {
      console.error('Failed to toggle status', error);
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this menu item?')) {
      return;
    }

    try {
      const response = await api.delete(`/articles/${id}`);
      if (response.data.success) {
        toast.success('Item deleted successfully');
        setArticles(prev => prev.filter(art => art.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete item', error);
      toast.error('Failed to delete item');
    }
  };

  // Filter & Search Logic
  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategoryFilter === 'all' || 
      article.categoryId.toString() === selectedCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '6px' }}>Articles & Menu Items</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Manage your coffee shop menu items, pricing, images, and description details.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal} style={{ display: 'flex', gap: '8px' }}>
          <Plus style={{ width: '18px', height: '18px' }} />
          Add Menu Item
        </button>
      </div>

      {/* Filters Bar */}
      <div className="glass-card" style={{ padding: '16px 24px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px', background: 'var(--bg-input)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', padding: '4px 14px' }}>
          <Search style={{ color: 'var(--text-muted)', width: '18px', height: '18px' }} />
          <input
            type="text"
            placeholder="Search items by name or description..."
            value={searchQuery}
            onChange={handleSearchChange}
            style={{ background: 'transparent', color: '#fff', padding: '10px 0', width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }} htmlFor="catFilter">Category Filter:</label>
          <select
            id="catFilter"
            className="form-input"
            style={{ width: '180px', padding: '10px' }}
            value={selectedCategoryFilter}
            onChange={handleCategoryFilterChange}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', height: '40vh', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="articles-grid">
          {filteredArticles.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '80px 0', textAlign: 'center', color: 'var(--text-muted)' }} className="glass-card">
              No menu items found. Add items to populate the menu list.
            </div>
          ) : (
            filteredArticles.map((article) => {
              const imageUrl = article.image ? `http://localhost:5000${article.image}` : null;
              return (
                <div key={article.id} className="glass-card article-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  {/* Article Image Container */}
                  <div style={{ height: '180px', width: '100%', background: 'rgba(255,255,255,0.02)', position: 'relative', borderBottom: '1px solid var(--border-light)' }}>
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={article.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                        <ImageIcon style={{ width: '36px', height: '36px', strokeWidth: 1.2 }} />
                        <span style={{ fontSize: '0.8rem' }}>No image available</span>
                      </div>
                    )}
                    
                    {/* Category Overlay Tag */}
                    <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                      <span className="badge" style={{ background: 'rgba(15,13,12,0.85)', color: 'var(--primary)', border: '1px solid var(--border-light)', backdropFilter: 'blur(4px)', textTransform: 'capitalize' }}>
                        {article.Category?.name || 'Item'}
                      </span>
                    </div>
                  </div>

                  {/* Article Contents */}
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <h4 style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 600 }}>{article.name}</h4>
                      <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)' }}>
                        ${article.price.toFixed(2)}
                      </span>
                    </div>
                    
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4, flex: 1 }}>
                      {article.description || 'No description provided.'}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-glass)', paddingTop: '16px', marginTop: '10px' }}>
                      {/* Active Toggle */}
                      <button
                        onClick={() => handleToggleActive(article.id)}
                        style={{ background: 'transparent', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        {article.active ? (
                          <>
                            <ToggleRight style={{ width: '28px', height: '28px', color: 'var(--success)' }} />
                            <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>Active</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft style={{ width: '28px', height: '28px', color: 'var(--text-muted)' }} />
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Inactive</span>
                          </>
                        )}
                      </button>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '8px' }}
                          onClick={() => openEditModal(article)}
                        >
                          <Edit style={{ width: '15px', height: '15px', color: 'var(--text-secondary)' }} />
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.1)' }}
                          onClick={() => handleDelete(article.id)}
                        >
                          <Trash2 style={{ width: '15px', height: '15px', color: 'var(--danger)' }} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
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
        }} onClick={() => setIsModalOpen(false)}>
          <div className="glass-card animate-fade-in" style={{
            width: '100%',
            maxWidth: '520px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>
                {modalMode === 'create' ? 'Create Menu Item' : 'Edit Menu Item'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', color: 'var(--text-secondary)' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label className="form-label" htmlFor="itemName">Item Name *</label>
                <input
                  id="itemName"
                  className="form-input"
                  placeholder="e.g. Iced Vanilla Latte"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label" htmlFor="itemPrice">Price ($) *</label>
                  <input
                    id="itemPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    placeholder="e.g. 4.50"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div>
                  <label className="form-label" htmlFor="itemCategory">Category *</label>
                  <select
                    id="itemCategory"
                    className="form-input"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    disabled={isSubmitting}
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label" htmlFor="itemChefRole">Kitchen Role</label>
                <select
                  id="itemChefRole"
                  className="form-input"
                  value={chefRole}
                  onChange={(e) => setChefRole(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="">— No kitchen preparation needed —</option>
                  <option value="head_chef">Head Chef</option>
                  <option value="pastry_chef">Pastry Chef</option>
                </select>
              </div>

              <div>
                <label className="form-label" htmlFor="itemDesc">Description</label>
                <textarea
                  id="itemDesc"
                  className="form-input"
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  placeholder="Describe ingredients, size, warm/cold details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="form-label">Item Image</label>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1px solid var(--border-medium)' }} 
                    />
                  ) : (
                    <div style={{ width: '80px', height: '80px', border: '1px dashed var(--border-medium)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                      <ImageIcon style={{ width: '24px', height: '24px' }} />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                      id="imageUpload"
                      disabled={isSubmitting}
                    />
                    <label 
                      htmlFor="imageUpload" 
                      className="btn btn-secondary" 
                      style={{ padding: '10px 16px', fontSize: '0.85rem', display: 'inline-block', cursor: 'pointer' }}
                    >
                      Choose Image
                    </label>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                      PNG, JPG, or WEBP. Max 2MB.
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .articles-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .article-card {
          transition: transform var(--transition-normal), box-shadow var(--transition-normal);
        }
        .article-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(217, 119, 6, 0.08), var(--shadow-lg);
        }
        @media (max-width: 1024px) {
          .articles-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .articles-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
