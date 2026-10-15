import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Share2,
  Heart,
  MapPin,
  Calendar,
  ShieldCheck,
  Star,
  MessageCircle,
  Phone,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Send
} from 'lucide-react';
import { api, getCurrentUser } from '../api';

export default function ProductDetailScreen({
  adId,
  onBack,
  onSelectAd,
  onToggleWishlist,
  onRequireAuth,
  onToast
}) {
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const [showPhone, setShowPhone] = useState(false);

  // Enquiry drawer
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [message, setMessage] = useState('Hi, is this still available? What is your best price for pickup today?');
  const [sendingEnquiry, setSendingEnquiry] = useState(false);

  // Report modal
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('spam');
  const [reportDesc, setReportDesc] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await api.getAdDetail(adId);
      setAd(res.advertisement);
    } catch (err) {
      onToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    window.scrollTo(0, 0);
  }, [adId]);

  const handleSendEnquiry = async (e) => {
    e.preventDefault();
    const user = getCurrentUser();
    if (!user) {
      onRequireAuth();
      return;
    }

    if (!message.trim()) return;

    setSendingEnquiry(true);
    try {
      const res = await api.sendEnquiry(ad.id, message.trim());
      onToast(res.message, 'success');
      setEnquiryOpen(false);
    } catch (err) {
      onToast(err.message, 'error');
    } finally {
      setSendingEnquiry(false);
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    const user = getCurrentUser();
    if (!user) {
      onRequireAuth();
      return;
    }

    setSubmittingReport(true);
    try {
      const res = await api.submitReport(ad.id, reportReason, reportDesc);
      onToast(res.message, 'success');
      setReportOpen(false);
      setReportDesc('');
    } catch (err) {
      onToast(err.message, 'error');
    } finally {
      setSubmittingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="screen-overlay" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#002f34', fontWeight: 600, fontSize: '14px' }}>Loading advertisement...</div>
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="screen-overlay" style={{ padding: '40px 20px', textAlign: 'center' }}>
        <h3 style={{ color: '#002f34' }}>Advertisement Not Found</h3>
        <button className="olx-btn olx-btn-primary" style={{ marginTop: '20px' }} onClick={onBack}>
          Back to Listings
        </button>
      </div>
    );
  }

  const images = ad.images && ad.images.length > 0 ? ad.images : [{ image_url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800' }];

  return (
    <div className="screen-overlay">
      {/* Top Navigation */}
      <div className="screen-header">
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
          <ArrowLeft size={22} />
        </button>
        <h2>Ad Details</h2>
        <div style={{ display: 'flex', gap: '14px' }}>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: ad.title, url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
                onToast('Link copied to clipboard!', 'info');
              }
            }}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
          >
            <Share2 size={20} />
          </button>
          <button
            onClick={() => onToggleWishlist(ad.id)}
            style={{ background: 'none', border: 'none', color: ad.is_favourited ? '#ef4444' : '#fff', cursor: 'pointer' }}
          >
            <Heart size={20} fill={ad.is_favourited ? '#ef4444' : 'none'} />
          </button>
        </div>
      </div>

      <div className="screen-body" style={{ padding: '0 0 80px 0' }}>
        {/* Photo Gallery Viewer */}
        <div style={{ position: 'relative', width: '100%', height: '320px', background: '#000' }}>
          <img
            src={images[currentImgIdx]?.image_url}
            alt={ad.title}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />

          {images.length > 1 && (
            <>
              <button
                onClick={() => setCurrentImgIdx(prev => (prev > 0 ? prev - 1 : images.length - 1))}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(0,0,0,0.5)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={() => setCurrentImgIdx(prev => (prev < images.length - 1 ? prev + 1 : 0))}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(0,0,0,0.5)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ChevronRight size={22} />
              </button>

              <div style={{
                position: 'absolute',
                bottom: '12px',
                right: '12px',
                background: 'rgba(0, 47, 52, 0.8)',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '4px'
              }}>
                {currentImgIdx + 1} / {images.length}
              </div>
            </>
          )}
        </div>

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div style={{ display: 'flex', gap: '8px', padding: '10px 16px', background: '#fff', borderBottom: '1px solid #ebedee', overflowX: 'auto' }}>
            {images.map((img, i) => (
              <img
                key={i}
                src={img.image_url}
                alt=""
                onClick={() => setCurrentImgIdx(i)}
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '4px',
                  objectFit: 'cover',
                  cursor: 'pointer',
                  border: `2px solid ${currentImgIdx === i ? '#00a49f' : 'transparent'}`
                }}
              />
            ))}
          </div>
        )}

        {/* Price & Title Card */}
        <div style={{ background: '#fff', padding: '16px', borderBottom: '1px solid #ebedee' }}>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#002f34' }}>
            ₹ {Number(ad.price).toLocaleString('en-IN')}
          </div>
          <h1 style={{ fontSize: '17px', fontWeight: 600, color: '#002f34', marginTop: '6px', lineHeight: 1.3 }}>
            {ad.title}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '12px', fontSize: '12px', color: '#5e7377' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={13} color="#00a49f" />
              <span>{ad.location || ad.city}, {ad.state}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={13} color="#00a49f" />
              <span>Posted {new Date(ad.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Overview & Specs Card */}
        <div style={{ background: '#fff', padding: '16px', borderBottom: '1px solid #ebedee', marginTop: '8px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#002f34', marginBottom: '12px' }}>
            Overview & Specifications
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
            <div>
              <span style={{ color: '#8e9da0', display: 'block', fontSize: '11.5px' }}>Condition</span>
              <strong style={{ color: '#002f34', textTransform: 'capitalize' }}>
                {ad.product_condition ? ad.product_condition.replace('_', ' ') : 'Used'}
              </strong>
            </div>
            <div>
              <span style={{ color: '#8e9da0', display: 'block', fontSize: '11.5px' }}>Category</span>
              <strong style={{ color: '#002f34' }}>{ad.category_name}</strong>
            </div>
            {ad.subcategory_name && (
              <div>
                <span style={{ color: '#8e9da0', display: 'block', fontSize: '11.5px' }}>Subcategory</span>
                <strong style={{ color: '#002f34' }}>{ad.subcategory_name}</strong>
              </div>
            )}
            <div>
              <span style={{ color: '#8e9da0', display: 'block', fontSize: '11.5px' }}>Marketplace Status</span>
              <strong style={{ color: '#16a34a' }}>Active / Verified</strong>
            </div>
          </div>
        </div>

        {/* Description Card */}
        <div style={{ background: '#fff', padding: '16px', borderBottom: '1px solid #ebedee', marginTop: '8px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#002f34', marginBottom: '8px' }}>
            Description
          </h3>
          <p style={{ fontSize: '13.5px', color: '#406367', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
            {ad.description}
          </p>
        </div>

        {/* Seller Profile Card */}
        <div style={{ background: '#fff', padding: '16px', borderBottom: '1px solid #ebedee', marginTop: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#8e9da0', marginBottom: '10px' }}>
            Seller Details
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={ad.seller_avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
              alt={ad.seller_name}
              style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #d9eeec' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#002f34' }}>
                  {ad.business_name || ad.seller_name}
                </h4>
                {ad.seller_verified === 1 && (
                  <span title="Verified Seller" style={{ color: '#00a49f' }}>
                    <ShieldCheck size={16} />
                  </span>
                )}
              </div>
              <div style={{ fontSize: '12px', color: '#5e7377', marginTop: '2px' }}>
                Member since {ad.seller_joined ? new Date(ad.seller_joined).getFullYear() : '2023'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: '#16a34a', fontWeight: 700, marginTop: '2px' }}>
                <Star size={12} fill="#16a34a" />
                <span>{ad.seller_rating || '4.9'} Star Rating • {ad.seller_sales || 24} Verified Deals</span>
              </div>
            </div>
          </div>

          {/* Quick Call Button / Phone Reveal */}
          <div style={{ marginTop: '14px' }}>
            {showPhone ? (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 14px', borderRadius: '6px', textAlign: 'center' }}>
                <span style={{ fontSize: '12px', color: '#166534', fontWeight: 600 }}>Seller Contact:</span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#15803d', marginTop: '2px' }}>
                  <a href={`tel:${ad.contact_phone || ad.seller_phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    📞 {ad.contact_phone || ad.seller_phone || '+91 9811223344'}
                  </a>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="olx-btn olx-btn-call"
                onClick={() => setShowPhone(true)}
              >
                <Phone size={16} />
                <span>Show Seller Phone Number</span>
              </button>
            )}
          </div>
        </div>

        {/* OLX Safety Tips Card */}
        <div style={{
          background: '#fffdf5',
          border: '1px solid #fef3c7',
          padding: '16px',
          margin: '12px 16px',
          borderRadius: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontWeight: 800, fontSize: '13px', marginBottom: '6px' }}>
            <ShieldAlert size={16} />
            <span>NEIGHSHOP SAFETY RECOMMENDATIONS</span>
          </div>
          <ul style={{ fontSize: '12px', color: '#78350f', paddingLeft: '18px', lineHeight: 1.5 }}>
            <li>Meet seller in a safe, public location (e.g. metro station or cafe).</li>
            <li>Inspect the physical item thoroughly before making any payment.</li>
            <li>Never transfer advance token payments or scan unknown QR codes.</li>
          </ul>
        </div>

        {/* Report Listing Button */}
        <div style={{ padding: '0 16px', marginTop: '6px' }}>
          <button
            type="button"
            onClick={() => setReportOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#dc2626',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <AlertTriangle size={14} />
            <span>Report this advertisement to safety team</span>
          </button>
        </div>

        {/* Similar Listings Carousel */}
        {ad.similar && ad.similar.length > 0 && (
          <div style={{ marginTop: '20px', padding: '16px', background: '#fff' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#002f34', marginBottom: '12px' }}>
              Similar Listings in {ad.category_name}
            </h3>
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', scrollbarWidth: 'none' }}>
              {ad.similar.map((sim) => (
                <div
                  key={sim.id}
                  onClick={() => onSelectAd(sim.id)}
                  style={{ minWidth: '140px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #ebedee', overflow: 'hidden', cursor: 'pointer' }}
                >
                  <img src={sim.primary_image} alt="" style={{ width: '100%', height: '90px', objectFit: 'cover' }} />
                  <div style={{ padding: '6px 8px' }}>
                    <div style={{ fontWeight: 800, fontSize: '13px', color: '#002f34' }}>₹{Number(sim.price).toLocaleString('en-IN')}</div>
                    <div style={{ fontSize: '11px', color: '#406367', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sim.title}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Action Bar: Chat CTA */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#fff',
        borderTop: '1px solid #ebedee',
        padding: '12px 16px',
        display: 'flex',
        gap: '10px',
        zIndex: 40,
        boxShadow: '0 -2px 10px rgba(0,0,0,0.06)'
      }}>
        <button
          className="olx-btn olx-btn-chat"
          onClick={() => setEnquiryOpen(true)}
        >
          <MessageCircle size={18} />
          <span>Chat / Send Enquiry</span>
        </button>
      </div>

      {/* Enquiry Composer Drawer */}
      {enquiryOpen && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 47, 52, 0.75)',
          backdropFilter: 'blur(3px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'flex-end'
        }} onClick={() => setEnquiryOpen(false)}>
          <div style={{
            width: '100%',
            background: '#fff',
            borderRadius: '24px 24px 0 0',
            padding: '24px 20px',
            maxHeight: '80vh'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#002f34' }}>Send Enquiry to Seller</h3>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Regarding: {ad.title}</div>
              </div>
              <button onClick={() => setEnquiryOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSendEnquiry}>
              <div style={{ marginBottom: '14px' }}>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your message or counter-offer to the seller..."
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {['Is this price negotiable?', 'Can I inspect this tomorrow?', 'Is warranty/bill available?'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setMessage(preset)}
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid #e2e8f0',
                      borderRadius: '16px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      color: '#002f34',
                      cursor: 'pointer'
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="olx-btn olx-btn-primary"
                disabled={sendingEnquiry}
              >
                <Send size={16} />
                <span>{sendingEnquiry ? 'Sending...' : 'Send Message'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportOpen && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 47, 52, 0.75)',
          backdropFilter: 'blur(3px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }} onClick={() => setReportOpen(false)}>
          <div style={{
            width: '100%',
            maxWidth: '380px',
            background: '#fff',
            borderRadius: '16px',
            padding: '24px'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#dc2626' }}>Report Listing</h3>
              <button onClick={() => setReportOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReport}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#002f34', display: 'block', marginBottom: '4px' }}>Reason</label>
                <select
                  className="form-select"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                >
                  <option value="spam">Spam / Duplicate advertisement</option>
                  <option value="counterfeit">Counterfeit / Fake product</option>
                  <option value="fraud">Fraud / Advance payment scam</option>
                  <option value="offensive">Offensive / Inappropriate content</option>
                  <option value="wrong_category">Wrong category placement</option>
                  <option value="other">Other policy violation</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#002f34', display: 'block', marginBottom: '4px' }}>Additional Details</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  placeholder="Provide any details to assist our moderation team..."
                />
              </div>

              <button
                type="submit"
                className="olx-btn"
                style={{ background: '#dc2626', color: '#fff' }}
                disabled={submittingReport}
              >
                <span>{submittingReport ? 'Submitting...' : 'Submit Report'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
