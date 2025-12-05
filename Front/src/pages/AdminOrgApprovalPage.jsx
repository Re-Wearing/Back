import { useState } from 'react';
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

  const orgRequests = Array.isArray(pendingOrganizations) ? pendingOrganizations : [];

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  const handleApproveOrg = requestId => {
    if (typeof onApproveOrganization !== 'function') return;
    onApproveOrganization(requestId);
    showToast('기관 가입을 승인했습니다.');
  };

  const openReasonModal = payload => {
    setReasonText('');
    setReasonModal(payload);
  };

  const handleRejectOrg = requestId => {
    if (typeof onRejectOrganization !== 'function') return;
    openReasonModal({ type: 'org', requestId, title: '기관 가입 거절 사유', placeholder: '거절 사유를 입력해주세요.' });
  };

  const handleReasonConfirm = () => {
    const trimmed = reasonText.trim();
    if (!trimmed) return;

    if (reasonModal.type === 'org' && typeof onRejectOrganization === 'function') {
      onRejectOrganization(reasonModal.requestId, trimmed);
      showToast('기관 가입을 거절했습니다.');
      setReasonModal(null);
      setReasonText('');
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
        {orgRequests.length === 0 ? (
          <p className="empty-hint">대기 중인 기관 가입 요청이 없습니다.</p>
        ) : (
          <div className="admin-card-list">
            {orgRequests.map((request) => (
              <article key={request.id} className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <strong>{request.organizationName}</strong>
                    <p>{request.contactName}</p>
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

