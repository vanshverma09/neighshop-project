import React, { useState, useEffect } from 'react';
import {
  Package,
  PlusCircle,
  MessageSquare,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Send,
  Trash2,
  Tag,
  MapPin,
  Image as ImageIcon
} from 'lucide-react';
import { sellerApi, adminApi, getSellerToken, setSellerAuth, getSellerUser } from '../api';
import { IAdvertisement } from '../types/advertisement.types';
import { ICategory } from '../types/category.types';

interface SellerPortalProps {
  onShowToast: (msg: string, type: 'info' | 'success' | 'error') => void;
  onAdCreated?: () => void;
}

export default function SellerPortal({ onShowToast, onAdCreated }: SellerPortalProps) {
  const [sellerToken, setSellerTokenState] = useState<string>('');
  const [sellerUser, setSellerUserState] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'inventory' | 'sell' | 'inquiries'>('inventory');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Inventory & Stats
  const [advertisements, setAdvertisements] = useState<IAdvertisement[]>([]);
  const [counts, setCounts] = useState<any>({ total: 0, approved_count: 0, pending_count: 0, rejected_count: 0, sold_count: 0 });
  const [loading, setLoading] = useState<boolean>(true);

  // Inquiries / Leads
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [replyText, setReplyText] = useState<Record<number, string>>({});
  const [sendingReply, setSendingReply] = useState<number | null>(null);

  // Categories for +SELL form
  const [categories, setCategories] = useState<ICategory[]>([]);

  // +SELL Form State
  const [sellForm, setSellForm] = useState({
    title: '',
    category_id: '1',
    price: '',
    product_condition: 'used_good',
    city: 'Mumbai',
    location: 'Bandra West, Mumbai',
    contact_phone: '+91 98112 23344',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800'
  });
  const [submittingAd, setSubmittingAd] = useState<boolean>(false);

  useEffect(() => {
    loginAsSeller();
    loadCategories();
  }, []);

  useEffect(() => {
    if (sellerToken) {
      if (activeTab === 'inventory') {
        loadSellerInventory();
      } else if (activeTab === 'inquiries') {
        loadSellerInquiries();
      }
    }
  }, [activeTab, statusFilter, sellerToken]);

  const loginAsSeller = async () => {
    try {
      const res = await adminApi.login('seller@neighshop.com', 'Seller@123');
      if (res.token && res.user) {
        setSellerTokenState(res.token);
        setSellerUserState(res.user);
        setSellerAuth(res.token, res.user);
      }
    } catch {
      // offline fallback
    }
  };

  const loadCategories = async () => {
    try {
      const res = await adminApi.getCategories();
      setCategories(res.categories || []);
    } catch (err: any) {
      console.warn('Categories load error:', err.message);
    }
  };

  const loadSellerInventory = async () => {
    if (!sellerToken) return;
    setLoading(true);
    try {
      const res = await sellerApi.getMyAdvertisements(statusFilter, sellerToken);
      setAdvertisements(res.advertisements || []);
      if (res.counts) setCounts(res.counts);
    } catch (err: any) {
      onShowToast(`Failed to load seller listings: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSellerInquiries = async () => {
    if (!sellerToken) return;
    try {
      const res = await sellerApi.getSellerInquiries(sellerToken);
      setInquiries(res.inquiries || []);
    } catch (err: any) {
      console.warn('Inquiries load error:', err.message);
    }
  };

  const handlePostAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerToken) {
      onShowToast('Please log in to post an ad', 'error');
      return;
    }

    if (!sellForm.title.trim() || !sellForm.price || !sellForm.description.trim()) {
      onShowToast('Please fill in title, price, and description', 'error');
      return;
    }

    setSubmittingAd(true);
    try {
      const payload = {
        title: sellForm.title.trim(),
        category_id: Number(sellForm.category_id),
        price: Number(sellForm.price),
        product_condition: sellForm.product_condition,
        city: sellForm.city,
        location: sellForm.location,
        contact_phone: sellForm.contact_phone,
        description: sellForm.description.trim(),
        images: [sellForm.imageUrl]
      };

      const res = await sellerApi.createAdvertisement(payload, sellerToken);
      onShowToast(res.message || 'Ad submitted! It is now pending Admin approval.', 'success');

      // Reset form
      setSellForm({
        title: '',
        category_id: '1',
        price: '',
        product_condition: 'used_good',
        city: 'Mumbai',
        location: 'Bandra West, Mumbai',
        contact_phone: '+91 98112 23344',
        description: '',
        imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800'
      });

      if (onAdCreated) onAdCreated();
      setActiveTab('inventory');
      loadSellerInventory();
    } catch (err: any) {
      onShowToast(err.message, 'error');
    } finally {
      setSubmittingAd(false);
    }
  };

  const handleDeleteAd = async (adId: number) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
      const res = await sellerApi.deleteAdvertisement(adId, sellerToken);
      onShowToast(res.message || 'Advertisement deleted successfully', 'success');
      loadSellerInventory();
    } catch (err: any) {
      onShowToast(err.message, 'error');
    }
  };

  const handleSendReply = async (inquiryId: number) => {
    const text = replyText[inquiryId];
    if (!text || !text.trim()) {
      onShowToast('Please enter a reply message', 'error');
      return;
    }

    setSendingReply(inquiryId);
    try {
      const res = await sellerApi.replyToInquiry(inquiryId, text.trim(), sellerToken);
      onShowToast(res.message || 'Reply sent to buyer!', 'success');
      setReplyText(prev => ({ ...prev, [inquiryId]: '' }));
      loadSellerInquiries();
    } catch (err: any) {
      onShowToast(err.message, 'error');
    } finally {
      setSendingReply(null);
    }
  };

  return (
    <div className="portal-container">
      {/* Subnav & Identity Bar */}
      <div className="portal-subnav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="identity-badge seller">
            💼 Active Seller: <strong>{sellerUser?.name || 'Rajesh Kumar'}</strong>
          </span>
          <span style={{ fontSize: '13px', color: '#64748b' }}>
            ({sellerUser?.email || 'seller@neighshop.com'})
          </span>
        </div>

        <div className="portal-tabs">
          <button
            className={`portal-tab ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            📦 My Listings ({counts.total || advertisements.length})
          </button>
          <button
            className={`portal-tab ${activeTab === 'sell' ? 'active' : ''}`}
            onClick={() => setActiveTab('sell')}
          >
            ➕ Post New Ad (SELL)
          </button>
          <button
            className={`portal-tab ${activeTab === 'inquiries' ? 'active' : ''}`}
            onClick={() => setActiveTab('inquiries')}
          >
            💬 Buyer Leads ({inquiries.length})
          </button>
        </div>
      </div>

      {/* INVENTORY TAB */}
      {activeTab === 'inventory' && (
        <>
          {/* Seller KPI Cards */}
          <div className="seller-kpis">
            <div className="seller-kpi-card" onClick={() => setStatusFilter('all')} style={{ cursor: 'pointer', borderColor: statusFilter === 'all' ? '#002f34' : undefined }}>
              <div className="kpi-num" style={{ color: '#0f172a' }}>{counts.total || 0}</div>
              <div className="kpi-label">TOTAL LISTINGS</div>
            </div>
            <div className="seller-kpi-card" onClick={() => setStatusFilter('approved')} style={{ cursor: 'pointer', borderColor: statusFilter === 'approved' ? '#16a34a' : undefined }}>
              <div className="kpi-num" style={{ color: '#16a34a' }}>{counts.approved_count || 0}</div>
              <div className="kpi-label">ACTIVE (APPROVED)</div>
            </div>
            <div className="seller-kpi-card" onClick={() => setStatusFilter('pending')} style={{ cursor: 'pointer', borderColor: statusFilter === 'pending' ? '#d97706' : undefined }}>
              <div className="kpi-num" style={{ color: '#d97706' }}>{counts.pending_count || 0}</div>
              <div className="kpi-label">PENDING APPROVAL</div>
            </div>
            <div className="seller-kpi-card" onClick={() => setStatusFilter('rejected')} style={{ cursor: 'pointer', borderColor: statusFilter === 'rejected' ? '#dc2626' : undefined }}>
              <div className="kpi-num" style={{ color: '#dc2626' }}>{counts.rejected_count || 0}</div>
              <div className="kpi-label">REJECTED</div>
            </div>
            <div className="seller-kpi-card" onClick={() => setStatusFilter('sold')} style={{ cursor: 'pointer', borderColor: statusFilter === 'sold' ? '#64748b' : undefined }}>
              <div className="kpi-num" style={{ color: '#64748b' }}>{counts.sold_count || 0}</div>
              <div className="kpi-label">SOLD ITEMS</div>
            </div>
          </div>

          {/* Listings List */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
              <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
              Loading your seller inventory...
            </div>
          ) : advertisements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '12px' }}>
              <h3>No listings match this filter</h3>
              <p style={{ color: '#64748b', margin: '6px 0 16px' }}>
                Post a new product to start getting buyer inquiries!
              </p>
              <button className="btn btn-primary" onClick={() => setActiveTab('sell')}>
                + Post Your First Ad
              </button>
            </div>
          ) : (
            <div className="seller-ads-list">
              {advertisements.map(ad => (
                <div key={ad.id} className="seller-ad-item">
                  <div className="seller-ad-thumb">
                    <img
                      src={ad.primary_image || (ad.images && ad.images[0]?.image_url) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'}
                      alt={ad.title}
                    />
                  </div>

                  <div className="seller-ad-content">
                    <div className="seller-ad-title-row">
                      <h4>{ad.title}</h4>
                      <span className={`badge badge-${ad.status === 'approved' ? 'success' : ad.status === 'pending' ? 'warning' : 'danger'}`}>
                        {ad.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="seller-ad-details">
                      <span className="price-tag">₹{Number(ad.price).toLocaleString('en-IN')}</span>
                      <span><Tag size={12} /> {ad.category_name}</span>
                      <span><MapPin size={12} /> {ad.city}</span>
                      <span>Views: {ad.views_count || 0}</span>
                    </div>

                    {/* Rejection Feedback Banner */}
                    {ad.status === 'rejected' && ad.rejection_reason && (
                      <div className="rejection-banner">
                        <AlertTriangle size={16} />
                        <div>
                          <strong>Admin Moderator Feedback:</strong> {ad.rejection_reason}
                        </div>
                      </div>
                    )}

                    {/* Pending Moderation Notice */}
                    {ad.status === 'pending' && (
                      <div className="pending-banner">
                        <Clock size={15} />
                        <span>Awaiting Admin moderation. This listing is hidden from buyers until approved.</span>
                      </div>
                    )}

                    <div className="seller-ad-actions">
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: '12px', padding: '6px 12px' }}
                        onClick={() => handleDeleteAd(ad.id)}
                      >
                        <Trash2 size={13} /> Delete Ad
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* +SELL FORM TAB */}
      {activeTab === 'sell' && (
        <div className="sell-form-container">
          <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '6px' }}>
            ➕ Create New Classified Advertisement
          </h3>
          <p className="form-subtitle">
            Your listing will be reviewed by Admin moderation and published to the marketplace feed upon approval.
          </p>

          <form onSubmit={handlePostAd}>
            <div className="form-group">
              <label>Advertisement Title *</label>
              <input
                type="text"
                placeholder="e.g. iPhone 15 Pro 256GB Natural Titanium (Mint Condition)"
                value={sellForm.title}
                onChange={e => setSellForm({ ...sellForm, title: e.target.value })}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category *</label>
                <select
                  value={sellForm.category_id}
                  onChange={e => setSellForm({ ...sellForm, category_id: e.target.value })}
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Price (₹) *</label>
                <input
                  type="number"
                  placeholder="e.g. 75000"
                  value={sellForm.price}
                  onChange={e => setSellForm({ ...sellForm, price: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Condition</label>
                <select
                  value={sellForm.product_condition}
                  onChange={e => setSellForm({ ...sellForm, product_condition: e.target.value })}
                >
                  <option value="new">Brand New (Unopened)</option>
                  <option value="like_new">Like New (Gently Used)</option>
                  <option value="used_good">Used - Good Condition</option>
                  <option value="used_fair">Used - Fair Condition</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>City *</label>
                <select
                  value={sellForm.city}
                  onChange={e => setSellForm({ ...sellForm, city: e.target.value })}
                >
                  <option value="Mumbai">Mumbai</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Bangalore">Bangalore</option>
                  <option value="Pune">Pune</option>
                  <option value="Hyderabad">Hyderabad</option>
                </select>
              </div>

              <div className="form-group">
                <label>Neighborhood / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Bandra West, Mumbai"
                  value={sellForm.location}
                  onChange={e => setSellForm({ ...sellForm, location: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Contact Phone</label>
                <input
                  type="text"
                  placeholder="+91 98112 23344"
                  value={sellForm.contact_phone}
                  onChange={e => setSellForm({ ...sellForm, contact_phone: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Product Image URL *</label>
              <input
                type="text"
                placeholder="https://..."
                value={sellForm.imageUrl}
                onChange={e => setSellForm({ ...sellForm, imageUrl: e.target.value })}
                required
              />
              <div className="image-preview-box">
                <img src={sellForm.imageUrl} alt="Preview" onError={e => (e.currentTarget.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600')} />
              </div>
            </div>

            <div className="form-group">
              <label>Detailed Description *</label>
              <textarea
                rows={4}
                placeholder="Detail specifications, bill/box availability, reason for sale, and pickup conditions..."
                value={sellForm.description}
                onChange={e => setSellForm({ ...sellForm, description: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setActiveTab('inventory')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submittingAd}
              >
                {submittingAd ? 'Submitting Ad...' : 'Publish & Submit for Moderation'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* INQUIRIES TAB */}
      {activeTab === 'inquiries' && (
        <div>
          <h3 style={{ marginBottom: '16px' }}>💬 Buyer Leads & Direct Messages</h3>
          {inquiries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '12px' }}>
              <p style={{ color: '#64748b' }}>No buyer leads received yet.</p>
            </div>
          ) : (
            <div className="leads-list">
              {inquiries.map(inq => (
                <div key={inq.id} className="lead-card">
                  <div className="lead-header">
                    <div>
                      <strong style={{ fontSize: '15px' }}>{inq.ad_title || `Listing #${inq.advertisement_id}`}</strong>
                      <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                        From Buyer: <strong>{inq.buyer_name || 'Interested Buyer'}</strong> ({inq.buyer_phone || inq.buyer_email || 'Verified User'})
                      </div>
                    </div>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {new Date(inq.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="buyer-inquiry-box">
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#0369a1', marginBottom: '4px' }}>
                      BUYER MESSAGE:
                    </div>
                    <p>{inq.message}</p>
                  </div>

                  {inq.response_message && (
                    <div className="seller-previous-reply">
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#15803d', marginBottom: '4px' }}>
                        YOUR PREVIOUS REPLY:
                      </div>
                      <p style={{ color: '#166534' }}>{inq.response_message}</p>
                    </div>
                  )}

                  <div className="reply-composer">
                    <input
                      type="text"
                      placeholder="Type your response to this buyer..."
                      value={replyText[inq.id] || ''}
                      onChange={e => setReplyText({ ...replyText, [inq.id]: e.target.value })}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSendReply(inq.id);
                      }}
                    />
                    <button
                      className="btn btn-primary"
                      disabled={sendingReply === inq.id}
                      onClick={() => handleSendReply(inq.id)}
                    >
                      <Send size={14} /> {sendingReply === inq.id ? 'Sending...' : 'Reply'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
