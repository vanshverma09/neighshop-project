import React, { useState } from 'react';
import { X, Mail, Lock, User, Phone, CheckCircle, ArrowRight } from 'lucide-react';
import { api, setAuth } from '../api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('buyer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const res = await api.register({
          name,
          email,
          password,
          phone,
          role
        });
        setAuth(res.token, res.user);
        onAuthSuccess(res.user);
        onClose();
      } else {
        const res = await api.login(email, password);
        setAuth(res.token, res.user);
        onAuthSuccess(res.user);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const quickFillBuyer = () => {
    setIsRegister(false);
    setEmail('buyer@neighshop.com');
    setPassword('Buyer@123');
    setError(null);
  };

  const quickFillSeller = () => {
    setIsRegister(false);
    setEmail('seller@neighshop.com');
    setPassword('Seller@123');
    setError(null);
  };

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'rgba(0, 47, 52, 0.75)',
      backdropFilter: 'blur(4px)',
      zIndex: 110,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }} onClick={onClose}>
      <div style={{
        width: '100%',
        maxWidth: '380px',
        background: '#fff',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)',
        position: 'relative'
      }} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#002f34' }}>
            {isRegister ? 'Join NeighShop Classifieds' : 'Welcome to NeighShop'}
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
            {isRegister ? 'Post ads and chat with local buyers' : 'Sign in to access chats, favorites and post ads'}
          </p>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', marginBottom: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {isRegister && (
            <div>
              <input
                type="text"
                placeholder="Full Name"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <input
              type="email"
              placeholder="Email Address"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {isRegister && (
            <>
              <div>
                <input
                  type="tel"
                  placeholder="Mobile Number (Optional)"
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setRole('buyer')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    border: `1px solid ${role === 'buyer' ? '#00a49f' : '#cbd5e1'}`,
                    background: role === 'buyer' ? '#e6f7f6' : '#fff',
                    color: '#002f34',
                    cursor: 'pointer'
                  }}
                >
                  I want to Buy
                </button>
                <button
                  type="button"
                  onClick={() => setRole('seller')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    border: `1px solid ${role === 'seller' ? '#00a49f' : '#cbd5e1'}`,
                    background: role === 'seller' ? '#e6f7f6' : '#fff',
                    color: '#002f34',
                    cursor: 'pointer'
                  }}
                >
                  I want to Sell
                </button>
              </div>
            </>
          )}

          <button
            type="submit"
            className="olx-btn olx-btn-primary"
            disabled={loading}
            style={{ marginTop: '4px' }}
          >
            {loading ? 'Please wait...' : (isRegister ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '12px', color: '#64748b' }}>
          {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          <span
            style={{ color: '#00a49f', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => { setIsRegister(!isRegister); setError(null); }}
          >
            {isRegister ? 'Sign In' : 'Register Free'}
          </span>
        </div>

        {/* Assessment Demo Logins */}
        <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', marginBottom: '8px', fontWeight: 600 }}>
            TEST DEMO PROFILES
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <button
              type="button"
              onClick={quickFillBuyer}
              style={{
                padding: '6px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#002f34',
                cursor: 'pointer'
              }}
            >
              Buyer (Priya)
            </button>
            <button
              type="button"
              onClick={quickFillSeller}
              style={{
                padding: '6px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#002f34',
                cursor: 'pointer'
              }}
            >
              Seller (Vansh)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
