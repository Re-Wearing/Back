import { useState, useEffect } from 'react'
import HeaderLanding from "../components/HeaderLanding"

export default function DeliveryCheckPage({
  onNavigateHome,
  onNavLink,
  isLoggedIn,
  onLogout,
  onNotifications,
  unreadCount,
  onMenu = () => {},
  currentUser,
  currentProfile,
  shipments = [],
  donorProfile,
  organizationProfile
}) {
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedDelivery, setSelectedDelivery] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const isDonorView = currentUser?.role !== '기관 회원'
  const fallbackDonorProfile = donorProfile || currentProfile
  const effectiveDonorProfile = isDonorView ? currentProfile : fallbackDonorProfile
  const senderName = effectiveDonorProfile?.useAnonymousName
    ? '익명 기부자'
    : effectiveDonorProfile?.fullName ||
      effectiveDonorProfile?.nickname ||
      currentUser?.name ||
      '일반 기부자'
  const senderContact = effectiveDonorProfile?.phone || '연락처 미등록'
  const receiverName =
    organizationProfile?.nickname || organizationProfile?.fullName || '협약 기관 물류센터'

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
        const response = await fetch('/api/deliveries', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        })

        if (!response.ok) {
          if (response.status === 401) {
            setDeliveries([])
            return
          }
          throw new Error('배송 목록을 불러오는데 실패했습니다.')
        }

        const data = await response.json()
        const deliveryList = (data.deliveries || []).map(delivery => ({
          id: delivery.id,
          trackingNumber: delivery.trackingNumber || `DEL-${delivery.id}`,
          carrier: delivery.carrier || '미정',
          sender: delivery.senderName || senderName,
          receiver: delivery.receiverName || receiverName,
          status: convertStatus(delivery.status),
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

  // 배송 상태 변환
  const convertStatus = (status) => {
    switch (status) {
      case 'DELIVERED':
        return '배송완료'
      case 'IN_TRANSIT':
        return '배송중'
      case 'PREPARING':
        return '배송준비중'
      case 'PENDING':
        return '배송대기'
      case 'CANCELLED':
        return '배송취소'
      default:
        return '배송대기'
    }
  }

  // 배송 상세 조회
  const handleViewDetail = async (deliveryId) => {
    try {
      const response = await fetch(`/api/deliveries/${deliveryId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('배송 상세 정보를 불러오는데 실패했습니다.')
      }

      const data = await response.json()
      setSelectedDelivery(data)
      setShowDetailModal(true)
    } catch (err) {
      console.error('배송 상세 조회 실패:', err)
      alert('배송 상세 정보를 불러오는데 실패했습니다.')
    }
  }

  const statusColor = status => {
    switch (status) {
      case "배송완료":
        return "status-complete"
      case "배송중":
      case "배송준비중":
        return "status-progress"
      case "배송대기":
        return "status-wait"
      case "배송취소":
        return "status-cancelled"
      default:
        return ""
    }
  }

  // 기존 shipments 데이터와 API 데이터 병합 (하위 호환성)
  const tableData = deliveries.length > 0 
    ? deliveries
    : (Array.isArray(shipments) && shipments.length > 0
        ? shipments
            .filter(item => {
              if (isDonorView) {
                return (
                  !item.sender ||
                  item.sender === effectiveDonorProfile?.fullName ||
                  item.sender === effectiveDonorProfile?.nickname
                )
              }
              return (
                item.receiver === currentUser?.name || item.receiver === currentUser?.nickname
              )
            })
            .map(item => ({
              ...item,
              sender: item.sender || senderName,
              receiver: item.receiver || receiverName
            }))
        : [])

  return (
    <section className="main-page delivery-check-page">
      <div className="main-shell delivery-check-shell">

        <HeaderLanding
          role={currentUser?.role}
          onLogoClick={onNavigateHome}
          onNavClick={onNavLink}
          isLoggedIn={isLoggedIn}
          onLogout={onLogout}
          onNotifications={onNotifications}
          unreadCount={unreadCount}
          onMenu={onMenu}
        />

        <div className="delivery-check-content">
          <h1>배송 조회</h1>

          <table className="delivery-table">
            <thead>
              <tr>
                <th>송장번호</th>
                <th>보내는 사람</th>
                <th>배송 시작</th>
                <th>받는 곳</th>
                <th>상태</th>
                <th>조회</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.id}</td>
                  <td>{senderName}</td>
                  <td>{row.startDate}</td>
                  <td>{row.receiver}</td>
                  <td>
                    <span className={`status-badge ${statusColor(row.status)}`}>
                      {row.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="delivery-link"
                      onClick={() => handleViewDetail(row.id)}
                    >
                      상세조회 →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

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
              maxWidth: '600px',
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
