import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, MapPin, User, Phone } from 'lucide-react';
import { adminApi } from '../api';
import Modal from '../components/Modal';
import { IAdvertisement } from '../types/advertisement.types';

interface PendingApprovalsViewProps {
  onApprove: (id: number) => Promise<void>;
  onReject: (id: number, reason: string) => Promise<void>;
  onToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export default function PendingApprovalsView({ onApprove, onReject, onToast }: PendingApprovalsViewProps) {
  const [ads, setAds] = useState<IAdvertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<IAdvertisement | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAdvertisements({ status: 'pending' });
      setAds(res.advertisements || []);
    } catch (err: any) {
      onToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (id: number) => {
    await onApprove(id);
    setAds(prev => prev.filter(a => a.id !== id));
  };

  const openRejectModal = (ad: IAdvertisement) => {
    setSelectedAd(ad);
    setRejectionReason('Policy violation: Please review and ensure product details and images comply with marketplace standards.');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedAd || !rejectionReason.trim()) return;
    await onReject(selectedAd.id, rejectionReason.trim());
    setAds(prev => prev.filter(a => a.id !== selectedAd.id));
    setRejectModalOpen(false);
    setSelectedAd(null);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Pending Advertisement Approvals</h1>
          <p>Carefully review submitted advertisements before publishing to the public marketplace</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="status-pill pending">
            {ads.length} Listings In Review
          </span>
          <button className="btn btn-outline btn-sm" onClick={fetchPending}>
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          Loading pending advertisements...
        </div>
      ) : ads.length === 0 ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <CheckCircle size={48} color="#16a34a" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#002f34' }}>
            No Pending Listings
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '6px' }}>
            Great job! All newly posted seller advertisements have been reviewed.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
          {ads.map((ad) => (
            <div key={ad.id} className="card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column' }}>
              {/* Cover Image */}
              <div style={{ position: 'relative', width: '100%', height: '220px', background: '#e2e8f0' }}>
                <img
                  src={ad.primary_image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600'}
                  alt={ad.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <span 
                  className="status-pill pending"
                  style={{ position: 'absolute', top: '12px', left: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                >
                  <Clock size={12} />
                  <span>Pending Approval</span>
                </span>
                <span
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    right: '12px',
                    background: 'rgba(0, 47, 52, 0.85)',
                    color: '#fff',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700
                  }}
                >
                  Condition: {ad.product_condition ? ad.product_condition.replace('_', ' ') : 'Used'}
                </span>
              </div>

              {/* Card Body */}
              <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                  <span style={{ fontSize: '22px', fontWeight: 800, color: '#002f34' }}>
                    ₹{Number(ad.price).toLocaleString('en-IN')}
                  </span>
                  <span style={{ fontSize: '12px', color: '#00a49f', fontWeight: 700, background: '#e6f7f6', padding: '2px 8px', borderRadius: '4px' }}>
                    {ad.category_name}
                  </span>
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#091e22', marginBottom: '8px', lineHeight: 1.3 }}>
                  {ad.title}
                </h3>

                <p style={{
                  fontSize: '13px',
                  color: '#64748b',
                  marginBottom: '16px',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: 1.4
                }}>
                  {ad.description}
                </p>

                {/* Seller & Location Info */}
                <div style={{
                  background: '#f8fafc',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#475569',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  marginBottom: '20px',
                  marginTop: 'auto'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={13} color="#00a49f" />
                    <span>Seller: <strong>{ad.seller_name}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={13} color="#00a49f" />
                    <span>Location: {ad.location || ad.city}, {ad.state}</span>
                  </div>
                  {ad.contact_phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={13} color="#00a49f" />
                      <span>Phone: {ad.contact_phone}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    className="btn btn-success"
                    onClick={() => handleApprove(ad.id)}
                  >
                    <CheckCircle size={16} />
                    <span>Approve</span>
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => openRejectModal(ad)}
                  >
                    <XCircle size={16} />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Specify Rejection Reason"
        footer={(
          <>
            <button className="btn btn-outline" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={handleConfirmReject}>
              Confirm & Reject
            </button>
          </>
        )}
      >
        <div>
          <p style={{ fontSize: '13.5px', color: '#475569', marginBottom: '14px' }}>
            Listing: <strong>"{selectedAd?.title}"</strong>
          </p>
          <div className="form-group">
            <label className="form-label">Official Feedback Note (Visible to Seller)</label>
            <textarea
              className="form-textarea"
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="State clear reasons why this advertisement was rejected..."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
