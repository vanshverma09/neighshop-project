import React, { useState, useEffect } from 'react';
import { adminApi, getAdminToken, getAdminUser, clearAdminAuth } from './api';
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

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
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
      fetchStats();
    }
  }, []);

  const handleLoginSuccess = (user) => {
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
  const handleApproveAd = async (adId) => {
    try {
      const res = await adminApi.updateAdStatus(adId, 'approved');
      addToast(res.message, 'success');
      fetchStats();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleRejectAd = async (adId, reason) => {
    try {
      const res = await adminApi.updateAdStatus(adId, 'rejected', reason);
      addToast(res.message, 'success');
      fetchStats();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  if (!currentUser) {
    return (
      <>
        <LoginView onLoginSuccess={handleLoginSuccess} />
        {/* Toast Container */}
        <div className="toast-container">
          {toasts.map(t => (
            <div key={t.id} className={`toast ${t.type}`}>{t.message}</div>
          ))}
        </div>
      </>
    );
  }

  const pendingCount = stats?.advertisements?.pending_ads || 0;
  const reportCount = stats?.reports?.pending_reports || 0;

  return (
    <div className="admin-layout">
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

      {/* Floating Toast Alerts */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>{t.message}</div>
        ))}
      </div>
    </div>
  );
}
