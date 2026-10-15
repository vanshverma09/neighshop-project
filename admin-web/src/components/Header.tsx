import React from 'react';
import { Search, Bell, ShieldCheck } from 'lucide-react';
import { IUser } from '../types/user.types';

interface HeaderProps {
  user: IUser | null;
  pendingCount: number;
  onOpenApprovals: () => void;
}

export default function Header({ user, pendingCount, onOpenApprovals }: HeaderProps) {
  return (
    <header className="top-header">
      <div className="header-search">
        <Search size={16} color="#64748b" />
        <input type="text" placeholder="Search across listings, users, categories..." />
      </div>

      <div className="header-actions">
        {pendingCount > 0 && (
          <button 
            className="btn btn-outline btn-sm" 
            style={{ color: '#b45309', borderColor: '#fde68a', background: '#fffbeb' }}
            onClick={onOpenApprovals}
          >
            <Bell size={14} />
            <span>{pendingCount} Awaiting Review</span>
          </button>
        )}

        <div className="admin-profile-pill">
          <img
            src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
            alt="Admin Avatar"
            className="admin-avatar"
          />
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#002f34' }}>
              {user?.name || 'Admin Moderator'}
            </div>
            <div style={{ fontSize: '11px', color: '#00a49f', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
              <ShieldCheck size={12} />
              <span>Verified Superadmin</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
