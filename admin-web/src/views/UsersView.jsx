import React, { useState, useEffect } from 'react';
import { Search, UserCheck, UserX, Shield, Store, Star } from 'lucide-react';
import { adminApi } from '../api';

export default function UsersView({ onToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers({
        search: search || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
      setUsers(res.users || []);
    } catch (err) {
      onToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    const confirmMsg = `Are you sure you want to ${newStatus === 'suspended' ? 'SUSPEND' : 'ACTIVATE'} ${user.name}'s account?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await adminApi.updateUserStatus(user.id, newStatus);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
      onToast(res.message, 'success');
    } catch (err) {
      onToast(err.message, 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>User & Seller Account Moderation</h1>
          <p>Review registered accounts, investigate reported sellers, and manage account authorization</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '18px 24px', marginBottom: '20px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '240px', display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0 12px' }}>
            <Search size={16} color="#64748b" />
            <input
              type="text"
              placeholder="Search by user name, email, or phone number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', padding: '10px', width: '100%', fontSize: '13.5px' }}
            />
          </div>

          <div style={{ width: '160px' }}>
            <select
              className="form-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="seller">Sellers Only</option>
              <option value="buyer">Buyers Only</option>
              <option value="admin">Administrators</option>
            </select>
          </div>

          <div style={{ width: '160px' }}>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '50px', textAlign: 'center', color: '#64748b' }}>
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '50px', textAlign: 'center', color: '#64748b' }}>
            No accounts match your query.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>User Profile</th>
                  <th>Role</th>
                  <th>Store / Business Details</th>
                  <th>Contact Info</th>
                  <th>Listings</th>
                  <th>Account Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={u.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                          alt={u.name}
                          style={{ width: '40px', height: '40px', borderRadius: '999px', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, color: '#002f34' }}>{u.name}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span 
                        style={{
                          textTransform: 'uppercase',
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: u.role === 'admin' ? '#f3e8ff' : (u.role === 'seller' ? '#e0f2fe' : '#f1f5f9'),
                          color: u.role === 'admin' ? '#7e22ce' : (u.role === 'seller' ? '#0369a1' : '#475569')
                        }}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td>
                      {u.business_name ? (
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '13px', color: '#002f34' }}>
                            {u.business_name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Star size={11} fill="#16a34a" />
                            <span>{u.rating || '5.0'} Rating • {u.total_sales || 0} Deals</span>
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>Individual Buyer</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '13px', color: '#475569' }}>
                        {u.phone || 'Not provided'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, fontSize: '13px' }}>
                        {u.total_ads || 0} ads
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${u.status}`}>
                        {u.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {u.role !== 'admin' && (
                        <button
                          className={`btn btn-sm ${u.status === 'active' ? 'btn-danger' : 'btn-success'}`}
                          onClick={() => handleToggleStatus(u)}
                          title={u.status === 'active' ? 'Suspend Account' : 'Activate Account'}
                        >
                          {u.status === 'active' ? (
                            <>
                              <UserX size={14} />
                              <span>Suspend</span>
                            </>
                          ) : (
                            <>
                              <UserCheck size={14} />
                              <span>Activate</span>
                            </>
                          )}
                        </button>
                      )}
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
