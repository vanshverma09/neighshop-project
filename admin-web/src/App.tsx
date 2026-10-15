import React, { useState, useEffect } from 'react';
import { adminApi, getAdminToken, getAdminUser, clearAdminAuth, AdminStatsResponse } from './api';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import PendingApprovalsView from './views/PendingApprovalsView';
import AdvertisementsView from './views/AdvertisementsView';
import UsersView from './views/UsersView';
import CategoriesView from './views/CategoriesView';
import ReportsView from './views/ReportsView';
import LogsView from './views/LogsView';
import BuyerPortal from './portal/BuyerPortal';
import SellerPortal from './portal/SellerPortal';
import MobileSimulator from './portal/MobileSimulator';
import { IUser } from './types/user.types';

interface Toast {
  id: number;
  message: string;
  type: 'info' | 'success' | 'error';
}

export type PortalMode = 'buyer' | 'seller' | 'admin' | 'mobile';

export default function App() {
  const [portalMode, setPortalMode] = useState<PortalMode>(() => {
    return (localStorage.getItem('neighshop_showcase_mode') as PortalMode) || 'buyer';
  });

  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const switchPortalMode = (mode: PortalMode) => {
    setPortalMode(mode);
    localStorage.setItem('neighshop_showcase_mode', mode);
  };

  const addToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const fetchStats = async () => {
    try {
      const res = await adminApi.getStats();
      setStats(res);
    } catch (err) {
      console.warn('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    const token = getAdminToken();
    const user = getAdminUser();
    if (token && user && user.role === 'admin') {
      setCurrentUser(user);
    }
    fetchStats();
  }, []);

  const handleLoginSuccess = (user: IUser) => {
    setCurrentUser(user);
    addToast(`Welcome back, ${user.name}!`, 'success');
    fetchStats();
  };

  const handleLogout = () => {
    clearAdminAuth();
    setCurrentUser(null);
    addToast('Logged out of Admin Portal.', 'info');
  };

  // Quick action from dashboard or approvals
  const handleApproveAd = async (adId: number) => {
    try {
      const res = await adminApi.updateAdStatus(adId, 'approved');
      addToast(res.message, 'success');
      fetchStats();
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  const handleRejectAd = async (adId: number, reason: string) => {
    try {
      const res = await adminApi.updateAdStatus(adId, 'rejected', reason);
      addToast(res.message, 'success');
      fetchStats();
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  const pendingCount = stats?.stats?.advertisements?.pending_ads || 0;
  const reportCount = stats?.stats?.reports?.pending_reports || 0;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ========================================================= */}
      {/* TOP UNIFIED SHOWCASE SUITE GLOBAL NAVIGATION BAR          */}
      {/* ========================================================= */}
      <header className="global-portal-bar">
        <div className="portal-brand">
          <span style={{ fontSize: '24px' }}>🏪</span>
          <div>
            <strong style={{ fontSize: '18px', letterSpacing: '-0.5px' }}>NeighShop</strong>
            <span className="portal-sub">Project Showcase Suite</span>
          </div>
        </div>

        <nav className="portal-mode-pills" aria-label="Portal Mode Switcher">
          <button
            id="portal-btn-buyer"
            className={`portal-mode-btn ${portalMode === 'buyer' ? 'active' : ''}`}
            onClick={() => switchPortalMode('buyer')}
          >
            🛍️ Buyer Marketplace
          </button>
          <button
            id="portal-btn-seller"
            className={`portal-mode-btn ${portalMode === 'seller' ? 'active' : ''}`}
            onClick={() => switchPortalMode('seller')}
          >
            💼 Seller Studio
          </button>
          <button
            id="portal-btn-admin"
            className={`portal-mode-btn ${portalMode === 'admin' ? 'active' : ''}`}
            onClick={() => switchPortalMode('admin')}
          >
            🛡️ Admin Control Panel
            {pendingCount > 0 && (
              <span
                style={{
                  marginLeft: '8px',
                  background: '#f59e0b',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '10px'
                }}
              >
                {pendingCount}
              </span>
            )}
          </button>
          <button
            id="portal-btn-mobile"
            className={`portal-mode-btn ${portalMode === 'mobile' ? 'active' : ''}`}
            onClick={() => switchPortalMode('mobile')}
            style={{
              borderColor: portalMode === 'mobile' ? '#a855f7' : undefined,
              color: portalMode === 'mobile' ? '#c084fc' : undefined
            }}
          >
            📱 Mobile App Simulator
          </button>
        </nav>

        <div className="portal-backend-status">
          <span className="live-dot" title="Live Local Server Running"></span>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#38bdf8' }}>
            Localhost 5000 API
          </span>
        </div>
      </header>

      {/* ========================================================= */}
      {/* MAIN VIEW AREA                                            */}
      {/* ========================================================= */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {portalMode === 'buyer' && (
          <BuyerPortal onShowToast={addToast} />
        )}

        {portalMode === 'seller' && (
          <SellerPortal
            onShowToast={addToast}
            onAdCreated={() => {
              fetchStats();
              addToast('New listing created and submitted for Admin moderation!', 'success');
            }}
          />
        )}

        {portalMode === 'mobile' && (
          <MobileSimulator onShowToast={addToast} />
        )}

        {portalMode === 'admin' && (
          <>
            {!currentUser ? (
              <LoginView onLoginSuccess={handleLoginSuccess} />
            ) : (
              <div className="admin-layout" style={{ flex: 1 }}>
                {/* Sidebar Navigation */}
                <Sidebar
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  pendingCount={pendingCount}
                  reportCount={reportCount}
                  onLogout={handleLogout}
                />

                {/* Main Content Area */}
                <main className="main-content">
                  <Header
                    user={currentUser}
                    pendingCount={pendingCount}
                    onOpenApprovals={() => setActiveTab('approvals')}
                  />

                  <div className="page-body">
                    {activeTab === 'dashboard' && (
                      <DashboardView
                        stats={stats}
                        onRefresh={fetchStats}
                        onNavigate={setActiveTab}
                        onApproveAd={handleApproveAd}
                        onRejectAd={handleRejectAd}
                      />
                    )}

                    {activeTab === 'approvals' && (
                      <PendingApprovalsView
                        onApprove={handleApproveAd}
                        onReject={handleRejectAd}
                        onToast={addToast}
                      />
                    )}

                    {activeTab === 'ads' && (
                      <AdvertisementsView onToast={addToast} />
                    )}

                    {activeTab === 'users' && (
                      <UsersView onToast={addToast} />
                    )}

                    {activeTab === 'categories' && (
                      <CategoriesView onToast={addToast} />
                    )}

                    {activeTab === 'reports' && (
                      <ReportsView onToast={addToast} />
                    )}

                    {activeTab === 'logs' && (
                      <LogsView onToast={addToast} />
                    )}
                  </div>
                </main>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Toast Alerts */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
