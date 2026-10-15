import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Monitor,
  User,
  Store,
  Layers,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

import { api, getCurrentUser, setAuth } from './api';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import LocationModal from './components/LocationModal';
import FilterModal from './components/FilterModal';
import AuthModal from './components/AuthModal';

import HomeScreen from './screens/HomeScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import SellScreen from './screens/SellScreen';
import MyAdsScreen from './screens/MyAdsScreen';
import ChatsScreen from './screens/ChatsScreen';
import AccountScreen from './screens/AccountScreen';

export default function App() {
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [activeTab, setActiveTab] = useState('home');
  const [selectedAdId, setSelectedAdId] = useState(null);

  // Layout Viewport mode: Phone Frame (true) or Responsive Desktop (false)
  const [isPhoneFrame, setIsPhoneFrame] = useState(true);

  // Marketplace state
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [featuredAds, setFeaturedAds] = useState([]);
  const [advertisements, setAdvertisements] = useState([]);
  const [loadingAds, setLoadingAds] = useState(true);

  // Filter & Search
  const [currentCity, setCurrentCity] = useState('Mumbai');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    sort: 'newest',
    condition: '',
    minPrice: '',
    maxPrice: ''
  });

  // Modals
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Global Toast
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  // Fetch Categories
  const fetchCategories = async () => {
    try {
      const res = await api.getCategories();
      setCategories(res.categories || []);
    } catch (err) {
      console.warn('Failed to fetch categories:', err);
    }
  };

  // Fetch Featured Ads
  const fetchFeatured = async () => {
    try {
      const res = await api.getFeaturedAds();
      setFeaturedAds(res.featured || []);
    } catch {
      // ignore
    }
  };

  // Fetch Ads with current filters
  const fetchAds = async () => {
    setLoadingAds(true);
    try {
      const params = {
        city: currentCity !== 'All India' ? currentCity : undefined,
        search: searchTerm || undefined,
        categoryId: selectedCategory || undefined,
        sort: filters.sort || 'newest',
        condition: filters.condition || undefined,
        minPrice: filters.minPrice || undefined,
        maxPrice: filters.maxPrice || undefined
      };
      const res = await api.getAdvertisements(params);
      setAdvertisements(res.advertisements || []);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoadingAds(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchFeatured();
  }, []);

  useEffect(() => {
    fetchAds();
  }, [currentCity, selectedCategory, filters]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAds();
  };

  // Wishlist toggle
  const handleToggleWishlist = async (adId) => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }

    try {
      const res = await api.toggleWishlist(adId);
      // Optimistic update
      setAdvertisements(prev => prev.map(a => a.id === adId ? { ...a, is_favourited: res.is_favourited } : a));
      addToast(res.message, 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Switch perspective between Buyer & Seller for assessment demonstration
  const handleSwitchToBuyerDemo = async () => {
    try {
      const res = await api.login('buyer@neighshop.com', 'Buyer@123');
      setAuth(res.token, res.user);
      setCurrentUser(res.user);
      addToast('Switched to Buyer Demo (Priya Sharma)', 'success');
      fetchAds();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleSwitchToSellerDemo = async () => {
    try {
      const res = await api.login('seller@neighshop.com', 'Seller@123');
      setAuth(res.token, res.user);
      setCurrentUser(res.user);
      addToast('Switched to Seller Demo (Vansh Verma)', 'success');
      fetchAds();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const activeFilterCount = (filters.condition ? 1 : 0) + (filters.minPrice || filters.maxPrice ? 1 : 0) + (filters.sort !== 'newest' ? 1 : 0);

  return (
    <div className="simulator-wrapper">
      {/* Top Simulator Control Bar */}
      <div className="simulator-toolbar">
        <div className="simulator-brand">
          <h1>NeighShop OLX Marketplace</h1>
          <span>{currentUser ? (currentUser.role === 'seller' ? 'SELLER APP' : 'USER APP') : 'GUEST'}</span>
        </div>

        {/* Perspective Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={handleSwitchToBuyerDemo}
            style={{
              background: currentUser?.email === 'buyer@neighshop.com' ? '#ffce32' : 'rgba(255,255,255,0.15)',
              color: currentUser?.email === 'buyer@neighshop.com' ? '#002f34' : '#fff',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Buyer App (Priya)
          </button>

          <button
            onClick={handleSwitchToSellerDemo}
            style={{
              background: currentUser?.email === 'seller@neighshop.com' ? '#ffce32' : 'rgba(255,255,255,0.15)',
              color: currentUser?.email === 'seller@neighshop.com' ? '#002f34' : '#fff',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Seller App (Vansh)
          </button>

          {/* Viewport toggle */}
          <button
            onClick={() => setIsPhoneFrame(!isPhoneFrame)}
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Toggle between Mobile Phone Simulator and Responsive Desktop Layout"
          >
            {isPhoneFrame ? <Monitor size={14} /> : <Smartphone size={14} />}
            <span>{isPhoneFrame ? 'Desktop Mode' : 'Phone Mode'}</span>
          </button>

          {/* Link to Admin Panel */}
          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noreferrer"
            style={{
              background: '#00a49f',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: 800,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>Admin Panel</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Device Frame */}
      <div className={`device-frame ${!isPhoneFrame ? 'desktop-mode' : ''}`}>
        {/* Phone Status Bar (Visible in phone simulator mode) */}
        {isPhoneFrame && (
          <div className="phone-status-bar">
            <span>9:41</span>
            <div style={{ width: '90px', height: '14px', background: '#000', borderRadius: '10px' }} />
            <span>5G  100%</span>
          </div>
        )}

        {/* Main Application Container */}
        <div className="app-container">
          {/* Header */}
          <Header
            currentCity={currentCity}
            onOpenLocation={() => setLocationModalOpen(true)}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onSearchSubmit={handleSearchSubmit}
            onOpenFilter={() => setFilterModalOpen(true)}
            activeFilterCount={activeFilterCount}
          />

          {/* Active Screen Rendering */}
          <div style={{ flex: 1 }}>
            {activeTab === 'home' && (
              <HomeScreen
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                featuredAds={featuredAds}
                advertisements={advertisements}
                loading={loadingAds}
                onSelectAd={(id) => setSelectedAdId(id)}
                onToggleWishlist={handleToggleWishlist}
                onOpenSell={() => setActiveTab('sell')}
              />
            )}

            {activeTab === 'chats' && (
              <ChatsScreen
                onRequireAuth={() => setAuthModalOpen(true)}
                onToast={addToast}
              />
            )}

            {activeTab === 'sell' && (
              <SellScreen
                categories={categories}
                onAdCreated={() => {
                  fetchAds();
                  setActiveTab('myads');
                }}
                onRequireAuth={() => setAuthModalOpen(true)}
                onToast={addToast}
              />
            )}

            {activeTab === 'myads' && (
              <MyAdsScreen
                onOpenSell={() => setActiveTab('sell')}
                onSelectAd={(id) => setSelectedAdId(id)}
                onRequireAuth={() => setAuthModalOpen(true)}
                onToast={addToast}
              />
            )}

            {activeTab === 'account' && (
              <AccountScreen
                onRequireAuth={() => setAuthModalOpen(true)}
                onSelectAd={(id) => setSelectedAdId(id)}
                onToast={addToast}
              />
            )}
          </div>

          {/* Bottom 5-Tab Navigation Bar */}
          <BottomNav
            activeTab={activeTab}
            setActiveTab={(tab) => {
              setActiveTab(tab);
              setSelectedAdId(null);
            }}
            isSeller={currentUser?.role === 'seller'}
          />

          {/* Full Screen Product Detail Overlay (When an item is clicked) */}
          {selectedAdId !== null && (
            <ProductDetailScreen
              adId={selectedAdId}
              onBack={() => setSelectedAdId(null)}
              onSelectAd={(id) => setSelectedAdId(id)}
              onToggleWishlist={handleToggleWishlist}
              onRequireAuth={() => setAuthModalOpen(true)}
              onToast={addToast}
            />
          )}

          {/* Location Picker Modal */}
          <LocationModal
            isOpen={locationModalOpen}
            onClose={() => setLocationModalOpen(false)}
            currentCity={currentCity}
            onSelectCity={setCurrentCity}
          />

          {/* Filter Modal */}
          <FilterModal
            isOpen={filterModalOpen}
            onClose={() => setFilterModalOpen(false)}
            filters={filters}
            onApplyFilters={setFilters}
            onResetFilters={() => setFilters({ sort: 'newest', condition: '', minPrice: '', maxPrice: '' })}
          />

          {/* Auth Modal */}
          <AuthModal
            isOpen={authModalOpen}
            onClose={() => setAuthModalOpen(false)}
            onAuthSuccess={(user) => {
              setCurrentUser(user);
              addToast(`Signed in as ${user.name}!`, 'success');
              fetchAds();
            }}
          />
        </div>
      </div>

      {/* Floating Toast Alerts */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>{t.message}</div>
        ))}
      </div>
    </div>
  );
}
