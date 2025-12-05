import { useEffect, useState, useMemo } from 'react';
import '../styles/admin-manage.css';

export default function AdminMatchingPage({
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
  const [matchSelections, setMatchSelections] = useState({});

  // API에서 자동 매칭 대기 목록 조회
  useEffect(() => {
    const fetchDonationData = async () => {
      try {
        setLoading(true);
        setError(null);
        
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
        
        setApiDonationItems(autoMatchItems);
        
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
  }, []);

  // 기관 옵션 병합
  const mergedOrganizationOptions = useMemo(() => {
    if (apiOrganizations.length > 0) {
      return apiOrganizations;
    }
    return Array.isArray(organizationOptions) ? organizationOptions : [];
  }, [apiOrganizations, organizationOptions]);

  const autoMatchingQueue = useMemo(() => {
    return apiDonationItems.filter(
      item => item.donationMethod === '자동 매칭' && item.status === '매칭대기' && !item.pendingOrganization
    );
  }, [apiDonationItems]);

  const pendingInviteList = Array.isArray(matchingInvites) ? matchingInvites : [];

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  const handleSendInvite = async item => {
    const selectedOrg = matchSelections[item.id];
    if (!selectedOrg) {
      window.alert('매칭할 기관을 선택해주세요.');
      return;
    }
    
    try {
      const selectedOrgan = apiOrganizations.find(org => 
        org.username === selectedOrg || org.name === selectedOrg || org.id.toString() === selectedOrg
      );
      
      if (!selectedOrgan) {
        throw new Error('선택한 기관을 찾을 수 없습니다.');
      }
      
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
      
      if (typeof onSendMatchingInvite === 'function') {
        onSendMatchingInvite(item.owner, item.id, selectedOrg);
      }
    } catch (err) {
      console.error('기관 할당 오류:', err);
      showToast(err.message || '기관 할당에 실패했습니다.');
    }
  };

  return (
    <div className="admin-manage-page">
      {toast && <div className="toast">{toast}</div>}

      <div className="admin-manage-header">
        <h1>자동 매칭</h1>
        <button type="button" className="btn primary" onClick={() => onNavigateHome('/main')}>
          메인으로
        </button>
      </div>

      <section className="admin-panel">
        <h2>자동 매칭 대기 물품</h2>
        {loading ? (
          <p className="empty-hint">자동 매칭 목록을 불러오는 중...</p>
        ) : error ? (
          <p className="empty-hint" style={{ color: 'red' }}>오류: {error}</p>
        ) : autoMatchingQueue.length === 0 ? (
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
                    {mergedOrganizationOptions.map((org) => (
                      <option key={org.username || org.id} value={org.username || org.id}>
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
    </div>
  );
}

