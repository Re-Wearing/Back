import { useEffect, useState, useMemo } from 'react';
import '../styles/admin-manage.css';

export default function AdminDirectMatchingPage({
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
  const [detailModal, setDetailModal] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState({}); // 택배 정보 저장 (item.id를 키로 사용)

  // API에서 직접 매칭 대기 목록 조회
  useEffect(() => {
    const fetchDonationData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 직접 매칭 목록 조회
        const response = await fetch('/api/admin/donations/direct-match', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include'
        });
        
        const contentType = response.headers.get('content-type');
        const responseText = await response.text();
        
        // Content-Type이 JSON이 아니거나 HTML 응답인지 확인
        if (contentType && !contentType.includes('application/json')) {
          console.error('JSON이 아닌 응답을 받았습니다. Content-Type:', contentType);
          if (responseText.trim().startsWith('<') || responseText.trim().startsWith('<!')) {
            console.error('HTML 응답이 반환되었습니다:', responseText.substring(0, 300));
            throw new Error('서버 오류: API 엔드포인트를 찾을 수 없습니다. 백엔드 서버를 재시작해주세요.');
          }
          throw new Error(`예상하지 못한 응답 형식입니다. (Content-Type: ${contentType})`);
        }
        
        // HTML 응답인지 확인 (서버 오류 페이지나 로그인 페이지가 반환된 경우)
        if (responseText.trim().startsWith('<') || responseText.trim().startsWith('<!')) {
          console.error('HTML 응답이 반환되었습니다. API 엔드포인트를 확인하세요:', responseText.substring(0, 300));
          throw new Error('서버 오류: API 엔드포인트를 찾을 수 없습니다. 백엔드 서버를 재시작해주세요.');
        }
        
        if (!response.ok) {
          console.error('직접 매칭 목록 조회 실패:', response.status, responseText);
          throw new Error(`직접 매칭 목록 조회에 실패했습니다. (상태 코드: ${response.status})`);
        }
        
        if (!responseText || responseText.trim() === '') {
          console.warn('직접 매칭 목록 응답이 비어있습니다.');
          setApiDonationItems([]);
        } else {
          try {
            const data = JSON.parse(responseText);
            const directMatchItems = (data.donations || []).map(item => ({
              ...item,
              owner: item.owner || 'unknown'
            }));
            setApiDonationItems(directMatchItems);
          } catch (parseError) {
            console.error('JSON 파싱 오류:', parseError, '응답 내용:', responseText.substring(0, 200));
            throw new Error('서버 응답 형식이 올바르지 않습니다.');
          }
        }
        
        // 기관 목록 조회
        const orgResponse = await fetch('/api/admin/donations/organs', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include'
        });
        
        if (orgResponse.ok) {
          const orgResponseText = await orgResponse.text();
          if (orgResponseText && orgResponseText.trim() !== '') {
            // HTML 응답인지 확인
            if (orgResponseText.trim().startsWith('<') || orgResponseText.trim().startsWith('<!')) {
              console.warn('기관 목록 API가 HTML을 반환했습니다. 기본 기관 목록을 사용합니다.');
            } else {
              try {
                const orgData = JSON.parse(orgResponseText);
                setApiOrganizations(orgData.organs || orgData.organizations || []);
              } catch (parseError) {
                console.error('기관 목록 JSON 파싱 오류:', parseError);
              }
            }
          }
        }
      } catch (err) {
        console.error('직접 매칭 목록 조회 오류:', err);
        setError(err.message || '직접 매칭 목록을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDonationData();
  }, []);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  // 직접 매칭 대기 목록 필터링 (승인 대기 + 기관 수락 완료)
  const directMatchingQueue = useMemo(() => {
    return apiDonationItems.filter(
      item => (item.donationMethod === '직접 매칭' || item.donationMethod === 'DIRECT_MATCH')
    );
  }, [apiDonationItems]);

  // 기관 옵션 병합
  const mergedOrganizationOptions = useMemo(() => {
    if (apiOrganizations.length > 0) {
      return apiOrganizations.map(org => ({
        username: org.username || org.id.toString(),
        name: org.name || org.username,
        id: org.id
      }));
    }
    return organizationOptions;
  }, [apiOrganizations, organizationOptions]);

  const handleApprove = async (item) => {
    try {
      const response = await fetch(`/api/admin/donations/${item.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      const responseText = await response.text();
      if (!responseText || responseText.trim() === '') {
        throw new Error('서버 응답이 비어있습니다.');
      }
      
      const result = JSON.parse(responseText);
      
      if (!response.ok || !result.success) {
        throw new Error(result.message || '기부 승인에 실패했습니다.');
      }
      
      showToast(result.message || '기부가 승인되었습니다.');
      
      // 목록에서 제거
      setApiDonationItems(prev => prev.filter(i => i.id !== item.id));
    } catch (err) {
      console.error('기부 승인 오류:', err);
      showToast(err.message || '기부 승인에 실패했습니다.');
    }
  };

  const handleCardClick = async (item, event) => {
    // 버튼이나 select, input 클릭 시에는 모달을 열지 않음
    if (event.target.tagName === 'BUTTON' || 
        event.target.tagName === 'SELECT' || 
        event.target.tagName === 'INPUT' ||
        event.target.closest('button') || 
        event.target.closest('select') ||
        event.target.closest('input')) {
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

  const handleReject = async (item, reason) => {
    try {
      const response = await fetch(`/api/admin/donations/${item.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ reason })
      });
      
      const responseText = await response.text();
      if (!responseText || responseText.trim() === '') {
        throw new Error('서버 응답이 비어있습니다.');
      }
      
      const result = JSON.parse(responseText);
      
      if (!response.ok || !result.success) {
        throw new Error(result.message || '기부 거절에 실패했습니다.');
      }
      
      showToast(result.message || '기부가 거절되었습니다.');
      
      // 목록에서 제거
      setApiDonationItems(prev => prev.filter(i => i.id !== item.id));
    } catch (err) {
      console.error('기부 거절 오류:', err);
      showToast(err.message || '기부 거절에 실패했습니다.');
    }
  };

  const openDetailModal = async (item) => {
    setDetailModal(item);
    setDetailLoading(true);
    
    try {
      const response = await fetch(`/api/admin/donations/${item.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const responseText = await response.text();
        if (responseText && responseText.trim() !== '') {
          try {
            const data = JSON.parse(responseText);
            setDetailModal(data.donation || data || item);
          } catch (parseError) {
            console.error('JSON 파싱 오류:', parseError);
            setDetailModal(item);
          }
        } else {
          setDetailModal(item);
        }
      }
    } catch (err) {
      console.error('상세 정보 조회 오류:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="admin-manage-container">
      {toast && <div className="toast">{toast}</div>}

      <div className="admin-manage-header">
        <h1>직접 매칭</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            type="button" 
            className="btn secondary" 
            onClick={() => window.location.href = '/admin/manage/matching/select'}
          >
            매칭 선택으로
          </button>
          <button type="button" className="btn primary" onClick={() => onNavigateHome('/main')}>
            메인으로
          </button>
        </div>
      </div>

      <section className="admin-panel">
        <h2>직접 매칭 대기 물품</h2>
        {loading ? (
          <p className="empty-hint">직접 매칭 목록을 불러오는 중...</p>
        ) : error ? (
          <p className="empty-hint" style={{ color: 'red' }}>오류: {error}</p>
        ) : directMatchingQueue.length === 0 ? (
          <p className="empty-hint">직접 매칭이 필요한 물품이 없습니다.</p>
        ) : (
          <div className="admin-card-list">
            {directMatchingQueue.map((item) => {
              const isParcelDelivery = item.deliveryMethod === '택배 배송' || 
                                      item.deliveryMethod === 'PARCEL_DELIVERY' ||
                                      (item.deliveryMethod && item.deliveryMethod.includes('택배'));
              
              return (
                <article 
                  key={item.id} 
                  className="admin-card"
                  onClick={(e) => handleCardClick(item, e)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="admin-card-header">
                    <div>
                      <strong>{item.name || item.items || '물품명 없음'}</strong>
                      <p>{item.ownerName || item.owner || '알 수 없음'}</p>
                    </div>
                    <span className="status-chip status-pending">대기</span>
                  </div>
                  <p className="admin-card-memo">{item.items}</p>
                  
                  <div onClick={(e) => e.stopPropagation()}>
                    {/* 기관 선택 영역 (읽기 전용) */}
                    <div style={{
                      marginTop: '1.5rem',
                      padding: '1.5rem',
                      borderRadius: '8px',
                      border: '1px solid #ddd',
                      backgroundColor: '#f9f9f9'
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
                          선택된 기관
                        </label>
                      </div>
                      <input
                        type="text"
                        value={item.donationOrganization || item.organization || '미정'}
                        readOnly
                        disabled
                        style={{
                          width: '100%',
                          padding: '1rem',
                          fontSize: '15px',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          backgroundColor: '#f5f5f5',
                          fontWeight: '500',
                          color: '#666',
                          cursor: 'not-allowed'
                        }}
                      />
                    </div>
                    
                    {/* 택배 배송인 경우 택배 정보 입력 필드 표시 */}
                    {isParcelDelivery && (
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
                            택배 정보
                          </label>
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          gap: '1rem', 
                          flexWrap: 'wrap'
                        }}>
                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <label style={{ 
                              display: 'block', 
                              fontSize: '13px', 
                              fontWeight: '600', 
                              color: '#666',
                              marginBottom: '0.75rem'
                            }}>
                              택배사
                            </label>
                            <select
                              value={deliveryInfo[item.id]?.carrier || ''}
                              onChange={(e) =>
                                setDeliveryInfo((prev) => ({
                                  ...prev,
                                  [item.id]: { ...prev[item.id], carrier: e.target.value }
                                }))
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
                              <option value="">택배사를 선택해주세요</option>
                              <option value="CJ대한통운">CJ대한통운</option>
                              <option value="한진택배">한진택배</option>
                              <option value="로젠택배">로젠택배</option>
                              <option value="롯데택배">롯데택배</option>
                              <option value="우체국택배">우체국택배</option>
                              <option value="쿠팡">쿠팡</option>
                              <option value="기타">기타</option>
                            </select>
                          </div>
                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <label style={{ 
                              display: 'block', 
                              fontSize: '13px', 
                              fontWeight: '600', 
                              color: '#666',
                              marginBottom: '0.75rem'
                            }}>
                              운송장 번호
                            </label>
                            <input
                              type="text"
                              value={deliveryInfo[item.id]?.trackingNumber || ''}
                              onChange={(e) =>
                                setDeliveryInfo((prev) => ({
                                  ...prev,
                                  [item.id]: { ...prev[item.id], trackingNumber: e.target.value }
                                }))
                              }
                              placeholder="운송장 번호를 입력해주세요"
                              style={{ 
                                width: '100%',
                                padding: '1rem', 
                                fontSize: '15px',
                                border: '1px solid #ddd',
                                borderRadius: '6px',
                                backgroundColor: 'white',
                                fontWeight: '500'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* 승인/거절 버튼 (기관이 아직 수락하지 않은 경우) */}
                    {item.status !== '매칭됨' && item.status !== 'IN_PROGRESS' && (
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                        <button
                          type="button"
                          className="btn primary"
                          style={{ flex: 1 }}
                          onClick={() => handleApprove(item)}
                        >
                          승인
                        </button>
                        <button
                          type="button"
                          className="btn secondary"
                          style={{ flex: 1 }}
                          onClick={() => {
                            const reason = window.prompt('거절 사유를 입력해주세요:');
                            if (reason) {
                              handleReject(item, reason);
                            }
                          }}
                        >
                          거절
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
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
                    <p style={{ margin: '0.5rem 0' }}><strong>기부 방법:</strong> {detailModal.donationMethod || '직접 매칭'}</p>
                    <p style={{ margin: '0.5rem 0' }}><strong>선택한 기관:</strong> {detailModal.donationOrganization || detailModal.organization || '미정'}</p>
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

