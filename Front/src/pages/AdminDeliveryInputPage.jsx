import { useEffect, useState } from 'react'
import '../styles/admin-manage.css'

export default function AdminDeliveryInputPage({
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
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [deliveryInfo, setDeliveryInfo] = useState({})

  // 기관이 승인한 택배 배송 기부 목록 조회
  useEffect(() => {
    const fetchDonations = async () => {
      if (!isLoggedIn || !currentUser) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/admin/donations/delivery/input', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        })

        if (!response.ok) {
          const errorText = await response.text()
          let errorMessage = '기부 목록을 불러오는데 실패했습니다.'
          try {
            const errorData = JSON.parse(errorText)
            errorMessage = errorData.message || errorMessage
          } catch (e) {
            errorMessage = `서버 오류 (${response.status}): ${errorText || errorMessage}`
          }
          throw new Error(errorMessage)
        }

        const responseText = await response.text()
        if (!responseText || responseText.trim() === '') {
          setDonations([])
          return
        }

        const data = JSON.parse(responseText)
        setDonations(data.donations || [])
      } catch (err) {
        console.error('기부 목록 조회 실패:', err)
        setError(err.message)
        setDonations([])
      } finally {
        setLoading(false)
      }
    }

    fetchDonations()
  }, [isLoggedIn, currentUser])

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }

  // 택배 정보 업데이트
  const handleUpdateDelivery = async (donationId) => {
    const deliveryData = deliveryInfo[donationId] || {}
    
    if (!deliveryData.carrier || !deliveryData.trackingNumber) {
      showToast('택배사와 운송장 번호를 모두 입력해주세요.')
      return
    }

    try {
      const response = await fetch(`/api/admin/donations/${donationId}/delivery-info`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          carrier: deliveryData.carrier,
          trackingNumber: deliveryData.trackingNumber
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || '택배 정보 업데이트에 실패했습니다.')
      }

      showToast('택배 정보가 업데이트되었습니다.')
      
      // 입력 필드 초기화
      setDeliveryInfo(prev => {
        const newInfo = { ...prev }
        delete newInfo[donationId]
        return newInfo
      })

      // 목록 새로고침
      const refreshResponse = await fetch('/api/admin/donations/delivery/input', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json()
        setDonations(refreshData.donations || [])
      }
    } catch (err) {
      console.error('택배 정보 업데이트 오류:', err)
      showToast(err.message || '택배 정보 업데이트에 실패했습니다.')
    }
  }

  return (
    <div className="admin-delivery-input-content">
          {toast && <div className="toast">{toast}</div>}

          <div className="admin-delivery-input-header">
            <div>
              <h1>택배 배송 정보 입력</h1>
              <p>기관이 승인한 택배 배송 기부의 택배 정보를 입력할 수 있습니다.</p>
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

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>로딩 중...</div>
          ) : donations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              택배 정보를 입력할 기부가 없습니다.
            </div>
          ) : (
            <div className="admin-card-list">
              {donations.map((donation) => (
                <article key={donation.id} className="admin-card">
                  <div className="admin-card-header">
                    <div>
                      <strong>{donation.name || donation.items}</strong>
                      <p>{donation.ownerName || donation.owner}</p>
                    </div>
                    <span className="status-chip status-pending">택배 정보 입력 필요</span>
                  </div>
                  
                  <div style={{ marginTop: '1rem', padding: '1rem', background: '#f9f9f9', borderRadius: '8px' }}>
                    <p style={{ margin: '0.5rem 0' }}><strong>기관:</strong> {donation.matchedOrganization || donation.donationOrganization}</p>
                    <p style={{ margin: '0.5rem 0' }}><strong>배송 방식:</strong> {donation.deliveryMethod}</p>
                  </div>

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
                        택배 정보 입력
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
                          택배사 *
                        </label>
                        <select
                          value={deliveryInfo[donation.id]?.carrier || ''}
                          onChange={(e) =>
                            setDeliveryInfo((prev) => ({
                              ...prev,
                              [donation.id]: { ...prev[donation.id], carrier: e.target.value }
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
                          운송장 번호 *
                        </label>
                        <input
                          type="text"
                          value={deliveryInfo[donation.id]?.trackingNumber || ''}
                          onChange={(e) =>
                            setDeliveryInfo((prev) => ({
                              ...prev,
                              [donation.id]: { ...prev[donation.id], trackingNumber: e.target.value }
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
                    
                    <button 
                      type="button" 
                      className="small-btn primary" 
                      onClick={() => handleUpdateDelivery(donation.id)}
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
                      택배 정보 저장
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
  )
}

