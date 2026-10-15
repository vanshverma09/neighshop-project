import React, { useState, useEffect } from 'react';
import {
  User,
  Heart,
  Store,
  Shield,
  LogOut,
  ArrowRight,
  Phone,
  Mail,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { api, getCurrentUser, clearAuth, setAuth } from '../api';

export default function AccountScreen({ onRequireAuth, onSelectAd, onToast }) {
  const [user, setUser] = useState(getCurrentUser());
  const [profileData, setProfileData] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const res = await api.getProfile();
      setProfileData(res);
      setUser(res.user);
      setAuth(localStorage.getItem('mobile_token'), res.user);
    } catch {
      // ignore
    }
  };

  const fetchWishlist = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.getWishlist();
      setWishlist(res.wishlist || []);
    } catch (err) {
      onToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchWishlist();
    }
  }, [user?.id]);

  const handleRoleSwitch = async () => {
    if (!user) return;
    const newRole = user.role === 'seller' ? 'buyer' : 'seller';
    try {
      const res = await api.switchRole(newRole);
      setAuth(res.token, { ...user, role: newRole });
      setUser(prev => ({ ...prev, role: newRole }));
      onToast(`Mode switched to ${newRole.toUpperCase()}!`, 'success');
      fetchProfile();
    } catch (err) {
      onToast(err.message, 'error');
    }
  };

  const handleRemoveFav = async (adId) => {
    try {
      await api.toggleWishlist(adId);
      setWishlist(prev => prev.filter(w => w.id !== adId));
      onToast('Removed from favourites', 'info');
    } catch (err) {
      onToast(err.message, 'error');
    }
  };

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    setProfileData(null);
    onToast('Logged out successfully', 'info');
  };

  if (!user) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', background: '#fff', minHeight: '100%' }}>
        <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#f0f7f7', color: '#00a49f', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <User size={34} />
        </div>
        <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#002f34' }}>Welcome to NeighShop</h3>
        <p style={{ color: '#64748b', fontSize: '13.5px', marginTop: '6px', marginBottom: '24px', lineHeight: 1.5 }}>
          Create an account or sign in to track favorite listings, manage your ads, and communicate with buyers.
        </p>
        <button className="olx-btn olx-btn-primary" onClick={onRequireAuth}>
          Log In or Register
        </button>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '80px', background: '#f2f4f5', minHeight: '100%' }}>
      {/* Profile Header */}
      <div style={{ background: '#002f34', color: '#fff', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img
            src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
            alt={user.name}
            style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #ffce32' }}
          />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800 }}>{user.name}</h2>
            <div style={{ fontSize: '12px', color: '#7dd3c8', marginTop: '2px' }}>{user.email}</div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              background: user.role === 'seller' ? '#ffce32' : 'rgba(255,255,255,0.15)',
              color: user.role === 'seller' ? '#002f34' : '#fff',
              fontSize: '10.5px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '12px',
              marginTop: '6px',
              textTransform: 'uppercase'
            }}>
              <span>Current Mode: {user.role}</span>
            </div>
          </div>
        </div>

        {/* Quick Role Switch Banner */}
        <div style={{
          marginTop: '18px',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '8px',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700 }}>
              {user.role === 'seller' ? 'Switch to Buyer Experience' : 'Activate Seller Mode'}
            </div>
            <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
              {user.role === 'seller' ? 'Browse and save listings as a buyer' : 'Publish and manage advertisements'}
            </div>
          </div>
          <button
            onClick={handleRoleSwitch}
            style={{
              background: '#ffce32',
              color: '#002f34',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              fontSize: '11.5px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Switch
          </button>
        </div>
      </div>

      {/* Menu Sections */}
      <div style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Wishlist Accordion */}
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #ebedee', overflow: 'hidden' }}>
          <div
            onClick={() => setWishlistOpen(!wishlistOpen)}
            style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Heart size={20} color="#ef4444" fill={wishlist.length > 0 ? '#ef4444' : 'none'} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#002f34' }}>
                  My Saved Favourites
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                  {wishlist.length} saved classifieds
                </div>
              </div>
            </div>
            <ArrowRight size={16} color="#64748b" style={{ transform: wishlistOpen ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />
          </div>

          {wishlistOpen && (
            <div style={{ padding: '0 16px 16px', borderTop: '1px solid #f1f5f9' }}>
              {wishlist.length === 0 ? (
                <p style={{ fontSize: '12.5px', color: '#64748b', padding: '12px 0' }}>
                  No saved advertisements yet. Tap the heart icon on any product to save it here!
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '10px' }}>
                  {wishlist.map((item) => (
                    <div
                      key={item.id}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', background: '#f8fafc', borderRadius: '6px', cursor: 'pointer' }}
                      onClick={() => onSelectAd(item.id)}
                    >
                      <img src={item.primary_image} alt="" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: '#002f34' }}>₹{Number(item.price).toLocaleString('en-IN')}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFav(item.id);
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Contact Info Card */}
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #ebedee', padding: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#8e9da0', marginBottom: '8px' }}>
            Account Credentials
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#002f34', marginBottom: '6px' }}>
            <Mail size={14} color="#00a49f" />
            <span>{user.email}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#002f34' }}>
            <Phone size={14} color="#00a49f" />
            <span>{user.phone || '+91 9811223344'}</span>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            background: '#fff',
            border: '1px solid #fee2e2',
            color: '#dc2626',
            borderRadius: '8px',
            padding: '14px',
            fontWeight: 700,
            fontSize: '13.5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            marginTop: '8px'
          }}
        >
          <LogOut size={16} />
          <span>Sign Out of Account</span>
        </button>
      </div>
    </div>
  );
}
