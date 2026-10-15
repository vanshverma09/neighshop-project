import React, { useState } from 'react';
import { Camera, Upload, X, CheckCircle, AlertCircle, Plus, Eye } from 'lucide-react';
import { api, getCurrentUser } from '../api';

export default function SellScreen({ categories, onAdCreated, onRequireAuth, onToast }) {
  const currentUser = getCurrentUser();

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState('used_good');
  const [location, setLocation] = useState('Bandra West');
  const [city, setCity] = useState('Mumbai');
  const [state, setState] = useState('Maharashtra');
  const [contactPhone, setContactPhone] = useState(currentUser?.phone || '+91 9811223344');

  // Images state
  const [imageUrls, setImageUrls] = useState([
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800'
  ]);
  const [customUrl, setCustomUrl] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewFiles, setPreviewFiles] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successAd, setSuccessAd] = useState(null);

  const selectedCategoryObj = categories.find(c => c.id === parseInt(categoryId, 10));

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewFiles(prev => [...prev, reader.result]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const addImageUrl = () => {
    if (customUrl.trim() && customUrl.startsWith('http')) {
      setImageUrls(prev => [...prev, customUrl.trim()]);
      setCustomUrl('');
    }
  };

  const removeImageUrl = (index) => {
    setImageUrls(prev => prev.filter((_, idx) => idx !== index));
  };

  const removeFilePreview = (index) => {
    setPreviewFiles(prev => prev.filter((_, idx) => idx !== index));
    setSelectedFiles(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = getCurrentUser();
    if (!user) {
      onRequireAuth();
      return;
    }

    if (!title.trim() || !description.trim() || !price || !categoryId) {
      setError('Please fill all mandatory fields (Title, Category, Price, and Description).');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('price', price);
      formData.append('category_id', categoryId);
      if (subcategoryId) formData.append('subcategory_id', subcategoryId);
      formData.append('product_condition', condition);
      formData.append('location', location);
      formData.append('city', city);
      formData.append('state', state);
      formData.append('contact_phone', contactPhone);

      // Append local files if selected
      selectedFiles.forEach(file => {
        formData.append('images', file);
      });

      // Append URLs
      imageUrls.forEach(url => {
        formData.append('imageUrls', url);
      });

      const res = await api.createAd(formData);
      setSuccessAd(res);
      onToast('Advertisement submitted for admin review!', 'success');
      onAdCreated();
    } catch (err) {
      setError(err.message || 'Failed to submit advertisement');
    } finally {
      setLoading(false);
    }
  };

  if (successAd) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', background: '#fff', minHeight: '100%' }}>
        <CheckCircle size={60} color="#16a34a" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#002f34' }}>
          Listing Submitted for Approval!
        </h2>
        <p style={{ color: '#475569', fontSize: '14px', marginTop: '8px', lineHeight: 1.5 }}>
          Your advertisement <strong>"{title}"</strong> has been queued for moderation. Per marketplace safety policy, an administrator will review and approve it shortly.
        </p>

        <div style={{ background: '#fef3c7', border: '1px solid #fde68a', padding: '12px', borderRadius: '8px', margin: '20px 0', fontSize: '13px', color: '#92400e', textAlign: 'left' }}>
          <strong>Workflow Stage:</strong> Status is currently <code>Pending</code>. Once approved by the administrator, your listing will instantly appear in public search and category feeds.
        </div>

        <button
          className="olx-btn olx-btn-primary"
          onClick={() => {
            setSuccessAd(null);
            setTitle('');
            setDescription('');
            setPrice('');
          }}
        >
          Post Another Advertisement
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 16px 80px 16px', background: '#fff' }}>
      <div style={{ marginBottom: '18px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#002f34' }}>
          Post an Advertisement
        </h2>
        <p style={{ fontSize: '12.5px', color: '#64748b' }}>
          Reach thousands of local buyers in your city with zero fees
        </p>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Category & Subcategory */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#002f34', display: 'block', marginBottom: '6px' }}>
            Category *
          </label>
          <select
            className="form-select"
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setSubcategoryId('');
            }}
            required
          >
            <option value="">Select Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {selectedCategoryObj?.subcategories && selectedCategoryObj.subcategories.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#002f34', display: 'block', marginBottom: '6px' }}>
              Subcategory
            </label>
            <select
              className="form-select"
              value={subcategoryId}
              onChange={(e) => setSubcategoryId(e.target.value)}
            >
              <option value="">Select Subcategory (Optional)</option>
              {selectedCategoryObj.subcategories.map((sub) => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Title */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#002f34', display: 'block', marginBottom: '6px' }}>
            Ad Title *
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="Mention key features (brand, model, age, specs)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Price */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#002f34', display: 'block', marginBottom: '6px' }}>
            Price (₹) *
          </label>
          <input
            type="number"
            className="form-input"
            placeholder="₹ Set a reasonable price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>

        {/* Condition */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#002f34', display: 'block', marginBottom: '6px' }}>
            Product Condition
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[
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
                  padding: '8px',
                  borderRadius: '6px',
                  border: `1px solid ${condition === c.id ? '#002f34' : '#e2e8f0'}`,
                  background: condition === c.id ? '#002f34' : '#f8fafc',
                  color: condition === c.id ? '#fff' : '#002f34',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#002f34', display: 'block', marginBottom: '6px' }}>
            Description *
          </label>
          <textarea
            className="form-textarea"
            rows={4}
            placeholder="Include condition, reasons for selling, what is included (box, bill, charger)..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        {/* Photo Upload Section */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#002f34', display: 'block', marginBottom: '6px' }}>
            Upload Photos (Up to 6 Photos)
          </label>

          {/* Image Previews */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {previewFiles.map((src, idx) => (
              <div key={`file-${idx}`} style={{ position: 'relative', width: '70px', height: '70px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={() => removeFilePreview(idx)}
                  style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}

            {imageUrls.map((url, idx) => (
              <div key={`url-${idx}`} style={{ position: 'relative', width: '70px', height: '70px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {idx === 0 && (
                  <span style={{ position: 'absolute', bottom: '0', left: '0', right: '0', background: '#00a49f', color: '#fff', fontSize: '9px', fontWeight: 800, textAlign: 'center' }}>
                    COVER
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeImageUrl(idx)}
                  style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}

            {/* File upload button */}
            <label style={{
              width: '70px',
              height: '70px',
              borderRadius: '6px',
              border: '2px dashed #00a49f',
              background: '#e6f7f6',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#002f34'
            }}>
              <Camera size={20} color="#00a49f" />
              <span style={{ fontSize: '10px', fontWeight: 700, marginTop: '2px' }}>+ Add</span>
              <input type="file" accept="image/*" multiple onChange={handleFileChange} style={{ display: 'none' }} />
            </label>
          </div>

          {/* Or add via URL */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="url"
              placeholder="Or paste web image URL..."
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="form-input"
              style={{ fontSize: '12px', padding: '8px' }}
            />
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={addImageUrl}
            >
              Add URL
            </button>
          </div>
        </div>

        {/* Location & Contact */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#002f34', display: 'block', marginBottom: '4px' }}>Locality / Area</label>
            <input
              type="text"
              className="form-input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Bandra West"
              required
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#002f34', display: 'block', marginBottom: '4px' }}>City</label>
            <input
              type="text"
              className="form-input"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#002f34', display: 'block', marginBottom: '4px' }}>Contact Phone Number</label>
          <input
            type="tel"
            className="form-input"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="olx-btn olx-btn-primary"
          disabled={loading}
          style={{ padding: '14px', fontSize: '15px' }}
        >
          {loading ? 'Submitting Listing...' : 'Post Advertisement Now'}
        </button>
      </form>
    </div>
  );
}
