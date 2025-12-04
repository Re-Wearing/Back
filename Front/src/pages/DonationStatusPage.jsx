import { useEffect, useMemo, useState } from 'react'
import HeaderLanding from '../components/HeaderLanding'

export default function DonationStatusPage({
  onNavigateHome,
  onNavLink,
  isLoggedIn,
  onLogout,
  onNotifications,
  unreadCount,
  onMenu = () => {},
  currentUser,
  onRequireLogin,
  shipments = [],
  donationItems = [],
  onNavigateDeliveryStatus = null,
  onCancelDonation = null
}) {
  if (!isLoggedIn || !currentUser) {
    if (onRequireLogin) {
      onRequireLogin()
    }
    return null
  }

  if (currentUser.role === '기관 회원' || currentUser.role === '관리자 회원') {
    if (onNavigateHome) {
      onNavigateHome()
    }
    return null
  }

  const normalizeStatus = status => String(status || '').replace(/\s+/g, '').toLowerCase()
  const isCompletedShipment = status => {
    const normalized = normalizeStatus(status)
    return normalized === '배송완료' || normalized === '완료' || normalized.endsWith('완료')
  }

  const [activeTab, setActiveTab] = useState('approval')

  const approvalStatusDescriptions = {
    승인대기: '관리자 검토 중입니다.',
    매칭대기: '기관 매칭을 기다리는 중입니다.',
    매칭됨: '기관과 매칭이 완료되었어요.',
    거절됨: '사유를 확인 후 다시 신청해주세요.',
    배송대기: '배송 준비 중입니다.',
    취소됨: '기부자가 신청을 취소했습니다.'
  }

  const getApprovalStatus = status => {
    const normalized = normalizeStatus(status)
    if (!normalized) return '승인대기'
    if (normalized.includes('취소')) return '취소됨'
    if (normalized.includes('배송대기')) return '배송대기'
    if (normalized.includes('거절') || normalized.includes('reject')) return '거절됨'
    if (normalized.includes('매칭됨') || normalized.includes('matched')) return '매칭됨'
    if (normalized === '승인대기' || normalized.includes('승인대기')) return '승인대기'
    if (normalized.includes('매칭대기') || normalized.includes('approved')) return '매칭대기'
    return '승인대기'
  }

  const getApprovalStatusColor = status => {
    switch (status) {
      case '승인대기':
        return '#ffb347'
      case '매칭대기':
        return '#64d1ff'
      case '매칭됨':
        return '#4eed90'
      case '거절됨':
        return '#ff6b6b'
      case '배송대기':
        return '#7a6b55'
      case '취소됨':
        return '#b0b0b0'
      default:
        return '#7a6b55'
    }
  }

  const approvalItems = useMemo(
    () =>
      (donationItems || []).map((item = {}, index) => {
        const statusLabel = getApprovalStatus(item.status)
        return {
          id: item.id || item.referenceCode || `donation-${index}`,
          name: item.name || item.items || item.productName || '등록한 기부 물품',
          category: item.category || item.itemType || '분류 미지정',
          registeredAt: item.registeredAt || item.date || item.createdAt || '-',
          status: statusLabel,
          matchingInfo:
            item.matchingInfo ||
            item.matchingSummary ||
            (statusLabel === '매칭대기'
              ? item.pendingOrganization ||
                item.donationOrganization ||
                (item.donationMethod === '직접 매칭' && item.organization && item.organization !== '자동 매칭')
                ? `${item.pendingOrganization || item.donationOrganization || item.organization} 기관 확인 중입니다.`
                : '기관 매칭을 기다리는 중입니다.'
              : statusLabel === '매칭됨'
              ? `${item.organization || item.matchedOrganization || '매칭된 기관'}과 연결되었어요.`
              : statusLabel === '승인대기'
              ? '관리자 검토 중입니다.'
              : statusLabel === '거절됨'
              ? item.rejectionReason
                ? `거절 사유: ${item.rejectionReason}`
                : '사유 확인 후 다시 신청해주세요.'
              : '-'),
          matchedOrganization: item.matchedOrganization || (statusLabel === '매칭됨' ? item.organization : null),
          referenceCode: item.referenceCode || item.id || `donation-${index}`
        }
      }),
    [donationItems]
  )

  const approvalStatusOrder = ['승인대기', '매칭대기', '매칭됨', '거절됨', '배송대기', '취소됨']
  const handleCancelRequest = itemId => {
    if (typeof onCancelDonation !== 'function') return
    const confirmed = window.confirm('기부 신청을 취소하시겠어요? 승인 대기 또는 매칭 대기 상태에서만 취소할 수 있습니다.')
    if (!confirmed) return
    const result = onCancelDonation(itemId)
    if (result === false) {
      window.alert('취소할 수 없는 상태입니다.')
    }
  }


  const approvalCounts = useMemo(() => {
    const counts = approvalStatusOrder.reduce((acc, key) => {
      acc[key] = 0
      return acc
    }, {})
    approvalItems.forEach(item => {
      counts[item.status] = (counts[item.status] || 0) + 1
    })
    return counts
  }, [approvalItems])

  const handleNavigateToDeliveryStatus = reference => {
    if (typeof onNavigateDeliveryStatus === 'function') {
      onNavigateDeliveryStatus(reference)
    } else {
      setActiveTab('history')
    }
  }

  const completedDonations = useMemo(
    () => {
      if (!currentUser) return []
      return (shipments || [])
        .filter(
          shipment =>
            isCompletedShipment(shipment.status) &&
            (!shipment.sender || shipment.sender === currentUser.name || shipment.sender === currentUser.nickname)
        )
        .map(shipment => ({
          id: shipment.id,
          date: shipment.startDate,
          items: shipment.product,
          organization: shipment.receiver,
          status: '완료'
        }))
    },
    [shipments, currentUser]
  )

  const [selectedItems, setSelectedItems] = useState(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    setSelectedItems(prev => {
      const next = new Set()
      completedDonations.forEach(donation => {
        if (prev.has(donation.id)) {
          next.add(donation.id)
        }
      })
      return next
    })
  }, [completedDonations])

  const handleSelectAll = event => {
    if (event.target.checked) {
      setSelectedItems(new Set(completedDonations.map(d => d.id)))
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

  const isAllSelected = selectedItems.size === completedDonations.length && completedDonations.length > 0
  const isIndeterminate = selectedItems.size > 0 && selectedItems.size < completedDonations.length

  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentDonations = completedDonations.slice(startIndex, endIndex)
  const totalPages = Math.ceil(completedDonations.length / itemsPerPage)

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

  const renderApprovalTab = () => {
    if (approvalItems.length === 0) {
      return (
        <div className="donation-status-empty">
          <p>아직 등록한 기부 물품이 없습니다.</p>
          <p>물품을 등록하면 승인 진행 상황을 확인할 수 있어요.</p>
        </div>
      )
    }

    return (
      <>
        <div className="approval-status-grid">
          {approvalStatusOrder.map(status => (
            <div
              key={status}
              className="approval-status-card"
              style={{ borderColor: getApprovalStatusColor(status) }}
            >
              <div className="approval-status-card-header">
                <span>{status}</span>
                <strong>{approvalCounts[status]}</strong>
              </div>
              <p>{approvalStatusDescriptions[status]}</p>
            </div>
          ))}
        </div>

        <div className="donation-table-container approval-table">
          <table className="donation-table">
            <thead>
              <tr>
                <th>등록일</th>
                <th>물품 정보</th>
                <th>진행 상태</th>
                <th>매칭 정보</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {approvalItems.map(item => (
                <tr key={item.id}>
                  <td>{item.registeredAt}</td>
                  <td>
                    <div className="approval-item-name">{item.name}</div>
                    <div className="approval-item-meta">{item.category}</div>
                  </td>
                  <td>
                    <span
                      className="donation-status-badge"
                      style={{ color: getApprovalStatusColor(item.status) }}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <div className="approval-item-matching">{item.matchingInfo}</div>
                    {item.matchedOrganization && (
                      <span className="approval-item-organization">{item.matchedOrganization}</span>
                    )}
                  </td>
                  <td>
                    <div className="approval-item-status-cell">
                      <span className="approval-item-placeholder">
                        {approvalStatusDescriptions[item.status] || '진행 중입니다.'}
                      </span>
                      {item.status === '배송대기' && (
                        <button
                          type="button"
                          className="btn-filter"
                          onClick={() => handleNavigateToDeliveryStatus(item.referenceCode)}
                        >
                          배송 조회
                        </button>
                      )}
                      {['승인대기', '매칭대기'].includes(item.status) && (
                        <button
                          type="button"
                          className="btn-cancel"
                          onClick={() => handleCancelRequest(item.id)}
                        >
                          기부 취소
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="donation-hint">승인 · 매칭 · 거절 상태가 바뀌면 알림으로 알려드릴게요.</p>
      </>
    )
  }

  const renderHistoryTab = () => (
    <>
      <div className="donation-status-actions">
        <div className="donation-search">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input type="search" placeholder="검색..." />
        </div>
        <button type="button" className="btn-cancel" onClick={onNavigateHome}>
          홈으로
        </button>
        <button type="button" className="btn-filter">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          Filters
        </button>
      </div>

      {completedDonations.length === 0 ? (
        <div className="donation-status-empty">
          <p>아직 기부 내역이 없습니다.</p>
          <p>기부를 진행한 후 조회할 수 있습니다.</p>
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
                    <td>
                      <span className="donation-status-badge" style={{ color: getStatusColor(donation.status) }}>
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
  )

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
              <p className="donation-status-subtitle">내 기부 관리</p>
              <h1>내 기부 관리</h1>
              <p>물품 승인부터 배송 완료까지 한 화면에서 확인하세요.</p>
            </div>
            <button type="button" className="btn-cancel" onClick={onNavigateHome}>
              홈으로
            </button>
          </div>

          <div className="donation-status-tabs">
            <button
              type="button"
              className={activeTab === 'approval' ? 'active' : ''}
              onClick={() => setActiveTab('approval')}
            >
              물품 승인 현황
            </button>
            <button
              type="button"
              className={activeTab === 'history' ? 'active' : ''}
              onClick={() => setActiveTab('history')}
            >
              기부 내역 조회
            </button>
          </div>

          {activeTab === 'approval' ? renderApprovalTab() : renderHistoryTab()}
        </div>
      </div>
    </section>
  )
}

