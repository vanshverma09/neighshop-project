import React, { useState } from 'react';
import { X, RotateCcw, Check } from 'lucide-react';

export default function FilterModal({ isOpen, onClose, filters, onApplyFilters, onResetFilters }) {
  const [sort, setSort] = useState(filters.sort || 'newest');
  const [condition, setCondition] = useState(filters.condition || '');
  const [minPrice, setMinPrice] = useState(filters.minPrice || '');
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice || '');

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyFilters({
      sort,
      condition,
      minPrice,
      maxPrice
    });
    onClose();
  };

  const handleReset = () => {
    setSort('newest');
    setCondition('');
    setMinPrice('');
    setMaxPrice('');
    onResetFilters();
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
        padding: '24px 20px',
        maxHeight: '85vh',
        overflowY: 'auto'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#002f34' }}>Filters & Sorting</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        {/* 1. Sort Options */}
        <div style={{ marginBottom: '22px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#002f34', marginBottom: '10px' }}>
            Sort By
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[
              { id: 'newest', label: 'Date: Newly Listed' },
              { id: 'price_asc', label: 'Price: Low to High' },
              { id: 'price_desc', label: 'Price: High to Low' },
              { id: 'oldest', label: 'Date: Oldest First' }
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSort(s.id)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${sort === s.id ? '#00a49f' : '#e2e8f0'}`,
                  background: sort === s.id ? '#e6f7f6' : '#fff',
                  color: sort === s.id ? '#002f34' : '#475569',
                  fontSize: '12.5px',
                  fontWeight: sort === s.id ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Product Condition */}
        <div style={{ marginBottom: '22px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#002f34', marginBottom: '10px' }}>
            Product Condition
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {[
              { id: '', label: 'Any Condition' },
              { id: 'new', label: 'Brand New' },
              { id: 'used_like_new', label: 'Like New (Mint)' },
              { id: 'used_good', label: 'Used - Good' },
              { id: 'used_fair', label: 'Used - Fair' }
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCondition(c.id)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '20px',
                  border: `1px solid ${condition === c.id ? '#002f34' : '#e2e8f0'}`,
                  background: condition === c.id ? '#002f34' : '#fff',
                  color: condition === c.id ? '#fff' : '#475569',
                  fontSize: '12.5px',
                  fontWeight: condition === c.id ? 700 : 500,
                  cursor: 'pointer'
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Price Range (₹) */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#002f34', marginBottom: '10px' }}>
            Price Range (₹)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Min Price</label>
              <input
                type="number"
                placeholder="₹ 0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Max Price</label>
              <input
                type="number"
                placeholder="₹ Any"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
          <button
            type="button"
            className="olx-btn olx-btn-secondary"
            onClick={handleReset}
          >
            <RotateCcw size={15} />
            <span>Clear All</span>
          </button>
          <button
            type="button"
            className="olx-btn olx-btn-primary"
            onClick={handleApply}
          >
            <Check size={16} />
            <span>Apply Filters</span>
          </button>
        </div>
      </div>
    </div>
  );
}
