import { useEffect, useState, useMemo } from 'react';
import '../styles/admin-manage.css';

export default function AdminMatchingPage({
  donationItems = [],
  organizationOptions = [],
  matchingInvites = [],
  onSendMatchingInvite,
  onNavigateHome
}) {
  const [apiDonationItems, setApiDonationItems] = useState([]);
  const [apiOrganizations, setApiOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [matchSelections, setMatchSelections] = useState({});
  const [detailModal, setDetailModal] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // API에서 자동 매칭 대기 목록 조회
  useEffect(() => {
    const fetchDonationData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const autoMatchResponse = await fetch('/api/admin/donations/auto-match', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        if (!autoMatchResponse.ok) {
          throw new Error('자동 매칭 목록 조회에 실패했습니다.');
        }
        
        const autoMatchData = await autoMatchResponse.json();
        const autoMatchItems = (autoMatchData.donations || []).map(item => {
          // 디버깅: deliveryMethod 확인
          if (process.env.NODE_ENV === 'development') {
            console.log('기부 항목 데이터:', {
              id: item.id,
              name: item.name,
              deliveryMethod: item.deliveryMethod,
              donationMethod: item.donationMethod
            });
          }
          return {
          ...item,
          owner: item.owner || 'unknown'
          };
        });
        
        setApiDonationItems(autoMatchItems);
        
        // 기관 목록 조회
        const organsResponse = await fetch('/api/admin/donations/organs', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        if (organsResponse.ok) {
          const organsData = await organsResponse.json();
          setApiOrganizations(organsData.organs || []);
        }
      } catch (err) {
        console.error('기부 데이터 조회 오류:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDonationData();
  }, []);

  // 기관 옵션 병합
  const mergedOrganizationOptions = useMemo(() => {
    if (apiOrganizations.length > 0) {
      return apiOrganizations;
    }
    return Array.isArray(organizationOptions) ? organizationOptions : [];
  }, [apiOrganizations, organizationOptions]);

  // 간접 매칭으로 신청되고 승인이 완료되었으며, 아직 기관이 할당되지 않은 항목만 표시
  // (기관이 승인한 항목은 택배 정보 입력 페이지로 분리)
  const autoMatchingQueue = useMemo(() => {
    return apiDonationItems.filter(
      item => item.donationMethod === '자동 매칭' 
              && (item.status === '매칭대기' || item.status === 'IN_PROGRESS')
              && !item.pendingOrganization
              && !item.matchedOrganization // 기관이 승인한 항목은 제외
    );
  }, [apiDonationItems]);

  const pendingInviteList = Array.isArray(matchingInvites) ? matchingInvites : [];

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  const handleCardClick = async (item, event) => {
    // 버튼이나 select 클릭 시에는 모달을 열지 않음
    if (event.target.tagName === 'BUTTON' || 
        event.target.tagName === 'SELECT' || 
        event.target.closest('button') || 
        event.target.closest('select')) {
      return;
    }

    try {
      setDetailLoading(true);
      const response = await fetch(`/api/admin/donations/${item.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('기부 상세 정보를 불러올 수 없습니다.');
      }

      const result = await response.json();
      if (result.success && result.donation) {
        setDetailModal(result.donation);
      } else {
        showToast(result.message || '기부 상세 정보를 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error('기부 상세 조회 오류:', err);
      showToast(err.message || '기부 상세 정보를 불러올 수 없습니다.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSendInvite = async item => {
    const selectedOrg = matchSelections[item.id];
    if (!selectedOrg) {
      window.alert('매칭할 기관을 선택해주세요.');
      return;
    }
    
    try {
      const selectedOrgan = apiOrganizations.find(org => 
        org.username === selectedOrg || org.name === selectedOrg || org.id.toString() === selectedOrg
      );
      
      if (!selectedOrgan) {
        throw new Error('선택한 기관을 찾을 수 없습니다.');
      }
      
      // 기관 할당만 수행 (택배 정보는 별도 페이지에서 입력)
      const response = await fetch(`/api/admin/donations/${item.id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          organId: selectedOrgan.id
        })
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.message || '기관 할당에 실패했습니다.');
      }
      
      showToast(result.message || '기관에 할당되었습니다.');
      setMatchSelections(prev => ({ ...prev, [item.id]: '' }));
      
      // 목록 새로고침 (할당된 항목은 자동으로 제외됨)
      const refreshResponse = await fetch('/api/admin/donations/auto-match', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        const refreshedItems = (refreshData.donations || []).map(i => ({
          ...i,
          owner: i.owner || 'unknown'
        }));
        setApiDonationItems(refreshedItems);
      }
    } catch (err) {
      console.error('기관 할당 오류:', err);
      showToast(err.message || '기관 할당에 실패했습니다.');
    }
  };

  return (
    <div className="admin-manage-page">
      {toast && <div className="toast">{toast}</div>}

      <div className="admin-manage-header">
        <h1>자동 매칭</h1>
        <button type="button" className="btn primary" onClick={() => onNavigateHome('/main')}>
          메인으로
        </button>
      </div>

      <section className="admin-panel">
        <h2>자동 매칭 대기 물품</h2>
        {loading ? (
          <p className="empty-hint">자동 매칭 목록을 불러오는 중...</p>
        ) : error ? (
          <p className="empty-hint" style={{ color: 'red' }}>오류: {error}</p>
        ) : autoMatchingQueue.length === 0 ? (
          <p className="empty-hint">자동 매칭이 필요한 물품이 없습니다.</p>
        ) : (
          <div className="admin-card-list">
            {autoMatchingQueue.map((item) => (
              <article 
                key={item.id} 
                className="admin-card"
                onClick={(e) => handleCardClick(item, e)}
                style={{ cursor: 'pointer' }}
              >
                <div className="admin-card-header">
                  <div>
                    <strong>{item.name}</strong>
                    <p>{item.ownerName || item.owner}</p>
                  </div>
                  <span className="status-chip status-pending">대기</span>
                </div>
                <p className="admin-card-memo">{item.items}</p>
                <div onClick={(e) => e.stopPropagation()}>
                  {/* 기관 선택 영역 */}
                  <div style={{
                    marginTop: '1.5rem',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    border: '1px solid #ddd'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      marginBottom: '1rem'
                    }}>
                      <label style={{ 
                        fontSize: '15px', 
                        fontWeight: '600', 
                        color: '#2f261c',
                        margin: 0
                      }}>
                        기관 선택
                      </label>
                    </div>
                  <select
                    value={matchSelections[item.id] || ''}
                    onChange={(event) =>
                      setMatchSelections((prev) => ({ ...prev, [item.id]: event.target.value }))
                    }
                      style={{
                        width: '100%',
                        padding: '1rem',
                        fontSize: '15px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        backgroundColor: 'white',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">기관을 선택해주세요</option>
                    {mergedOrganizationOptions.map((org) => (
                      <option key={org.username || org.id} value={org.username || org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                  </div>
                  
                  
                  <button 
                    type="button" 
                    className="small-btn primary" 
                    onClick={() => handleSendInvite(item)}
                    style={{
                      width: '100%',
                      marginTop: '1.5rem',
                      padding: '1rem',
                      fontSize: '16px',
                      fontWeight: '600',
                      backgroundColor: '#2f261c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    매칭 제안하기
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <h2>기관 응답 현황</h2>
        {pendingInviteList.length === 0 ? (
          <p className="empty-hint">최근 매칭 제안 내역이 없습니다.</p>
        ) : (
          <div className="admin-table-wrapper mini">
            <table>
              <thead>
                <tr>
                  <th>물품</th>
                  <th>기관</th>
                  <th>상태</th>
                  <th>비고</th>
                </tr>
              </thead>
              <tbody>
                {pendingInviteList.map((invite) => (
                  <tr key={invite.id}>
                    <td>
                      {invite.donorName} / {invite.itemName || invite.itemId}
                    </td>
                    <td>{invite.organizationName}</td>
                    <td>{invite.status}</td>
                    <td>{invite.responseReason || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 상세 정보 모달 */}
      {detailModal && (
        <div className="modal-overlay" onClick={() => setDetailModal(null)}>
          <div 
            className="modal image-modal" 
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative',
              margin: 'auto',
              maxWidth: '1200px',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              background: 'white',
              borderRadius: '12px'
            }}
          >
            {/* 위쪽: 제목 영역 */}
            <div style={{
              width: '100%',
              background: '#f5f5f5',
              padding: '1.5rem 2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #ddd',
              position: 'relative'
            }}>
              <h2 style={{ 
                margin: 0, 
                padding: 0,
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#2f261c'
              }}>
                기부 상세 정보
              </h2>
              <button
                type="button"
                onClick={() => setDetailModal(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.8rem',
                  cursor: 'pointer',
                  color: '#7a6b55',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  padding: 0,
                  lineHeight: 1
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#e0e0e0';
                  e.target.style.color = '#2f261c';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = '#7a6b55';
                }}
              >
                ×
              </button>
            </div>

            {/* 아래쪽: 내용 영역 */}
            <div style={{
              flex: 1,
              padding: '2rem',
              overflowY: 'auto',
              maxHeight: 'calc(90vh - 80px)'
            }}>

            {detailLoading ? (
              <p>상세 정보를 불러오는 중...</p>
            ) : (
              <div className="modal-content">
                {/* 이미지 */}
                {(() => {
                  let imageList = [];
                  if (detailModal.imageUrls && Array.isArray(detailModal.imageUrls) && detailModal.imageUrls.length > 0) {
                    imageList = detailModal.imageUrls;
                  } else if (detailModal.imageUrl) {
                    imageList = [detailModal.imageUrl];
                  } else if (detailModal.images && Array.isArray(detailModal.images)) {
                    imageList = detailModal.images.map(img => img.url || img.dataUrl || img);
                  }

                  if (imageList.length > 0) {
                    return (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ marginBottom: '0.75rem', color: '#2f261c' }}>이미지</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {imageList.map((img, index) => {
                            let imageUrl = img;
                            if (imageUrl && typeof imageUrl === 'string') {
                              if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://') && !imageUrl.startsWith('data:')) {
                                if (imageUrl.startsWith('/uploads/')) {
                                  imageUrl = imageUrl;
                                } else {
                                  imageUrl = `/uploads/${imageUrl}`;
                                }
                              }
                            }
                            return (
                              <img
                                key={index}
                                src={imageUrl}
                                alt={`기부 물품 ${index + 1}`}
                                style={{
                                  width: '100%',
                                  maxWidth: '300px',
                                  height: 'auto',
                                  borderRadius: '8px',
                                  border: '1px solid #ddd',
                                  objectFit: 'cover'
                                }}
                                onError={(e) => {
                                  console.error('이미지 로드 실패:', imageUrl);
                                  e.target.style.display = 'none';
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* 물품 정보 */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ marginBottom: '0.75rem', color: '#2f261c' }}>물품 정보</h3>
                  <div style={{ padding: '1rem', background: '#f9f9f9', borderRadius: '8px' }}>
                    <p style={{ margin: '0.5rem 0' }}><strong>물품명:</strong> {detailModal.items || detailModal.name || '-'}</p>
                    <p style={{ margin: '0.5rem 0' }}><strong>카테고리:</strong> {detailModal.detailCategory || detailModal.category || '-'}</p>
                    <p style={{ margin: '0.5rem 0' }}><strong>상태:</strong> {detailModal.itemDescription || '-'}</p>
                    {detailModal.quantity && <p style={{ margin: '0.5rem 0' }}><strong>수량:</strong> {detailModal.quantity}</p>}
                  </div>
                </div>

                {/* 기부자 정보 */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ marginBottom: '0.75rem', color: '#2f261c' }}>기부자 정보</h3>
                  <div style={{ padding: '1rem', background: '#f9f9f9', borderRadius: '8px' }}>
                    <p style={{ margin: '0.5rem 0' }}><strong>신청자:</strong> {detailModal.ownerName || detailModal.owner || '-'}</p>
                    {detailModal.contact && <p style={{ margin: '0.5rem 0' }}><strong>연락처:</strong> {detailModal.contact}</p>}
                    {detailModal.isAnonymous && <p style={{ margin: '0.5rem 0' }}><strong>익명 요청:</strong> 예</p>}
                  </div>
                </div>

                {/* 기부 방법 및 배송 정보 */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ marginBottom: '0.75rem', color: '#2f261c' }}>기부 방법 및 배송 정보</h3>
                  <div style={{ padding: '1rem', background: '#f9f9f9', borderRadius: '8px' }}>
                    <p style={{ margin: '0.5rem 0' }}><strong>기부 방법:</strong> {detailModal.donationMethod || '자동 매칭'}</p>
                    {detailModal.deliveryMethod && <p style={{ margin: '0.5rem 0' }}><strong>배송 방식:</strong> {detailModal.deliveryMethod}</p>}
                    {detailModal.desiredDate && <p style={{ margin: '0.5rem 0' }}><strong>희망일:</strong> {detailModal.desiredDate}</p>}
                    {detailModal.memo && <p style={{ margin: '0.5rem 0' }}><strong>메모:</strong> {detailModal.memo}</p>}
                  </div>
                </div>

                {/* 상태 정보 */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ marginBottom: '0.75rem', color: '#2f261c' }}>상태 정보</h3>
                  <div style={{ padding: '1rem', background: '#f9f9f9', borderRadius: '8px' }}>
                    <p style={{ margin: '0.5rem 0' }}><strong>현재 상태:</strong> {detailModal.status || '-'}</p>
                    {detailModal.matchingInfo && <p style={{ margin: '0.5rem 0' }}><strong>매칭 정보:</strong> {detailModal.matchingInfo}</p>}
                    {detailModal.rejectionReason && <p style={{ margin: '0.5rem 0' }}><strong>거절 사유:</strong> {detailModal.rejectionReason}</p>}
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

