import React from 'react';
import {
  LayoutDashboard,
  ShieldAlert,
  Package,
  Users,
  Layers,
  Flag,
  FileText,
  LogOut,
  Store
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, pendingCount, reportCount, onLogout }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'approvals', label: 'Pending Approvals', icon: ShieldAlert, badge: pendingCount, badgeColor: 'badge-amber' },
    { id: 'ads', label: 'All Advertisements', icon: Package },
    { id: 'users', label: 'User & Seller Accounts', icon: Users },
    { id: 'categories', label: 'Categories & Taxonomy', icon: Layers },
    { id: 'reports', label: 'Reports & Flagged Ads', icon: Flag, badge: reportCount, badgeColor: 'badge-rose' },
    { id: 'logs', label: 'Platform Audit Logs', icon: FileText }
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-badge">NS</div>
        <div className="brand-text">
          <h2>NeighShop</h2>
          <span>Admin Portal</span>
        </div>
      </div>

      {/* Nav Section */}
      <nav className="sidebar-nav">
        <div className="nav-section-title">Marketplace Control</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <div
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className={`badge ${item.badgeColor || 'badge-amber'}`}>
                  {item.badge}
                </span>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div
          className="nav-item"
          style={{ color: '#f87171' }}
          onClick={onLogout}
        >
          <LogOut size={18} />
          <span>Exit Admin Portal</span>
        </div>
      </div>
    </aside>
  );
}
