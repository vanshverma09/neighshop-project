import React from 'react';
import {
  Smartphone,
  Car,
  Home,
  Tv,
  Armchair,
  Shirt,
  Briefcase,
  Heart,
  Tag,
  Sparkles,
  ChevronRight
} from 'lucide-react';

const CATEGORY_ICONS = {
  'mobiles-tablets': Smartphone,
  'cars-vehicles': Car,
  'property-real-estate': Home,
  'electronics-appliances': Tv,
  'furniture-decor': Armchair,
  'fashion-lifestyle': Shirt,
  'services-jobs': Briefcase
};

export default function HomeScreen({
  categories,
  selectedCategory,
  onSelectCategory,
  featuredAds,
  advertisements,
  loading,
  onSelectAd,
  onToggleWishlist,
  onOpenSell
}) {
  return (
    <div style={{ paddingBottom: '20px' }}>
      {/* 1. Category Strip (Horizontal Scroll Pills) */}
      <div className="category-strip">
        <button
          className={`category-chip ${selectedCategory === null ? 'active' : ''}`}
          onClick={() => onSelectCategory(null)}
        >
          <div className="cat-icon-circle">
            <Sparkles size={20} />
          </div>
          <span>All Items</span>
        </button>

        {categories.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.slug] || Tag;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              className={`category-chip ${isActive ? 'active' : ''}`}
              onClick={() => onSelectCategory(isActive ? null : cat.id)}
            >
              <div className="cat-icon-circle">
                <Icon size={20} />
              </div>
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Hero Promotional Banner */}
      <div className="banner-slider">
        <div className="banner-card">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', background: 'rgba(255,206,50,0.2)', color: '#ffce32', padding: '2px 6px', borderRadius: '4px', fontWeight: 800, marginBottom: '6px' }}>
            <Sparkles size={11} />
            <span>NEIGHBORHOOD MARKETPLACE</span>
          </div>
          <h3>Sell Smarter, Buy Faster</h3>
          <p>Find genuine deals from verified neighbors in your city with 0% platform commission.</p>
          <button className="banner-btn" onClick={onOpenSell}>
            + Post Free Ad
          </button>
        </div>

        <div className="banner-card" style={{ background: 'linear-gradient(135deg, #0f4c81 0%, #002f34 100%)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: 800, marginBottom: '6px' }}>
            <span>PRE-OWNED CARS & BIKES</span>
          </div>
          <h3>Verified Vehicles</h3>
          <p>Inspected single-owner cars & two-wheelers with service history in Mumbai & Bengaluru.</p>
          <button 
            className="banner-btn"
            style={{ background: '#fff', color: '#002f34' }}
            onClick={() => onSelectCategory(2)}
          >
            Browse Cars
          </button>
        </div>
      </div>

      {/* 3. Featured Classifieds Carousel (if any) */}
      {featuredAds && featuredAds.length > 0 && selectedCategory === null && (
        <div style={{ marginTop: '10px', marginBottom: '8px' }}>
          <div className="feed-header">
            <h2>🔥 Featured Listings</h2>
          </div>
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '0 12px 10px', scrollbarWidth: 'none' }}>
            {featuredAds.map((ad) => (
              <div
                key={ad.id}
                onClick={() => onSelectAd(ad.id)}
                style={{
                  minWidth: '160px',
                  maxWidth: '160px',
                  background: '#fff',
                  borderRadius: '6px',
                  border: '1px solid #ebedee',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                <div style={{ width: '100%', height: '110px', position: 'relative', background: '#e2e8f0' }}>
                  <img
                    src={ad.primary_image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=300'}
                    alt={ad.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <span className="featured-ribbon">FEATURED</span>
                </div>
                <div style={{ padding: '8px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#002f34' }}>
                    ₹{Number(ad.price).toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '11px', color: '#406367', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                    {ad.title}
                  </div>
                  <div style={{ fontSize: '10px', color: '#8e9da0', marginTop: '4px' }}>
                    {ad.city}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Fresh Recommendations Header */}
      <div className="feed-header">
        <h2>Fresh Recommendations</h2>
        <span style={{ fontSize: '12px', color: '#00a49f', fontWeight: 700 }}>
          {advertisements.length} Listings
        </span>
      </div>

      {/* 5. Product Grid (2-Column Mobile Feed) */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#5e7377', fontSize: '13px' }}>
          Discovering fresh classifieds near you...
        </div>
      ) : advertisements.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#5e7377' }}>
          <Tag size={36} color="#00a49f" style={{ margin: '0 auto 10px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#002f34' }}>No listings found</h3>
          <p style={{ fontSize: '12.5px', marginTop: '4px' }}>
            Try expanding your search keyword, removing filters, or choosing "All India".
          </p>
        </div>
      ) : (
        <div className="product-grid">
          {advertisements.map((ad) => (
            <div
              key={ad.id}
              className="product-card"
              onClick={() => onSelectAd(ad.id)}
            >
              <div className="card-image-box">
                <img
                  src={ad.primary_image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400'}
                  alt={ad.title}
                  loading="lazy"
                />
                {ad.is_featured === 1 && (
                  <span className="featured-ribbon">FEATURED</span>
                )}
                <button
                  type="button"
                  className={`fav-btn ${ad.is_favourited ? 'favorited' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleWishlist(ad.id);
                  }}
                  title={ad.is_favourited ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart
                    size={16}
                    fill={ad.is_favourited ? '#ef4444' : 'none'}
                    color={ad.is_favourited ? '#ef4444' : '#002f34'}
                  />
                </button>
              </div>

              <div className="card-content">
                <div className="card-price">
                  ₹ {Number(ad.price).toLocaleString('en-IN')}
                </div>
                <div className="card-title">
                  {ad.title}
                </div>
                <div className="card-footer">
                  <span style={{ maxWidth: '85px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {ad.location || ad.city}
                  </span>
                  <span>
                    {new Date(ad.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
