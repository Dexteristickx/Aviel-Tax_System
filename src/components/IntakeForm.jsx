import React, { useState } from 'react';

export default function IntakeForm({ onSubmit, loading, user }) {
  const [currentType, setCurrentType] = useState(null); // 'business' or 'individual'
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', location: '',
    bizName: '', role: '', cac: '', rc: '',
    industry: '', years: '', revenue: '', employees: '',
    track: '', consult: '', returns: '', tcc: '', audit: '',
    taxes: [], concerns: [], issue: '',
    employ: '', employer: '', occupation: '', state: '',
    income: '', incomeSources: [], paye: '', filed: '',
    tin: '', query: ''
  });
  const [consent, setConsent] = useState(false);
  const [validationError, setValidationError] = useState('');

  const statesOfResidence = ["Lagos", "Abuja (FCT)", "Rivers", "Kano", "Oyo", "Delta", "Anambra", "Other"];
  const industries = ["Technology / IT", "Retail / E-commerce", "Manufacturing", "Agriculture", "Real Estate / Construction", "Professional Services", "Healthcare", "Education", "Other"];

  const handleInputChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
    setValidationError('');
  };

  const handleRadioClick = (groupId, val) => {
    setFormData(prev => ({ ...prev, [groupId]: val }));
    setValidationError('');
  };

  const handleCheckboxClick = (groupId, val) => {
    setFormData(prev => {
      const currentList = prev[groupId] || [];
      const updatedList = currentList.includes(val)
        ? currentList.filter(item => item !== val)
        : [...currentList, val];
      return { ...prev, [groupId]: updatedList };
    });
    setValidationError('');
  };

  const validate = () => {
    if (!formData.name.trim()) return 'Full Name is required.';
    if (!formData.email.trim() || !formData.email.includes('@')) return 'A valid Email Address is required.';
    if (!formData.phone.trim()) return 'Phone / WhatsApp number is required.';
    if (!formData.location.trim()) return 'State / Location is required.';

    if (currentType === 'business') {
      if (!formData.bizName.trim()) return 'Business Name is required.';
      if (!formData.role.trim()) return 'Your Role / Position is required.';
      if (!formData.cac) return 'Please select your CAC Registration status.';
      if (!formData.industry) return 'Please select your Industry / Sector.';
      if (!formData.years) return 'Please select how many years you have been operating.';
      if (!formData.revenue) return 'Please select your Estimated Annual Revenue range.';
      if (!formData.employees) return 'Please select your Number of Employees.';
      if (!formData.track) return 'Please select your Finance Tracking method.';
      if (!formData.consult) return 'Please indicate whether you use a Tax Consultant.';
      if (!formData.returns) return 'Please select your Tax Return filing history.';
      if (!formData.tcc) return 'Please select your Tax Clearance Certificate status.';
      if (!formData.audit) return 'Please indicate if you have received a Tax Audit or Query.';
    } else {
      if (!formData.employ) return 'Please select your Employment Status.';
      if (!formData.occupation.trim()) return 'Primary Occupation / Field is required.';
      if (!formData.state) return 'Please select your State of Tax Residence.';
      if (!formData.income) return 'Please select your Estimated Annual Income range.';
      if (formData.incomeSources.length === 0) return 'Please select at least one Source of Income.';
      if (!formData.paye) return 'Please indicate your PAYE deduction status.';
      if (!formData.filed) return 'Please indicate your Tax Return filing history.';
      if (!formData.tcc) return 'Please select your Personal TCC Status.';
      if (!formData.tin) return 'Please indicate whether you have a TIN.';
      if (!formData.query) return 'Please indicate if you have received a Tax Query or Notice.';
    }
    if (!consent) return 'Please tick the consent checkbox before submitting.';
    return '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      setValidationError(error);
      const banner = document.getElementById('val-banner-intake');
      if (banner) banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }

    // Call app submit handler
    onSubmit({
      ...formData,
      type: currentType === 'business' ? 'Business' : 'Individual',
      userId: user?.id || null
    }, () => {
      // Success Callback: Reset Form State
      setCurrentType(null);
      setConsent(false);
      setFormData({
        name: '', email: '', phone: '', location: '',
        bizName: '', role: '', cac: '', rc: '',
        industry: '', years: '', revenue: '', employees: '',
        track: '', consult: '', returns: '', tcc: '', audit: '',
        taxes: [], concerns: [], issue: '',
        employ: '', employer: '', occupation: '', state: '',
        income: '', incomeSources: [], paye: '', filed: '',
        tin: '', query: ''
      });
    });
  };

  return (
    <div id="view-intake" className="view active" style={{ display: 'block' }}>
      <div className="view-title">Tax Intake Questionnaire</div>
      <div className="view-sub">Complete this questionnaire to analyze your tax profile and generate a comprehensive Tax Health Report.</div>

      <div className="form-card">
        {/* SECTION 0 — Client Information */}
        <div className="section-badge">SECTION 0 — CONTACT DETAILS</div>
        <div className="section-title">Who is this report for?</div>
        
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
          <div className="form-group">
            <label>State / Location <span className="req">★</span></label>
            <input 
              type="text" 
              value={formData.location} 
              onChange={e => handleInputChange('location', e.target.value)} 
              placeholder="e.g. Lagos, Nigeria" 
            />
          </div>
        </div>

        <hr className="divider" />

        {/* Client Type selection */}
        <div className="section-badge">SECTION 0B — TAX PROFILE TYPE</div>
        <div className="section-title">Are you a Business entity or an Individual?</div>
        
        <div className="type-selector">
          <div 
            id="type-biz" 
            className={`type-card ${currentType === 'business' ? 'selected' : ''}`}
            onClick={() => setCurrentType('business')}
          >
            <div className="icon">🏢</div>
            <div className="label">Business / Corporate</div>
            <div className="desc">Companies, Partnerships, LLCs, and Registered Entities</div>
          </div>
          <div 
            id="type-ind" 
            className={`type-card ${currentType === 'individual' ? 'selected' : ''}`}
            onClick={() => setCurrentType('individual')}
          >
            <div className="icon">👤</div>
            <div className="label">Individual Client</div>
            <div className="desc">Employees, Freelancers, Contractors, and Sole Proprietors</div>
          </div>
        </div>

        {/* BUSINESS PATH */}
        {currentType === 'business' && (
          <div id="business-path" className="visible-section">
            <div className="section-badge">SECTION 1B — BUSINESS DETAILS</div>
            <div className="section-title">Corporate Information</div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Business Name <span className="req">★</span></label>
                <input 
                  type="text" 
                  value={formData.bizName}
                  onChange={e => handleInputChange('bizName', e.target.value)}
                  placeholder="Official company name" 
                />
              </div>
              <div className="form-group">
                <label>Your Role / Position <span className="req">★</span></label>
                <input 
                  type="text" 
                  value={formData.role}
                  onChange={e => handleInputChange('role', e.target.value)}
                  placeholder="e.g. Managing Director, Founder, Accountant" 
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>CAC Registration <span className="req">★</span></label>
                <div className="radio-group" id="b-cac">
                  {['Registered', 'No', 'In Progress'].map(opt => (
                    <div 
                      key={opt}
                      className={`radio-option ${formData.cac === opt ? 'selected' : ''}`}
                      onClick={() => handleRadioClick('cac', opt)}
                    >
                      <input type="radio" checked={formData.cac === opt} readOnly />
                      {opt === 'Registered' ? 'CAC Registered' : opt === 'No' ? 'Unregistered' : 'In Progress'}
                    </div>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>RC / BN Number <span style={{ color: '#888', fontWeight: 400 }}>(if registered)</span></label>
                <input 
                  type="text" 
                  value={formData.rc}
                  onChange={e => handleInputChange('rc', e.target.value)}
                  placeholder="RC 123456 or BN 78910..." 
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Industry / Sector <span className="req">★</span></label>
                <select 
                  value={formData.industry} 
                  onChange={e => handleInputChange('industry', e.target.value)}
                >
                  <option value="">Select industry…</option>
                  {industries.map(ind => <option key={ind}>{ind}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Years Operating <span className="req">★</span></label>
                <div className="radio-group" id="b-years">
                  {['<1', '1-3', '3-5', '5+'].map(opt => (
                    <div 
                      key={opt}
                      className={`radio-option ${formData.years === opt ? 'selected' : ''}`}
                      onClick={() => handleRadioClick('years', opt)}
                    >
                      <input type="radio" checked={formData.years === opt} readOnly />
                      {opt === '<1' ? 'Under 1 year' : opt === '1-3' ? '1–3 years' : opt === '3-5' ? '3–5 years' : 'Above 5 years'}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Estimated Annual Revenue <span className="req">★</span></label>
                <div className="radio-group" id="b-rev">
                  {['<5M', '5-20M', '20-100M', '>100M'].map(opt => (
                    <div 
                      key={opt}
                      className={`radio-option ${formData.revenue === opt ? 'selected' : ''}`}
                      onClick={() => handleRadioClick('revenue', opt)}
                    >
                      <input type="radio" checked={formData.revenue === opt} readOnly />
                      {opt === '<5M' ? 'Under ₦5M' : opt === '5-20M' ? '₦5M–₦20M' : opt === '20-100M' ? '₦20M–₦100M' : 'Above ₦100M'}
                    </div>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Number of Employees <span className="req">★</span></label>
                <div className="radio-group" id="b-emp">
                  {['1-5', '6-20', '21-100', '>100'].map(opt => (
                    <div 
                      key={opt}
                      className={`radio-option ${formData.employees === opt ? 'selected' : ''}`}
                      onClick={() => handleRadioClick('employees', opt)}
                    >
                      <input type="radio" checked={formData.employees === opt} readOnly />
                      {opt === '1-5' ? '1–5 staff' : opt === '6-20' ? '6–20 staff' : opt === '21-100' ? '21–100 staff' : 'Over 100 staff'}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <hr className="divider" />
            <div className="section-badge">SECTION 2B — TAX DETAILS</div>
            <div className="section-title">Tax Compliance Status</div>

            <div className="form-row">
              <div className="form-group">
                <label>Finance Tracking <span className="req">★</span></label>
                <div className="radio-group" id="b-track">
                  {['Software', 'Spreadsheets', 'Poor', 'Bookkeeper'].map(opt => (
                    <div 
                      key={opt}
                      className={`radio-option ${formData.track === opt ? 'selected' : ''}`}
                      onClick={() => handleRadioClick('track', opt)}
                    >
                      <input type="radio" checked={formData.track === opt} readOnly />
                      {opt === 'Software' ? 'Accounting Software' : opt === 'Spreadsheets' ? 'Spreadsheets' : opt === 'Poor' ? 'Not well organised' : 'Bookkeeper'}
                    </div>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Tax Consultant? <span className="req">★</span></label>
                <div className="radio-group" id="b-consult">
                  {['Yes FT', 'Yes Occ', 'No'].map(opt => (
                    <div 
                      key={opt}
                      className={`radio-option ${formData.consult === opt ? 'selected' : ''}`}
                      onClick={() => handleRadioClick('consult', opt)}
                    >
                      <input type="radio" checked={formData.consult === opt} readOnly />
                      {opt === 'Yes FT' ? 'Yes, full-time' : opt === 'Yes Occ' ? 'Occasionally' : 'No'}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Files Tax Returns? <span className="req">★</span></label>
                <div className="radio-group" id="b-returns">
                  {['Regularly', 'Sometimes', 'Never', 'Unsure'].map(opt => (
                    <div 
                      key={opt}
                      className={`radio-option ${formData.returns === opt ? 'selected' : ''}`}
                      onClick={() => handleRadioClick('returns', opt)}
                    >
                      <input type="radio" checked={formData.returns === opt} readOnly />
                      {opt === 'Regularly' ? 'Yes, regularly' : opt === 'Sometimes' ? 'Sometimes' : opt === 'Never' ? 'Never filed' : 'Not sure'}
                    </div>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Tax Clearance Certificate <span className="req">★</span></label>
                <div className="radio-group" id="b-tcc">
                  {['Valid', 'Expired', 'Never', 'InProgress'].map(opt => (
                    <div 
                      key={opt}
                      className={`radio-option ${formData.tcc === opt ? 'selected' : ''}`}
                      onClick={() => handleRadioClick('tcc', opt)}
                    >
                      <input type="radio" checked={formData.tcc === opt} readOnly />
                      {opt === 'Valid' ? 'Valid' : opt === 'Expired' ? 'Expired' : opt === 'Never' ? 'Never obtained' : 'In progress'}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Tax Audit / Query Received? <span className="req">★</span></label>
                <div className="radio-group" id="b-audit">
                  {['Yes', 'No', 'Unsure'].map(opt => (
                    <div 
                      key={opt}
                      className={`radio-option ${formData.audit === opt ? 'selected' : ''}`}
                      onClick={() => handleRadioClick('audit', opt)}
                    >
                      <input type="radio" checked={formData.audit === opt} readOnly />
                      {opt === 'Yes' ? 'Yes' : opt === 'No' ? 'No' : 'Not sure'}
                    </div>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Taxes Currently Filed <span className="req">★</span></label>
                <div className="checkbox-group" id="b-taxes">
                  {['CIT', 'VAT', 'PAYE', 'WHT', 'CGT', 'None'].map(opt => (
                    <div 
                      key={opt}
                      className={`check-option ${formData.taxes.includes(opt) ? 'selected' : ''}`}
                      onClick={() => handleCheckboxClick('taxes', opt)}
                    >
                      <input type="checkbox" checked={formData.taxes.includes(opt)} readOnly />
                      {opt === 'CGT' ? 'Capital Gains' : opt}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Main Tax Concerns <span className="req">★</span></label>
                <div className="checkbox-group" id="b-concerns">
                  {['Avoiding penalties', 'Tax audits', 'Understanding obligations', 'Record keeping', 'VAT compliance', 'PAYE compliance'].map(opt => (
                    <div 
                      key={opt}
                      className={`check-option ${formData.concerns.includes(opt) ? 'selected' : ''}`}
                      onClick={() => handleCheckboxClick('concerns', opt)}
                    >
                      <input type="checkbox" checked={formData.concerns.includes(opt)} readOnly />
                      {opt}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-row full">
              <div className="form-group">
                <label>Specific Tax Issue to Review <span className="req">★</span></label>
                <textarea 
                  value={formData.issue}
                  onChange={e => handleInputChange('issue', e.target.value)}
                  placeholder="Describe any specific tax issue, concern, or question you'd like us to address…"
                />
              </div>
            </div>
          </div>
        )}

        {/* INDIVIDUAL PATH */}
        {currentType === 'individual' && (
          <div id="individual-path" className="visible-section">
            <div className="section-badge">SECTION 1I — INDIVIDUAL DETAILS</div>
            <div className="section-title">Personal Information</div>

            <div className="form-row">
              <div className="form-group">
                <label>Employment Status <span className="req">★</span></label>
                <div className="radio-group" id="i-employ">
                  {['Employed', 'Self-employed', 'Business owner', 'Unemployed', 'Retired'].map(opt => (
                    <div 
                      key={opt}
                      className={`radio-option ${formData.employ === opt ? 'selected' : ''}`}
                      onClick={() => handleRadioClick('employ', opt)}
                    >
                      <input type="radio" checked={formData.employ === opt} readOnly />
                      {opt === 'Unemployed' ? 'Unemployed/Student' : opt}
                    </div>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Employer's Name <span style={{ color: '#888', fontWeight: 400 }}>(if employed)</span></label>
                <input 
                  type="text" 
                  value={formData.employer}
                  onChange={e => handleInputChange('employer', e.target.value)}
                  placeholder="Company / Organisation name" 
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Primary Occupation / Field <span className="req">★</span></label>
                <input 
                  type="text" 
                  value={formData.occupation}
                  onChange={e => handleInputChange('occupation', e.target.value)}
                  placeholder="e.g. Software Engineer, Nurse, Trader" 
                />
              </div>
              <div className="form-group">
                <label>State of Tax Residence <span className="req">★</span></label>
                <select 
                  value={formData.state} 
                  onChange={e => handleInputChange('state', e.target.value)}
                >
                  <option value="">Select state…</option>
                  {statesOfResidence.map(st => <option key={st}>{st}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Estimated Annual Income <span className="req">★</span></label>
                <div className="radio-group" id="i-income">
                  {['<3M', '3-10M', '10-30M', '>30M'].map(opt => (
                    <div 
                      key={opt}
                      className={`radio-option ${formData.income === opt ? 'selected' : ''}`}
                      onClick={() => handleRadioClick('income', opt)}
                    >
                      <input type="radio" checked={formData.income === opt} readOnly />
                      {opt === '<3M' ? 'Under ₦3M' : opt === '3-10M' ? '₦3M–₦10M' : opt === '10-30M' ? '₦10M–₦30M' : 'Above ₦30M'}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <hr className="divider" />
            <div className="section-badge">SECTION 2I — INDIVIDUAL TAX PROFILE</div>
            <div className="section-title">Personal Tax Compliance</div>

            <div className="form-row">
              <div className="form-group">
                <label>Sources of Income <span className="req">★</span></label>
                <div className="checkbox-group" id="i-sources">
                  {['Salary', 'Freelance', 'Rental', 'Business', 'Investment', 'Foreign'].map(opt => (
                    <div 
                      key={opt}
                      className={`check-option ${formData.incomeSources.includes(opt) ? 'selected' : ''}`}
                      onClick={() => handleCheckboxClick('incomeSources', opt)}
                    >
                      <input type="checkbox" checked={formData.incomeSources.includes(opt)} readOnly />
                      {opt === 'Salary' ? 'Salary/Wages' : opt === 'Freelance' ? 'Freelance/Contract' : opt === 'Rental' ? 'Rental Income' : opt === 'Business' ? 'Business Profits' : opt === 'Investment' ? 'Investment Returns' : 'Foreign Income'}
                    </div>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>PAYE Deducted by Employer? <span className="req">★</span></label>
                <div className="radio-group" id="i-paye">
                  {['Yes', 'No', 'Unsure', 'N/A'].map(opt => (
                    <div 
                      key={opt}
                      className={`radio-option ${formData.paye === opt ? 'selected' : ''}`}
                      onClick={() => handleRadioClick('paye', opt)}
                    >
                      <input type="radio" checked={formData.paye === opt} readOnly />
                      {opt === 'Unsure' ? 'Not sure' : opt}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Filed Tax Return Before? <span className="req">★</span></label>
                <div className="radio-group" id="i-filed">
                  {['Regularly', 'Once/twice', 'Never', 'Unsure'].map(opt => (
                    <div 
                      key={opt}
                      className={`radio-option ${formData.filed === opt ? 'selected' : ''}`}
                      onClick={() => handleRadioClick('filed', opt)}
                    >
                      <input type="radio" checked={formData.filed === opt} readOnly />
                      {opt === 'Regularly' ? 'Yes, regularly' : opt === 'Once/twice' ? 'Once or twice' : opt === 'Never' ? 'Never' : 'Not sure'}
                    </div>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Personal TCC Status <span className="req">★</span></label>
                <div className="radio-group" id="i-tcc">
                  {['Valid', 'Expired', 'Never', 'InProgress'].map(opt => (
                    <div 
                      key={opt}
                      className={`radio-option ${formData.tcc === opt ? 'selected' : ''}`}
                      onClick={() => handleRadioClick('tcc', opt)}
                    >
                      <input type="radio" checked={formData.tcc === opt} readOnly />
                      {opt === 'Valid' ? 'Valid' : opt === 'Expired' ? 'Expired' : opt === 'Never' ? 'Never obtained' : 'In progress'}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Have a TIN? <span className="req">★</span></label>
                <div className="radio-group" id="i-tin">
                  {['Yes', 'No', 'Unsure'].map(opt => (
                    <div 
                      key={opt}
                      className={`radio-option ${formData.tin === opt ? 'selected' : ''}`}
                      onClick={() => handleRadioClick('tin', opt)}
                    >
                      <input type="radio" checked={formData.tin === opt} readOnly />
                      {opt === 'Unsure' ? 'Not sure' : opt}
                    </div>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Tax Query / Notice Received? <span className="req">★</span></label>
                <div className="radio-group" id="i-query">
                  {['Yes', 'No', 'Unsure'].map(opt => (
                    <div 
                      key={opt}
                      className={`radio-option ${formData.query === opt ? 'selected' : ''}`}
                      onClick={() => handleRadioClick('query', opt)}
                    >
                      <input type="radio" checked={formData.query === opt} readOnly />
                      {opt === 'Unsure' ? 'Not sure' : opt}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Main Personal Tax Concerns <span className="req">★</span></label>
                <div className="checkbox-group" id="i-concerns">
                  {['Understanding obligations', 'Getting TCC', 'Avoiding penalties', 'Backlog returns', 'PAYE not remitted', 'Freelance taxation', 'Foreign income'].map(opt => (
                    <div 
                      key={opt}
                      className={`check-option ${formData.concerns.includes(opt) ? 'selected' : ''}`}
                      onClick={() => handleCheckboxClick('concerns', opt)}
                    >
                      <input type="checkbox" checked={formData.concerns.includes(opt)} readOnly />
                      {opt}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-row full">
              <div className="form-group">
                <label>Specific Tax Issue to Review <span className="req">★</span></label>
                <textarea 
                  value={formData.issue}
                  onChange={e => handleInputChange('issue', e.target.value)}
                  placeholder="Describe any specific concern, e.g. unremitted PAYE, rental income, freelance fees not declared…"
                />
              </div>
            </div>
          </div>
        )}

        {currentType && (
          <div id="submit-area" className="visible-section" style={{ marginTop: '24px' }}>
            <div id="val-banner-intake" className={`validation-banner ${validationError ? 'visible' : ''}`}>
              {validationError ? `⚠ ${validationError}` : ''}
            </div>
            
            <div className="consent-block">
              <div className="consent-title">DATA PROTECTION &amp; CONSENT</div>
              <p style={{ marginBottom: '10px' }}>By submitting this form, you confirm that the information provided is accurate and complete to the best of your knowledge, and you consent to Aviel Alpha Secretaries Ltd processing this data for the purpose of preparing your Tax Health Report and related tax advisory services.</p>
              <p style={{ marginBottom: '4px' }}>Your data is handled in accordance with the Nigeria Data Protection Act (NDPA) 2023. It is stored securely, used only for the purposes stated, and never shared with third parties without your explicit consent. You may request deletion of your data at any time by emailing <strong style={{ color: '#ff8c33' }}>avielalphasecretaries@gmail.com</strong>.</p>
              <label className="consent-check">
                <input 
                  type="checkbox" 
                  checked={consent}
                  onChange={e => {
                    setConsent(e.target.checked);
                    setValidationError('');
                  }}
                  id="consent-box" 
                />
                <span>I consent to the collection, processing, and storage of my data. <span className="req">★</span></span>
              </label>
            </div>

            <button 
              type="submit" 
              onClick={handleSubmit}
              id="submit-btn" 
              className="btn-primary" 
              disabled={loading}
            >
              {loading ? <><span className="spinner"></span> Generating Report…</> : '⚡ Generate Tax Health Report'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
