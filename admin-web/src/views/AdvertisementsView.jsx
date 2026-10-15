import React, { useState, useEffect } from 'react';
import { Search, Filter, Star, Eye, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { adminApi } from '../api';
import Modal from '../components/Modal';

export default function AdvertisementsView({ onToast }) {
  const [ads, setAds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedAd, setSelectedAd] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const fetchAds = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAdvertisements({
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        categoryId: categoryFilter || undefined,
        limit: 50
      });
      setAds(res.advertisements || []);
    } catch (err) {
      onToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await adminApi.getCategories();
      setCategories(res.categories || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchAds();
  }, [statusFilter, categoryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAds();
  };

  const handleToggleFeatured = async (id) => {
    try {
      const res = await adminApi.toggleFeatured(id);
      setAds(prev => prev.map(a => a.id === id ? { ...a, is_featured: res.is_featured ? 1 : 0 } : a));
      onToast(res.message, 'success');
    } catch (err) {
      onToast(err.message, 'error');
    }
  };

  const handleChangeStatus = async (id, newStatus) => {
    try {
      let reason = null;
      if (newStatus === 'rejected') {
        reason = prompt('Enter rejection reason:') || 'Policy violation';
      }
      const res = await adminApi.updateAdStatus(id, newStatus, reason);
      setAds(prev => prev.map(a => a.id === id ? { ...a, status: newStatus, rejection_reason: reason } : a));
      onToast(res.message, 'success');
    } catch (err) {
      onToast(err.message, 'error');
    }
  };

  const openDetail = (ad) => {
    setSelectedAd(ad);
    setDetailModalOpen(true);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Classified Advertisements Inventory</h1>
          <p>Browse, moderate, manage featured statuses, and filter all listings across categories</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '18px 24px', marginBottom: '20px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '240px', display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0 12px' }}>
            <Search size={16} color="#64748b" />
            <input
              type="text"
              placeholder="Search by title, seller, or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', padding: '10px', width: '100%', fontSize: '13.5px' }}
            />
          </div>

          <div style={{ width: '180px' }}>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved / Active</option>
              <option value="pending">Pending Approval</option>
              <option value="rejected">Rejected</option>
              <option value="sold">Sold</option>
            </select>
          </div>

          <div style={{ width: '200px' }}>
            <select
              className="form-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary">
            Apply Search
          </button>
        </form>
      </div>

      {/* Ads Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '50px', textAlign: 'center', color: '#64748b' }}>
            Loading inventory...
          </div>
        ) : ads.length === 0 ? (
          <div style={{ padding: '50px', textAlign: 'center', color: '#64748b' }}>
            No advertisements match the selected criteria.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>Promote</th>
                  <th>Advertisement</th>
                  <th>Category</th>
                  <th>Seller</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ads.map((ad) => (
                  <tr key={ad.id}>
                    <td>
                      <button
                        onClick={() => handleToggleFeatured(ad.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: ad.is_featured ? '#eab308' : '#cbd5e1',
                          padding: '4px'
                        }}
                        title={ad.is_featured ? 'Featured on Homepage (Click to Unfeature)' : 'Mark as Featured on Homepage'}
                      >
                        <Star size={18} fill={ad.is_featured ? '#eab308' : 'none'} />
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={ad.primary_image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=100'}
                          alt={ad.title}
                          style={{ width: '44px', height: '44px', borderRadius: '6px', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, color: '#002f34', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {ad.title}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            {ad.location || ad.city} • {ad.product_condition ? ad.product_condition.replace('_', ' ') : 'Used'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px', color: '#334155' }}>
                        {ad.category_name}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: '#002f34' }}>
                        {ad.seller_name}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#002f34' }}>
                        ₹{Number(ad.price).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${ad.status}`}>
                        {ad.status}
                      </span>
                      {ad.status === 'rejected' && ad.rejection_reason && (
                        <div style={{ fontSize: '11px', color: '#b91c1c', marginTop: '2px', maxWidth: '160px' }}>
                          Reason: {ad.rejection_reason}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => openDetail(ad)}
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        {ad.status !== 'approved' && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleChangeStatus(ad.id, 'approved')}
                            title="Quick Approve"
                          >
                            <CheckCircle size={14} />
                          </button>
                        )}
                        {ad.status !== 'rejected' && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleChangeStatus(ad.id, 'rejected')}
                            title="Reject"
                          >
                            <XCircle size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={selectedAd?.title || 'Advertisement Details'}
        footer={(
          <button className="btn btn-outline" onClick={() => setDetailModalOpen(false)}>
            Close
          </button>
        )}
      >
        {selectedAd && (
          <div>
            <div style={{ width: '100%', height: '240px', background: '#e2e8f0', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
              <img
                src={selectedAd.primary_image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600'}
                alt={selectedAd.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '24px', fontWeight: 800, color: '#002f34' }}>
                ₹{Number(selectedAd.price).toLocaleString('en-IN')}
              </span>
              <span className={`status-pill ${selectedAd.status}`}>
                {selectedAd.status}
              </span>
            </div>

            <h4 style={{ fontWeight: 700, marginBottom: '6px' }}>Description</h4>
            <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.5, marginBottom: '16px' }}>
              {selectedAd.description}
            </p>

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', fontSize: '13px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div><strong>Category:</strong> {selectedAd.category_name}</div>
              <div><strong>Condition:</strong> {selectedAd.product_condition}</div>
              <div><strong>Seller:</strong> {selectedAd.seller_name} ({selectedAd.seller_email})</div>
              <div><strong>Location:</strong> {selectedAd.location}, {selectedAd.city}</div>
              <div><strong>Views Count:</strong> {selectedAd.views_count}</div>
              <div><strong>Featured:</strong> {selectedAd.is_featured ? 'Yes' : 'No'}</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
