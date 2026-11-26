import fetch from '../apiFetch'
import { useEffect, useState } from 'react'
import HeaderLanding from '../components/HeaderLanding'
import '../styles/admin-manage.css'

export default function AdminDeliveryManagePage({
  onNavigateHome,
  onNavLink,
  isLoggedIn,
  onLogout,
  onNotifications,
  unreadCount,
  onMenu = () => {},
  currentUser,
  onLogin = () => {}
}) {
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedDelivery, setSelectedDelivery] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState('전체')

  // 배송 상태 변환 (3단계: 대기, 배송중, 완료)
  const convertStatus = (status) => {
    switch (status) {
      case 'DELIVERED':
        return '완료'
      case 'IN_TRANSIT':
        return '배송중'
      case 'PREPARING':
      case 'PENDING':
        return '대기'
      case 'CANCELLED':
        return '취소'
      default:
        return '대기'
    }
  }

  const statusColor = status => {
    switch (status) {
      case "완료":
        return "status-complete"
      case "배송중":
        return "status-progress"
      case "대기":
        return "status-wait"
      case "취소":
        return "status-cancelled"
      default:
        return ""
    }
  }

  // 배송 목록 조회
  useEffect(() => {
    const fetchDeliveries = async () => {
      if (!isLoggedIn || !currentUser) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        // 백엔드 페이지로 리다이렉트하거나 API를 사용
        // 일단 백엔드 API를 직접 호출
        const response = await fetch('/api/admin/deliveries', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        })

        if (!response.ok) {
          // API가 없으면 백엔드 페이지로 리다이렉트
          if (response.status === 404) {
            window.location.href = '/admin/deliveries'
            return
          }
          throw new Error('배송 목록을 불러오는데 실패했습니다.')
        }

        const data = await response.json()
        const deliveryList = (data.deliveries || []).map(delivery => ({
          id: delivery.id,
          trackingNumber: delivery.trackingNumber || `DEL-${delivery.id}`,
          carrier: delivery.carrier || '미정',
          sender: delivery.senderName || '미등록',
          receiver: delivery.receiverName || '미등록',
          status: convertStatus(delivery.status),
          statusRaw: delivery.status,
          startDate: delivery.shippedAt 
            ? new Date(delivery.shippedAt).toLocaleDateString('ko-KR', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit' 
              }).replace(/\./g, '.').replace(/\s/g, '')
            : delivery.createdAt 
            ? new Date(delivery.createdAt).toLocaleDateString('ko-KR', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit' 
              }).replace(/\./g, '.').replace(/\s/g, '')
            : '-',
          delivery: delivery // 전체 정보 저장
        }))

        setDeliveries(deliveryList)
      } catch (err) {
        console.error('배송 목록 조회 실패:', err)
        setError(err.message)
        setDeliveries([])
      } finally {
        setLoading(false)
      }
    }

    fetchDeliveries()
  }, [isLoggedIn, currentUser])

  // 배송 상세 조회
  const handleViewDetail = async (deliveryId) => {
    try {
      const response = await fetch(`/api/admin/deliveries/${deliveryId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      if (!response.ok) {
        // API가 없으면 백엔드 페이지로 리다이렉트
        if (response.status === 404) {
          window.location.href = `/admin/deliveries/${deliveryId}`
          return
        }
        throw new Error('배송 상세 정보를 불러오는데 실패했습니다.')
      }

      const data = await response.json()
      setSelectedDelivery(data.delivery || data)
      setShowDetailModal(true)
    } catch (err) {
      console.error('배송 상세 조회 실패:', err)
      alert('배송 상세 정보를 불러오는데 실패했습니다.')
    }
  }

  // 배송 상태 업데이트
  const handleUpdateStatus = async (deliveryId, newStatus) => {
    try {
      const response = await fetch(`/api/admin/deliveries/${deliveryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || '배송 상태 업데이트에 실패했습니다.')
      }

      // 목록 새로고침
      const refreshResponse = await fetch('/api/admin/deliveries', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json()
        const deliveryList = (refreshData.deliveries || []).map(delivery => ({
          id: delivery.id,
          trackingNumber: delivery.trackingNumber || `DEL-${delivery.id}`,
          carrier: delivery.carrier || '미정',
          sender: delivery.senderName || '미등록',
          receiver: delivery.receiverName || '미등록',
          status: convertStatus(delivery.status),
          statusRaw: delivery.status,
          startDate: delivery.shippedAt 
            ? new Date(delivery.shippedAt).toLocaleDateString('ko-KR', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit' 
              }).replace(/\./g, '.').replace(/\s/g, '')
            : delivery.createdAt 
            ? new Date(delivery.createdAt).toLocaleDateString('ko-KR', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit' 
              }).replace(/\./g, '.').replace(/\s/g, '')
            : '-',
          delivery: delivery
        }))
        setDeliveries(deliveryList)
      }

      alert(result.message || '배송 상태가 업데이트되었습니다.')
      setShowDetailModal(false)
    } catch (err) {
      console.error('배송 상태 업데이트 오류:', err)
      alert(err.message || '배송 상태 업데이트에 실패했습니다.')
    }
  }

  // 필터링된 배송 목록 (택배사가 정해진 것만, 상태 필터 적용)
  const filteredDeliveries = deliveries
    .filter(d => d.carrier && d.carrier !== '미정' && d.carrier !== '미등록')
    .filter(d => statusFilter === '전체' || d.status === statusFilter)

  return (
    <section className="main-page admin-delivery-manage-page">
      <div className="main-shell admin-delivery-manage-shell">
        <HeaderLanding
          role={currentUser?.role}
          onLogoClick={onNavigateHome}
          onNavClick={onNavLink}
          isLoggedIn={isLoggedIn}
          onLogout={onLogout}
          onLogin={onLogin}
          onNotifications={onNotifications}
          unreadCount={unreadCount}
          onMenu={onMenu}
        />

        <div className="admin-delivery-manage-content">
          <div className="admin-delivery-manage-header" style={{
            paddingBottom: '1.5rem',
            marginBottom: '1.5rem',
            borderBottom: '2px solid #e9ecef'
          }}>
            <div>
              <h1>배송 관리</h1>
              <p>전체 배송 정보를 조회하고 관리할 수 있습니다.</p>
            </div>
            <button type="button" className="btn-cancel" onClick={onNavigateHome}>
              홈으로
            </button>
          </div>

          {error && (
            <div className="error-message" style={{ 
              padding: '1rem', 
              background: '#fee', 
              color: '#c33', 
              borderRadius: '8px', 
              marginBottom: '1.5rem',
              border: '1px solid #fcc'
            }}>
              {error}
            </div>
          )}

          <div className="delivery-filter-section" style={{ 
            marginBottom: '1.5rem', 
            display: 'flex', 
            gap: '1rem', 
            alignItems: 'center',
            padding: '1rem 1.25rem',
            background: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <label style={{ 
              fontWeight: '500', 
              color: '#2f261c',
              fontSize: '14px'
            }}>
              상태 필터:
            </label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="delivery-status-filter"
              style={{ 
                padding: '0.625rem 1rem', 
                borderRadius: '6px', 
                border: '1px solid #ddd',
                background: 'white',
                fontSize: '14px',
                color: '#2f261c',
                cursor: 'pointer',
                minWidth: '120px',
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#7a6b55'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            >
              <option value="전체">전체</option>
              <option value="대기">대기</option>
              <option value="배송중">배송중</option>
              <option value="완료">완료</option>
            </select>
            <div style={{ 
              marginLeft: 'auto',
              fontSize: '14px',
              color: '#666'
            }}>
              총 {filteredDeliveries.length}건
            </div>
          </div>

          {loading ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem',
              color: '#666',
              fontSize: '16px'
            }}>
              <div style={{ marginBottom: '1rem' }}>⏳</div>
              로딩 중...
            </div>
          ) : filteredDeliveries.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem', 
              color: '#666',
              background: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '1rem' }}>📦</div>
              <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '0.5rem' }}>
                배송 내역이 없습니다.
              </div>
              <div style={{ fontSize: '14px', color: '#999' }}>
                {statusFilter !== '전체' ? `${statusFilter} 상태의 배송이 없습니다.` : '등록된 배송 정보가 없습니다.'}
              </div>
            </div>
          ) : (
            <div className="delivery-table-container" style={{
              background: 'transparent',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <table className="delivery-table" style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{
                    background: '#f8f9fa',
                    borderBottom: '2px solid #e9ecef'
                  }}>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#2f261c',
                      fontSize: '14px'
                    }}>송장번호</th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#2f261c',
                      fontSize: '14px'
                    }}>보내는 사람</th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#2f261c',
                      fontSize: '14px'
                    }}>받는 사람</th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#2f261c',
                      fontSize: '14px'
                    }}>택배사</th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#2f261c',
                      fontSize: '14px'
                    }}>배송 시작</th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'center',
                      fontWeight: '600',
                      color: '#2f261c',
                      fontSize: '14px'
                    }}>상태</th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'center',
                      fontWeight: '600',
                      color: '#2f261c',
                      fontSize: '14px'
                    }}>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeliveries.map((delivery, index) => (
                    <tr 
                      key={delivery.id}
                      style={{
                        background: 'white',
                        borderBottom: index < filteredDeliveries.length - 1 ? '1px solid #f0f0f0' : 'none',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                      <td style={{
                        padding: '1rem',
                        color: '#2f261c',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        {delivery.trackingNumber}
                      </td>
                      <td style={{
                        padding: '1rem',
                        color: '#555',
                        fontSize: '14px'
                      }}>
                        {delivery.sender}
                      </td>
                      <td style={{
                        padding: '1rem',
                        color: '#555',
                        fontSize: '14px'
                      }}>
                        {delivery.receiver}
                      </td>
                      <td style={{
                        padding: '1rem',
                        color: '#555',
                        fontSize: '14px'
                      }}>
                        {delivery.carrier}
                      </td>
                      <td style={{
                        padding: '1rem',
                        color: '#666',
                        fontSize: '14px'
                      }}>
                        {delivery.startDate}
                      </td>
                      <td style={{
                        padding: '1rem',
                        textAlign: 'center'
                      }}>
                        <span className={`status-badge ${statusColor(delivery.status)}`} style={{
                          display: 'inline-block',
                          padding: '0.375rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          whiteSpace: 'nowrap'
                        }}>
                          {delivery.status}
                        </span>
                      </td>
                      <td style={{
                        padding: '1rem',
                        textAlign: 'center'
                      }}>
                        <button
                          className="btn-filter"
                          onClick={() => handleViewDetail(delivery.id)}
                          style={{ 
                            fontSize: '13px', 
                            padding: '0.5rem 1rem',
                            background: '#7a6b55',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            fontWeight: '500'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = '#6a5b4d'
                            e.target.style.transform = 'translateY(-1px)'
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = '#7a6b55'
                            e.target.style.transform = 'translateY(0)'
                          }}
                        >
                          상세보기
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 배송 상세 모달 */}
      {showDetailModal && selectedDelivery && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowDetailModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(2px)'
          }}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '12px',
              maxWidth: '700px',
              width: '90%',
              maxHeight: '85vh',
              overflow: 'auto',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)'
            }}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid #e9ecef'
            }}>
              <h2 style={{ 
                margin: 0,
                fontSize: '24px',
                fontWeight: '700',
                color: '#2f261c'
              }}>
                배송 상세 정보
              </h2>
              <button 
                onClick={() => setShowDetailModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.75rem',
                  cursor: 'pointer',
                  color: '#666',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f0f0f0'
                  e.target.style.color = '#2f261c'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'none'
                  e.target.style.color = '#666'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                padding: '1rem',
                background: '#f8f9fa',
                borderRadius: '8px'
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '0.25rem', fontWeight: '500' }}>
                    송장번호
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#2f261c' }}>
                    {selectedDelivery.trackingNumber || `DEL-${selectedDelivery.id}`}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '0.25rem', fontWeight: '500' }}>
                    택배사
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#2f261c' }}>
                    {selectedDelivery.carrier || '미정'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '0.25rem', fontWeight: '500' }}>
                    배송 상태
                  </div>
                  <span className={`status-badge ${statusColor(convertStatus(selectedDelivery.status))}`}>
                    {convertStatus(selectedDelivery.status)}
                  </span>
                </div>
              </div>
              
              <div style={{ 
                borderTop: '1px solid #e9ecef', 
                paddingTop: '1.5rem', 
                marginTop: '0.5rem' 
              }}>
                <h3 style={{ 
                  marginBottom: '1rem',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#2f261c'
                }}>
                  보내는 사람
                </h3>
                <div style={{ 
                  display: 'grid', 
                  gap: '0.75rem',
                  padding: '1rem',
                  background: '#f8f9fa',
                  borderRadius: '8px'
                }}>
                  <div>
                    <span style={{ fontSize: '13px', color: '#666', fontWeight: '500' }}>이름:</span>{' '}
                    <span style={{ fontSize: '14px', color: '#2f261c' }}>{selectedDelivery.senderName}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '13px', color: '#666', fontWeight: '500' }}>전화번호:</span>{' '}
                    <span style={{ fontSize: '14px', color: '#2f261c' }}>{selectedDelivery.senderPhone}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '13px', color: '#666', fontWeight: '500' }}>주소:</span>{' '}
                    <span style={{ fontSize: '14px', color: '#2f261c' }}>
                      {selectedDelivery.senderAddress} {selectedDelivery.senderDetailAddress || ''}
                    </span>
                  </div>
                  {selectedDelivery.senderPostalCode && (
                    <div>
                      <span style={{ fontSize: '13px', color: '#666', fontWeight: '500' }}>우편번호:</span>{' '}
                      <span style={{ fontSize: '14px', color: '#2f261c' }}>{selectedDelivery.senderPostalCode}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{ borderTop: '1px solid #e9ecef', paddingTop: '1.5rem' }}>
                <h3 style={{ 
                  marginBottom: '1rem',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#2f261c'
                }}>
                  받는 사람
                </h3>
                <div style={{ 
                  display: 'grid', 
                  gap: '0.75rem',
                  padding: '1rem',
                  background: '#f8f9fa',
                  borderRadius: '8px'
                }}>
                  <div>
                    <span style={{ fontSize: '13px', color: '#666', fontWeight: '500' }}>이름:</span>{' '}
                    <span style={{ fontSize: '14px', color: '#2f261c' }}>{selectedDelivery.receiverName}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '13px', color: '#666', fontWeight: '500' }}>전화번호:</span>{' '}
                    <span style={{ fontSize: '14px', color: '#2f261c' }}>{selectedDelivery.receiverPhone}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '13px', color: '#666', fontWeight: '500' }}>주소:</span>{' '}
                    <span style={{ fontSize: '14px', color: '#2f261c' }}>
                      {selectedDelivery.receiverAddress} {selectedDelivery.receiverDetailAddress || ''}
                    </span>
                  </div>
                  {selectedDelivery.receiverPostalCode && (
                    <div>
                      <span style={{ fontSize: '13px', color: '#666', fontWeight: '500' }}>우편번호:</span>{' '}
                      <span style={{ fontSize: '14px', color: '#2f261c' }}>{selectedDelivery.receiverPostalCode}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{ borderTop: '1px solid #e9ecef', paddingTop: '1.5rem' }}>
                <h3 style={{ 
                  marginBottom: '1rem',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#2f261c'
                }}>
                  배송 일정
                </h3>
                <div style={{ 
                  display: 'grid', 
                  gap: '0.75rem',
                  padding: '1rem',
                  background: '#f8f9fa',
                  borderRadius: '8px'
                }}>
                  {selectedDelivery.shippedAt && (
                    <div>
                      <span style={{ fontSize: '13px', color: '#666', fontWeight: '500' }}>배송 시작:</span>{' '}
                      <span style={{ fontSize: '14px', color: '#2f261c' }}>
                        {new Date(selectedDelivery.shippedAt).toLocaleString('ko-KR')}
                      </span>
                    </div>
                  )}
                  {selectedDelivery.deliveredAt && (
                    <div>
                      <span style={{ fontSize: '13px', color: '#666', fontWeight: '500' }}>배송 완료:</span>{' '}
                      <span style={{ fontSize: '14px', color: '#2f261c' }}>
                        {new Date(selectedDelivery.deliveredAt).toLocaleString('ko-KR')}
                      </span>
                    </div>
                  )}
                  {selectedDelivery.createdAt && (
                    <div>
                      <span style={{ fontSize: '13px', color: '#666', fontWeight: '500' }}>등록일:</span>{' '}
                      <span style={{ fontSize: '14px', color: '#2f261c' }}>
                        {new Date(selectedDelivery.createdAt).toLocaleString('ko-KR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ 
                borderTop: '1px solid #e9ecef', 
                paddingTop: '1.5rem' 
              }}>
                <h3 style={{ 
                  marginBottom: '1rem',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#2f261c'
                }}>
                  배송 상태 변경
                </h3>
                <div style={{ 
                  display: 'flex', 
                  gap: '0.75rem', 
                  flexWrap: 'wrap' 
                }}>
                  <button
                    onClick={() => handleUpdateStatus(selectedDelivery.id, 'PENDING')}
                    disabled={selectedDelivery.status === 'PENDING'}
                    style={{
                      padding: '0.625rem 1.25rem',
                      background: selectedDelivery.status === 'PENDING' ? '#e9ecef' : '#fef3c7',
                      color: selectedDelivery.status === 'PENDING' ? '#999' : '#92400e',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: selectedDelivery.status === 'PENDING' ? 'not-allowed' : 'pointer',
                      fontWeight: '500',
                      fontSize: '14px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedDelivery.status !== 'PENDING') {
                        e.target.style.background = '#fde68a'
                        e.target.style.transform = 'translateY(-1px)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedDelivery.status !== 'PENDING') {
                        e.target.style.background = '#fef3c7'
                        e.target.style.transform = 'translateY(0)'
                      }
                    }}
                  >
                    대기
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedDelivery.id, 'IN_TRANSIT')}
                    disabled={selectedDelivery.status === 'IN_TRANSIT'}
                    style={{
                      padding: '0.625rem 1.25rem',
                      background: selectedDelivery.status === 'IN_TRANSIT' ? '#e9ecef' : '#dbeafe',
                      color: selectedDelivery.status === 'IN_TRANSIT' ? '#999' : '#1e40af',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: selectedDelivery.status === 'IN_TRANSIT' ? 'not-allowed' : 'pointer',
                      fontWeight: '500',
                      fontSize: '14px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedDelivery.status !== 'IN_TRANSIT') {
                        e.target.style.background = '#93c5fd'
                        e.target.style.transform = 'translateY(-1px)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedDelivery.status !== 'IN_TRANSIT') {
                        e.target.style.background = '#dbeafe'
                        e.target.style.transform = 'translateY(0)'
                      }
                    }}
                  >
                    배송중
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedDelivery.id, 'DELIVERED')}
                    disabled={selectedDelivery.status === 'DELIVERED'}
                    style={{
                      padding: '0.625rem 1.25rem',
                      background: selectedDelivery.status === 'DELIVERED' ? '#e9ecef' : '#d1fae5',
                      color: selectedDelivery.status === 'DELIVERED' ? '#999' : '#065f46',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: selectedDelivery.status === 'DELIVERED' ? 'not-allowed' : 'pointer',
                      fontWeight: '500',
                      fontSize: '14px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedDelivery.status !== 'DELIVERED') {
                        e.target.style.background = '#a7f3d0'
                        e.target.style.transform = 'translateY(-1px)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedDelivery.status !== 'DELIVERED') {
                        e.target.style.background = '#d1fae5'
                        e.target.style.transform = 'translateY(0)'
                      }
                    }}
                  >
                    완료
                  </button>
                </div>
              </div>
            </div>
            
            <div style={{ 
              marginTop: '2rem', 
              paddingTop: '1.5rem',
              borderTop: '1px solid #e9ecef',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem'
            }}>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#7a6b55',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '14px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#6a5b4d'
                  e.target.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#7a6b55'
                  e.target.style.transform = 'translateY(0)'
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

