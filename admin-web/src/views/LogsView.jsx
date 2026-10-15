import React, { useState, useEffect } from 'react';
import { FileText, Shield, Clock, RefreshCw } from 'lucide-react';
import { adminApi } from '../api';

export default function LogsView({ onToast }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAuditLogs();
      setLogs(res.logs || []);
    } catch (err) {
      onToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Platform Operations Audit Log</h1>
          <p>Complete traceability and accountability of all moderator decisions, listing approvals, and policy enforcements</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={fetchLogs}>
          <RefreshCw size={14} />
          <span>Refresh Audit Trail</span>
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            Loading audit records...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            No administrative actions recorded yet.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Admin Moderator</th>
                  <th>Action Type</th>
                  <th>Target Entity</th>
                  <th>Action Summary & Details</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#475569' }}>
                        <Clock size={13} color="#94a3b8" />
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Shield size={14} color="#00a49f" />
                        <span style={{ fontWeight: 600, fontSize: '13px', color: '#002f34' }}>
                          {log.admin_name}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span 
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: log.action_type.includes('reject') ? '#fee2e2' : (log.action_type.includes('approve') ? '#dcfce7' : '#f1f5f9'),
                          color: log.action_type.includes('reject') ? '#991b1b' : (log.action_type.includes('approve') ? '#166534' : '#334155')
                        }}
                      >
                        {log.action_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span style={{ textTransform: 'capitalize', fontSize: '13px', color: '#64748b' }}>
                        {log.target_entity} #{log.target_id || ''}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '13.5px', color: '#0f172a' }}>
                        {log.details}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>
                        {log.ip_address || '::1'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
