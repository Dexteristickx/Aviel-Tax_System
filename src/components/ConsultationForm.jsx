import React, { useState } from 'react';

export default function ConsultationForm({ type, onSubmit, loading }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    country: 'Nigeria',
    company: '', // company/org name
    enquiry: '', // area of enquiry
    summary: '',
    ack: false
  });
  const [validationError, setValidationError] = useState('');

  const prefix = type === 'corporate' ? 'c' : 'l';

  const handleInputChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
    setValidationError('');
  };

  const handleRadioClick = (val) => {
    setFormData(prev => ({ ...prev, enquiry: val }));
    setValidationError('');
  };

  const validate = () => {
    if (!formData.name.trim()) return 'Full Name is required.';
    if (!formData.email.trim() || !formData.email.includes('@')) return 'A valid Email Address is required.';
    if (!formData.phone.trim()) return 'Phone / WhatsApp number is required.';
    if (!formData.country.trim()) return 'Country is required.';
    if (!formData.enquiry) return `Please select the area of ${type === 'corporate' ? 'secretarial service' : 'law'}.`;
    if (!formData.summary.trim()) return 'Please summarize your matter clearly.';
    if (!formData.ack) return 'Please acknowledge the consultation fee before requesting.';
    return '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      setValidationError(error);
      const banner = document.getElementById(`val-banner-consult-${type}`);
      if (banner) banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }

    const payload = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      type: type === 'corporate' ? 'Corporate Consultation' : 'Legal Consultation',
      name: formData.name,
      email: formData.email,
      whatsapp: formData.phone,
      location: formData.country,
      summary: formData.summary,
      details: type === 'corporate' ? {
        company: formData.company,
        enquiry: formData.enquiry
      } : {
        organisation: formData.company,
        matterType: formData.enquiry
      }
    };

    onSubmit(payload, () => {
      // Success Callback: Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        country: 'Nigeria',
        company: '',
        enquiry: '',
        summary: '',
        ack: false
      });
      setValidationError('');
    });
  };

  const corporateOptions = ["Incorporation", "Compliance", "Annual Returns", "Governance", "Regulatory", "Other"];
  const legalOptions = ["Corporate & Commercial", "Governance", "Real Estate", "Debt Recovery", "Secretarial", "Dispute Resolution", "Other"];
  const options = type === 'corporate' ? corporateOptions : legalOptions;

  return (
    <div id={`view-${type}`} className="view active" style={{ display: 'block' }}>
      <div className="view-title">
        {type === 'corporate' ? 'Corporate Consultation Request' : 'Legal Consultation Request'}
      </div>
      <div className="view-sub">
        {type === 'corporate' 
          ? 'Aviel Alpha Secretaries Ltd — Fast-track Corporate Filings & Compliance.' 
          : 'Aviel Avenante Law Practice (aaLawsng) — Structured Legal Advisory.'}
      </div>

      <div className="form-card">
        {/* SECTION 1 — CLIENT DETAILS */}
        <div className="section-badge">SECTION 1 — CLIENT DETAILS</div>
        <div className="form-row">
          <div className="form-group">
            <label>Full Name <span className="req">★</span></label>
            <input 
              type="text" 
              value={formData.name}
              onChange={e => handleInputChange('name', e.target.value)}
              placeholder="Your full name" 
            />
          </div>
          <div className="form-group">
            <label>{type === 'corporate' ? 'Company Name' : 'Organisation Name'}</label>
            <input 
              type="text" 
              value={formData.company}
              onChange={e => handleInputChange('company', e.target.value)}
              placeholder="Company name (optional)" 
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Country <span className="req">★</span></label>
            <input 
              type="text" 
              value={formData.country}
              onChange={e => handleInputChange('country', e.target.value)}
              placeholder="e.g. Nigeria" 
            />
          </div>
          <div className="form-group">
            <label>Email Address <span className="req">★</span></label>
            <input 
              type="email" 
              value={formData.email}
              onChange={e => handleInputChange('email', e.target.value)}
              placeholder="email@address.com" 
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Phone / WhatsApp Number <span className="req">★</span></label>
            <input 
              type="text" 
              value={formData.phone}
              onChange={e => handleInputChange('phone', e.target.value)}
              placeholder="e.g. +234 803 123 4567" 
            />
          </div>
        </div>

        <hr className="divider" />

        {/* SECTION 2 — NATURE OF ENQUIRY */}
        <div className="section-badge">SECTION 2 — AREA OF MATTERS</div>
        <div className="form-group">
          <label>{type === 'corporate' ? 'Secretarial Service Requested' : 'Nature of Legal Matter'} <span className="req">★</span></label>
          <div className="radio-group" id={`${prefix}-enquiry`}>
            {options.map(opt => (
              <div 
                key={opt}
                className={`radio-option ${formData.enquiry === opt ? 'selected' : ''}`}
                onClick={() => handleRadioClick(opt)}
              >
                <input type="radio" checked={formData.enquiry === opt} readOnly />
                {type === 'corporate' && opt === 'Compliance' ? 'Post-Incorporation Compliance' :
                 type === 'corporate' && opt === 'Annual Returns' ? 'Annual Returns Filing' :
                 type === 'corporate' && opt === 'Governance' ? 'Corporate Governance Advisory' :
                 type === 'corporate' && opt === 'Regulatory' ? 'Regulatory Filings' :
                 type === 'legal' && opt === 'Corporate & Commercial' ? 'Corporate & Commercial Law' :
                 type === 'legal' && opt === 'Governance' ? 'Corporate Governance & Compliance' :
                 type === 'legal' && opt === 'Real Estate' ? 'Real Estate & Property' :
                 type === 'legal' && opt === 'Secretarial' ? 'Company Secretarial Matters' :
                 type === 'legal' && opt === 'Dispute Resolution' ? 'Litigation / Dispute Resolution' :
                 opt}
              </div>
            ))}
          </div>
        </div>

        <hr className="divider" />

        {/* SECTION 3 — MATTER SUMMARY */}
        <div className="section-badge">SECTION 3 — MATTER SUMMARY</div>
        <div className="form-group">
          <label>Matter Summary <span className="req">★</span></label>
          <textarea 
            value={formData.summary}
            onChange={e => handleInputChange('summary', e.target.value)}
            placeholder="Kindly summarise your matter clearly in 5 to 10 sentences..." 
          />
        </div>

        <div className="consent-block" style={{ marginTop: '24px' }}>
          <div className="consent-title">CONSULTATION ACKNOWLEDGMENT</div>
          <label className="consent-check">
            <input 
              type="checkbox" 
              checked={formData.ack}
              onChange={e => handleInputChange('ack', e.target.checked)}
            />
            <span style={{ fontSize: '.85rem' }}>
              I understand that {type === 'corporate' ? 'corporate' : 'legal'} consultations are paid (₦50,000 for 30 mins / ₦100,000 for 60 mins) and will only be scheduled upon confirmation of payment. <span className="req">★</span>
            </span>
          </label>
        </div>

        <div id={`val-banner-consult-${type}`} className={`validation-banner ${validationError ? 'visible' : ''}`}>
          {validationError ? `⚠ ${validationError}` : ''}
        </div>

        <button 
          onClick={handleSubmit}
          className="btn-primary" 
          disabled={loading}
        >
          {loading ? <><span className="spinner"></span> Sending Request…</> : `⚡ Request ${type === 'corporate' ? 'Corporate' : 'Legal'} Consultation`}
        </button>
      </div>
    </div>
  );
}
