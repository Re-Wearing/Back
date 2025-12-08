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

  const [activeTab, setActiveTab] = useState('shipments')
  const [imageModal, setImageModal] = useState(null)
  const [reasonModal, setReasonModal] = useState(null)
  const [reasonText, setReasonText] = useState('')

  const donations = useMemo(
    () =>
      (shipments || [])
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
        })),
    [shipments, currentUser.name, currentUser.nickname]
  )
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

  const organizationInviteList = useMemo(
    () => (matchingInvites || []).filter(invite => invite.organizationUsername === currentUser.username),
    [matchingInvites, currentUser.username]
  )
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

  const handleInviteResponse = (inviteId, decision) => {
    if (typeof onRespondMatchingInvite !== 'function') return
    if (decision === 'reject') {
      setReasonModal({ inviteId })
      setReasonText('')
    } else {
      onRespondMatchingInvite(inviteId, 'accept')
    }
  }

  const handleReasonConfirm = () => {
    if (!reasonModal || !reasonText.trim()) return
    onRespondMatchingInvite(reasonModal.inviteId, 'reject', reasonText.trim())
    setReasonModal(null)
    setReasonText('')
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
                  <input type="search" placeholder="검색..." />
                </div>
                <button type="button" className="btn-filter">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                  Filters
                </button>
              </div>

              {donations.length === 0 ? (
                <div className="donation-status-empty">
                  <p>아직 받은 기부가 없습니다.</p>
                  <p>기부를 받은 후 조회할 수 있습니다.</p>
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
    </section>
  )
}

