import { useState, useEffect } from 'react';
import '../styles/admin-manage.css';

export default function AdminOrgApprovalPage({
  pendingOrganizations = [],
  onApproveOrganization,
  onRejectOrganization,
  onNavigateHome
}) {
  const [toast, setToast] = useState(null);
  const [reasonModal, setReasonModal] = useState(null);
  const [reasonText, setReasonText] = useState('');
  const [orgRequests, setOrgRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // API에서 대기 중인 기관 목록 조회
  useEffect(() => {
    const fetchPendingOrgs = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/orgs/pending', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('기관 목록 조회에 실패했습니다.');
        }

        const data = await response.json();
        const orgs = (data.orgs || []).map(org => ({
          id: org.id,
          organizationName: org.organizationName,
          username: org.username,
          businessNo: org.businessNo,
          submittedAt: org.submittedAt ? new Date(org.submittedAt).toLocaleDateString('ko-KR') : '-',
          status: org.status || 'pending',
          contactName: org.contactName || org.username,
          phone: org.phone || '-',
          email: org.email || '-',
          address: org.address || null
        }));
        
        setOrgRequests(orgs);
      } catch (err) {
        console.error('기관 목록 조회 오류:', err);
        // API 실패 시 props로 받은 데이터 사용 (하위 호환성)
        setOrgRequests(Array.isArray(pendingOrganizations) ? pendingOrganizations : []);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingOrgs();
  }, [pendingOrganizations]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  const handleApproveOrg = async (requestId) => {
    try {
      const response = await fetch(`/api/admin/orgs/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || '기관 승인에 실패했습니다.');
      }

      showToast(result.message || '기관 가입을 승인했습니다.');
      
      // 목록에서 제거
      setOrgRequests(prev => prev.filter(org => org.id !== requestId));
      
      // 기존 콜백도 호출 (하위 호환성)
      if (typeof onApproveOrganization === 'function') {
        onApproveOrganization(requestId);
      }
    } catch (err) {
      console.error('기관 승인 오류:', err);
      showToast(err.message || '기관 승인에 실패했습니다.');
    }
  };

  const openReasonModal = payload => {
    setReasonText('');
    setReasonModal(payload);
  };

  const handleRejectOrg = requestId => {
    openReasonModal({ type: 'org', requestId, title: '기관 가입 거절 사유', placeholder: '거절 사유를 입력해주세요.' });
  };

  const handleReasonConfirm = async () => {
    const trimmed = reasonText.trim();
    if (!trimmed) return;

    if (reasonModal.type === 'org') {
      try {
        const response = await fetch(`/api/admin/orgs/${reasonModal.requestId}/reject`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ reason: trimmed })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || '기관 거부에 실패했습니다.');
        }

        showToast(result.message || '기관 가입을 거절했습니다.');
        
        // 목록에서 제거
        setOrgRequests(prev => prev.filter(org => org.id !== reasonModal.requestId));
        
        setReasonModal(null);
        setReasonText('');
        
        // 기존 콜백도 호출 (하위 호환성)
        if (typeof onRejectOrganization === 'function') {
          onRejectOrganization(reasonModal.requestId, trimmed);
        }
      } catch (err) {
        console.error('기관 거부 오류:', err);
        showToast(err.message || '기관 거부에 실패했습니다.');
      }
    }
  };

  return (
    <div className="admin-manage-page">
      {toast && <div className="toast">{toast}</div>}

      <div className="admin-manage-header">
        <h1>기관 가입 승인</h1>
        <button type="button" className="btn primary" onClick={() => onNavigateHome('/main')}>
          메인으로
        </button>
      </div>

      <section className="admin-panel">
        {loading ? (
          <p className="empty-hint">로딩 중...</p>
        ) : orgRequests.length === 0 ? (
          <p className="empty-hint">대기 중인 기관 가입 요청이 없습니다.</p>
        ) : (
          <div className="admin-card-list">
            {orgRequests.map((request) => (
              <article key={request.id} className="admin-card">
                <div className="admin-card-header">
                  <div className="org-main-info">
                    <div className="org-name-section">
                      <strong className="org-name">{request.organizationName || '-'}</strong>
                      <span className="business-no-badge">사업자번호: {request.businessNo || '-'}</span>
                    </div>
                    <p className="contact-name">담당자: {request.contactName || request.username}</p>
                  </div>
                  <span className={`status-chip status-${request.status}`}>{request.status}</span>
                </div>
                <ul className="admin-card-meta">
                  <li>아이디 : {request.username}</li>
                  <li>연락처 : {request.phone}</li>
                  <li>이메일 : {request.email}</li>
                  <li>신청일 : {request.submittedAt}</li>
                  {request.address && <li>주소 : {request.address}</li>}
                </ul>
                {request.memo && <p className="admin-card-memo">{request.memo}</p>}
                {request.status === 'pending' ? (
                  <div className="admin-card-actions">
                    <button type="button" className="small-btn primary" onClick={() => handleApproveOrg(request.id)}>
                      승인
                    </button>
                    <button type="button" className="small-btn danger" onClick={() => handleRejectOrg(request.id)}>
                      거절
                    </button>
                  </div>
                ) : (
                  <p className="admin-card-result">
                    {request.status === 'approved'
                      ? '승인 완료'
                      : `거절 사유: ${request.rejectionReason || '미입력'}`}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {reasonModal && (
        <div className="modal-overlay" onClick={() => { setReasonModal(null); setReasonText(''); }}>
          <div className="modal reason-modal" onClick={e => e.stopPropagation()}>
            <h2>{reasonModal.title || '사유 입력'}</h2>
            <textarea
              value={reasonText}
              onChange={e => setReasonText(e.target.value)}
              placeholder={reasonModal.placeholder || '내용을 입력해주세요.'}
            />
            <div className="modal-buttons">
              <button
                className="small-btn"
                onClick={() => {
                  setReasonModal(null);
                  setReasonText('');
                }}
              >
                취소
              </button>
              <button
                className="small-btn primary"
                disabled={!reasonText.trim()}
                onClick={handleReasonConfirm}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

