import React, { useState } from 'react';

export default function Dashboard({ submissions, onViewReport }) {
  const [filter, setFilter] = useState('all');

  // Compute Stats
  const totalClients = submissions.length;
  const businessClients = submissions.filter(s => s.type === 'Business').length;
  const individualClients = submissions.filter(s => s.type === 'Individual').length;
  const criticalOrHighClients = submissions.filter(s => s.risk === 'Critical' || s.risk === 'High').length;

  const filteredSubmissions = submissions.filter(s => {
    if (filter === 'all') return true;
    if (filter === 'Business') return s.type === 'Business';
    if (filter === 'Individual') return s.type === 'Individual';
    if (filter === 'Critical') return s.risk === 'Critical';
    if (filter === 'High') return s.risk === 'High';
    return true;
  });

  const getBadgeClass = (type) => {
    switch (type) {
      case 'Business': return 'badge-business';
      case 'Individual': return 'badge-individual';
      default: return 'badge-moderate';
    }
  };

  const getRiskClass = (risk) => {
    switch (risk) {
      case 'Critical': return 'critical';
      case 'High': return 'high';
      case 'Moderate': return 'moderate';
      case 'Low': return 'low';
      default: return 'low';
    }
  };

  return (
    <div id="view-dashboard" className="view active" style={{ display: 'block' }}>
      <div className="view-title">Tax Dashboard</div>
      <div className="view-sub">All client submissions — Business &amp; Individual unified view.</div>

      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{totalClients}</div>
          <div className="stat-label">Total Clients</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{businessClients}</div>
          <div className="stat-label">Business Clients</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{individualClients}</div>
          <div className="stat-label">Individual Clients</div>
        </div>
        <div className="stat-card red">
          <div className="stat-value">{criticalOrHighClients}</div>
          <div className="stat-label">High / Critical Risk</div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="filter-row">
        {[
          { key: 'all', label: 'All Clients' },
          { key: 'Business', label: 'Business Only' },
          { key: 'Individual', label: 'Individual Only' },
          { key: 'Critical', label: 'Critical Risk' },
          { key: 'High', label: 'High Risk' }
        ].map(btn => (
          <button 
            key={btn.key}
            className={`filter-btn ${filter === btn.key ? 'active' : ''}`}
            onClick={() => setFilter(btn.key)}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Unified Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Client Type</th>
              <th>Name</th>
              <th>Email</th>
              <th>Location</th>
              <th>Role / Enquiry</th>
              <th>Rev / Income</th>
              <th>TCC Status</th>
              <th>Risk Score</th>
              <th>Risk Level</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubmissions.length === 0 ? (
              <tr>
                <td colSpan="11" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                  No submissions match the selected filter.
                </td>
              </tr>
            ) : (
              filteredSubmissions.map((s, index) => {
                const isConsult = s.type.includes('Consultation');
                const roleDisplay = s.type === 'Business' ? (s.role || '—') : (s.type === 'Individual' ? (s.employ || '—') : (s.details?.enquiry || s.details?.matterType || '—'));
                const revenueDisplay = s.type === 'Business' ? (s.revenue || '—') : (s.type === 'Individual' ? (s.income || '—') : 'Consultation');
                const tccDisplay = isConsult ? '—' : (s.tcc || '—');
                const riskDisplay = isConsult ? 'Request' : s.risk;
                const scoreDisplay = isConsult ? '—' : s.score;

                return (
                  <tr key={s.id || index}>
                    <td style={{ color: '#888', fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.7rem' }}>{index + 1}</td>
                    <td>
                      <span className={`badge ${getBadgeClass(s.type)}`}>
                        {s.type}
                      </span>
                    </td>
                    <td><strong>{s.name}</strong></td>
                    <td style={{ fontSize: '0.78rem' }}>{s.email}</td>
                    <td>{s.location || '—'}</td>
                    <td style={{ fontSize: '0.82rem' }}>{roleDisplay}</td>
                    <td style={{ fontSize: '0.82rem' }}>{revenueDisplay}</td>
                    <td>
                      {isConsult ? '—' : (
                        <span className={`badge badge-${tccDisplay === 'Valid' ? 'moderate' : 'high'}`}>
                          {tccDisplay}
                        </span>
                      )}
                    </td>
                    <td>
                      {isConsult ? '—' : (
                        <div className="score-bar">
                          <div className="score-track">
                            <div 
                              className={`score-fill ${
                                s.risk === 'Critical' ? 'fill-critical' : s.risk === 'High' ? 'fill-high' : 'fill-moderate'
                              }`}
                              style={{ width: `${s.score}%` }}
                            ></div>
                          </div>
                          <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.72rem', minWidth: '24px' }}>
                            {scoreDisplay}
                          </span>
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-${getRiskClass(riskDisplay)}`}>
                        {riskDisplay}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn-secondary"
                        style={{ padding: '5px 12px', fontSize: '0.65rem' }}
                        onClick={() => onViewReport(s)}
                      >
                        {isConsult ? 'Details' : 'Report'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
