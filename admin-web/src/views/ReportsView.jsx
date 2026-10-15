import React, { useState, useEffect } from 'react';
import { Flag, ShieldCheck, Trash2, CheckCircle, AlertTriangle, MessageSquare } from 'lucide-react';
import { adminApi } from '../api';
import Modal from '../components/Modal';

export default function ReportsView({ onToast }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionModal, setActionModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [takeDownAd, setTakeDownAd] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getReports(statusFilter);
      setReports(res.reports || []);
    } catch (err) {
      onToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const openActionModal = (report) => {
    setSelectedReport(report);
    setAdminNotes(report.admin_notes || '');
    setTakeDownAd(false);
    setActionModal(true);
  };

  const handleResolve = async (newStatus) => {
    if (!selectedReport) return;

    try {
      const res = await adminApi.updateReportStatus(selectedReport.id, {
        status: newStatus,
        admin_notes: adminNotes,
        takeDownAd: takeDownAd
      });

      onToast(res.message, 'success');
      setActionModal(false);
      setSelectedReport(null);
      fetchReports();
    } catch (err) {
      onToast(err.message, 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Listing Reports & Safety Complaints</h1>
          <p>Investigate buyer complaints, enforce community trust standards, and take down policy-violating listings</p>
        </div>

        <div style={{ width: '180px' }}>
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Reports</option>
            <option value="pending">Pending Investigation</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            Loading complaints...
          </div>
        ) : reports.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <CheckCircle size={40} color="#16a34a" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#002f34' }}>
              No Reports Filed
            </h3>
            <p style={{ color: '#64748b', fontSize: '13.5px', marginTop: '4px' }}>
              Marketplace community trust is spotless! No open complaints matching current filter.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Reported Listing</th>
                  <th>Violation Type</th>
                  <th>Complainant</th>
                  <th>Seller</th>
                  <th>Report Status</th>
                  <th>Date Filed</th>
                  <th style={{ textAlign: 'right' }}>Investigation</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={r.ad_image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=100'}
                          alt={r.ad_title}
                          style={{ width: '44px', height: '44px', borderRadius: '6px', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, color: '#002f34', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {r.ad_title}
                          </div>
                          <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: 600 }}>
                            {r.ad_status === 'rejected' ? 'Currently Suspended' : 'Live on Site'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span 
                        style={{
                          textTransform: 'uppercase',
                          fontWeight: 800,
                          fontSize: '11px',
                          color: '#b91c1c',
                          background: '#fee2e2',
                          padding: '3px 8px',
                          borderRadius: '4px'
                        }}
                      >
                        {r.reason.replace('_', ' ')}
                      </span>
                      {r.description && (
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', maxWidth: '220px' }}>
                          "{r.description}"
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: '13px', color: '#002f34' }}>{r.reporter_name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{r.reporter_email}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: '13px', color: '#002f34' }}>{r.seller_name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{r.seller_email}</div>
                    </td>
                    <td>
                      <span className={`status-pill ${r.status === 'resolved' ? 'approved' : (r.status === 'dismissed' ? 'sold' : 'pending')}`}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => openActionModal(r)}
                      >
                        Take Action
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action / Resolution Modal */}
      <Modal
        isOpen={actionModal}
        onClose={() => setActionModal(false)}
        title="Investigate & Resolve Complaint"
        footer={(
          <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'space-between' }}>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => handleResolve('dismissed')}
            >
              Dismiss (No Violation)
            </button>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => handleResolve('under_review')}
              >
                Mark Under Review
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleResolve('resolved')}
              >
                Resolve & Enforce
              </button>
            </div>
          </div>
        )}
      >
        {selectedReport && (
          <div>
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontWeight: 700, color: '#002f34' }}>{selectedReport.ad_title}</span>
                <span style={{ fontWeight: 800, color: '#dc2626' }}>Reason: {selectedReport.reason}</span>
              </div>
              <p style={{ fontSize: '13px', color: '#475569', fontStyle: 'italic' }}>
                Complainant note: "{selectedReport.description || 'No additional note provided'}"
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Internal Moderator Notes</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Log internal findings, verification results, or warning communications..."
              />
            </div>

            <div style={{
              background: '#fef2f2',
              border: '1px solid #fee2e2',
              padding: '12px 14px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <input
                type="checkbox"
                id="takeDownCheckbox"
                checked={takeDownAd}
                onChange={(e) => setTakeDownAd(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#dc2626' }}
              />
              <label htmlFor="takeDownCheckbox" style={{ fontSize: '13px', fontWeight: 600, color: '#991b1b', cursor: 'pointer' }}>
                Immediately remove and suspend this advertisement from the marketplace
              </label>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
