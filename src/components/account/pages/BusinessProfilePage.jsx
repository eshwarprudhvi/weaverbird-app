import React, { useState, useEffect } from 'react';
import { ChevronLeft, Save, Loader2, Check } from 'lucide-react';
import { useWorkspace } from '../../../contexts/WorkspaceContext';

const BusinessProfilePage = ({ onBack }) => {
  const { workspace, updateWorkspace, status } = useWorkspace();
  
  // Local state for the form
  const [formData, setFormData] = useState({
    companyName: '',
    studioName: '',
    businessCategory: '',
    email: '',
    phone: '',
    address: ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Initialize form from workspace context
  useEffect(() => {
    if (workspace) {
      setFormData({
        companyName: workspace.companyName || '',
        studioName: workspace.studioName || '',
        businessCategory: workspace.businessCategory || '',
        email: workspace.email || '',
        phone: workspace.phone || '',
        address: workspace.address || ''
      });
    }
  }, [workspace]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMsg('');
    setSaveSuccess(false);

    try {
      await updateWorkspace(formData);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onBack();
      }, 1000); // Briefly show success state, then go back
    } catch (err) {
      console.error("Save error:", err);
      setErrorMsg("Failed to save. Please check your connection.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '16px 20px',
        backgroundColor: 'var(--bg-nav-solid)',
        borderBottom: '1px solid var(--border)',
        zIndex: 10
      }}>
        <button 
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', marginRight: '16px' }}
        >
          <ChevronLeft size={24} />
        </button>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-title)' }}>Business Profile</h2>
        {status === 'offline' && (
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#f59e0b', fontWeight: 600 }}>Offline Mode</span>
        )}
      </div>

      <div className="screen-content fade-in" style={{ padding: '20px 20px 120px 20px' }}>

      <div style={{ padding: '20px' }}>
        
        {errorMsg && (
          <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', fontWeight: 500 }}>
            {errorMsg}
          </div>
        )}

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
            General Information
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Company Name</label>
              <input 
                type="text" 
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="e.g. My Workspace"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '14px' }} 
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Studio Name</label>
              <input 
                type="text" 
                name="studioName"
                value={formData.studioName}
                onChange={handleChange}
                placeholder="e.g. Interior Studio"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '14px' }} 
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Business Category</label>
              <select 
                name="businessCategory"
                value={formData.businessCategory}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '14px' }}
              >
                <option value="">Select a category</option>
                <option value="Interior Design">Interior Design</option>
                <option value="Architecture">Architecture</option>
                <option value="Contracting">Contracting</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
            Contact & Location
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Contact Email</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="hello@company.com"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '14px' }} 
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Phone Number</label>
              <input 
                type="tel" 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 123-4567"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '14px' }} 
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Address</label>
              <textarea 
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="123 Design Avenue..."
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '14px', minHeight: '60px', resize: 'vertical' }} 
              />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
            Subscription
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-title)', textTransform: 'capitalize' }}>
                {workspace?.subscription || 'Pro'} Plan
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Renews Dec 15, 2026</span>
            </div>
            <button style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              Manage
            </button>
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={isSaving}
          style={{ 
            width: '100%', 
            padding: '14px', 
            borderRadius: '12px', 
            backgroundColor: saveSuccess ? '#10b981' : 'var(--accent-gold-dark)', 
            color: 'white', 
            border: 'none', 
            fontSize: '14px', 
            fontWeight: 600, 
            cursor: isSaving ? 'not-allowed' : 'pointer', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '8px',
            opacity: isSaving ? 0.7 : 1,
            transition: 'background-color 0.2s ease'
          }}
        >
          {isSaving ? (
            <>
              <Loader2 size={18} className="spinner-mini" />
              Saving...
            </>
          ) : saveSuccess ? (
            <>
              <Check size={18} />
              Saved
            </>
          ) : (
            <>
              <Save size={18} />
              Save Changes
            </>
          )}
        </button>

      </div>
    </div>
  </div>
  );
};

export default BusinessProfilePage;
