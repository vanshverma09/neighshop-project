import React, { useState } from 'react';
import {
  Users,
  Store,
  Package,
  Clock,
  Flag,
  MessageSquare,
  CheckCircle,
  XCircle,
  ArrowRight,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';
import Modal from '../components/Modal';

export default function DashboardView({ stats, onRefresh, onNavigate, onApproveAd, onRejectAd }) {
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedAdForReject, setSelectedAdForReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const usersCount = stats?.users?.total_users || 0;
  const sellersCount = stats?.users?.total_sellers || 0;
  const totalAds = stats?.advertisements?.total_ads || 0;
  const pendingAds = stats?.advertisements?.pending_ads || 0;
  const approvedAds = stats?.advertisements?.approved_ads || 0;
  const openReports = stats?.reports?.pending_reports || 0;
  const totalEnquiries = stats?.enquiriesCount || 0;

  const handleOpenReject = (ad) => {
    setSelectedAdForReject(ad);
    setRejectionReason('Policy violation: Description or images do not adhere to classified standards.');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = () => {
    if (selectedAdForReject && rejectionReason) {
      onRejectAd(selectedAdForReject.id, rejectionReason);
      setRejectModalOpen(false);
      setSelectedAdForReject(null);
    }
  };

  return (
    <div>
      {/* Page Title */}
      <div className="page-header">
        <div className="page-title">
          <h1>Platform Operations Dashboard</h1>
          <p>Real-time analytics, listing approval queues, and system activities</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={onRefresh}>
          Refresh Metrics
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div>
            <div className="stat-label">Total Users</div>
            <div className="stat-val">{usersCount}</div>
            <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '4px', fontWeight: 600 }}>
              {sellersCount} Registered Sellers
            </div>
          </div>
          <div className="stat-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <Users size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Active Advertisements</div>
            <div className="stat-val">{approvedAds}</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              Out of {totalAds} total listings
            </div>
          </div>
          <div className="stat-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
            <Package size={24} />
          </div>
        </div>

        <div 
          className="stat-card" 
          style={{ 
            borderColor: pendingAds > 0 ? '#fde68a' : 'inherit', 
            background: pendingAds > 0 ? '#fffdf5' : '#fff',
            cursor: 'pointer'
          }}
          onClick={() => onNavigate('approvals')}
        >
          <div>
            <div className="stat-label" style={{ color: pendingAds > 0 ? '#b45309' : 'inherit' }}>
              Pending Approvals
            </div>
            <div className="stat-val" style={{ color: pendingAds > 0 ? '#d97706' : 'inherit' }}>
              {pendingAds}
            </div>
            <div style={{ fontSize: '11px', color: '#d97706', marginTop: '4px', fontWeight: 600 }}>
              Action required
            </div>
          </div>
          <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            <Clock size={24} />
          </div>
        </div>

        <div 
          className="stat-card"
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigate('reports')}
        >
          <div>
            <div className="stat-label">Open Complaints</div>
            <div className="stat-val" style={{ color: openReports > 0 ? '#dc2626' : 'inherit' }}>
              {openReports}
            </div>
            <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px', fontWeight: 600 }}>
              Safety reports
            </div>
          </div>
          <div className="stat-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
            <Flag size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Buyer Enquiries</div>
            <div className="stat-val">{totalEnquiries}</div>
            <div style={{ fontSize: '11px', color: '#00a49f', marginTop: '4px', fontWeight: 600 }}>
              Active communications
            </div>
          </div>
          <div className="stat-icon" style={{ background: '#e6f7f6', color: '#00a49f' }}>
            <MessageSquare size={24} />
          </div>
        </div>
      </div>

      {/* Pending Approvals Quick Moderation Panel */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={18} color="#d97706" />
            <span className="card-title">Pending Moderation Queue</span>
            {pendingAds > 0 && (
              <span className="status-pill pending" style={{ marginLeft: '6px' }}>
                {pendingAds} Waiting
              </span>
            )}
          </div>
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => onNavigate('approvals')}
          >
            <span>View All in Full Screen</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {stats?.recentPending && stats.recentPending.length > 0 ? (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th>Category</th>
                  <th>Seller</th>
                  <th>Price</th>
                  <th>Location</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentPending.map((ad) => (
                  <tr key={ad.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={ad.primary_image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=100'}
                          alt={ad.title}
                          style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0' }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '14px', color: '#002f34', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {ad.title}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            Listing #{ad.id} • Posted recently
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: 500 }}>
                        {ad.category_name}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: '#002f34' }}>
                        {ad.seller_name}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#002f34', fontSize: '14px' }}>
                        ₹{Number(ad.price).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {ad.location || ad.city}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => onApproveAd(ad.id)}
                          title="Approve Listing"
                        >
                          <CheckCircle size={14} />
                          <span>Approve</span>
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleOpenReject(ad)}
                          title="Reject Listing"
                        >
                          <XCircle size={14} />
                          <span>Reject</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <CheckCircle size={36} color="#16a34a" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ color: '#002f34', fontWeight: 700 }}>Approval Queue Clear!</h4>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>
              All submitted classified advertisements have been reviewed and moderated.
            </p>
          </div>
        )}
      </div>

      {/* Two-Column: Category Breakdown & Recent Reports */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        {/* Category Breakdown */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <span className="card-title">Category Distribution</span>
            <TrendingUp size={16} color="#00a49f" />
          </div>
          <div style={{ padding: '20px' }}>
            {stats?.categoryBreakdown && stats.categoryBreakdown.map((cat, idx) => {
              const pct = totalAds > 0 ? Math.round((cat.ad_count / totalAds) * 100) : 0;
              return (
                <div key={idx} style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                    <span style={{ fontWeight: 600, color: '#002f34' }}>{cat.name}</span>
                    <span style={{ color: '#64748b' }}>{cat.ad_count} ads ({pct}%)</span>
                  </div>
                  <div style={{ height: '7px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: 'linear-gradient(90deg, #002f34, #00a49f)',
                      borderRadius: '10px'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Reports */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <span className="card-title">Recent Flagged Reports</span>
            <button className="btn btn-outline btn-sm" onClick={() => onNavigate('reports')}>
              <span>View All</span>
            </button>
          </div>
          <div style={{ padding: '12px 20px' }}>
            {stats?.recentReports && stats.recentReports.length > 0 ? (
              stats.recentReports.map((rep) => (
                <div key={rep.id} style={{ padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#002f34' }}>
                      {rep.ad_title}
                    </span>
                    <span className={`status-pill ${rep.status === 'resolved' ? 'approved' : 'rejected'}`}>
                      {rep.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#e11d48', marginTop: '3px', fontWeight: 600 }}>
                    Reason: {rep.reason.toUpperCase()}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Reported by {rep.reporter_name}
                  </div>
                </div>
              ))
            ) : (
              <p style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                No active complaints filed.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Advertisement Listing"
        footer={(
          <>
            <button className="btn btn-outline" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={handleConfirmReject}>
              Confirm Rejection
            </button>
          </>
        )}
      >
        <div>
          <p style={{ fontSize: '13.5px', color: '#475569', marginBottom: '16px' }}>
            Please state the official reason for rejecting: <strong>"{selectedAdForReject?.title}"</strong>.
            This reason will be displayed in the seller’s dashboard so they can rectify their advertisement.
          </p>

          <div className="form-group">
            <label className="form-label">Rejection Reason</label>
            <textarea
              className="form-textarea"
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain why this listing violates marketplace rules..."
              required
            />
          </div>

          <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span>Common presets:</span>
            <span 
              style={{ color: '#00a49f', cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => setRejectionReason('Policy violation: Counterfeit, replica, or prohibited goods are strictly disallowed.')}
            >
              • Counterfeit / prohibited product
            </span>
            <span 
              style={{ color: '#00a49f', cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => setRejectionReason('Low photo quality: Please upload clear, original photographs of the physical item.')}
            >
              • Low quality or stock images
            </span>
            <span 
              style={{ color: '#00a49f', cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => setRejectionReason('Pricing error: Stated price appears misleading or drastically unrealistic.')}
            >
              • Misleading pricing
            </span>
          </div>
        </div>
      </Modal>
    </div>
  );
}
