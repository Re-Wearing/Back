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
  // API 데이터 상태
  const [apiDonationItems, setApiDonationItems] = useState([]);
  const [apiOrganizations, setApiOrganizations] = useState([]);
  const [apiPosts, setApiPosts] = useState([]);
  const [apiUsers, setApiUsers] = useState([]); // API에서 가져온 사용자 목록
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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
  const [viewingPost, setViewingPost] = useState(null);

  // API에서 기부 목록 조회
  useEffect(() => {
    const fetchDonationData = async () => {
      if (activePanel !== 'items' && activePanel !== 'matching') return;
      
      try {
        setLoading(true);
        setError(null);
        
        // 승인 대기 목록 조회
        const pendingResponse = await fetch('/api/admin/donations/pending', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        if (!pendingResponse.ok) {
          throw new Error('기부 목록 조회에 실패했습니다.');
        }
        
        const pendingData = await pendingResponse.json();
        const pendingItems = (pendingData.donations || []).map(item => ({
          ...item,
          owner: item.owner || 'unknown'
        }));
        
        // 자동 매칭 대기 목록 조회
        const autoMatchResponse = await fetch('/api/admin/donations/auto-match', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        if (!autoMatchResponse.ok) {
          throw new Error('자동 매칭 목록 조회에 실패했습니다.');
        }
        
        const autoMatchData = await autoMatchResponse.json();
        const autoMatchItems = (autoMatchData.donations || []).map(item => ({
          ...item,
          owner: item.owner || 'unknown'
        }));
        
        // 두 목록 합치기 (중복 제거)
        const allItems = [...pendingItems, ...autoMatchItems];
        const uniqueItems = allItems.filter((item, index, self) =>
          index === self.findIndex(t => t.id === item.id)
        );
        
        setApiDonationItems(uniqueItems);
        
        // 기관 목록 조회
        const organsResponse = await fetch('/api/admin/donations/organs', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        if (organsResponse.ok) {
          const organsData = await organsResponse.json();
          setApiOrganizations(organsData.organs || []);
        }
      } catch (err) {
        console.error('기부 데이터 조회 오류:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDonationData();
  }, [activePanel]);

  // API에서 사용자 목록 및 통계 정보 조회
  useEffect(() => {
    const fetchUsers = async () => {
      if (activePanel !== 'members') return;
      
      try {
        setLoading(true);
        const response = await fetch('/api/admin/users/with-stats', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('사용자 목록 조회에 실패했습니다.');
        }
        
        const data = await response.json();
        const users = data.data || data || []; // ApiResponse 구조에 따라 조정
        setApiUsers(users);
      } catch (err) {
        console.error('사용자 목록 조회 오류:', err);
        setError(err.message);
        setApiUsers([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [activePanel]);

  // API에서 게시물 목록 조회
  useEffect(() => {
    const fetchPosts = async () => {
      if (activePanel !== 'posts') return;
      
      try {
        setLoading(true);
        setError(null);
        
        // 모든 게시물 조회 (타입 필터 없이)
        const response = await fetch('/api/posts?page=0&size=100', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('게시물 목록 조회에 실패했습니다.');
        }
        
        const data = await response.json();
        console.log('게시물 목록 조회 성공:', data);
        const posts = data.content || [];
        console.log('게시물 개수:', posts.length);
        setApiPosts(posts);
      } catch (err) {
        console.error('게시물 목록 조회 오류:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPosts();
  }, [activePanel]);

  // 게시물 상세 조회
  const handleViewPost = async (postId) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('게시물 조회에 실패했습니다.');
      }
      
      const post = await response.json();
      setViewingPost(post);
    } catch (err) {
      console.error('게시물 조회 오류:', err);
      showToast(err.message || '게시물 조회에 실패했습니다.');
    }
  };

  // 게시물 삭제 핸들러
  const handleDeletePost = async (postId) => {
    if (!window.confirm('정말 이 게시물을 삭제하시겠습니까?')) return;
    
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '게시물 삭제에 실패했습니다.');
      }
      
      showToast('게시물이 삭제되었습니다.');
      
      // 목록에서 제거
      setApiPosts(prev => prev.filter(post => post.id !== postId));
    } catch (err) {
      console.error('게시물 삭제 오류:', err);
      showToast(err.message || '게시물 삭제에 실패했습니다.');
    }
  };


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

  // 🔍 검색 + 필터 적용된 rows (API 데이터 기반)
  const rows = useMemo(() => {
    // API에서 가져온 사용자 데이터 사용
    if (apiUsers.length === 0) {
      return [];
    }
    
    return apiUsers
      .map(user => ({
        id: user.id,
        username: user.username,
        nickname: user.nickname || user.username,
        role: user.role,
        email: user.email,
        unread: user.unreadNotificationCount || 0,
        donationCount: user.donationCount || 0
      }))
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
  }, [apiUsers, searchText, roleFilter]);

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
  
  // API 데이터와 기존 prop 데이터 병합
  const mergedDonationItems = useMemo(() => {
    if (apiDonationItems.length > 0) {
      return apiDonationItems;
    }
    return Array.isArray(donationItems)
      ? donationItems.filter(item => item.status && allowedAdminStatuses.has(item.status))
      : [];
  }, [apiDonationItems, donationItems, allowedAdminStatuses]);
  
  const donationQueue = mergedDonationItems;
  const autoMatchingQueue = donationQueue.filter(
    item => item.donationMethod === '자동 매칭' && item.status === '매칭대기' && !item.pendingOrganization
  );
  const pendingInviteList = Array.isArray(matchingInvites) ? matchingInvites : [];
  
  // 기관 옵션 병합
  const mergedOrganizationOptions = useMemo(() => {
    if (apiOrganizations.length > 0) {
      return apiOrganizations.map(org => ({
        username: org.username || org.id.toString(),
        name: org.name || org.username
      }));
    }
    return organizationOptions;
  }, [apiOrganizations, organizationOptions]);

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

  const handleReset = async (username) => {
    if (!window.confirm(`${username} 계정의 비밀번호를 초기화하시겠습니까?`)) return;
    
    // API에서 가져온 사용자 목록에서 ID 찾기
    const user = apiUsers.find(u => u.username === username);
    if (!user || !user.id) {
      showToast('사용자 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${user.id}/reset-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || '비밀번호 초기화에 실패했습니다.');
      }

      showToast(result.message || `${username} 비밀번호 초기화 완료!`);
      
      // 사용자 목록 새로고침
      const refreshResponse = await fetch('/api/admin/users/with-stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        const refreshedUsers = refreshData.data || refreshData || [];
        setApiUsers(refreshedUsers);
      }
      
      // 기존 콜백도 호출 (하위 호환성)
      if (typeof onResetPassword === 'function') {
        onResetPassword(username, 'rewear123!');
      }
    } catch (err) {
      console.error('비밀번호 초기화 오류:', err);
      showToast(err.message || '비밀번호 초기화에 실패했습니다.');
    }
  };

  const handleDelete = async (username) => {
    if (!window.confirm(`${username} 계정을 삭제하시겠습니까?`)) return;
    
    // API에서 가져온 사용자 목록에서 ID 찾기
    const user = apiUsers.find(u => u.username === username);
    if (!user || !user.id) {
      showToast('사용자 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || '사용자 삭제에 실패했습니다.');
      }

      showToast(result.message || `${username} 계정 삭제됨`);
      
      // 사용자 목록 새로고침
      const refreshResponse = await fetch('/api/admin/users/with-stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        const refreshedUsers = refreshData.data || refreshData || [];
        setApiUsers(refreshedUsers);
      }
      
      // 기존 콜백도 호출 (하위 호환성)
      if (typeof onDeleteUser === 'function') {
        onDeleteUser(username);
      }
    } catch (err) {
      console.error('사용자 삭제 오류:', err);
      showToast(err.message || '사용자 삭제에 실패했습니다.');
    }
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

  const handleDonationAction = async (item, nextStatus, options = {}) => {
    try {
      if (nextStatus === '매칭대기') {
        // 승인 API 호출
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
        
        // 즉시 로컬 상태 업데이트 (매칭대기로 변경)
        setApiDonationItems(prev => prev.map(i => {
          if (i.id === item.id) {
            return {
              ...i,
              status: '매칭대기',
              matchingInfo: options.matchingInfo || '기관 매칭을 기다리는 중입니다.',
              pendingOrganization: options.pendingOrganization || i.pendingOrganization,
              matchedOrganization: null
            };
          }
          return i;
        }));
        
        // API 데이터 새로고침 (백그라운드)
        const refreshResponse = await fetch('/api/admin/donations/pending', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          const refreshedItems = (refreshData.donations || []).map(i => ({
            ...i,
            owner: i.owner || 'unknown'
          }));
          setApiDonationItems(prev => {
            // 기존 항목 제거하고 새로고침된 데이터로 교체
            const filtered = prev.filter(i => i.id !== item.id);
            return [...filtered, ...refreshedItems];
          });
        }
        
        // 기존 콜백도 호출 (하위 호환성)
        if (typeof onUpdateDonationStatus === 'function') {
          onUpdateDonationStatus(item.owner, item.id, nextStatus, options);
        }
      } else if (nextStatus === '거절됨') {
        // 반려는 handleReasonConfirm에서 처리
        return;
      }
    } catch (err) {
      console.error('기부 상태 변경 오류:', err);
      showToast(err.message || '기부 상태 변경에 실패했습니다.');
    }
  };

  const handleRejectItem = item => {
    openReasonModal({
      type: 'item',
      item,
      title: '물품 거절 사유',
      placeholder: '거절 사유를 입력해주세요.'
    });
  };

  // 배송 상태 업데이트 함수
  const handleUpdateDeliveryStatus = async (deliveryId, status) => {
    try {
      const response = await fetch(`/api/admin/deliveries/${deliveryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || '배송 상태 업데이트에 실패했습니다.');
      }

      showToast(result.message || '배송 상태가 업데이트되었습니다.');
      return { success: true, delivery: result.delivery };
    } catch (err) {
      console.error('배송 상태 업데이트 오류:', err);
      showToast(err.message || '배송 상태 업데이트에 실패했습니다.');
      return { success: false, error: err.message };
    }
  };

  const handleSendInvite = async item => {
    const selectedOrg = matchSelections[item.id];
    if (!selectedOrg) {
      window.alert('매칭할 기관을 선택해주세요.');
      return;
    }
    
    try {
      // 기관 ID 찾기
      const selectedOrgan = apiOrganizations.find(org => 
        org.username === selectedOrg || org.name === selectedOrg || org.id.toString() === selectedOrg
      );
      
      if (!selectedOrgan) {
        throw new Error('선택한 기관을 찾을 수 없습니다.');
      }
      
      // 기관 할당 API 호출
      const response = await fetch(`/api/admin/donations/${item.id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          organId: selectedOrgan.id
        })
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.message || '기관 할당에 실패했습니다.');
      }
      
      showToast(result.message || '기관에 할당되었습니다.');
      setMatchSelections(prev => ({ ...prev, [item.id]: '' }));
      
      // API 데이터 새로고침
      const refreshResponse = await fetch('/api/admin/donations/auto-match', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        const refreshedItems = (refreshData.donations || []).map(i => ({
          ...i,
          owner: i.owner || 'unknown'
        }));
        setApiDonationItems(prev => {
          const filtered = prev.filter(i => i.id !== item.id);
          return [...filtered, ...refreshedItems];
        });
      }
      
      // 기존 콜백도 호출 (하위 호환성)
      if (typeof onSendMatchingInvite === 'function') {
        onSendMatchingInvite(item.owner, item.id, selectedOrg);
      }
    } catch (err) {
      console.error('기관 할당 오류:', err);
      showToast(err.message || '기관 할당에 실패했습니다.');
    }
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

    if (reasonModal.type === 'org' && typeof onRejectOrganization === 'function') {
      onRejectOrganization(reasonModal.requestId, trimmed);
      showToast('기관 가입을 거절했습니다.');
    } else if (reasonModal.type === 'item') {
      try {
        // 기부 반려 API 호출
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
        
        // 즉시 로컬 상태 업데이트 (거절됨으로 변경)
        setApiDonationItems(prev => prev.map(i => {
          if (i.id === reasonModal.item.id) {
            return {
              ...i,
              status: '거절됨',
              rejectionReason: trimmed,
              matchingInfo: `거절 사유: ${trimmed}`,
              pendingOrganization: null,
              matchedOrganization: null
            };
          }
          return i;
        }));
        
        // API 데이터 새로고침 (백그라운드)
        const refreshResponse = await fetch('/api/admin/donations/pending', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          const refreshedItems = (refreshData.donations || []).map(i => ({
            ...i,
            owner: i.owner || 'unknown'
          }));
          setApiDonationItems(prev => {
            // 기존 항목 제거하고 새로고침된 데이터로 교체
            const filtered = prev.filter(i => i.id !== reasonModal.item.id);
            return [...filtered, ...refreshedItems];
          });
        }
        
        // 기존 콜백도 호출 (하위 호환성)
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
        <h1>회원 관리</h1>
        <button type="button" className="btn primary" onClick={() => onNavigateHome('/main')}>
메인으로
        </button>
      </div>

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

      {loading && <div className="loading">로딩 중...</div>}
      {error && <div className="error">오류: {error}</div>}
      
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
            {paginatedRows.length === 0 && !loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                  회원이 없습니다.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row) => (
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
              ))
            )}
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

      {/* Other panels (orgs, items, matching, posts) have been moved to separate pages */}

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
            <p className="text-muted">상세 내역은 개별 조회 기능을 이용해주세요.</p>
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
              imageModal.images.map((img, index) => {
                const imageUrl = img.dataUrl || img.url || img;
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
            <div className="modal-buttons">
              <button className="small-btn" onClick={() => setImageModal(null)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingPost && (
        <div className="modal-overlay" onClick={() => setViewingPost(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2>게시물 상세보기</h2>
            
            <div className="modal-content" style={{ padding: '1rem 0' }}>
              <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <label style={{ fontWeight: '600' }}>게시물 타입:</label>
                <span className={`type-badge ${viewingPost.postType === 'DONATION_REVIEW' ? 'review' : 'request'}`}>
                  {viewingPost.postType === 'DONATION_REVIEW' ? '기부 후기' : '요청 게시물'}
                </span>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>제목</label>
                <div style={{ padding: '0.75rem', background: '#f5f5f5', borderRadius: '4px', border: '1px solid #ddd' }}>
                  {viewingPost.title}
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>내용</label>
                <div style={{ padding: '0.75rem', background: '#f5f5f5', borderRadius: '4px', border: '1px solid #ddd', minHeight: '150px', whiteSpace: 'pre-wrap' }}>
                  {viewingPost.content}
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>작성자</label>
                <div style={{ padding: '0.75rem', background: '#f5f5f5', borderRadius: '4px', border: '1px solid #ddd' }}>
                  {viewingPost.writer || '익명'}
                  {viewingPost.writerType && (
                    <span className="anon-chip" style={{ marginLeft: '0.5rem' }}>
                      {viewingPost.writerType === 'user' ? '일반 회원' : '기관 회원'}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>조회수</label>
                  <div style={{ padding: '0.75rem', background: '#f5f5f5', borderRadius: '4px', border: '1px solid #ddd' }}>
                    {viewingPost.viewCount || 0}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>작성일</label>
                  <div style={{ padding: '0.75rem', background: '#f5f5f5', borderRadius: '4px', border: '1px solid #ddd' }}>
                    {viewingPost.createdAt 
                      ? new Date(viewingPost.createdAt).toLocaleString('ko-KR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : '-'}
                  </div>
                </div>
              </div>

              {viewingPost.images && viewingPost.images.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>이미지</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.5rem' }}>
                    {viewingPost.images.map((img, index) => {
                      const imageUrl = img.url || img.dataUrl || img;
                      const fullUrl = imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')
                        ? (imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`)
                        : imageUrl;
                      return (
                        <div key={index} style={{ position: 'relative' }}>
                          <img
                            src={fullUrl}
                            alt={`게시물 이미지 ${index + 1}`}
                            style={{ 
                              width: '100%', 
                              height: '150px', 
                              objectFit: 'cover', 
                              borderRadius: '4px',
                              cursor: 'pointer',
                              border: '1px solid #ddd'
                            }}
                            onClick={() => {
                              setImageModal({
                                title: viewingPost.title,
                                images: viewingPost.images.map(i => ({
                                  url: i.url || i.dataUrl || i,
                                  dataUrl: i.dataUrl || i.url || i
                                }))
                              });
                            }}
                            onError={(e) => {
                              console.error('이미지 로드 실패:', fullUrl);
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-buttons">
              <button
                className="small-btn danger"
                onClick={async () => {
                  if (window.confirm('정말 이 게시물을 삭제하시겠습니까?')) {
                    await handleDeletePost(viewingPost.id);
                    setViewingPost(null);
                  }
                }}
              >
                삭제
              </button>
              <button
                className="small-btn"
                onClick={() => setViewingPost(null)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
