import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, XCircle, Tag, Trash2, Check, AlertCircle, Plus } from 'lucide-react';
import { api, getCurrentUser } from '../api';

export default function MyAdsScreen({ onOpenSell, onSelectAd, onRequireAuth, onToast }) {
  const currentUser = getCurrentUser();
  const [ads, setAds] = useState([]);
  const [counts, setCounts] = useState({ total: 0, approved_count: 0, pending_count: 0, rejected_count: 0, sold_count: 0 });
  const [statusTab, setStatusTab] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchMyAds = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await api.getMyAds(statusTab);
      setAds(res.advertisements || []);
      if (res.counts) setCounts(res.counts);
    } catch (err) {
      onToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchMyAds();
    }
  }, [currentUser, statusTab]);

  const handleMarkSold = async (id) => {
    try {
      const res = await api.markAsSold(id);
      onToast(res.message, 'success');
      fetchMyAds();
    } catch (err) {
      onToast(err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing permanently?')) return;
    try {
      const res = await api.deleteAd(id);
      onToast(res.message, 'success');
      setAds(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      onToast(err.message, 'error');
    }
  };

  if (!currentUser) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', background: '#fff', minHeight: '100%' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#002f34' }}>Track & Manage Your Listings</h3>
        <p style={{ color: '#64748b', fontSize: '13px', marginTop: '6px', marginBottom: '20px' }}>
          Please sign in to view your active ads, track approval progress, and view buyer offers.
        </p>
        <button className="olx-btn olx-btn-primary" onClick={onRequireAuth}>
          Sign In / Create Account
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'all', label: 'All', count: counts.total || 0 },
    { id: 'approved', label: 'Active', count: counts.approved_count || 0 },
    { id: 'pending', label: 'Pending', count: counts.pending_count || 0 },
    { id: 'rejected', label: 'Rejected', count: counts.rejected_count || 0 },
    { id: 'sold', label: 'Sold', count: counts.sold_count || 0 }
  ];

  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{ background: '#002f34', color: '#fff', padding: '16px 16px 12px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 800 }}>My Classified Listings</h1>
        <p style={{ fontSize: '12px', color: '#7dd3c8', marginTop: '2px' }}>
          Seller inventory & approval status dashboard
        </p>

        {/* Tab Strip */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginTop: '14px', scrollbarWidth: 'none' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusTab(tab.id)}
              style={{
                background: statusTab === tab.id ? '#ffce32' : 'rgba(255,255,255,0.12)',
                color: statusTab === tab.id ? '#002f34' : '#fff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '16px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Ads List */}
      <div style={{ padding: '16px 12px' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
            Fetching your advertisements...
          </div>
        ) : ads.length === 0 ? (
          <div style={{ padding: '50px 20px', textAlign: 'center', background: '#fff', borderRadius: '8px', border: '1px solid #ebedee' }}>
            <Tag size={40} color="#00a49f" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#002f34' }}>No Listings in this Tab</h3>
            <p style={{ fontSize: '12.5px', color: '#64748b', marginTop: '4px', marginBottom: '16px' }}>
              Post an item to find verified buyers in your neighborhood.
            </p>
            <button className="olx-btn olx-btn-primary" style={{ maxWidth: '200px', margin: '0 auto' }} onClick={onOpenSell}>
              + Post New Ad
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {ads.map((ad) => (
              <div
                key={ad.id}
                style={{
                  background: '#fff',
                  borderRadius: '8px',
                  border: '1px solid #ebedee',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                }}
              >
                <div style={{ display: 'flex', padding: '12px', gap: '12px' }}>
                  <img
                    src={ad.primary_image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=200'}
                    alt={ad.title}
                    style={{ width: '84px', height: '84px', borderRadius: '6px', objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '17px', fontWeight: 800, color: '#002f34' }}>
                        ₹{Number(ad.price).toLocaleString('en-IN')}
                      </span>
                      <span className={`status-pill ${ad.status}`}>
                        {ad.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#091e22', marginTop: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {ad.title}
                    </div>

                    <div style={{ fontSize: '11px', color: '#8e9da0', marginTop: '3px' }}>
                      {ad.category_name} • Views: {ad.views_count}
                    </div>
                  </div>
                </div>

                {/* Rejection Reason Banner (Crucial Requirement 5.4 & 6.6) */}
                {ad.status === 'rejected' && ad.rejection_reason && (
                  <div style={{
                    background: '#fef2f2',
                    borderTop: '1px solid #fee2e2',
                    borderBottom: '1px solid #fee2e2',
                    padding: '10px 14px',
                    fontSize: '12px',
                    color: '#991b1b',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px'
                  }}>
                    <AlertCircle size={15} flexShrink={0} style={{ marginTop: '2px' }} />
                    <div>
                      <strong>Administrator Feedback:</strong> {ad.rejection_reason}
                    </div>
                  </div>
                )}

                {/* Card Actions */}
                <div style={{
                  padding: '8px 12px',
                  background: '#f8fafc',
                  borderTop: '1px solid #f1f5f9',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '8px'
                }}>
                  {ad.status === 'approved' && (
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '11.5px', color: '#16a34a' }}
                      onClick={() => handleMarkSold(ad.id)}
                    >
                      <Check size={13} />
                      <span>Mark Sold</span>
                    </button>
                  )}
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '11.5px' }}
                    onClick={() => onSelectAd(ad.id)}
                  >
                    View Listing
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '11.5px', color: '#dc2626' }}
                    onClick={() => handleDelete(ad.id)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
