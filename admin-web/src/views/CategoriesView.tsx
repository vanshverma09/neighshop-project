import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Layers } from 'lucide-react';
import { adminApi } from '../api';
import Modal from '../components/Modal';
import { ICategory } from '../types/category.types';

interface CategoriesViewProps {
  onToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export default function CategoriesView({ onToast }: CategoriesViewProps) {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [addCatModal, setAddCatModal] = useState(false);
  const [addSubModal, setAddSubModal] = useState(false);
  const [selectedParentCat, setSelectedParentCat] = useState<ICategory | null>(null);

  // Forms
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('tag');
  const [catDesc, setCatDesc] = useState('');
  const [subName, setSubName] = useState('');

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getCategories();
      setCategories(res.categories || []);
    } catch (err: any) {
      onToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    try {
      const res = await adminApi.createCategory({
        name: catName.trim(),
        icon: catIcon,
        description: catDesc
      });
      onToast(res.message, 'success');
      setAddCatModal(false);
      setCatName('');
      setCatDesc('');
      fetchCategories();
    } catch (err: any) {
      onToast(err.message, 'error');
    }
  };

  const handleCreateSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim() || !selectedParentCat) return;

    try {
      const res = await adminApi.createSubcategory({
        category_id: selectedParentCat.id,
        name: subName.trim()
      });
      onToast(res.message, 'success');
      setAddSubModal(false);
      setSubName('');
      setSelectedParentCat(null);
      fetchCategories();
    } catch (err: any) {
      onToast(err.message, 'error');
    }
  };

  const handleDeleteCategory = async (cat: ICategory) => {
    if (cat.ad_count && cat.ad_count > 0) {
      alert(`Safety Protection: Cannot delete category "${cat.name}" because it currently contains ${cat.ad_count} advertisements. Please reclassify or remove those listings first.`);
      return;
    }

    if (!window.confirm(`Delete category "${cat.name}"?`)) return;

    try {
      const res = await adminApi.deleteCategory(cat.id);
      onToast(res.message, 'success');
      setCategories(prev => prev.filter(c => c.id !== cat.id));
    } catch (err: any) {
      onToast(err.message, 'error');
    }
  };

  const openAddSub = (cat: ICategory) => {
    setSelectedParentCat(cat);
    setSubName('');
    setAddSubModal(true);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Classified Categories & Taxonomy</h1>
          <p>Organize marketplace categories and subcategories with cascade safety protection</p>
        </div>
        <button className="btn btn-primary" onClick={() => setAddCatModal(true)}>
          <Plus size={16} />
          <span>Add Primary Category</span>
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          Loading taxonomy tree...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {categories.map((cat) => (
            <div key={cat.id} className="card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column' }}>
              <div className="card-header" style={{ background: '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e6f7f6', color: '#00a49f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Layers size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#002f34' }}>
                      {cat.name}
                    </h3>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      {cat.ad_count || 0} active listings
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => openAddSub(cat)}
                    title="Add Subcategory"
                  >
                    <Plus size={14} />
                    <span>Sub</span>
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ color: '#dc2626' }}
                    onClick={() => handleDeleteCategory(cat)}
                    title="Delete Category"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Subcategories list */}
              <div style={{ padding: '16px 20px', flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '8px' }}>
                  Subcategories ({cat.subcategories?.length || 0})
                </div>

                {cat.subcategories && cat.subcategories.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {cat.subcategories.map((sub) => (
                      <span
                        key={sub.id}
                        style={{
                          background: '#f1f5f9',
                          color: '#334155',
                          fontSize: '12px',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontWeight: 500,
                          border: '1px solid #e2e8f0'
                        }}
                      >
                        {sub.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                    No subcategories added yet.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Category Modal */}
      <Modal
        isOpen={addCatModal}
        onClose={() => setAddCatModal(false)}
        title="Create New Classified Category"
        footer={(
          <>
            <button className="btn btn-outline" onClick={() => setAddCatModal(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreateCategory}>
              Save Category
            </button>
          </>
        )}
      >
        <form onSubmit={handleCreateCategory}>
          <div className="form-group">
            <label className="form-label">Category Name</label>
            <input
              type="text"
              className="form-input"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="e.g., Musical Instruments & Gear"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Icon Identifier</label>
            <input
              type="text"
              className="form-input"
              value={catIcon}
              onChange={(e) => setCatIcon(e.target.value)}
              placeholder="e.g., guitar or tag"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Short Description</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={catDesc}
              onChange={(e) => setCatDesc(e.target.value)}
              placeholder="Brief description of products in this category..."
            />
          </div>
        </form>
      </Modal>

      {/* Add Subcategory Modal */}
      <Modal
        isOpen={addSubModal}
        onClose={() => setAddSubModal(false)}
        title={`Add Subcategory to "${selectedParentCat?.name}"`}
        footer={(
          <>
            <button className="btn btn-outline" onClick={() => setAddSubModal(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreateSubcategory}>
              Save Subcategory
            </button>
          </>
        )}
      >
        <form onSubmit={handleCreateSubcategory}>
          <div className="form-group">
            <label className="form-label">Subcategory Name</label>
            <input
              type="text"
              className="form-input"
              value={subName}
              onChange={(e) => setSubName(e.target.value)}
              placeholder="e.g., Electric Guitars"
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
