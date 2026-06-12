'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { ICategory } from '@/lib/types';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentCategory, setCurrentCategory] = useState<ICategory | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      if (response.data && response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load categories', error);
      toast.error('Failed to retrieve categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setCategoryName('');
    setCurrentCategory(null);
    setIsModalOpen(true);
  };

  const openEditModal = (category: ICategory) => {
    setModalMode('edit');
    setCategoryName(category.name);
    setCurrentCategory(category);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      toast.error('Category name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalMode === 'create') {
        const response = await api.post('/categories', { name: categoryName });
        if (response.data.success) {
          toast.success('Category created successfully');
          setIsModalOpen(false);
          fetchCategories();
        }
      } else if (modalMode === 'edit' && currentCategory) {
        const response = await api.put(`/categories/${currentCategory.id}`, { name: categoryName });
        if (response.data.success) {
          toast.success('Category updated successfully');
          setIsModalOpen(false);
          fetchCategories();
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
      const response = await api.patch(`/categories/${id}/toggle`);
      if (response.data.success) {
        toast.success('Category status updated');
        // Optimistic update
        setCategories(prev =>
          prev.map(cat => cat.id === id ? { ...cat, active: !cat.active } : cat)
        );
      }
    } catch (error) {
      console.error('Failed to toggle status', error);
      toast.error('Failed to update category status');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category? All articles belonging to this category might become uncategorized.')) {
      return;
    }

    try {
      const response = await api.delete(`/categories/${id}`);
      if (response.data.success) {
        toast.success('Category deleted successfully');
        setCategories(prev => prev.filter(cat => cat.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete category', error);
      toast.error('Failed to delete category. Make sure no items are associated.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '6px' }}>Menu Categories</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Manage options for organizing your food, beverage, and dessert menus.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal} style={{ display: 'flex', gap: '8px' }}>
          <Plus style={{ width: '18px', height: '18px' }} />
          Add Category
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
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600 }}>Category Name</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No categories found. Click 'Add Category' to create one.
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id} style={{ borderBottom: '1px solid var(--border-light)' }} className="category-row">
                    <td style={{ padding: '16px 24px', fontWeight: 600, fontSize: '1rem' }}>
                      {category.name}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <button 
                        onClick={() => handleToggleActive(category.id)}
                        style={{ background: 'transparent', display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        {category.active ? (
                          <>
                            <ToggleRight style={{ width: '32px', height: '32px', color: 'var(--success)' }} />
                            <span className="badge badge-served">Active</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft style={{ width: '32px', height: '32px', color: 'var(--text-muted)' }} />
                            <span className="badge badge-completed">Inactive</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '8px' }}
                          onClick={() => openEditModal(category)}
                          title="Edit Category"
                        >
                          <Edit style={{ width: '16px', height: '16px', color: 'var(--text-secondary)' }} />
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.1)' }}
                          onClick={() => handleDelete(category.id)}
                          title="Delete Category"
                        >
                          <Trash2 style={{ width: '16px', height: '16px', color: 'var(--danger)' }} />
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
            maxWidth: '480px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>
                {modalMode === 'create' ? 'Create New Category' : 'Edit Category'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', color: 'var(--text-secondary)' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label className="form-label" htmlFor="catName">Category Name</label>
                <input
                  id="catName"
                  className="form-input"
                  placeholder="e.g. Special Coffees, Desserts, Pizza"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  disabled={isSubmitting}
                  autoFocus
                  required
                />
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
                  {isSubmitting ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        .category-row {
          transition: background-color var(--transition-fast);
        }
        .category-row:hover {
          background-color: rgba(255, 255, 255, 0.015);
        }
      `}</style>
    </div>
  );
}
