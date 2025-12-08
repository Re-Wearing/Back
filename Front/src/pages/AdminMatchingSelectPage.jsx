import '../styles/admin-manage.css';

export default function AdminMatchingSelectPage({ onNavigateHome }) {
  const handleSelectMatching = (type) => {
    if (type === 'auto') {
      window.location.href = '/admin/manage/matching';
    } else if (type === 'direct') {
      window.location.href = '/admin/manage/matching/direct';
    }
  };

  return (
    <div className="admin-manage-container">
      <div className="admin-manage-header">
        <h1>매칭 관리</h1>
        <button type="button" className="btn primary" onClick={() => onNavigateHome('/main')}>
          메인으로
        </button>
      </div>

      <section className="admin-panel" style={{ padding: '3rem 0' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '2rem',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <div 
            className="admin-card" 
            style={{ 
              cursor: 'pointer',
              textAlign: 'center',
              padding: '3rem 2rem',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onClick={() => handleSelectMatching('auto')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.06)';
            }}
          >
            <h2 style={{ marginBottom: '1rem', color: '#2f261c' }}>자동 매칭</h2>
            <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              사용자가 자동 매칭을 선택한 기부를 관리자가 수동으로 기관에 할당합니다.
            </p>
            <button 
              type="button" 
              className="btn primary"
              style={{ width: '100%' }}
            >
              자동 매칭 관리
            </button>
          </div>

          <div 
            className="admin-card" 
            style={{ 
              cursor: 'pointer',
              textAlign: 'center',
              padding: '3rem 2rem',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onClick={() => handleSelectMatching('direct')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.06)';
            }}
          >
            <h2 style={{ marginBottom: '1rem', color: '#2f261c' }}>직접 매칭</h2>
            <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              사용자가 직접 기관을 선택한 기부를 관리자가 승인하고 관리합니다.
            </p>
            <button 
              type="button" 
              className="btn primary"
              style={{ width: '100%' }}
            >
              직접 매칭 관리
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

