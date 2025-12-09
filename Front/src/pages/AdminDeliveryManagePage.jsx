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
            ? new Date(delivery.shippedAt).toLocaleDateString('ko-KR')
            : delivery.createdAt 
            ? new Date(delivery.createdAt).toLocaleDateString('ko-KR')
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
            ? new Date(delivery.shippedAt).toLocaleDateString('ko-KR')
            : delivery.createdAt 
            ? new Date(delivery.createdAt).toLocaleDateString('ko-KR')
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

  // 필터링된 배송 목록
  const filteredDeliveries = statusFilter === '전체'
    ? deliveries
    : deliveries.filter(d => d.status === statusFilter)

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
          <div className="admin-delivery-manage-header">
            <div>
              <h1>배송 관리</h1>
              <p>전체 배송 정보를 조회하고 관리할 수 있습니다.</p>
            </div>
            <button type="button" className="btn-cancel" onClick={onNavigateHome}>
              홈으로
            </button>
          </div>

          {error && (
            <div style={{ padding: '1rem', background: '#fee', color: '#c33', borderRadius: '8px', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label>상태 필터:</label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="전체">전체</option>
              <option value="대기">대기</option>
              <option value="배송중">배송중</option>
              <option value="완료">완료</option>
              <option value="취소">취소</option>
            </select>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>로딩 중...</div>
          ) : filteredDeliveries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              배송 내역이 없습니다.
            </div>
          ) : (
            <div className="delivery-table-container">
              <table className="delivery-table">
                <thead>
                  <tr>
                    <th>송장번호</th>
                    <th>보내는 사람</th>
                    <th>받는 사람</th>
                    <th>택배사</th>
                    <th>배송 시작</th>
                    <th>상태</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeliveries.map((delivery) => (
                    <tr key={delivery.id}>
                      <td>{delivery.trackingNumber}</td>
                      <td>{delivery.sender}</td>
                      <td>{delivery.receiver}</td>
                      <td>{delivery.carrier}</td>
                      <td>{delivery.startDate}</td>
                      <td>
                        <span className={`status-badge ${statusColor(delivery.status)}`}>
                          {delivery.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-filter"
                          onClick={() => handleViewDetail(delivery.id)}
                          style={{ fontSize: '12px', padding: '4px 8px' }}
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
            zIndex: 1000
          }}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '8px',
              maxWidth: '700px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2>배송 상세 정보</h2>
              <button 
                onClick={() => setShowDetailModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <strong>송장번호:</strong> {selectedDelivery.trackingNumber || `DEL-${selectedDelivery.id}`}
              </div>
              <div>
                <strong>택배사:</strong> {selectedDelivery.carrier || '미정'}
              </div>
              <div>
                <strong>배송 상태:</strong> 
                <span className={`status-badge ${statusColor(convertStatus(selectedDelivery.status))}`} style={{ marginLeft: '0.5rem' }}>
                  {convertStatus(selectedDelivery.status)}
                </span>
              </div>
              
              <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem', marginTop: '1rem' }}>
                <h3 style={{ marginBottom: '0.5rem' }}>보내는 사람</h3>
                <div><strong>이름:</strong> {selectedDelivery.senderName}</div>
                <div><strong>전화번호:</strong> {selectedDelivery.senderPhone}</div>
                <div><strong>주소:</strong> {selectedDelivery.senderAddress} {selectedDelivery.senderDetailAddress || ''}</div>
                {selectedDelivery.senderPostalCode && (
                  <div><strong>우편번호:</strong> {selectedDelivery.senderPostalCode}</div>
                )}
              </div>
              
              <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                <h3 style={{ marginBottom: '0.5rem' }}>받는 사람</h3>
                <div><strong>이름:</strong> {selectedDelivery.receiverName}</div>
                <div><strong>전화번호:</strong> {selectedDelivery.receiverPhone}</div>
                <div><strong>주소:</strong> {selectedDelivery.receiverAddress} {selectedDelivery.receiverDetailAddress || ''}</div>
                {selectedDelivery.receiverPostalCode && (
                  <div><strong>우편번호:</strong> {selectedDelivery.receiverPostalCode}</div>
                )}
              </div>
              
              <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                <h3 style={{ marginBottom: '0.5rem' }}>배송 일정</h3>
                {selectedDelivery.shippedAt && (
                  <div><strong>배송 시작:</strong> {new Date(selectedDelivery.shippedAt).toLocaleString('ko-KR')}</div>
                )}
                {selectedDelivery.deliveredAt && (
                  <div><strong>배송 완료:</strong> {new Date(selectedDelivery.deliveredAt).toLocaleString('ko-KR')}</div>
                )}
                {selectedDelivery.createdAt && (
                  <div><strong>등록일:</strong> {new Date(selectedDelivery.createdAt).toLocaleString('ko-KR')}</div>
                )}
              </div>

              <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                <h3 style={{ marginBottom: '0.5rem' }}>배송 상태 변경</h3>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleUpdateStatus(selectedDelivery.id, 'PENDING')}
                    disabled={selectedDelivery.status === 'PENDING'}
                    style={{
                      padding: '0.5rem 1rem',
                      background: selectedDelivery.status === 'PENDING' ? '#ccc' : '#fef3c7',
                      color: selectedDelivery.status === 'PENDING' ? '#666' : '#92400e',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: selectedDelivery.status === 'PENDING' ? 'not-allowed' : 'pointer'
                    }}
                  >
                    대기
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedDelivery.id, 'IN_TRANSIT')}
                    disabled={selectedDelivery.status === 'IN_TRANSIT'}
                    style={{
                      padding: '0.5rem 1rem',
                      background: selectedDelivery.status === 'IN_TRANSIT' ? '#ccc' : '#dbeafe',
                      color: selectedDelivery.status === 'IN_TRANSIT' ? '#666' : '#1e40af',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: selectedDelivery.status === 'IN_TRANSIT' ? 'not-allowed' : 'pointer'
                    }}
                  >
                    배송중
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedDelivery.id, 'DELIVERED')}
                    disabled={selectedDelivery.status === 'DELIVERED'}
                    style={{
                      padding: '0.5rem 1rem',
                      background: selectedDelivery.status === 'DELIVERED' ? '#ccc' : '#d1fae5',
                      color: selectedDelivery.status === 'DELIVERED' ? '#666' : '#065f46',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: selectedDelivery.status === 'DELIVERED' ? 'not-allowed' : 'pointer'
                    }}
                  >
                    완료
                  </button>
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
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

