import { useEffect, useMemo, useState } from 'react';
import '../styles/admin-manage.css';

export default function AdminManagePage({
  accounts,
  profiles,
  notifications,
  shipments,
  pendingOrganizations = [],
  donationItems = [],
  organizationOptions = [],
  matchingInvites = [],
  onApproveOrganization,
  onRejectOrganization,
  onUpdateDonationStatus,
  onSendMatchingInvite,
  onResetPassword,
  onDeleteUser,
  onNavigateHome,
  initialPanel = 'members',
  onPanelChange
}) {
  // 디버깅: props 확인 (개발 환경에서만)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 AdminManagePage - shipments prop:', shipments);
    console.log('🔍 AdminManagePage - shipments type:', typeof shipments, 'isArray:', Array.isArray(shipments));
    console.log('🔍 AdminManagePage - accounts[user]:', accounts?.user);
  }
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState('전체');
  const [toast, setToast] = useState(null);
  // 상세 정보 모달 상태
const [selectedUser, setSelectedUser] = useState(null);
const [showModal, setShowModal] = useState(false);

  // 정렬 상태
  const [sortField, setSortField] = useState('username');
  const [sortDirection, setSortDirection] = useState('asc');

  // 페이지네이션
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;
  const [activePanel, setActivePanel] = useState(initialPanel || 'members');
  const [matchSelections, setMatchSelections] = useState({});
  const [pendingItemUpdates, setPendingItemUpdates] = useState({});
  const [imageModal, setImageModal] = useState(null);
  const [reasonModal, setReasonModal] = useState(null);
  const [reasonText, setReasonText] = useState('');
  useEffect(() => {
    if (initialPanel && initialPanel !== activePanel) {
      setActivePanel(initialPanel);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPanel]);

  const handlePanelChange = panel => {
    setActivePanel(panel);
    onPanelChange?.(panel);
  };

  // 토스트 메시지 함수
  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  const formatStatusLabel = status => {
    switch (status) {
      case '승인대기':
        return '승인대기'
      case '매칭대기':
        return '매칭대기'
      case '매칭됨':
        return '매칭됨'
      case '거절됨':
        return '거절됨'
      case '배송대기':
        return '배송대기'
      default:
        return status
    }
  }

  // 🔍 검색 + 필터 적용된 rows
  const rows = useMemo(() => {
    // shipments가 배열인지 확인하고, 아니면 빈 배열로 처리
    const shipmentsArray = Array.isArray(shipments) ? shipments : [];
    
    // 디버깅: shipments 데이터 확인
    if (shipmentsArray.length > 0) {
      console.log('🔍 AdminManagePage - shipments:', shipmentsArray);
    } else {
      console.warn('⚠️ AdminManagePage - shipments가 비어있거나 배열이 아님:', shipments);
    }
    
    // 디버깅: 모든 accounts 확인
    console.log('🔍 모든 accounts:', Object.keys(accounts));
    console.log('🔍 accounts[user]:', accounts['user']);
    
    return Object.entries(accounts)
    .map(([username, acc]) => {
      const nickname = profiles[username]?.nickname || acc.name;
      
      // 디버깅: user 계정 정보
      if (username === 'user') {
        console.log('🔍 user 계정 발견!', { username, role: acc.role, name: acc.name, nickname });
      }
    
      // ⭐ 일반/기관 기부 횟수 계산
      let donationCount = 0;
    
      if (acc.role === "일반 회원") {
        // 모든 shipments의 sender와 비교 가능한 값들을 확인
        const accountName = String(acc.name || '').trim();
        const accountNickname = String(nickname || '').trim();
        const accountUsername = String(username || '').trim();
        
        donationCount = shipmentsArray.filter((s) => {
          if (!s || !s.sender) return false;
          
          const sender = String(s.sender || '').trim();
          
          // username이 'user'인 경우, sender가 '권석현'이면 매칭
          if (username === 'user' && sender === '권석현') {
            console.log(`✅ user 계정 매칭 성공! sender: "${sender}"`);
            return true;
          }
          
          // 일반적인 비교 로직
          const matches = sender === accountName || 
                         sender === accountNickname || 
                         sender === accountUsername;
          
          if (username === 'user') {
            console.log(`🔍 비교: sender="${sender}" vs name="${accountName}" nickname="${accountNickname}" username="${accountUsername}" → ${matches}`);
          }
          
          return matches;
        }).length;
        
        if (username === 'user') {
          console.log(`📊 최종 기부횟수: ${donationCount}회`);
        }
      }
    
      if (acc.role === "기관 회원") {
        donationCount = shipmentsArray.filter(
          (s) => {
            if (!s || !s.receiver) return false;
            const receiver = String(s.receiver || '').trim();
            const accountName = String(acc.name || '').trim();
            const accountNickname = String(nickname || '').trim();
            
            return receiver === accountName || 
                   receiver === accountNickname;
          }
        ).length;
      }
    
      return {
        username,
        role: acc.role,
        email: acc.email,
        nickname,
        unread: (notifications[username] || []).filter((n) => !n.read).length,
        donationCount   // ⭐ 새로 추가됨
      };
    })
    
      .filter((row) => {
        const text = searchText.toLowerCase();
        const match =
          row.username.toLowerCase().includes(text) ||
          row.nickname.toLowerCase().includes(text) ||
          row.email.toLowerCase().includes(text) ||
          row.role.toLowerCase().includes(text);

        const roleMatch = roleFilter === '전체' || roleFilter === row.role;
        return match && roleMatch;
      });
  }, [accounts, profiles, notifications, searchText, roleFilter, shipments]);

  // 🔽 정렬 기능 적용
  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const A = a[sortField];
      const B = b[sortField];

      if (A < B) return sortDirection === 'asc' ? -1 : 1;
      if (A > B) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [rows, sortField, sortDirection]);

  // 📄 페이지네이션 rows
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return sortedRows.slice(start, start + itemsPerPage);
  }, [sortedRows, page]);

  const orgRequests = Array.isArray(pendingOrganizations) ? pendingOrganizations : [];
  const allowedAdminStatuses = new Set(['승인대기', '매칭대기', '매칭됨', '거절됨']);
  const donationQueue = Array.isArray(donationItems)
    ? donationItems.filter(item => item.status && allowedAdminStatuses.has(item.status))
    : [];
  const autoMatchingQueue = donationQueue.filter(
    item => item.donationMethod === '자동 매칭' && item.status === '매칭대기' && !item.pendingOrganization
  );
  const pendingInviteList = Array.isArray(matchingInvites) ? matchingInvites : [];

  const getMatchingMemoText = item => {
    if (item?.rejectionReason) return `거절: ${item.rejectionReason}`;
    if (item?.pendingOrganization) return `${item.pendingOrganization} 기관 확인 중입니다.`;
    if (
      item?.donationMethod === '직접 매칭' &&
      item?.donationOrganization &&
      item?.status !== '승인대기'
    ) {
      return `${item.donationOrganization} 기관 확인 중입니다.`;
    }
    if (item?.matchingInfo) return item.matchingInfo;
    return '-';
  };

  // 정렬 버튼 클릭 시 동작
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleReset = (username) => {
    const result = onResetPassword(username, 'rewear123!');
    if (result.success) showToast(`${username} 비밀번호 초기화 완료!`);
    else showToast(`오류: ${result.message}`);
  };

  const handleDelete = (username) => {
    if (!window.confirm(`${username} 계정을 삭제하시겠습니까?`)) return;
    const result = onDeleteUser(username);
    if (result.success) showToast(`${username} 계정 삭제됨`);
    else showToast(`실패: ${result.message}`);
  };

  const handleApproveOrg = requestId => {
    if (typeof onApproveOrganization !== 'function') return;
    onApproveOrganization(requestId);
    showToast('기관 가입을 승인했습니다.');
  };

  const openReasonModal = payload => {
    setReasonText('');
    setReasonModal(payload);
  };

  const handleRejectOrg = requestId => {
    if (typeof onRejectOrganization !== 'function') return;
    openReasonModal({ type: 'org', requestId, title: '기관 가입 거절 사유', placeholder: '거절 사유를 입력해주세요.' });
  };

  const handleDonationAction = (item, nextStatus, options = {}) => {
    if (typeof onUpdateDonationStatus !== 'function') return;
    onUpdateDonationStatus(item.owner, item.id, nextStatus, options);
    showToast('물품 상태가 업데이트되었습니다.');
  };

  const handleRejectItem = item => {
    openReasonModal({
      type: 'item',
      item,
      title: '물품 거절 사유',
      placeholder: '거절 사유를 입력해주세요.'
    });
  };

  const handleSendInvite = item => {
    if (typeof onSendMatchingInvite !== 'function') return;
    const selectedOrg = matchSelections[item.id];
    if (!selectedOrg) {
      window.alert('매칭할 기관을 선택해주세요.');
      return;
    }
    onSendMatchingInvite(item.owner, item.id, selectedOrg);
    setMatchSelections(prev => ({ ...prev, [item.id]: '' }));
    showToast('기관에 매칭 제안을 보냈습니다.');
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

  const handleReasonConfirm = () => {
    if (!reasonModal) return;
    const trimmed = reasonText.trim();
    if (!trimmed) return;

    if (reasonModal.type === 'org' && typeof onRejectOrganization === 'function') {
      onRejectOrganization(reasonModal.requestId, trimmed);
      showToast('기관 가입을 거절했습니다.');
    } else if (reasonModal.type === 'item') {
      queueItemUpdate(
        reasonModal.item,
        '거절됨',
        {
          rejectionReason: trimmed,
          matchingInfo: `거절 사유: ${trimmed}`,
          pendingOrganization: null,
          matchedOrganization: null
        },
        '거절'
      );
    }

    setReasonModal(null);
    setReasonText('');
  };

  // ⭐ 회원 기부/수혜 내역 계산 함수
  const getUserDonationStats = (user) => {
    if (!user || !shipments || !Array.isArray(shipments)) return { count: 0, recent: [] };
    
    // accounts에서 실제 계정 정보 가져오기
    const account = accounts[user.username];
    if (!account) return { count: 0, recent: [] };

    // 1) 일반 회원: sender(보낸 사람) 기준
    if (user.role === "일반 회원") {
      const sent = shipments.filter(s => {
        if (!s || !s.sender) return false;
        const sender = String(s.sender || '').trim();
        
        // username이 'user'인 경우, sender가 '권석현'이면 매칭
        if (user.username === 'user' && sender === '권석현') {
          return true;
        }
        
        // 일반적인 비교 로직
        const accountName = String(account.name || '').trim();
        const userNickname = String(user.nickname || '').trim();
        const userUsername = String(user.username || '').trim();
        
        return sender === accountName ||
               sender === userNickname ||
               sender === userUsername;
      });
      return {
        count: sent.length,
        recent: sent.slice(0, 3)
      };
    }

    // 2) 기관 회원: receiver(받은 기관) 기준
    if (user.role === "기관 회원") {
      const received = shipments.filter(s =>
        s?.receiver === account.name ||
        s?.receiver === user.nickname
      );
      return {
        count: received.length,
        recent: received.slice(0, 3)
      };
    }

    // 3) 관리자 회원 → 기부/수혜 통계 없음
    return { count: 0, recent: [] };
  };


  return (
    <div className="admin-manage-page">
      {toast && <div className="toast">{toast}</div>}

      <div className="admin-manage-header">
        <h1>운영 도구</h1>
        <button type="button" className="btn primary" onClick={() => onNavigateHome('/main')}>
          메인으로
        </button>
      </div>

      <div className="admin-tabs">
        <button type="button" className={activePanel === 'members' ? 'active' : ''} onClick={() => handlePanelChange('members')}>
          회원 관리
        </button>
        <button type="button" className={activePanel === 'orgs' ? 'active' : ''} onClick={() => handlePanelChange('orgs')}>
          기관 가입 승인
        </button>
        <button type="button" className={activePanel === 'items' ? 'active' : ''} onClick={() => handlePanelChange('items')}>
          물품 승인
        </button>
        <button type="button" className={activePanel === 'matching' ? 'active' : ''} onClick={() => handlePanelChange('matching')}>
          자동 매칭
        </button>
      </div>

      {activePanel === 'members' && (
        <>
      <div className="admin-controls">
        <input
          type="text"
          placeholder="아이디, 닉네임, 이메일 검색..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="search-input"
        />

        <select
          className="filter-select"
          value={roleFilter}
          onChange={(e) => {
                setPage(1);
            setRoleFilter(e.target.value);
          }}
        >
          <option>전체</option>
          <option>일반 회원</option>
          <option>기관 회원</option>
          <option>관리자 회원</option>
        </select>
      </div>

      <div className="admin-table-wrapper">
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort('username')}>아이디</th>
              <th onClick={() => handleSort('nickname')}>닉네임</th>
              <th onClick={() => handleSort('role')}>역할</th>
              <th onClick={() => handleSort('email')}>이메일</th>
              <th onClick={() => handleSort('unread')}>안읽은 알림</th>
              <th onClick={() => handleSort('donationCount')}>기부 횟수</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row) => (
              <tr 
              key={row.username}
              className="user-row"
                    onClick={() => {
                      setSelectedUser(row);
                      setShowModal(true);
                    }}
            >
                <td>{row.username}</td>
                <td>{row.nickname}</td>
                <td>
                      <span className={`role-badge role-${row.role.replace(/\s+/g, '')}`}>{row.role}</span>
                </td>
                <td>{row.email}</td>
                <td>
                  <span className={`badge ${row.unread > 0 ? 'unread' : ''}`}>{row.unread}</span>
                </td>
                <td>{row.donationCount}</td>
                <td>
                  {row.username !== 'admin' ? (
                    <>
                          <button
                            className="small-btn"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleReset(row.username);
                            }}
                          >
                        비밀번호 초기화
                      </button>
                          <button
                            className="small-btn danger"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDelete(row.username);
                            }}
                          >
                        삭제
                      </button>
                    </>
                  ) : (
                    <span>-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
            <button onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1}>
          이전
        </button>
            <span>{page}</span>
            <button onClick={() => setPage((prev) => prev + 1)} disabled={paginatedRows.length < itemsPerPage}>
              다음
            </button>
          </div>
        </>
      )}

      {activePanel === 'orgs' && (
        <section className="admin-panel">
          {orgRequests.length === 0 ? (
            <p className="empty-hint">대기 중인 기관 가입 요청이 없습니다.</p>
          ) : (
            <div className="admin-card-list">
              {orgRequests.map((request) => (
                <article key={request.id} className="admin-card">
                  <div className="admin-card-header">
                    <div>
                      <strong>{request.organizationName}</strong>
                      <p>{request.contactName}</p>
                    </div>
                    <span className={`status-chip status-${request.status}`}>{request.status}</span>
                  </div>
                  <ul className="admin-card-meta">
                    <li>아이디 : {request.username}</li>
                    <li>연락처 : {request.phone}</li>
                    <li>이메일 : {request.email}</li>
                    <li>신청일 : {request.submittedAt}</li>
                    {request.address && <li>주소 : {request.address}</li>}
                  </ul>
                  {request.memo && <p className="admin-card-memo">{request.memo}</p>}
                  {request.status === 'pending' ? (
                    <div className="admin-card-actions">
                      <button type="button" className="small-btn primary" onClick={() => handleApproveOrg(request.id)}>
                        승인
                      </button>
                      <button type="button" className="small-btn danger" onClick={() => handleRejectOrg(request.id)}>
                        거절
                      </button>
                    </div>
                  ) : (
                    <p className="admin-card-result">
                      {request.status === 'approved'
                        ? '승인 완료'
                        : `거절 사유: ${request.rejectionReason || '미입력'}`}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {activePanel === 'items' && (
        <section className="admin-panel">
          {donationQueue.length === 0 ? (
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
                    const pendingUpdate = pendingItemUpdates[item.id]
                    return (
                      <tr key={item.id}>
                        <td className="item-image-cell">
                          {item.images?.length ? (
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
                                src={item.images[0].dataUrl || item.images[0].url || item.images[0]}
                                alt="기부 물품"
                              />
                              <span className="image-zoom-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <circle cx="11" cy="11" r="6" />
                                  <line x1="16" y1="16" x2="22" y2="22" />
                                </svg>
                              </span>
                            </button>
                          ) : (
                            <span className="text-muted">이미지 없음</span>
                          )}
                        </td>
                        <td>
                          <div className="text-strong">{item.items || item.name}</div>
                          {item.itemDescription && <p className="item-detail">{item.itemDescription}</p>}
                          <div className="item-meta">
                            {item.deliveryMethod && <span>배송: {item.deliveryMethod}</span>}
                            {item.desiredDate && <span>희망일: {item.desiredDate}</span>}
                            {item.memo && <span>메모: {item.memo}</span>}
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
                          ) : item.status === '매칭됨' || item.pendingOrganization ? (
                            <div className="text-muted">
                              {item.status === '매칭됨' ? '매칭 완료' : '기관 확인 중입니다.'}
                            </div>
                          ) : (
                            <div className="admin-card-actions">
                              {(() => {
                                const isDirectMatch =
                                  item.donationMethod === '직접 매칭' &&
                                  (item.donationOrganizationId || item.donationOrganization)
                                const orgName = item.donationOrganization || item.organization || item.pendingOrganization
                                const approvalOptions = {
                                  matchingInfo: isDirectMatch && orgName
                                    ? `${orgName} 기관 확인 중입니다.`
                                    : '기관 매칭을 기다리는 중입니다.',
                                  rejectionReason: '',
                                  pendingOrganization: isDirectMatch ? orgName : null,
                                  matchedOrganization: null,
                                  directMatchOrganization: isDirectMatch ? orgName : null,
                                  directMatchOrganizationId: isDirectMatch ? item.donationOrganizationId || null : null
                                }
                                return (
                                  <button
                                    type="button"
                                    className="small-btn"
                                    onClick={() => queueItemUpdate(item, '매칭대기', approvalOptions, '승인')}
                                  >
                                    승인
                                  </button>
                                )
                              })()}
                              <button type="button" className="small-btn warning" onClick={() => handleRejectItem(item)}>
                                거절
                              </button>
                              <button
                                type="button"
                                className="small-btn secondary"
                                onClick={() =>
                                  queueItemUpdate(
                                    item,
                                    '승인대기',
                                    {
                                      matchingInfo: '관리자 검토 중입니다.',
                                      rejectionReason: '',
                                      pendingOrganization: null,
                                      matchedOrganization: null
                                    },
                                    '승인대기'
                                  )
                                }
                              >
                                승인대기
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activePanel === 'matching' && (
        <section className="admin-panel">
          <h2>자동 매칭 대기 물품</h2>
          {autoMatchingQueue.length === 0 ? (
            <p className="empty-hint">자동 매칭이 필요한 물품이 없습니다.</p>
          ) : (
            <div className="admin-card-list">
              {autoMatchingQueue.map((item) => (
                <article key={item.id} className="admin-card">
                  <div className="admin-card-header">
                    <div>
                      <strong>{item.name}</strong>
                      <p>{item.ownerName || item.owner}</p>
                    </div>
                    <span className="status-chip status-pending">대기</span>
                  </div>
                  <p className="admin-card-memo">{item.items}</p>
                  <div className="match-select">
                    <select
                      value={matchSelections[item.id] || ''}
                      onChange={(event) =>
                        setMatchSelections((prev) => ({ ...prev, [item.id]: event.target.value }))
                      }
                    >
                      <option value="">기관 선택</option>
                      {organizationOptions.map((org) => (
                        <option key={org.username} value={org.username}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                    <button type="button" className="small-btn primary" onClick={() => handleSendInvite(item)}>
                      매칭 제안
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
      )}

{showModal && selectedUser && (
  <div className="modal-overlay" onClick={() => setShowModal(false)}>
    <div className="modal" onClick={(e) => e.stopPropagation()}>
      <h2>회원 상세 정보</h2>

      <div className="modal-content">
              <p>
                <strong>아이디:</strong> {selectedUser.username}
              </p>
              <p>
                <strong>닉네임:</strong> {selectedUser.nickname}
              </p>
              <p>
                <strong>역할:</strong> {selectedUser.role}
              </p>
              <p>
                <strong>이메일:</strong> {selectedUser.email}
              </p>
              <p>
                <strong>읽지 않은 알림:</strong> {selectedUser.unread} 개
              </p>
              {selectedUser.role !== '관리자 회원' && (
          <>
                  <hr style={{ margin: '12px 0' }} />
                  <h3>📦 {selectedUser.role === '일반 회원' ? '기부한 횟수' : '받은 기부 횟수'}</h3>
            <p>{selectedUser.donationCount || 0} 회</p>

            <h4>📌 최근 내역</h4>
            {(() => {
              const stats = getUserDonationStats(selectedUser);
              return stats.recent.length === 0 ? (
                <p>최근 내역이 없습니다.</p>
              ) : (
                <ul>
                  {stats.recent.map((item, i) => (
                    <li key={i}>
                      {item.startDate || item.date} — {item.product || item.items} → {item.receiver}
                    </li>
                  ))}
                </ul>
              );
            })()}
          </>
        )}
      </div>

      <div className="modal-buttons">
        {selectedUser.username !== 'admin' && (
          <>
            <button
              className="small-btn"
              onClick={() => {
                handleReset(selectedUser.username);
                setShowModal(false);
              }}
            >
              비밀번호 초기화
            </button>

            <button
              className="small-btn danger"
              onClick={() => {
                handleDelete(selectedUser.username);
                setShowModal(false);
              }}
            >
              삭제
            </button>
          </>
        )}

        <button className="small-btn" onClick={() => setShowModal(false)}>
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
      {imageModal && (
        <div className="modal-overlay" onClick={() => setImageModal(null)}>
          <div className="modal image-modal" onClick={e => e.stopPropagation()}>
            <h2>{imageModal.title || '기부 물품 이미지'}</h2>
            {imageModal.images?.length ? (
              imageModal.images.map((img, index) => (
                <img key={img.id || index} src={img.dataUrl || img.url || img} alt="기부 물품" />
              ))
            ) : (
              <p className="text-muted">등록된 이미지가 없습니다.</p>
            )}
            <div className="modal-buttons">
              <button className="small-btn" onClick={() => setImageModal(null)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
