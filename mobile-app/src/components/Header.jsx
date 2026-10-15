import React from 'react';
import { MapPin, ChevronDown, Search, SlidersHorizontal, Heart, Bell } from 'lucide-react';

export default function Header({ 
  currentCity, 
  onOpenLocation, 
  searchTerm, 
  onSearchChange, 
  onSearchSubmit, 
  onOpenFilter, 
  activeFilterCount = 0 
}) {
  return (
    <header className="olx-header">
      {/* Location Selector Row */}
      <div className="location-picker-bar">
        <button className="location-btn" onClick={onOpenLocation}>
          <MapPin size={14} color="#ffce32" />
          <span>{currentCity || 'All India'}</span>
          <ChevronDown size={14} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#ffce32', fontWeight: 800, letterSpacing: '0.5px' }}>
            NEIGHSHOP
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <form onSubmit={onSearchSubmit} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div className="search-input-wrapper" style={{ flex: 1 }}>
          <Search size={18} color="#002f34" />
          <input
            type="text"
            placeholder="Find Cars, Mobile Phones and more..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <button
          type="button"
          onClick={onOpenFilter}
          style={{
            background: activeFilterCount > 0 ? '#ffce32' : 'rgba(255,255,255,0.15)',
            color: activeFilterCount > 0 ? '#002f34' : '#fff',
            border: 'none',
            borderRadius: '4px',
            width: '42px',
            height: '42px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative',
            flexShrink: 0
          }}
          title="Filter and Sort"
        >
          <SlidersHorizontal size={18} />
          {activeFilterCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#ef4444',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 800,
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {activeFilterCount}
            </span>
          )}
        </button>
      </form>
    </header>
  );
}
