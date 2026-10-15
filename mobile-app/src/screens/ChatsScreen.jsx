import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, CheckCircle, Clock, Store, User } from 'lucide-react';
import { api, getCurrentUser } from '../api';

export default function ChatsScreen({ onRequireAuth, onToast }) {
  const currentUser = getCurrentUser();
  const [activeTab, setActiveTab] = useState('buyer'); // 'buyer' or 'seller'
  const [buyerEnquiries, setBuyerEnquiries] = useState([]);
  const [sellerEnquiries, setSellerEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reply state
  const [activeEnquiry, setActiveEnquiry] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const fetchEnquiries = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [buyerRes, sellerRes] = await Promise.all([
        api.getBuyerEnquiries().catch(() => ({ enquiries: [] })),
        api.getSellerEnquiries().catch(() => ({ enquiries: [] }))
      ]);
      setBuyerEnquiries(buyerRes.enquiries || []);
      setSellerEnquiries(sellerRes.enquiries || []);
    } catch (err) {
      onToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchEnquiries();
    }
  }, [currentUser]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!activeEnquiry || !replyText.trim()) return;

    setSendingReply(true);
    try {
      const res = await api.replyEnquiry(activeEnquiry.id, replyText.trim());
      onToast(res.message, 'success');
      setActiveEnquiry(null);
      setReplyText('');
      fetchEnquiries();
    } catch (err) {
      onToast(err.message, 'error');
    } finally {
      setSendingReply(false);
    }
  };

  if (!currentUser) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', background: '#fff', minHeight: '100%' }}>
        <MessageCircle size={44} color="#00a49f" style={{ margin: '0 auto 12px' }} />
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#002f34' }}>Your Marketplace Chats</h3>
        <p style={{ color: '#64748b', fontSize: '13px', marginTop: '6px', marginBottom: '20px' }}>
          Sign in to communicate securely with buyers and sellers in your neighborhood.
        </p>
        <button className="olx-btn olx-btn-primary" onClick={onRequireAuth}>
          Sign In
        </button>
      </div>
    );
  }

  const list = activeTab === 'buyer' ? buyerEnquiries : sellerEnquiries;

  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{ background: '#002f34', color: '#fff', padding: '16px 16px 12px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 800 }}>Buyer–Seller Enquiries</h1>
        <p style={{ fontSize: '12px', color: '#7dd3c8', marginTop: '2px' }}>
          Negotiate deals and arrange local pickups
        </p>

        {/* Tab switch */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
          <button
            onClick={() => setActiveTab('buyer')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '20px',
              border: 'none',
              background: activeTab === 'buyer' ? '#ffce32' : 'rgba(255,255,255,0.12)',
              color: activeTab === 'buyer' ? '#002f34' : '#fff',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            My Sent Enquiries ({buyerEnquiries.length})
          </button>
          <button
            onClick={() => setActiveTab('seller')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '20px',
              border: 'none',
              background: activeTab === 'seller' ? '#ffce32' : 'rgba(255,255,255,0.12)',
              color: activeTab === 'seller' ? '#002f34' : '#fff',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Received as Seller ({sellerEnquiries.length})
          </button>
        </div>
      </div>

      <div style={{ padding: '16px 12px' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
            Loading conversations...
          </div>
        ) : list.length === 0 ? (
          <div style={{ padding: '50px 20px', textAlign: 'center', background: '#fff', borderRadius: '8px', border: '1px solid #ebedee' }}>
            <MessageCircle size={40} color="#00a49f" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#002f34' }}>
              {activeTab === 'buyer' ? 'No Enquiries Sent Yet' : 'No Buyer Enquiries Received Yet'}
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748b', marginTop: '4px' }}>
              {activeTab === 'buyer'
                ? 'Send a quick message on any active classified listing to negotiate or ask questions.'
                : 'Buyer inquiries on your active advertisements will appear right here.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {list.map((enq) => (
              <div
                key={enq.id}
                style={{
                  background: '#fff',
                  borderRadius: '8px',
                  border: '1px solid #ebedee',
                  padding: '14px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                {/* Header with thumbnail */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                  <img
                    src={enq.ad_image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=100'}
                    alt={enq.ad_title}
                    style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#002f34', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {enq.ad_title}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      {activeTab === 'buyer' ? `Seller: ${enq.seller_name}` : `Buyer: ${enq.buyer_name}`}
                    </div>
                  </div>
                  <span className={`status-pill ${enq.status === 'responded' ? 'approved' : 'pending'}`}>
                    {enq.status}
                  </span>
                </div>

                {/* Message Thread */}
                <div style={{ padding: '10px 0', fontSize: '13px' }}>
                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#00a49f', fontWeight: 700, display: 'block' }}>
                      {activeTab === 'buyer' ? 'You asked:' : `${enq.buyer_name} asked:`}
                    </span>
                    <p style={{ color: '#0f172a', marginTop: '2px' }}>{enq.message}</p>
                  </div>

                  {enq.reply ? (
                    <div style={{ background: '#e6f7f6', padding: '10px 12px', borderRadius: '8px', marginLeft: '12px' }}>
                      <span style={{ fontSize: '11px', color: '#002f34', fontWeight: 700, display: 'block' }}>
                        {activeTab === 'buyer' ? `${enq.seller_name} replied:` : 'Your response:'}
                      </span>
                      <p style={{ color: '#002f34', marginTop: '2px' }}>{enq.reply}</p>
                    </div>
                  ) : (
                    activeTab === 'seller' && (
                      <div style={{ textAlign: 'right', marginTop: '6px' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ color: '#00a49f', borderColor: '#00a49f' }}
                          onClick={() => {
                            setActiveEnquiry(enq);
                            setReplyText('');
                          }}
                        >
                          Respond to Buyer
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {activeEnquiry && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 47, 52, 0.75)',
          backdropFilter: 'blur(3px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'flex-end'
        }} onClick={() => setActiveEnquiry(null)}>
          <div style={{
            width: '100%',
            background: '#fff',
            borderRadius: '24px 24px 0 0',
            padding: '24px 20px',
            maxHeight: '75vh'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#002f34' }}>Respond to {activeEnquiry.buyer_name}</h3>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Regarding: {activeEnquiry.ad_title}</div>
              </div>
              <button onClick={() => setActiveEnquiry(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSendReply}>
              <div style={{ marginBottom: '16px' }}>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your response to the buyer..."
                  required
                />
              </div>

              <button
                type="submit"
                className="olx-btn olx-btn-primary"
                disabled={sendingReply}
              >
                <Send size={16} />
                <span>{sendingReply ? 'Sending...' : 'Send Response'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
