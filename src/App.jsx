import React, { useState, useEffect } from 'react';
import IntakeForm from './components/IntakeForm';
import ConsultationForm from './components/ConsultationForm';
import Dashboard from './components/Dashboard';
import ReportView from './components/ReportView';
import AuthModal from './components/AuthModal';
import { supabase, isSupabaseConfigured } from './supabase';

export default function App() {
  const [currentView, setCurrentView] = useState('intake'); // intake, corporate, legal, dashboard, report
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isWaOpen, setIsWaOpen] = useState(false);

  // Load Submissions
  useEffect(() => {
    // 1. Initial local load
    const local = JSON.parse(localStorage.getItem('aviel_submissions') || '[]');
    setSubmissions(local);

    // 2. Auth checks
    if (isSupabaseConfigured) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          setUser(user);
          syncLocalSubmissions(user.id).then(() => fetchUserSubmissions(user.id));
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser(session.user);
          syncLocalSubmissions(session.user.id).then(() => fetchUserSubmissions(session.user.id));
        } else {
          setUser(null);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const syncLocalSubmissions = async (userId) => {
    if (!isSupabaseConfigured) return;
    try {
      const local = JSON.parse(localStorage.getItem('aviel_submissions') || '[]');
      const unsynced = local.filter(s => !s.userId);
      if (unsynced.length > 0) {
        const toSync = unsynced.map(s => ({ ...s, userId }));
        const { error } = await supabase.from('submissions').insert(toSync);
        if (!error) {
          const updatedLocal = local.map(s => s.userId ? s : { ...s, userId });
          localStorage.setItem('aviel_submissions', JSON.stringify(updatedLocal));
        } else {
          console.warn('Error syncing local submissions to DB:', error);
        }
      }
    } catch (e) {
      console.warn('Sync failed:', e);
    }
  };

  const fetchUserSubmissions = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('userId', userId)
        .order('id', { ascending: false });

      if (error) throw error;
      if (data && data.length > 0) {
        // Merge Supabase entries with local entries (removing duplicates)
        setSubmissions(prev => {
          const combined = [...data, ...prev];
          const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
          localStorage.setItem('aviel_submissions', JSON.stringify(unique));
          return unique;
        });
      }
    } catch (e) {
      console.warn('Could not sync with database:', e.message);
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
      setUser(null);
      // Fallback local submissions
      setSubmissions(JSON.parse(localStorage.getItem('aviel_submissions') || '[]'));
    }
  };

  // Tax Risk Calculations
  const calcScore = (data) => {
    let score = 0;
    if (data.type === 'Business') {
      if (data.cac === 'No') score += 10;
      if (data.track === 'Poor') score += 10;
      if (data.consult === 'No') score += 5;
      if (data.returns === 'Never') score += 20;
      else if (data.returns === 'Sometimes') score += 10;
      if (data.tcc === 'Never') score += 15;
      else if (data.tcc === 'Expired') score += 8;
      if (data.audit === 'Yes') score += 20;
      if (!data.taxes || data.taxes.includes('None') || data.taxes.length === 0) score += 15;
    } else {
      if (data.tin === 'No') score += 15;
      if (data.paye === 'No') score += 10;
      if (data.filed === 'Never') score += 20;
      if (data.tcc === 'Never') score += 10;
      if (data.query === 'Yes') score += 20;
      const incSrc = data.incomeSources || [];
      if (incSrc.includes('Freelance') || incSrc.includes('Rental') || incSrc.includes('Foreign')) score += 15;
      if (incSrc.length > 2 && data.filed === 'Never') score += 10;
    }
    return Math.min(score, 100);
  };

  const riskLevel = (score) => {
    if (score >= 60) return 'Critical';
    if (score >= 35) return 'High';
    if (score >= 15) return 'Moderate';
    return 'Low';
  };

  const generateFallbackReport = (d) => {
    const isBiz = d.type === 'Business';
    return `1. Executive Summary\nBased on the information provided, ${d.name}${isBiz ? ' (' + (d.bizName||'') + ')' : ''} presents a ${d.risk} tax compliance risk with a score of ${d.score}/100. ${d.risk === 'Critical' || d.risk === 'High' ? 'Immediate attention is required to address several compliance gaps.' : 'There are areas for improvement that should be addressed in the coming months.'}\n\n2. ${isBiz ? 'Business Registration & Compliance Status' : 'TIN Status'}\n${isBiz ? `CAC registration status: ${d.cac}. ${d.cac === 'No' ? 'Registration with the Corporate Affairs Commission is strongly advised to formalise operations and tax obligations.' : 'Business registration is in order.'}` : `TIN status: ${d.tin}. ${d.tin === 'No' ? 'TIN registration with the Joint Tax Board (JTB) is the first and most critical step — without it, no tax compliance can proceed.' : 'TIN appears to be in place.'}`}\n\n3. ${isBiz ? 'Tax Return Filing History' : 'PAYE & Filing Compliance'}\n${isBiz ? `The business ${d.returns === 'Never' ? 'has never filed tax returns. This creates significant exposure to penalties under CITA and FIRS regulations.' : d.returns === 'Sometimes' ? 'files returns inconsistently, which creates gaps and potential penalties.' : 'has a regular filing history, which is positive.'}` : `PAYE deduction status: ${d.paye}. Personal income tax filing history: ${d.filed}. ${d.filed === 'Never' ? 'Non-filing of personal returns carries penalties under PITA and should be addressed urgently.' : ''}`}\n\n4. Tax Clearance Certificate\nTCC Status: ${d.tcc}. ${d.tcc === 'Never' ? 'A TCC has never been obtained. This is a significant gap — TCCs are required for government contracts, bank loans, and travel documentation.' : d.tcc === 'Expired' ? 'The TCC has expired and should be renewed immediately.' : d.tcc === 'Valid' ? 'A valid TCC is in place — this is excellent.' : 'TCC is in progress.'}\n\n5. Risk Areas Identified\n${d.risk === 'Critical' ? 'CRITICAL: Multiple serious compliance failures detected. Immediate engagement with a tax professional is essential to avoid enforcement action.' : d.risk === 'High' ? 'HIGH: Several compliance gaps exist that could result in penalties if not addressed promptly.' : 'MODERATE: Some areas need attention but overall risk is manageable.'}\n\n6. Recommendations\nImmediate: ${d.tcc !== 'Valid' ? 'Initiate TCC application. ' : ''}${isBiz && d.returns === 'Never' ? 'Begin back-filing of outstanding returns. ' : ''}${!isBiz && d.tin === 'No' ? 'Register for TIN immediately. ' : ''}Address any audit queries.\n\nWithin 90 days: Establish regular filing schedule. Organise financial records. Engage a tax consultant if not already done.\n\nLong-term: Maintain annual compliance calendar. Keep TCC renewed. Engage proactively with relevant tax authority.\n\n7. How Aviel Alpha Can Help\nAviel Alpha Secretaries Ltd can assist with TIN registration, TCC processing, back-filing of outstanding returns, FIRS correspondence, and ongoing tax advisory. Contact us to schedule a full consultation.`;
  };

  const buildPrompt = (d) => {
    if (d.type === 'Business') {
      return `You are a senior Nigerian tax consultant at Aviel Alpha Secretaries Ltd. Write a concise, professional Tax Health Report for this business client. Use plain language, no markdown headers, just flowing professional paragraphs for each section numbered 1–8.
Client: ${d.name} | Business: ${d.bizName || 'N/A'} | Industry: ${d.industry || 'N/A'} | Revenue: ${d.revenue} | Employees: ${d.employees} | CAC: ${d.cac} | Years: ${d.years} | Finance tracking: ${d.track} | Tax consultant: ${d.consult} | Files returns: ${d.returns} | TCC: ${d.tcc} | Tax audit received: ${d.audit} | Taxes filed: ${(d.taxes||[]).join(', ')||'None'} | Concerns: ${(d.concerns||[]).join(', ')||'None'} | Specific issue: ${d.issue||'None'} | Risk Score: ${d.score}/100 (${d.risk})
Write sections: 1. Executive Summary  2. Business Registration Status  3. Tax Compliance Overview  4. Tax Clearance Certificate Status  5. Audit & Query Risk  6. Compliance Gaps & Risk Areas  7. Recommendations (Immediate / 90-day / Long-term)  8. How Aviel Alpha Can Help. Keep total under 600 words. Professional, direct, actionable.`;
    } else {
      return `You are a senior Nigerian tax consultant at Aviel Alpha Secretaries Ltd. Write a concise professional Individual Tax Health Report. Plain paragraphs numbered 1–8, no markdown.
Client: ${d.name} | Employment: ${d.employ} | Employer: ${d.employer||'N/A'} | Occupation: ${d.occupation||'N/A'} | State: ${d.state} | Income range: ${d.income} | Income sources: ${(d.incomeSources||[]).join(', ')||'N/A'} | PAYE deducted: ${d.paye} | Filed returns before: ${d.filed} | TCC: ${d.tcc} | TIN: ${d.tin} | Tax query received: ${d.query} | Concerns: ${(d.concerns||[]).join(', ')||'None'} | Specific issue: ${d.issue||'None'} | Risk Score: ${d.score}/100 (${d.risk})
Write sections: 1. Executive Summary  2. Tax Identification Number (TIN) Status  3. PAYE Compliance Review  4. Income Sources Assessment  5. Tax Clearance Certificate Status  6. Filing History & Compliance Gap  7. Risk Areas & Recommendations  8. How Aviel Alpha Can Help. Under 600 words. Professional, clear, actionable for a Nigerian individual taxpayer.`;
    }
  };

  const handleIntakeSubmit = async (formData, resetCallback) => {
    setLoading(true);
    const score = calcScore(formData);
    const risk = riskLevel(score);

    const submissionData = {
      ...formData,
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      score,
      risk,
      userId: user ? user.id : undefined
    };

    // AI Report Generation call
    try {
      const prompt = buildPrompt(submissionData);
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20240620',
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const result = await res.json();
      submissionData.reportText = result.content?.map(c => c.text || '').join('') || generateFallbackReport(submissionData);
    } catch (e) {
      console.warn('Report generation failed, using fallback report:', e);
      submissionData.reportText = generateFallbackReport(submissionData);
    }

    // Save locally
    const updated = [submissionData, ...submissions];
    setSubmissions(updated);
    localStorage.setItem('aviel_submissions', JSON.stringify(updated));

    // Save in Supabase database if logged in
    if (user && isSupabaseConfigured) {
      try {
        await supabase.from('submissions').insert([submissionData]);
      } catch (e) {
        console.warn('Failed to insert record in cloud database:', e);
      }
    }

    // Dispatch webhook & emails
    try {
      await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...submissionData,
          taxes: (submissionData.taxes || []).join(', '),
          concerns: (submissionData.concerns || []).join(', '),
          incomeSources: (submissionData.incomeSources || []).join(', ')
        })
      });

      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: submissionData.email,
          subject: `Your Tax Health Report — Aviel Alpha`,
          clientName: submissionData.name,
          score: submissionData.score,
          risk: submissionData.risk,
          reportText: submissionData.reportText,
          message: 'Please find your Tax Health Report below.',
          submission: submissionData
        })
      });
    } catch (e) {
      console.warn('Failed to sync webhook/email triggers:', e);
    }

    setLoading(false);
    resetCallback();
    setSelectedSubmission(submissionData);
    setCurrentView('report');
  };

  const handleConsultSubmit = async (consultData, resetCallback) => {
    setLoading(true);

    // Save locally
    const updated = [consultData, ...submissions];
    setSubmissions(updated);
    localStorage.setItem('aviel_submissions', JSON.stringify(updated));

    // Save in Supabase database if logged in
    if (user && isSupabaseConfigured) {
      try {
        await supabase.from('submissions').insert([consultData]);
      } catch (e) {
        console.warn('Failed to insert record in cloud database:', e);
      }
    }

    // Sync webhook & email
    try {
      await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(consultData)
      });

      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: consultData.email,
          subject: `Consultation Request: ${consultData.type}`,
          clientName: consultData.name,
          score: 0,
          risk: 'Request',
          reportText: `NATURE OF ENQUIRY: ${consultData.details?.enquiry || consultData.details?.matterType}\n\nMATTER SUMMARY:\n${consultData.summary}\n\nOur team will review your request and send payment instructions shortly.`,
          message: `Thank you for requesting a ${consultData.type}. We have received your details and are reviewing your matter.`
        })
      });
    } catch (e) {
      console.warn('Failed to sync webhook/email triggers:', e);
    }

    setLoading(false);
    resetCallback();
    setCurrentView('dashboard');
  };

  return (
    <div>
      {/* Header */}
      <div className="header">
        <div className="logo-wrap">
          <img src="/logo.png" className="logo-img" alt="Aviel Alpha Logo" />
          <div>
            <div className="logo">Aviel Alpha <span>Secretaries</span></div>
            <div className="tagline">Integrated Tax Service System</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {user ? (
            <div className="auth-status-bar">
              Logged in as <span className="user-email">{user.email}</span>
              <button className="btn-logout" onClick={handleLogout}>Log Out</button>
            </div>
          ) : (
            <button className="btn-secondary" style={{ padding: '6px 14px' }} onClick={() => setIsAuthOpen(true)}>
              🔐 Sign In
            </button>
          )}

          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.65rem', color: '#888', textAlign: 'right' }}>
            Business &amp; Individual<br />Unified Campaign
          </div>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="nav">
        {[
          { key: 'intake', label: '📋 Intake Form' },
          { key: 'corporate', label: '🏢 Corporate Consultation' },
          { key: 'legal', label: '⚖️ Legal Consultation' },
          { key: 'dashboard', label: '📊 Dashboard' }
        ].map(tab => (
          <button 
            key={tab.key}
            className={`nav-btn ${currentView === tab.key ? 'active' : ''}`}
            onClick={() => {
              setCurrentView(tab.key);
              setSelectedSubmission(null);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Views */}
      <div className="view-container">
        {currentView === 'intake' && !selectedSubmission && (
          <IntakeForm onSubmit={handleIntakeSubmit} loading={loading} user={user} />
        )}
        
        {currentView === 'corporate' && (
          <ConsultationForm type="corporate" onSubmit={handleConsultSubmit} loading={loading} />
        )}

        {currentView === 'legal' && (
          <ConsultationForm type="legal" onSubmit={handleConsultSubmit} loading={loading} />
        )}

        {currentView === 'dashboard' && !selectedSubmission && (
          <Dashboard 
            submissions={submissions} 
            onViewReport={(sub) => {
              setSelectedSubmission(sub);
              setCurrentView('report');
            }} 
          />
        )}

        {currentView === 'report' && selectedSubmission && (
          <ReportView 
            submission={selectedSubmission} 
            onClose={() => {
              setSelectedSubmission(null);
              setCurrentView(submissions.findIndex(x => x.id === selectedSubmission.id) !== -1 ? 'dashboard' : 'intake');
            }} 
          />
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        onAuthSuccess={(u) => {
          setUser(u);
          fetchUserSubmissions(u.id);
        }} 
      />

      {/* WhatsApp Float Button & popup */}
      <div className="wa-float">
        <div className={`wa-popup ${isWaOpen ? 'open' : ''}`}>
          <div className="wa-popup-title">Aviel WhatsApp Helplines</div>
          <a href="https://wa.me/2348098319696" target="_blank" rel="noopener noreferrer" className="wa-contact">
            <span className="wa-icon">🏢</span>
            <div>
              Corporate &amp; Secretarial
              <div className="wa-num">+234 809 831 9696</div>
            </div>
          </a>
          <a href="https://wa.me/2348028711463" target="_blank" rel="noopener noreferrer" className="wa-contact">
            <span className="wa-icon">⚖️</span>
            <div>
              Legal Advisory
              <div className="wa-num">+234 802 871 1463</div>
            </div>
          </a>
        </div>
        <button 
          className={`wa-btn ${isWaOpen ? 'open' : ''}`}
          onClick={() => setIsWaOpen(!isWaOpen)}
        >
          {isWaOpen ? (
            <span className="wa-x" style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 300 }}>&times;</span>
          ) : (
            <svg viewBox="0 0 448 512" style={{ width: '24px', height: '24px' }}>
              <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
