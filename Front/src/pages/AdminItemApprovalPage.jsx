import { useEffect, useState, useMemo } from 'react';
import '../styles/admin-manage.css';

export default function AdminItemApprovalPage({
  donationItems = [],
  onNavigateHome
}) {
  const [apiDonationItems, setApiDonationItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [imageModal, setImageModal] = useState(null);
  const [reasonModal, setReasonModal] = useState(null);
  const [reasonText, setReasonText] = useState('');
  const [pendingItemUpdates, setPendingItemUpdates] = useState({});
  const [activeFilter, setActiveFilter] = useState('pending'); // 'pending', 'approved', 'rejected'

  const allowedAdminStatuses = new Set(['승인대기', '매칭대기', '매칭됨', '거절됨']);

  // API에서 기부 목록 조회
  useEffect(() => {
    const fetchDonationData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let apiEndpoint = '/api/admin/donations/pending';
        if (activeFilter === 'approved') {
          apiEndpoint = '/api/admin/donations/approved';
        } else if (activeFilter === 'rejected') {
          apiEndpoint = '/api/admin/donations/rejected';
        }
        
        const response = await fetch(apiEndpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('기부 목록 조회에 실패했습니다.');
        }
        
        const data = await response.json();
        const items = (data.donations || []).map(item => ({
          ...item,
          owner: item.owner || 'unknown'
        }));
        
        setApiDonationItems(items);
      } catch (err) {
        console.error('기부 목록 조회 오류:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDonationData();
  }, [activeFilter]);

  // API 데이터만 사용 (더미 데이터 제거)
  const donationQueue = apiDonationItems;

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  const formatStatusLabel = status => {
    switch (status) {
      case '승인대기': return '승인대기';
      case '매칭대기': return '매칭대기';
      case '매칭됨': return '매칭됨';
      case '거절됨': return '거절됨';
      case '배송대기': return '배송대기';
      default: return status;
    }
  };

  const getMatchingMemoText = (item) => {
    if (item.matchingInfo) return item.matchingInfo;
    if (item.rejectionReason) return `거절 사유: ${item.rejectionReason}`;
    if (item.pendingOrganization) return `${item.pendingOrganization} 기관 확인 중입니다.`;
    if (item.matchedOrganization) return `${item.matchedOrganization} 기관에 매칭됨`;
    return '-';
  };

  const handleDonationAction = async (item, nextStatus, options = {}) => {
    try {
      if (nextStatus === '매칭대기') {
        const response = await fetch(`/api/admin/donations/${item.id}/approve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        const result = await response.json();
        
        if (!response.ok || !result.success) {
          throw new Error(result.message || '기부 승인에 실패했습니다.');
        }
        
        showToast(result.message || '기부가 승인되었습니다.');
        
        // 목록 완전 새로고침
        await refreshDonationList();
      }
    } catch (err) {
      console.error('기부 상태 변경 오류:', err);
      showToast(err.message || '기부 상태 변경에 실패했습니다.');
    }
  };

  // 목록 새로고침 함수
  const refreshDonationList = async () => {
    try {
      let apiEndpoint = '/api/admin/donations/pending';
      if (activeFilter === 'approved') {
        apiEndpoint = '/api/admin/donations/approved';
      } else if (activeFilter === 'rejected') {
        apiEndpoint = '/api/admin/donations/rejected';
      }
      
      const response = await fetch(apiEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('기부 목록 조회에 실패했습니다.');
      }
      
      const data = await response.json();
      const refreshedItems = (data.donations || []).map(i => ({
        ...i,
        owner: i.owner || 'unknown'
      }));
      
      setApiDonationItems(refreshedItems);
    } catch (err) {
      console.error('목록 새로고침 오류:', err);
      showToast('목록을 새로고침하는 중 오류가 발생했습니다.');
    }
  };

  const handleRejectItem = item => {
    setReasonModal({
      type: 'item',
      item,
      title: '물품 거절 사유',
      placeholder: '거절 사유를 입력해주세요.'
    });
  };

  const queueItemUpdate = (item, nextStatus, options = {}, label) => {
    setPendingItemUpdates(prev => ({
      ...prev,
      [item.id]: { item, nextStatus, options, label }
    }));
    showToast('변경이 대기 중입니다. 저장을 눌러 적용하세요.');
  };

  const clearPendingUpdate = itemId => {
    setPendingItemUpdates(prev => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  const applyPendingUpdate = itemId => {
    const pending = pendingItemUpdates[itemId];
    if (!pending) return;
    handleDonationAction(pending.item, pending.nextStatus, pending.options);
    clearPendingUpdate(itemId);
    showToast('물품 상태가 저장되었습니다.');
  };

  const openImageModal = ({ title, images, description, memo, deliveryMethod, desiredDate, contact, owner }) => {
    if (!images || images.length === 0) return;
    setImageModal({ title, images, description, memo, deliveryMethod, desiredDate, contact, owner });
  };

  const handleReasonConfirm = async () => {
    if (!reasonModal) return;
    const trimmed = reasonText.trim();
    if (!trimmed) return;

    if (reasonModal.type === 'item') {
      try {
        const response = await fetch(`/api/admin/donations/${reasonModal.item.id}/reject`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            reason: trimmed
          })
        });
        
        const result = await response.json();
        
        if (!response.ok || !result.success) {
          throw new Error(result.message || '기부 반려에 실패했습니다.');
        }
        
        showToast(result.message || '기부가 반려되었습니다.');
        
        // 목록 완전 새로고침
        await refreshDonationList();
      } catch (err) {
        console.error('기부 반려 오류:', err);
        showToast(err.message || '기부 반려에 실패했습니다.');
      }
    }

    setReasonModal(null);
    setReasonText('');
  };

  return (
    <div className="admin-manage-page">
      {toast && <div className="toast">{toast}</div>}

      <div className="admin-manage-header">
        <h1>물품 승인</h1>
        <button type="button" className="btn primary" onClick={() => {
          if (typeof onNavigateHome === 'function') {
            onNavigateHome()
          }
        }}>
          메인으로
        </button>
      </div>

      {/* 필터 탭 */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '2px solid #eee', paddingBottom: '0.5rem' }}>
        <button
          type="button"
          onClick={() => setActiveFilter('pending')}
          style={{
            padding: '0.5rem 1.5rem',
            border: 'none',
            background: activeFilter === 'pending' ? '#4a90e2' : 'transparent',
            color: activeFilter === 'pending' ? 'white' : '#666',
            cursor: 'pointer',
            borderRadius: '4px 4px 0 0',
            fontWeight: activeFilter === 'pending' ? 'bold' : 'normal',
            borderBottom: activeFilter === 'pending' ? '2px solid #4a90e2' : '2px solid transparent',
            marginBottom: activeFilter === 'pending' ? '-2px' : '0'
          }}
        >
          승인 대기
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('approved')}
          style={{
            padding: '0.5rem 1.5rem',
            border: 'none',
            background: activeFilter === 'approved' ? '#4a90e2' : 'transparent',
            color: activeFilter === 'approved' ? 'white' : '#666',
            cursor: 'pointer',
            borderRadius: '4px 4px 0 0',
            fontWeight: activeFilter === 'approved' ? 'bold' : 'normal',
            borderBottom: activeFilter === 'approved' ? '2px solid #4a90e2' : '2px solid transparent',
            marginBottom: activeFilter === 'approved' ? '-2px' : '0'
          }}
        >
          승인 완료
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('rejected')}
          style={{
            padding: '0.5rem 1.5rem',
            border: 'none',
            background: activeFilter === 'rejected' ? '#4a90e2' : 'transparent',
            color: activeFilter === 'rejected' ? 'white' : '#666',
            cursor: 'pointer',
            borderRadius: '4px 4px 0 0',
            fontWeight: activeFilter === 'rejected' ? 'bold' : 'normal',
            borderBottom: activeFilter === 'rejected' ? '2px solid #4a90e2' : '2px solid transparent',
            marginBottom: activeFilter === 'rejected' ? '-2px' : '0'
          }}
        >
          거절됨
        </button>
      </div>

      <section className="admin-panel">
        {loading ? (
          <p className="empty-hint">기부 목록을 불러오는 중...</p>
        ) : error ? (
          <p className="empty-hint" style={{ color: 'red' }}>오류: {error}</p>
        ) : donationQueue.length === 0 ? (
          <p className="empty-hint">등록된 기부 물품이 없습니다.</p>
        ) : (
          <div className="admin-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>이미지</th>
                  <th>물품</th>
                  <th>신청자</th>
                  <th>기부 방법</th>
                  <th>현재 상태</th>
                  <th>최근 메모</th>
                  <th>조치</th>
                </tr>
              </thead>
              <tbody>
                {donationQueue.map((item) => {
                  const pendingUpdate = pendingItemUpdates[item.id];
                  return (
                    <tr key={item.id}>
                      <td className="item-image-cell">
                        {item.images?.length && item.images[0] ? (
                          (() => {
                            let imageUrl = item.images[0].dataUrl || item.images[0].url || item.images[0];
                            const hasValidUrl = imageUrl && typeof imageUrl === 'string' && imageUrl.trim().length > 0;
                            
                            if (!hasValidUrl) {
                              return <span className="text-muted">이미지 없음</span>;
                            }
                            
                            // 이미지 URL 처리: 상대 경로 사용
                            if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://') && !imageUrl.startsWith('data:')) {
                              if (imageUrl.startsWith('/uploads/')) {
                                imageUrl = imageUrl;
                              } else {
                                imageUrl = `/uploads/${imageUrl}`;
                              }
                            }
                            
                            return (
                              <button
                                type="button"
                                className="image-large-button"
                                onClick={() =>
                                  openImageModal({
                                    title: item.name || '기부 물품',
                                    images: item.images,
                                    description: item.itemDescription,
                                    memo: item.memo,
                                    deliveryMethod: item.deliveryMethod,
                                    desiredDate: item.desiredDate,
                                    contact: item.contact,
                                    owner: item.ownerName || item.owner
                                  })
                                }
                              >
                                <img
                                  className="item-image-large"
                                  src={imageUrl}
                                  alt="기부 물품"
                                  onError={(e) => {
                                    console.error('이미지 로드 실패:', imageUrl);
                                    e.target.style.display = 'none';
                                  }}
                                />
                                <span className="image-zoom-icon">
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <circle cx="11" cy="11" r="6" />
                                    <line x1="16" y1="16" x2="22" y2="22" />
                                  </svg>
                                </span>
                              </button>
                            );
                          })()
                        ) : (
                          <span className="text-muted">이미지 없음</span>
                        )}
                      </td>
                      <td>
                        <div className="text-strong">{item.items || item.name}</div>
                        {item.itemDescription && <p className="item-detail">{item.itemDescription}</p>}
                        <div className="item-meta">
                          {item.deliveryMethod && <div>배송: {item.deliveryMethod}</div>}
                          {item.desiredDate && <div>희망일: {item.desiredDate}</div>}
                          {item.memo && <div>메모: {item.memo}</div>}
                        </div>
                      </td>
                      <td>
                        <div className="text-strong">{item.ownerName || item.owner}</div>
                        {item.isAnonymous && <span className="anon-chip">익명 요청</span>}
                      </td>
                      <td>{item.donationMethod || '자동 매칭'}</td>
                      <td>{item.status}</td>
                      <td>
                        <div className="text-muted">{getMatchingMemoText(item)}</div>
                      </td>
                      <td>
                        {pendingUpdate ? (
                          <>
                            <div className="pending-note">
                              변경 예정: {pendingUpdate.label || formatStatusLabel(pendingUpdate.nextStatus)}
                            </div>
                            <div className="admin-card-actions">
                              <button
                                type="button"
                                className="small-btn primary"
                                onClick={() => applyPendingUpdate(item.id)}
                              >
                                저장
                              </button>
                              <button
                                type="button"
                                className="small-btn"
                                onClick={() => clearPendingUpdate(item.id)}
                              >
                                취소
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="admin-card-actions">
                            {(() => {
                              const isDirectMatch =
                                item.donationMethod === '직접 매칭' &&
                                (item.donationOrganizationId || item.donationOrganization);
                              const orgName = item.donationOrganization || item.organization || item.pendingOrganization;
                              const approvalOptions = {
                                matchingInfo: isDirectMatch && orgName
                                  ? `${orgName} 기관 확인 중입니다.`
                                  : '기관 매칭을 기다리는 중입니다.',
                                rejectionReason: '',
                                pendingOrganization: isDirectMatch ? orgName : null,
                                matchedOrganization: null,
                                directMatchOrganization: isDirectMatch ? orgName : null,
                                directMatchOrganizationId: isDirectMatch ? item.donationOrganizationId || null : null
                              };
                              // 상태에 따라 필요한 버튼만 표시
                              if (item.status === '승인대기') {
                                // 승인대기 상태: 승인, 거절 버튼만 일렬로
                                return (
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                      type="button"
                                      className="small-btn approve-btn"
                                      onClick={() => queueItemUpdate(item, '매칭대기', approvalOptions, '승인')}
                                    >
                                      승인
                                    </button>
                                    <button type="button" className="small-btn warning" onClick={() => handleRejectItem(item)}>
                                      거절
                                    </button>
                                  </div>
                                );
                              } else if (item.status === '매칭대기' || item.status === '매칭됨') {
                                // 매칭대기/매칭됨 상태: 텍스트 + 거절, 승인대기 버튼 일렬로
                                return (
                                  <>
                                    <div className="text-muted" style={{ marginBottom: '8px' }}>
                                      {item.status === '매칭됨' ? '매칭 완료' : '매칭 대기중입니다.'}
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                      <button type="button" className="small-btn warning" onClick={() => handleRejectItem(item)}>
                                        거절
                                      </button>
                                      <button 
                                        type="button" 
                                        className="small-btn pending-btn"
                                        onClick={async () => {
                                          try {
                                            const response = await fetch(`/api/admin/donations/${item.id}/reset-to-pending`, {
                                              method: 'POST',
                                              headers: {
                                                'Content-Type': 'application/json'
                                              },
                                              credentials: 'include'
                                            });
                                            
                                            const result = await response.json();
                                            
                                            if (!response.ok || !result.success) {
                                              throw new Error(result.message || '상태 변경에 실패했습니다.');
                                            }
                                            
                                            showToast(result.message || '상태가 승인대기로 변경되었습니다.');
                                            await refreshDonationList();
                                          } catch (err) {
                                            console.error('상태 변경 오류:', err);
                                            showToast(err.message || '상태 변경에 실패했습니다.');
                                          }
                                        }}
                                      >
                                        승인대기
                                      </button>
                                    </div>
                                  </>
                                );
                              } else if (item.status === '거절됨') {
                                // 거절됨 상태: 승인, 승인대기 버튼만 일렬로
                                return (
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                      type="button"
                                      className="small-btn approve-btn"
                                      onClick={() => queueItemUpdate(item, '매칭대기', approvalOptions, '승인')}
                                    >
                                      승인
                                    </button>
                                    <button 
                                      type="button" 
                                      className="small-btn pending-btn"
                                      onClick={async () => {
                                        try {
                                          const response = await fetch(`/api/admin/donations/${item.id}/reset-to-pending`, {
                                            method: 'POST',
                                            headers: {
                                              'Content-Type': 'application/json'
                                            },
                                            credentials: 'include'
                                          });
                                          
                                          const result = await response.json();
                                          
                                          if (!response.ok || !result.success) {
                                            throw new Error(result.message || '상태 변경에 실패했습니다.');
                                          }
                                          
                                          showToast(result.message || '상태가 승인대기로 변경되었습니다.');
                                          await refreshDonationList();
                                        } catch (err) {
                                          console.error('상태 변경 오류:', err);
                                          showToast(err.message || '상태 변경에 실패했습니다.');
                                        }
                                      }}
                                    >
                                      승인대기
                                    </button>
                                  </div>
                                );
                              }
                              
                              // 기본값 (예상치 못한 상태)
                              return null;
                            })()}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {imageModal && (
        <div className="modal-overlay" onClick={() => setImageModal(null)}>
          <div className="modal image-modal" onClick={e => e.stopPropagation()}>
            {imageModal.images?.length ? (
              imageModal.images.map((img, index) => {
                let imageUrl = img.dataUrl || img.url || img;
                
                // 이미지 URL 처리: 상대 경로 사용
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
                    key={img.id || index} 
                    src={imageUrl} 
                    alt="기부 물품" 
                    onError={(e) => {
                      console.error('이미지 로드 실패:', imageUrl);
                      e.target.style.display = 'none';
                    }}
                  />
                );
              })
            ) : (
              <p className="text-muted">등록된 이미지가 없습니다.</p>
            )}
            <div className="modal-buttons" style={{ marginTop: '1.5rem', justifyContent: 'center' }}>
              <button className="small-btn" onClick={() => setImageModal(null)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

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

