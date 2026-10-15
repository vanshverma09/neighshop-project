import React from 'react';
import { Home, MessageCircle, Plus, FileText, User } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab, unreadChats = 0, isSeller = false }) {
  return (
    <nav className="bottom-nav">
      {/* 1. Home */}
      <button
        className={`bottom-tab ${activeTab === 'home' ? 'active' : ''}`}
        onClick={() => setActiveTab('home')}
      >
        <Home size={22} />
        <span>HOME</span>
      </button>

      {/* 2. Chats */}
      <button
        className={`bottom-tab ${activeTab === 'chats' ? 'active' : ''}`}
        onClick={() => setActiveTab('chats')}
      >
        <div style={{ position: 'relative' }}>
          <MessageCircle size={22} />
          {unreadChats > 0 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-6px',
              background: '#ef4444',
              color: '#fff',
              fontSize: '9px',
              fontWeight: 800,
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {unreadChats}
            </span>
          )}
        </div>
        <span>CHATS</span>
      </button>

      {/* 3. The Iconic OLX Circular SELL Button */}
      <button
        className="sell-tab-btn"
        onClick={() => setActiveTab('sell')}
        title="Post an Advertisement"
      >
        <Plus size={26} strokeWidth={3} />
      </button>

      {/* 4. My Ads */}
      <button
        className={`bottom-tab ${activeTab === 'myads' ? 'active' : ''}`}
        onClick={() => setActiveTab('myads')}
      >
        <FileText size={22} />
        <span>MY ADS</span>
      </button>

      {/* 5. Account */}
      <button
        className={`bottom-tab ${activeTab === 'account' ? 'active' : ''}`}
        onClick={() => setActiveTab('account')}
      >
        <User size={22} />
        <span>ACCOUNT</span>
      </button>
    </nav>
  );
}
