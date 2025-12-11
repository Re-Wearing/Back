import { useMemo, useState, useEffect } from 'react'
import HeaderLanding from '../components/HeaderLanding'

export default function OrganizationDonationStatusPage({
  onNavigateHome,
  onNavLink,
  isLoggedIn,
  onLogout,
  onNotifications,
  unreadCount,
  onMenu = () => {},
  currentUser,
  onLogin = () => {},
  onRequireLogin,
  isBootstrapped = true,
  shipments = [],
  matchingInvites = [],
  onRespondMatchingInvite
}) {
  if (!isBootstrapped) {
    return null
  }

  if (!isLoggedIn || !currentUser) {
    if (onRequireLogin) {
      onRequireLogin()
    }
    return null
  }

  if (currentUser.role !== '기관 회원') {
    if (onNavigateHome) {
      onNavigateHome()
    }
    return null
  }

  const normalizeStatus = status => String(status || '').replace(/\s+/g, '').toLowerCase()
  const isCompleted = status => {
    const normalized = normalizeStatus(status)
    return normalized === '배송완료' || normalized === '완료' || normalized.endsWith('완료')
  }

  const [activeTab, setActiveTab] = useState('matching')
  const [imageModal, setImageModal] = useState(null)
  const [reasonModal, setReasonModal] = useState(null)
  const [reasonText, setReasonText] = useState('')
  const [apiDonations, setApiDonations] = useState([])
  const [completedDonations, setCompletedDonations] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingCompleted, setLoadingCompleted] = useState(false)
  const [error, setError] = useState(null)
  const [deliveryModal, setDeliveryModal] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDelivery, setSelectedDelivery] = useState(null)
  const [showDeliveryModal, setShowDeliveryModal] = useState(false)
  const [deliveryLoading, setDeliveryLoading] = useState(false)

  // API에서 기관에 할당된 기부 목록 조회 (매칭 관리용)
  useEffect(() => {
    const fetchOrganDonations = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/organs/donations', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        })
        
        if (!response.ok) {
          throw new Error('기부 목록 조회에 실패했습니다.')
        }
        
        const data = await response.json()
        if (data.donations) {
          setApiDonations(data.donations)
        }
      } catch (err) {
        console.error('기부 목록 조회 오류:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchOrganDonations()
  }, [])

  // API에서 완료된 기부 목록 조회 (기부 내역 조회용)
  useEffect(() => {
    const fetchCompletedDonations = async () => {
      try {
        setLoadingCompleted(true)
        
        const response = await fetch('/api/organs/donations/completed', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        })
        
        if (!response.ok) {
          throw new Error('완료된 기부 목록 조회에 실패했습니다.')
        }
        
        const data = await response.json()
        if (data.donations) {
          setCompletedDonations(data.donations)
        }
      } catch (err) {
        console.error('완료된 기부 목록 조회 오류:', err)
      } finally {
        setLoadingCompleted(false)
      }
    }
    
    fetchCompletedDonations()
  }, [])

  // 완료된 기부 목록 (API 데이터 우선 사용)
  const allDonations = useMemo(() => {
    if (completedDonations.length > 0) {
      return completedDonations.map(donation => ({
        id: donation.id,
        date: donation.date || new Date().toISOString().split('T')[0],
        items: donation.itemName || '기부 물품',
        organization: donation.organization || currentUser.name,
        sender: donation.donorName || '익명 기부자',
        status: donation.status || '완료',
        delivery: donation.delivery
      }))
    }
    
    // 기존 shipments 데이터 (하위 호환성)
    return (shipments || [])
      .filter(
        shipment =>
          (shipment.receiver === currentUser.name || shipment.receiver === currentUser.nickname) &&
          isCompleted(shipment.status)
      )
      .map(shipment => ({
        id: shipment.id,
        date: shipment.startDate,
        items: shipment.product,
        organization: shipment.receiver,
        sender: shipment.sender || '익명 기부자',
        status: '완료'
      }))
  }, [completedDonations, shipments, currentUser.name, currentUser.nickname])

  // 검색어로 필터링된 기부 목록
  const donations = useMemo(() => {
    if (!searchQuery.trim()) {
      return allDonations
    }
    
    const query = searchQuery.toLowerCase().trim()
    return allDonations.filter(donation => {
      return (
        (donation.items && donation.items.toLowerCase().includes(query)) ||
        (donation.sender && donation.sender.toLowerCase().includes(query)) ||
        (donation.date && donation.date.includes(query)) ||
        (donation.organization && donation.organization.toLowerCase().includes(query))
      )
    })
  }, [allDonations, searchQuery])

  const [selectedItems, setSelectedItems] = useState(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    setSelectedItems(prev => {
      const next = new Set()
      donations.forEach(donation => {
        if (prev.has(donation.id)) {
          next.add(donation.id)
        }
      })
      return next
    })
  }, [donations])

  const handleSelectAll = event => {
    if (event.target.checked) {
      setSelectedItems(new Set(donations.map(d => d.id)))
    } else {
      setSelectedItems(new Set())
    }
  }

  const handleSelectItem = (id, checked) => {
    const newSelected = new Set(selectedItems)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedItems(newSelected)
  }

  const isAllSelected = selectedItems.size === donations.length && donations.length > 0
  const isIndeterminate = selectedItems.size > 0 && selectedItems.size < donations.length

  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentDonations = donations.slice(startIndex, endIndex)
  const totalPages = Math.ceil(donations.length / itemsPerPage)

  // API에서 가져온 기부 목록과 기존 matchingInvites 병합
  const organizationInviteList = useMemo(() => {
    const apiInvites = (apiDonations || []).map(donation => ({
      id: `api-${donation.id}`,
      itemId: donation.itemId || donation.id.toString(),
      itemName: donation.itemName || '기부 물품',
      itemDescription: donation.itemDescription,
      donorName: donation.donorName || '익명',
      organizationUsername: donation.organizationUsername || currentUser.username,
      organizationName: donation.organizationName,
      status: donation.status || 'pending',
      message: donation.message || '관리자가 귀하의 기관에 할당한 기부입니다.',
      deliveryMethod: donation.deliveryMethod,
      desiredDate: donation.desiredDate,
      contact: donation.contact,
      memo: donation.memo,
      images: donation.images || []
    }))
    
    // 기존 matchingInvites와 병합 (중복 제거)
    const existingInvites = (matchingInvites || []).filter(invite => invite.organizationUsername === currentUser.username)
    const combined = [...apiInvites, ...existingInvites]
    
    // 중복 제거 (itemId 기준)
    const uniqueMap = new Map()
    combined.forEach(invite => {
      const key = invite.itemId || invite.id
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, invite)
      }
    })
    
    return Array.from(uniqueMap.values())
  }, [apiDonations, matchingInvites, currentUser.username])
  const pendingInviteCount = organizationInviteList.filter(invite => invite.status === 'pending').length

  const getStatusColor = status => {
    switch (status) {
      case '완료':
        return '#4eed90'
      case '배송중':
        return '#64d1ff'
      case '승인':
        return '#ffa500'
      case '대기':
        return '#ff6b6b'
      default:
        return '#7a6b55'
    }
  }

  const handleInviteResponse = async (inviteId, decision) => {
    // API 기반 invite인지 확인
    const invite = organizationInviteList.find(inv => inv.id === inviteId)
    if (!invite) {
      // 기존 방식 (하위 호환성)
      if (typeof onRespondMatchingInvite !== 'function') return
      if (decision === 'reject') {
        setReasonModal({ inviteId })
        setReasonText('')
      } else {
        onRespondMatchingInvite(inviteId, 'accept')
      }
      return
    }

    // API 기반 invite 처리
    if (decision === 'reject') {
      setReasonModal({ inviteId, donationId: invite.itemId })
      setReasonText('')
    } else {
      // 기관은 수락만 함 (택배 정보는 관리자가 입력)
      handleApproveDonation(invite.itemId)
    }
  }

  const handleApproveDonation = async (donationId) => {
    try {
      const response = await fetch(`/api/organs/donations/${donationId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: '{}'
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || '기부 승인에 실패했습니다.')
      }

      // 목록 새로고침
      const refreshResponse = await fetch('/api/organs/donations', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json()
        if (refreshData.donations) {
          setApiDonations(refreshData.donations)
        }
      }

      // 완료된 기부 목록도 새로고침
      const completedResponse = await fetch('/api/organs/donations/completed', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      if (completedResponse.ok) {
        const completedData = await completedResponse.json()
        if (completedData.donations) {
          setCompletedDonations(completedData.donations)
        }
      }

      alert(result.message || '기부를 승인했습니다.')
    } catch (err) {
      console.error('기부 승인 오류:', err)
      alert(err.message || '기부 승인에 실패했습니다.')
    }
  }

  const handleReasonConfirm = async () => {
    if (!reasonModal || !reasonText.trim()) return
    
    const invite = organizationInviteList.find(inv => inv.id === reasonModal.inviteId)
    
    if (invite && invite.itemId) {
      // API 기반 invite 처리
      try {
        const response = await fetch(`/api/organs/donations/${invite.itemId}/reject`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            reason: reasonText.trim()
          })
        })

        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.message || '기부 거부에 실패했습니다.')
        }

        // 목록 새로고침
        const refreshResponse = await fetch('/api/organs/donations', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        })

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json()
          if (refreshData.donations) {
            setApiDonations(refreshData.donations)
          }
        }

        alert(result.message || '기부를 거부했습니다.')
        setReasonModal(null)
        setReasonText('')
      } catch (err) {
        console.error('기부 거부 오류:', err)
        alert(err.message || '기부 거부에 실패했습니다.')
      }
    } else {
      // 기존 방식 (하위 호환성)
      if (typeof onRespondMatchingInvite === 'function') {
        onRespondMatchingInvite(reasonModal.inviteId, 'reject', reasonText.trim())
      }
      setReasonModal(null)
      setReasonText('')
    }
  }

  // 배송 상세 정보 조회
  const handleViewDeliveryDetail = async (deliveryId, event) => {
    // 이벤트 전파 방지
    if (event) {
      event.stopPropagation()
      event.preventDefault()
    }

    if (!deliveryId) {
      window.alert('배송 정보가 아직 없습니다.')
      return
    }

    console.log('배송 상세 조회 시작:', deliveryId)

    try {
      setDeliveryLoading(true)
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
      console.log('배송 상세 정보:', data)
      setSelectedDelivery(data)
      setShowDeliveryModal(true)
    } catch (err) {
      console.error('배송 상세 조회 실패:', err)
      alert('배송 상세 정보를 불러오는데 실패했습니다.')
    } finally {
      setDeliveryLoading(false)
    }
  }


  return (
    <section className="main-page donation-status-page">
      <div className="main-shell donation-status-shell">
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

        <div className="donation-status-content">
          <div className="donation-status-header">
            <div>
              <p className="donation-status-subtitle">기관 페이지</p>
              <h1>기관 기부 관리</h1>
              <p>배송 현황과 매칭 제안을 한 곳에서 확인하세요.</p>
            </div>
            <button type="button" className="btn-cancel" onClick={onNavigateHome}>
              홈으로
            </button>
          </div>

          <div className="donation-status-tabs">
            <button
              type="button"
              className={activeTab === 'matching' ? 'active' : ''}
              onClick={() => setActiveTab('matching')}
            >
              매칭 관리
              {pendingInviteCount > 0 && <span className="tab-badge">{pendingInviteCount}</span>}
            </button>
            <button
              type="button"
              className={activeTab === 'shipments' ? 'active' : ''}
              onClick={() => setActiveTab('shipments')}
            >
              기부 내역 조회
            </button>
          </div>

          {activeTab === 'shipments' ? (
            <>
              <div className="donation-status-actions">
                <div className="donation-search">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <input 
                    type="search" 
                    placeholder="검색..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {loadingCompleted ? (
                <div className="donation-status-empty">
                  <p>기부 내역을 불러오는 중...</p>
                </div>
              ) : donations.length === 0 ? (
                <div className="donation-status-empty">
                  <p>아직 승인한 기부가 없습니다.</p>
                  <p>매칭 관리에서 기부를 승인하면 이곳에서 확인할 수 있습니다.</p>
                </div>
              ) : (
                <>
                  <div className="donation-table-container">
                    <table className="donation-table">
                      <thead>
                        <tr>
                          <th>
                            <input
                              type="checkbox"
                              checked={isAllSelected}
                              ref={input => {
                                if (input) input.indeterminate = isIndeterminate
                              }}
                              onChange={handleSelectAll}
                            />
                          </th>
                          <th>기부 날짜 ↓</th>
                          <th>기부 내용 ↓</th>
                          <th>수혜 기관 ↓</th>
                          <th>기부자</th>
                          <th>기부 진행 상태 ↓</th>
                          <th>배송 조회</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentDonations.map(donation => (
                          <tr key={donation.id}>
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedItems.has(donation.id)}
                                onChange={e => handleSelectItem(donation.id, e.target.checked)}
                              />
                            </td>
                            <td>{donation.date}</td>
                            <td>{donation.items}</td>
                            <td>{donation.organization}</td>
                            <td>{donation.sender}</td>
                            <td>
                              <span
                                className="donation-status-badge"
                                style={{ color: getStatusColor(donation.status) }}
                              >
                                {donation.status}
                              </span>
                            </td>
                            <td>
                              {donation.delivery ? (
                                <button
                                  type="button"
                                  className="btn-filter"
                                  disabled={deliveryLoading}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    e.preventDefault()
                                    console.log('배송 조회 버튼 클릭:', donation.delivery.id)
                                    handleViewDeliveryDetail(donation.delivery.id, e)
                                  }}
                                  style={{ fontSize: '12px', padding: '4px 8px' }}
                                >
                                  {deliveryLoading ? '로딩...' : '배송 조회'}
                                </button>
                              ) : (
                                <span style={{ color: '#999', fontSize: '12px' }}>배송 정보 없음</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="donation-pagination">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      if (i === 4 && totalPages > 5) {
                        return (
                          <button key="ellipsis" type="button" className="pagination-ellipsis" disabled>
                            ...
                          </button>
                        )
                      }
                      const pageNum = i + 1
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          className={currentPage === pageNum ? 'active' : ''}
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                    {totalPages > 5 && (
                      <button
                        type="button"
                        className={currentPage === totalPages ? 'active' : ''}
                        onClick={() => setCurrentPage(totalPages)}
                      >
                        {totalPages}
                      </button>
                    )}
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              {organizationInviteList.length === 0 ? (
                <div className="donation-status-empty">
                  <p>받은 매칭 제안이 없습니다.</p>
                  <p>관리자가 기관을 지정하면 이곳에서 확인할 수 있습니다.</p>
                </div>
              ) : (
                <div className="donation-table-container">
                  <table className="donation-table">
                    <thead>
                      <tr>
                        <th>물품 정보</th>
                        <th>기부자</th>
                        <th>상태</th>
                        <th>조치</th>
                      </tr>
                    </thead>
                    <tbody>
                      {organizationInviteList.map(invite => (
                        <tr key={invite.id}>
                          <td>
                            <div className="approval-item-name">{invite.itemName || invite.itemId}</div>
                            <div className="approval-item-meta">{invite.message}</div>
                            {invite.itemDescription && (
                              <p className="approval-item-detail">{invite.itemDescription}</p>
                            )}
                            <div className="approval-item-extra">
                              {invite.deliveryMethod && <span>배송: {invite.deliveryMethod}</span>}
                              {invite.desiredDate && <span>희망일: {invite.desiredDate}</span>}
                              {invite.contact && <span>연락처: {invite.contact}</span>}
                              {invite.memo && <span>메모: {invite.memo}</span>}
                            </div>
                            {invite.images?.length > 0 && (
                              <div className="image-strip">
                                {invite.images.slice(0, 4).map((img, index) => (
                                  <button
                                    key={img.id || index}
                                    type="button"
                                    className="image-thumb"
                                    onClick={() =>
                                      setImageModal({
                                        title: `${invite.itemName || '기부 물품'} 이미지`,
                                        images: invite.images,
                                        description: invite.itemDescription,
                                        memo: invite.memo,
                                        deliveryMethod: invite.deliveryMethod,
                                        desiredDate: invite.desiredDate,
                                        owner: invite.donorName,
                                        contact: invite.contact
                                      })
                                    }
                                  >
                                    <img src={img.dataUrl || img.url || img} alt="기부 물품" />
                                  </button>
                                ))}
                              </div>
                            )}
                          </td>
                          <td>{invite.donorName}</td>
                          <td>
                            <span className="donation-status-badge">
                              {invite.status === 'pending'
                                ? '응답 대기'
                                : invite.status === 'accepted'
                                ? '수락 완료'
                                : '거절됨'}
                            </span>
                          </td>
                          <td>
                            {invite.status === 'pending' ? (
                              <div className="matching-actions">
                                <button
                                  type="button"
                                  className="btn-filter"
                                  onClick={() => handleInviteResponse(invite.id, 'accept')}
                                >
                                  수락
                                </button>
                                <button
                                  type="button"
                                  className="btn-cancel"
                                  onClick={() => handleInviteResponse(invite.id, 'reject')}
                                >
                                  거절
                                </button>
                              </div>
                            ) : (
                              <span className="approval-item-placeholder">
                                {invite.status === 'accepted'
                                  ? '수락 완료'
                                  : invite.responseReason
                                  ? `거절 사유: ${invite.responseReason}`
                                  : '거절되었습니다.'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {imageModal && (
        <div className="donation-modal-overlay" onClick={() => setImageModal(null)}>
          <div className="donation-modal" onClick={e => e.stopPropagation()}>
            <h2>{imageModal.title || '기부 물품 이미지'}</h2>
            {imageModal.images?.length ? (
              imageModal.images.map((img, index) => (
                <img key={img.id || index} src={img.dataUrl || img.url || img} alt="기부 물품" />
              ))
            ) : (
              <p>이미지가 없습니다.</p>
            )}
            <button type="button" className="btn-cancel" onClick={() => setImageModal(null)}>
              닫기
            </button>
          </div>
        </div>
      )}
      {reasonModal && (
        <div className="donation-modal-overlay" onClick={() => setReasonModal(null)}>
          <div className="donation-reason-modal" onClick={e => e.stopPropagation()}>
            <h2>거절 사유 입력</h2>
            <textarea
              value={reasonText}
              onChange={e => setReasonText(e.target.value)}
              placeholder="거절 사유를 입력해주세요."
            />
            <div className="reason-modal-actions">
              <button type="button" className="btn-cancel" onClick={() => setReasonModal(null)}>
                취소
              </button>
              <button
                type="button"
                className="btn-filter"
                disabled={!reasonText.trim()}
                onClick={handleReasonConfirm}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 배송 상세 정보 모달 */}
      {showDeliveryModal && selectedDelivery && (
        <div 
          className="modal-overlay" 
          onClick={() => {
            setShowDeliveryModal(false)
            setSelectedDelivery(null)
          }}
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
                onClick={() => {
                  setShowDeliveryModal(false)
                  setSelectedDelivery(null)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#7a6b55'
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
                <span 
                  className="donation-status-badge" 
                  style={{ 
                    color: selectedDelivery.status === 'DELIVERED' ? '#4eed90' :
                            selectedDelivery.status === 'IN_TRANSIT' ? '#64d1ff' :
                            (selectedDelivery.status === 'PENDING' || selectedDelivery.status === 'PREPARING') ? '#ffb347' :
                            selectedDelivery.status === 'CANCELLED' ? '#ff6b6b' : '#7a6b55',
                    marginLeft: '0.5rem' 
                  }}
                >
                  {selectedDelivery.status === 'DELIVERED' ? '완료' :
                   selectedDelivery.status === 'IN_TRANSIT' ? '배송중' :
                   (selectedDelivery.status === 'PENDING' || selectedDelivery.status === 'PREPARING') ? '대기' :
                   selectedDelivery.status === 'CANCELLED' ? '취소' : '대기'}
                </span>
              </div>
              
              <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem', marginTop: '1rem' }}>
                <h3 style={{ marginBottom: '0.5rem', color: '#2f261c' }}>보내는 사람</h3>
                <div><strong>이름:</strong> {selectedDelivery.senderName}</div>
                <div><strong>전화번호:</strong> {selectedDelivery.senderPhone}</div>
                <div><strong>주소:</strong> {selectedDelivery.senderAddress} {selectedDelivery.senderDetailAddress || ''}</div>
                {selectedDelivery.senderPostalCode && (
                  <div><strong>우편번호:</strong> {selectedDelivery.senderPostalCode}</div>
                )}
              </div>
              
              <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                <h3 style={{ marginBottom: '0.5rem', color: '#2f261c' }}>받는 사람</h3>
                <div><strong>이름:</strong> {selectedDelivery.receiverName}</div>
                <div><strong>전화번호:</strong> {selectedDelivery.receiverPhone}</div>
                <div><strong>주소:</strong> {selectedDelivery.receiverAddress} {selectedDelivery.receiverDetailAddress || ''}</div>
                {selectedDelivery.receiverPostalCode && (
                  <div><strong>우편번호:</strong> {selectedDelivery.receiverPostalCode}</div>
                )}
              </div>
              
              {selectedDelivery.donation && selectedDelivery.donation.donationItem && (
                <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                  <h3 style={{ marginBottom: '0.5rem', color: '#2f261c' }}>배송 물품</h3>
                  {(selectedDelivery.donation.donationItem.detailCategory || selectedDelivery.donation.donationItem.mainCategory) && (
                    <div><strong>카테고리:</strong> {selectedDelivery.donation.donationItem.detailCategory || selectedDelivery.donation.donationItem.mainCategory}</div>
                  )}
                  {selectedDelivery.donation.donationItem.size && (
                    <div><strong>사이즈:</strong> {selectedDelivery.donation.donationItem.size}</div>
                  )}
                  {selectedDelivery.donation.donationItem.genderType && (
                    <div><strong>성별:</strong> {selectedDelivery.donation.donationItem.genderType === 'MALE' ? '남성' : selectedDelivery.donation.donationItem.genderType === 'FEMALE' ? '여성' : '공용'}</div>
                  )}
                  {selectedDelivery.donation.donationItem.quantity && selectedDelivery.donation.donationItem.quantity > 1 && (
                    <div><strong>수량:</strong> {selectedDelivery.donation.donationItem.quantity}개</div>
                  )}
                  {selectedDelivery.donation.donationItem.description && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <strong>설명:</strong>
                      <div style={{ marginTop: '0.25rem', color: '#666', fontSize: '0.9rem' }}>
                        {selectedDelivery.donation.donationItem.description}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                <h3 style={{ marginBottom: '0.5rem', color: '#2f261c' }}>배송 일정</h3>
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
            
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowDeliveryModal(false)
                  setSelectedDelivery(null)
                }}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#f5f5f5',
                  color: '#2f261c',
                  border: '1px solid #ddd',
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

