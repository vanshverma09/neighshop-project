import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Heart,
  MessageSquare,
  Share2,
  Phone,
  Shield,
  Star,
  Tag,
  CheckCircle,
  AlertTriangle,
  X,
  ExternalLink
} from 'lucide-react';
import { buyerApi, adminApi, getBuyerToken, setBuyerAuth, getBuyerUser } from '../api';
import { IAdvertisement } from '../types/advertisement.types';
import { ICategory } from '../types/category.types';

interface BuyerPortalProps {
  onShowToast: (msg: string, type: 'info' | 'success' | 'error') => void;
}

export default function BuyerPortal({ onShowToast }: BuyerPortalProps) {
  const [buyerToken, setBuyerTokenState] = useState<string>('');
  const [buyerUser, setBuyerUserState] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'feed' | 'favourites' | 'chats'>('feed');

  // Marketplace Feed state
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>('All India');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [advertisements, setAdvertisements] = useState<IAdvertisement[]>([]);
  const [featuredAds, setFeaturedAds] = useState<IAdvertisement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Selected Ad Detail Modal
  const [selectedAd, setSelectedAd] = useState<IAdvertisement | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [enquiryMessage, setEnquiryMessage] = useState<string>('');
  const [sendingEnquiry, setSendingEnquiry] = useState<boolean>(false);

  // Favourites & Chats
  const [wishlist, setWishlist] = useState<IAdvertisement[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);

  // Safety Report Modal
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
  const [reportReason, setReportReason] = useState<string>('duplicate');
  const [reportDescription, setReportDescription] = useState<string>('');

  useEffect(() => {
    loginAsBuyer();
    loadCategories();
  }, []);

  useEffect(() => {
    if (activeTab === 'feed') {
      loadMarketplaceFeed();
    } else if (activeTab === 'favourites' && buyerToken) {
      loadWishlist();
    } else if (activeTab === 'chats' && buyerToken) {
      loadEnquiries();
    }
  }, [activeTab, selectedCategory, selectedCity, searchTerm, buyerToken]);

  const loginAsBuyer = async () => {
    try {
      const res = await adminApi.login('buyer@neighshop.com', 'Buyer@123');
      if (res.token && res.user) {
        setBuyerTokenState(res.token);
        setBuyerUserState(res.user);
        setBuyerAuth(res.token, res.user);
      }
    } catch {
      // Offline fallback
    }
  };

  const loadCategories = async () => {
    try {
      const res = await buyerApi.getCategories();
      setCategories(res.categories || []);
      const feat = await buyerApi.getFeaturedAds();
      setFeaturedAds(feat.featured || []);
    } catch (err: any) {
      console.warn('Categories load error:', err.message);
    }
  };

  const loadMarketplaceFeed = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { limit: 30 };
      if (selectedCategory) params.category_id = selectedCategory;
      if (selectedCity && selectedCity !== 'All India') params.city = selectedCity;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await buyerApi.getAdvertisements(params);
      setAdvertisements(res.advertisements || []);
    } catch (err: any) {
      onShowToast(`Failed to load marketplace ads: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadWishlist = async () => {
    if (!buyerToken) return;
    try {
      const res = await buyerApi.getFavourites(buyerToken);
      setWishlist(res.favourites || []);
    } catch (err: any) {
      console.warn('Wishlist load error:', err.message);
    }
  };

  const loadEnquiries = async () => {
    if (!buyerToken) return;
    try {
      const res = await buyerApi.getMyEnquiries(buyerToken);
      setEnquiries(res.enquiries || []);
    } catch (err: any) {
      console.warn('Enquiries load error:', err.message);
    }
  };

  const handleToggleFavourite = async (ad: IAdvertisement, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!buyerToken) {
      onShowToast('Please log in as a buyer to save favourites', 'error');
      return;
    }

    try {
      const res = await buyerApi.toggleFavourite(ad.id, buyerToken);
      onShowToast(res.message || (res.is_favourite ? 'Added to favourites!' : 'Removed from favourites'), 'success');
      loadMarketplaceFeed();
      if (activeTab === 'favourites') loadWishlist();
    } catch (err: any) {
      onShowToast(err.message, 'error');
    }
  };

  const handleSendEnquiry = async () => {
    if (!selectedAd || !buyerToken) return;
    if (!enquiryMessage.trim()) {
      onShowToast('Please type a message before sending', 'error');
      return;
    }

    setSendingEnquiry(true);
    try {
      await buyerApi.createEnquiry(
        {
          advertisement_id: selectedAd.id,
          message: enquiryMessage.trim()
        },
        buyerToken
      );
      onShowToast('Enquiry sent directly to seller inbox!', 'success');
      setEnquiryMessage('');
    } catch (err: any) {
      onShowToast(err.message, 'error');
    } finally {
      setSendingEnquiry(false);
    }
  };

  const handleOpenAdDetail = async (ad: IAdvertisement) => {
    setSelectedAd(ad);
    setActiveImageIndex(0);
    setEnquiryMessage(`Hello! Is "${ad.title}" still available?`);
    try {
      const full = await buyerApi.getAdvertisementById(ad.id, buyerToken);
      if (full.advertisement) {
        setSelectedAd(full.advertisement);
      }
    } catch {
      // fallback to basic
    }
  };

  const handleReportAd = async () => {
    if (!selectedAd || !buyerToken) return;
    try {
      await buyerApi.submitReport(
        {
          advertisement_id: selectedAd.id,
          reason: reportReason,
          description: reportDescription
        },
        buyerToken
      );
      onShowToast('Safety report submitted to Admin moderation team.', 'success');
      setReportModalOpen(false);
      setReportDescription('');
    } catch (err: any) {
      onShowToast(err.message, 'error');
    }
  };

  return (
    <div className="portal-container">
      {/* Subnav & Identity Bar */}
      <div className="portal-subnav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="identity-badge buyer">
            👤 Active Buyer: <strong>{buyerUser?.name || 'Priya Sharma'}</strong>
          </span>
          <span style={{ fontSize: '13px', color: '#64748b' }}>
            ({buyerUser?.email || 'buyer@neighshop.com'})
          </span>
        </div>

        <div className="portal-tabs">
          <button
            className={`portal-tab ${activeTab === 'feed' ? 'active' : ''}`}
            onClick={() => setActiveTab('feed')}
          >
            🛍️ Browse Marketplace
          </button>
          <button
            className={`portal-tab ${activeTab === 'favourites' ? 'active' : ''}`}
            onClick={() => setActiveTab('favourites')}
          >
            ❤️ Saved Wishlist ({wishlist.length})
          </button>
          <button
            className={`portal-tab ${activeTab === 'chats' ? 'active' : ''}`}
            onClick={() => setActiveTab('chats')}
          >
            💬 My Inquiries ({enquiries.length})
          </button>
        </div>
      </div>

      {/* FEED TAB */}
      {activeTab === 'feed' && (
        <>
          {/* Search & Location Filter */}
          <div className="marketplace-search-bar">
            <div className="city-picker">
              <MapPin size={18} color="#00a49f" />
              <select
                value={selectedCity}
                onChange={e => setSelectedCity(e.target.value)}
                aria-label="Filter by City"
              >
                <option value="All India">All India</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Delhi">Delhi</option>
                <option value="Bangalore">Bangalore</option>
                <option value="Pune">Pune</option>
              </select>
            </div>

            <div className="search-box">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search smartphones, cars, apartments, electronics, fashion..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Category Chips Carousel */}
          <div className="category-chips">
            <button
              className={`cat-chip ${selectedCategory === null ? 'active' : ''}`}
              onClick={() => setSelectedCategory(null)}
            >
              All Categories
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`cat-chip ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
              <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
              Loading live marketplace catalog...
            </div>
          ) : advertisements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '12px' }}>
              <h3>No items found in this category or city</h3>
              <p style={{ color: '#64748b', marginTop: '6px' }}>
                Try switching city to "All India" or clearing the search query.
              </p>
            </div>
          ) : (
            <div className="product-grid">
              {advertisements.map(ad => (
                <div
                  key={ad.id}
                  className="ad-card"
                  onClick={() => handleOpenAdDetail(ad)}
                >
                  <div className="ad-img-box">
                    <img
                      src={ad.primary_image || (ad.images && ad.images[0]?.image_url) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'}
                      alt={ad.title}
                      loading="lazy"
                    />
                    {Boolean(ad.is_featured) && (
                      <span className="ad-featured-badge">FEATURED</span>
                    )}
                    <button
                      className="fav-btn"
                      onClick={e => handleToggleFavourite(ad, e)}
                      title="Save to Favourites"
                    >
                      <Heart
                        size={16}
                        color={(ad.is_favourited || (ad as any).is_favourite) ? '#ef4444' : '#ffffff'}
                        fill={(ad.is_favourited || (ad as any).is_favourite) ? '#ef4444' : 'none'}
                      />
                    </button>
                  </div>

                  <div className="ad-body">
                    <div className="ad-price-row">
                      <span className="ad-price">₹{Number(ad.price).toLocaleString('en-IN')}</span>
                      <span className="condition-badge">{ad.product_condition?.replace('_', ' ')}</span>
                    </div>

                    <h4 className="ad-title" title={ad.title}>
                      {ad.title}
                    </h4>

                    <div className="ad-footer">
                      <span className="ad-loc">
                        <MapPin size={12} /> {ad.city || 'India'}
                      </span>
                      <span>
                        {new Date(ad.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* FAVOURITES TAB */}
      {activeTab === 'favourites' && (
        <div style={{ marginTop: '16px' }}>
          <h3 style={{ marginBottom: '16px' }}>❤️ My Saved Wishlist</h3>
          {wishlist.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '12px' }}>
              <p style={{ color: '#64748b' }}>You haven't saved any advertisements to favourites yet.</p>
              <button
                style={{ marginTop: '12px' }}
                className="btn btn-primary"
                onClick={() => setActiveTab('feed')}
              >
                Browse Marketplace
              </button>
            </div>
          ) : (
            <div className="product-grid">
              {wishlist.map(ad => (
                <div
                  key={ad.id}
                  className="ad-card"
                  onClick={() => handleOpenAdDetail(ad)}
                >
                  <div className="ad-img-box">
                    <img
                      src={ad.primary_image || (ad.images && ad.images[0]?.image_url) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'}
                      alt={ad.title}
                    />
                    <button
                      className="fav-btn"
                      onClick={e => handleToggleFavourite(ad, e)}
                    >
                      <Heart size={16} color="#ef4444" fill="#ef4444" />
                    </button>
                  </div>
                  <div className="ad-body">
                    <div className="ad-price-row">
                      <span className="ad-price">₹{Number(ad.price).toLocaleString('en-IN')}</span>
                    </div>
                    <h4 className="ad-title">{ad.title}</h4>
                    <div className="ad-footer">
                      <span><MapPin size={12} /> {ad.city}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* INQUIRIES TAB */}
      {activeTab === 'chats' && (
        <div style={{ marginTop: '16px' }}>
          <h3 style={{ marginBottom: '16px' }}>💬 My Inquiries & Seller Replies</h3>
          {enquiries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '12px' }}>
              <p style={{ color: '#64748b' }}>You haven't initiated any product inquiries yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {enquiries.map(enq => (
                <div key={enq.id} style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong>Listing: {enq.ad_title || `Ad #${enq.advertisement_id}`}</strong>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      {new Date(enq.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '10px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#0369a1', marginBottom: '4px' }}>YOU ASKED:</div>
                    <p style={{ fontSize: '14px' }}>{enq.message}</p>
                  </div>

                  {enq.response_message ? (
                    <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '8px', borderLeft: '3px solid #22c55e' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#15803d', marginBottom: '4px' }}>SELLER REPLIED:</div>
                      <p style={{ fontSize: '14px', color: '#166534' }}>{enq.response_message}</p>
                    </div>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#d97706', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      ⏳ Waiting for seller response...
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AD DETAIL MODAL */}
      {selectedAd && (
        <div className="modal-overlay" onClick={() => setSelectedAd(null)}>
          <div className="product-detail-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedAd(null)}>
              <X size={20} />
            </button>

            <div className="detail-layout">
              {/* Photo Gallery Column */}
              <div className="detail-gallery">
                <div className="main-image-wrap">
                  <img
                    src={
                      (selectedAd.images && selectedAd.images[activeImageIndex]?.image_url) ||
                      selectedAd.primary_image ||
                      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'
                    }
                    alt={selectedAd.title}
                  />
                </div>

                {selectedAd.images && selectedAd.images.length > 1 && (
                  <div className="thumbnail-row">
                    {selectedAd.images.map((img, idx) => (
                      <div
                        key={img.id || idx}
                        className={`thumb-box ${activeImageIndex === idx ? 'active' : ''}`}
                        onClick={() => setActiveImageIndex(idx)}
                      >
                        <img src={img.image_url} alt="thumbnail" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Information Column */}
              <div className="detail-info">
                <div className="detail-price-box">
                  <h2 style={{ fontSize: '28px', color: '#002f34', fontWeight: 800 }}>
                    ₹{Number(selectedAd.price).toLocaleString('en-IN')}
                  </h2>
                  <button
                    className="btn-fav-large"
                    onClick={e => handleToggleFavourite(selectedAd, e)}
                  >
                    <Heart
                      size={18}
                      color={(selectedAd.is_favourited || (selectedAd as any).is_favourite) ? '#ef4444' : '#64748b'}
                      fill={(selectedAd.is_favourited || (selectedAd as any).is_favourite) ? '#ef4444' : 'none'}
                    />
                    <span>{(selectedAd.is_favourited || (selectedAd as any).is_favourite) ? 'Saved' : 'Save'}</span>
                  </button>
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '8px 0 16px' }}>
                  {selectedAd.title}
                </h3>

                <div className="detail-tags">
                  <span className="badge badge-info">
                    <Tag size={12} /> {selectedAd.category_name || 'Classified'}
                  </span>
                  <span className="badge badge-neutral">
                    Condition: {selectedAd.product_condition?.replace('_', ' ')}
                  </span>
                  <span className="badge badge-neutral">
                    <MapPin size={12} /> {selectedAd.location || selectedAd.city}
                  </span>
                </div>

                {/* Seller Profile Summary */}
                <div className="seller-box">
                  <div className="seller-avatar">
                    <img
                      src={selectedAd.seller_avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'}
                      alt="Seller"
                    />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 700 }}>
                      {selectedAd.seller_name || 'Verified Seller'}
                    </h4>
                    <span style={{ fontSize: '12px', color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <CheckCircle size={12} /> ID Verified Seller • Rating 5.0 ★
                    </span>
                    {selectedAd.contact_phone && (
                      <div style={{ fontSize: '13px', color: '#0f172a', marginTop: '4px' }}>
                        📞 <strong>{selectedAd.contact_phone}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div style={{ margin: '16px 0' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>Description</h4>
                  <p style={{ fontSize: '13.5px', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                    {selectedAd.description}
                  </p>
                </div>

                {/* Direct Seller Enquiry */}
                <div className="enquiry-box">
                  <h4 style={{ fontSize: '14px', fontWeight: 700 }}>Send Enquiry to Seller</h4>
                  <textarea
                    rows={3}
                    placeholder="Ask about availability, delivery, or best price..."
                    value={enquiryMessage}
                    onChange={e => setEnquiryMessage(e.target.value)}
                  />
                  <div className="enquiry-actions">
                    <button
                      className="btn btn-secondary"
                      onClick={() => setReportModalOpen(true)}
                      style={{ fontSize: '12px' }}
                    >
                      <AlertTriangle size={14} color="#dc2626" /> Report Violation
                    </button>
                    <button
                      className="btn btn-primary"
                      disabled={sendingEnquiry}
                      onClick={handleSendEnquiry}
                    >
                      {sendingEnquiry ? 'Sending...' : 'Send Message'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SAFETY REPORT MODAL */}
      {reportModalOpen && selectedAd && (
        <div className="modal-overlay" onClick={() => setReportModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '12px', color: '#dc2626' }}>
              🛡️ Report Advertisement #{selectedAd.id}
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              Help keep NeighShop safe. Submitted complaints are routed immediately to the Admin Moderation panel.
            </p>

            <div className="form-group">
              <label>Violation Type</label>
              <select
                value={reportReason}
                onChange={e => setReportReason(e.target.value)}
              >
                <option value="duplicate">Duplicate or Spam Posting</option>
                <option value="inappropriate_content">Prohibited or Inappropriate Goods</option>
                <option value="scam_fraud">Suspected Fraud or Scam</option>
                <option value="misleading">Misleading Price or Description</option>
                <option value="other">Other Violation</option>
              </select>
            </div>

            <div className="form-group">
              <label>Additional Details</label>
              <textarea
                rows={3}
                placeholder="Describe what makes this listing problematic..."
                value={reportDescription}
                onChange={e => setReportDescription(e.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setReportModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleReportAd}>
                Submit Report to Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
