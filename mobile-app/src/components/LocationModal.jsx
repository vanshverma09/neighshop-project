import React, { useState } from 'react';
import { MapPin, X, Search, Check } from 'lucide-react';

const POPULAR_CITIES = [
  'All India',
  'Mumbai',
  'Bengaluru',
  'New Delhi',
  'Hyderabad',
  'Pune',
  'Kolkata',
  'Chennai',
  'Ahmedabad',
  'Jaipur',
  'Chandigarh'
];

export default function LocationModal({ isOpen, onClose, currentCity, onSelectCity }) {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const filtered = POPULAR_CITIES.filter(c => c.toLowerCase().includes(query.toLowerCase()));

  const handleSelect = (city) => {
    onSelectCity(city);
    onClose();
  };

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'rgba(0, 47, 52, 0.7)',
      backdropFilter: 'blur(3px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'flex-end',
      animation: 'fadeIn 0.2s'
    }} onClick={onClose}>
      <div style={{
        width: '100%',
        background: '#fff',
        borderRadius: '24px 24px 0 0',
        padding: '20px',
        maxHeight: '75vh',
        overflowY: 'auto'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={20} color="#00a49f" />
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#002f34' }}>Select Location</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#f1f5f9',
          padding: '10px 14px',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder="Search city, state or area..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px' }}
            autoFocus
          />
        </div>

        {/* Custom enter */}
        {query.trim() && !POPULAR_CITIES.some(c => c.toLowerCase() === query.trim().toLowerCase()) && (
          <div
            onClick={() => handleSelect(query.trim())}
            style={{
              padding: '12px',
              borderBottom: '1px solid #f1f5f9',
              cursor: 'pointer',
              color: '#00a49f',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <MapPin size={16} />
            <span>Use "{query.trim()}" as location</span>
          </div>
        )}

        <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
          Popular Cities
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filtered.map((city) => {
            const isSelected = (currentCity || 'All India') === city;
            return (
              <div
                key={city}
                onClick={() => handleSelect(city)}
                style={{
                  padding: '14px 10px',
                  borderBottom: '1px solid #f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? '#00a49f' : '#002f34',
                  fontSize: '14px'
                }}
              >
                <span>{city}</span>
                {isSelected && <Check size={16} color="#00a49f" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
