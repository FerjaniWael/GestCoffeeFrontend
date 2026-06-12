'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { ITable } from '@/lib/types';
import { Plus, Edit, Trash2, QrCode, Download, Printer, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TablesPage() {
  const [tables, setTables] = useState<ITable[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentTable, setCurrentTable] = useState<ITable | null>(null);
  const [tableNumber, setTableNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTables = async () => {
    try {
      const response = await api.get('/tables');
      if (response.data && response.data.success) {
        setTables(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load tables', error);
      toast.error('Failed to retrieve tables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setTableNumber('');
    setCurrentTable(null);
    setIsModalOpen(true);
  };

  const openEditModal = (table: ITable) => {
    setModalMode('edit');
    setTableNumber(table.tableNumber.toString());
    setCurrentTable(table);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber || isNaN(parseInt(tableNumber))) {
      toast.error('Valid table number is required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalMode === 'create') {
        const response = await api.post('/tables', { tableNumber: parseInt(tableNumber) });
        if (response.data.success) {
          toast.success('Table created successfully');
          setIsModalOpen(false);
          fetchTables();
        }
      } else if (modalMode === 'edit' && currentTable) {
        const response = await api.put(`/tables/${currentTable.id}`, { tableNumber: parseInt(tableNumber) });
        if (response.data.success) {
          toast.success('Table updated successfully');
          setIsModalOpen(false);
          fetchTables();
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this table? Orders and QR codes for this table will be deleted.')) {
      return;
    }

    try {
      const response = await api.delete(`/tables/${id}`);
      if (response.data.success) {
        toast.success('Table deleted successfully');
        setTables(prev => prev.filter(t => t.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete table', error);
      toast.error('Failed to delete table');
    }
  };

  const handleDownloadQR = (id: number, number: number) => {
    // We can open a link to download backend endpoint directly
    window.open(`http://localhost:5000/api/tables/${id}/download`, '_blank');
    toast.success(`Downloading QR Code for Table #${number}...`);
  };

  const handlePrintQR = (table: ITable) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up blocker is preventing print view');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Table ${table.tableNumber}</title>
          <style>
            body {
              font-family: 'Outfit', sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              text-align: center;
              background-color: #fff;
              color: #120f0e;
            }
            .container {
              border: 3px double #d97706;
              padding: 40px;
              border-radius: 20px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
              max-width: 400px;
            }
            h1 {
              font-size: 2.5rem;
              margin: 0 0 10px 0;
              color: #b45309;
            }
            h2 {
              font-size: 1.5rem;
              margin: 0 0 20px 0;
              color: #78716c;
              font-weight: 400;
            }
            img {
              width: 250px;
              height: 250px;
              margin-bottom: 20px;
            }
            p {
              font-size: 1rem;
              color: #78716c;
              margin: 10px 0 0 0;
            }
            .footer {
              margin-top: 30px;
              font-size: 0.8rem;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              color: #a8a29e;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>AROMA CAFE</h1>
            <h2>TABLE ${table.tableNumber}</h2>
            <img src="${table.qrCode}" alt="Table ${table.tableNumber} QR" />
            <p>Scan to view our menu & order directly from your phone!</p>
            <div class="footer">AROMA CAFE SYSTEM</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '6px' }}>Tables & QR Codes</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Configure tables, view and print unique QR codes for self-ordering customer access.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal} style={{ display: 'flex', gap: '8px' }}>
          <Plus style={{ width: '18px', height: '18px' }} />
          Add Table
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', height: '40vh', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="tables-grid">
          {tables.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '80px 0', textAlign: 'center', color: 'var(--text-muted)' }} className="glass-card">
              No tables set up. Click 'Add Table' to generate QR codes.
            </div>
          ) : (
            [...tables].sort((a, b) => a.tableNumber - b.tableNumber).map((table) => (
              <div key={table.id} className="glass-card table-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', padding: '24px', alignItems: 'center', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.25rem', color: '#fff' }}>Table #{table.tableNumber}</h3>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '6px' }}
                      onClick={() => openEditModal(table)}
                      title="Edit Table Number"
                    >
                      <Edit style={{ width: '14px', height: '14px' }} />
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '6px', background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.1)' }}
                      onClick={() => handleDelete(table.id)}
                      title="Delete Table"
                    >
                      <Trash2 style={{ width: '14px', height: '14px', color: 'var(--danger)' }} />
                    </button>
                  </div>
                </div>

                {/* QR Code Preview */}
                <div className="qr-container" style={{ background: '#fff', padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-medium)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <img 
                    src={table.qrCode} 
                    alt={`Table ${table.tableNumber} QR`} 
                    style={{ width: '140px', height: '140px' }} 
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                  <button 
                    className="btn btn-secondary" 
                    style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
                    onClick={() => handleDownloadQR(table.id, table.tableNumber)}
                  >
                    <Download style={{ width: '14px', height: '14px' }} />
                    Download
                  </button>
                  <button 
                    className="btn btn-primary" 
                    style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
                    onClick={() => handlePrintQR(table)}
                  >
                    <Printer style={{ width: '14px', height: '14px' }} />
                    Print
                  </button>
                </div>
              </div>
            ))
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
            maxWidth: '440px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>
                {modalMode === 'create' ? 'Add New Table' : 'Edit Table'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', color: 'var(--text-secondary)' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label className="form-label" htmlFor="tblNumber">Table Number</label>
                <input
                  id="tblNumber"
                  type="number"
                  min="1"
                  className="form-input"
                  placeholder="e.g. 7"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
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
                  {isSubmitting ? 'Generating...' : 'Save & Generate QR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .tables-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }
        .table-card {
          transition: transform var(--transition-normal), box-shadow var(--transition-normal);
        }
        .table-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(217, 119, 6, 0.08), var(--shadow-lg);
        }
        .table-card:hover .qr-container {
          border-color: var(--primary) !important;
        }
        .qr-container {
          transition: border-color var(--transition-normal);
        }
        @media (max-width: 1024px) {
          .tables-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 768px) {
          .tables-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 480px) {
          .tables-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
