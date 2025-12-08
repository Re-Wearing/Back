import { useState, useMemo, useEffect } from 'react'
import HeaderLanding from '../components/HeaderLanding'
import { getNavLinksForRole, boardTabs, boardNotices, reviewPosts, requestPosts } from '../constants/landingData'

// 게시글에 content 필드 추가 (임시)
const getPostContent = (post) => {
  return post.content || `${post.title}에 대한 상세 내용입니다.`
}

export default function BoardPage({
  onNavigateHome = () => {},
  onLogin = () => {},
  onNavLink,
  isLoggedIn = false,
  onLogout = () => {},
  onNotifications = () => {},
  unreadCount = 0,
  onMenu = () => {},
  onGoToBoardWrite = () => {},
  currentUser = null,
  selectedBoardType: propSelectedBoardType = null,
  boardPosts = { review: [], request: [] },
  boardViews = {},
  onGoToBoardDetail = () => {},
  extraNotices = []
}) {
  const [selectedBoardType, setSelectedBoardType] = useState('all')
  const [selectedSort, setSelectedSort] = useState('latest')
  const [searchInput, setSearchInput] = useState('') 
  const [searchQuery, setSearchQuery] = useState('') 
  const [searchScope, setSearchScope] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [apiPosts, setApiPosts] = useState({ review: [], request: [] })
  const [loading, setLoading] = useState(true) // 초기값을 true로 설정하여 로딩 상태로 시작
  const [refreshKey, setRefreshKey] = useState(0)
  const POSTS_PER_PAGE = 10

  // API에서 게시글 목록 가져오기
  const fetchPosts = async () => {
    setLoading(true)
    try {
      // 기부 후기 목록 (DONATION_REVIEW 타입만)
      const reviewResponse = await fetch('http://localhost:8080/api/posts?type=DONATION_REVIEW&page=0&size=100')
      if (reviewResponse.ok) {
        const reviewData = await reviewResponse.json()
        const reviewPosts = (reviewData.content || []).map(post => ({
          id: post.id,
          title: post.title,
          content: post.content,
          writer: post.writer,
          views: post.viewCount || 0,
          date: post.createdAt ? new Date(post.createdAt).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).replace(/\s/g, '.') : '',
          createdAt: post.createdAt, // 정렬을 위한 원본 날짜 저장
          boardType: 'review',
          postType: post.postType // 게시글 타입 저장
        }))
        setApiPosts(prev => ({ ...prev, review: reviewPosts })) // 완전 교체
      }

      // 요청 게시판 목록 (ORGAN_REQUEST 타입만, 모든 기관의 게시물)
      const requestResponse = await fetch('http://localhost:8080/api/posts?type=ORGAN_REQUEST&page=0&size=100', {
        credentials: 'include'
      })
      if (requestResponse.ok) {
        const requestData = await requestResponse.json()
        const requestPosts = (requestData.content || []).map(post => ({
          id: post.id,
          title: post.title,
          content: post.content,
          writer: post.writer,
          views: post.viewCount || 0,
          date: post.createdAt ? new Date(post.createdAt).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).replace(/\s/g, '.') : '',
          createdAt: post.createdAt, // 정렬을 위한 원본 날짜 저장
          boardType: 'request',
          postType: post.postType // 게시글 타입 저장
        }))
        setApiPosts(prev => ({ ...prev, request: requestPosts })) // 완전 교체
      }
    } catch (error) {
      console.error('게시글 목록 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [isLoggedIn, refreshKey])

  // 페이지 포커스 시 목록 새로고침 (게시글 작성 후 돌아올 때)
  useEffect(() => {
    const handleFocus = () => {
      setRefreshKey(prev => prev + 1)
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setRefreshKey(prev => prev + 1)
      }
    }
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])
  
  const parseDate = (dateString) => {
    if (!dateString) return new Date(0)
    
    // ISO 형식 (2025-12-05T10:30:00) 또는 날짜 문자열
    if (dateString.includes('T') || dateString.includes('-')) {
      return new Date(dateString)
    }
    
    // 한국 형식 (2025.12.05. 또는 2025.12.05)
    const parts = dateString.split('.').filter(p => p.trim() !== '').map(Number)
    if (parts.length >= 3) {
      return new Date(parts[0], parts[1] - 1, parts[2])
    }
    
    return new Date(dateString)
  }

  const filteredAndSortedPosts = useMemo(() => {
    let posts = []
    
    // API에서 가져온 게시글만 사용 (로컬 상태는 사용하지 않음)
    // 게시글 작성은 API로만 처리하므로 API 데이터가 항상 최신 상태
    const reviewPostsWithNew = apiPosts.review || []
    const requestPostsWithNew = apiPosts.request || []
    
    if (selectedBoardType === 'all') {
      posts = [...reviewPostsWithNew, ...requestPostsWithNew]
    } else if (selectedBoardType === 'review') {
      posts = [...reviewPostsWithNew]
    } else {
      posts = [...requestPostsWithNew]
    }
    
    // 조회수 업데이트 적용
    posts = posts.map(post => ({
      ...post,
      views: boardViews[post.id] !== undefined ? (post.views || 0) + boardViews[post.id] : post.views
    }))
    
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase()
      posts = posts.filter(post => {
        const matchesTitle = post.title.toLowerCase().includes(query)
        const matchesWriter = post.writer.toLowerCase().includes(query)
        
        switch (searchScope) {
          case 'title':
            return matchesTitle
          case 'writer':
            return matchesWriter
          case 'all':
          default:
            return matchesTitle || matchesWriter
        }
      })
    }
    
    posts.sort((a, b) => {
      switch (selectedSort) {
        case 'latest':
          // 최신순: 날짜 내림차순 (최신이 먼저)
          // createdAt이 있으면 사용, 없으면 date 파싱
          if (a.createdAt && b.createdAt) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          }
          const dateB = parseDate(b.date)
          const dateA = parseDate(a.date)
          return dateB.getTime() - dateA.getTime()
        case 'popular':
          // 인기순: 조회수 내림차순
          return (b.views || 0) - (a.views || 0)
        case 'oldest':
          // 오래된순: 날짜 오름차순 (오래된 것이 먼저)
          // createdAt이 있으면 사용, 없으면 date 파싱
          if (a.createdAt && b.createdAt) {
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          }
          const dateAOld = parseDate(a.date)
          const dateBOld = parseDate(b.date)
          return dateAOld.getTime() - dateBOld.getTime()
        default:
          return 0
      }
    })
    
    return posts
  }, [selectedBoardType, selectedSort, searchQuery, searchScope, boardPosts, boardViews])

  const totalPages = Math.ceil(filteredAndSortedPosts.length / POSTS_PER_PAGE)
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE
  const endIndex = startIndex + POSTS_PER_PAGE
  const currentPosts = filteredAndSortedPosts.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedBoardType, selectedSort, searchQuery, searchScope])
  
  const sortTabs = boardTabs

  const handleSearch = (e) => {
    e.preventDefault()
    setSearchQuery(searchInput.trim())
    setCurrentPage(1)
  }

  const getPaginationButtons = () => {
    const buttons = []
    
    if (totalPages <= 1) {
      return []
    }

    buttons.push(1)

    if (currentPage <= 4) {
      for (let i = 2; i <= Math.min(4, totalPages - 1); i++) {
        buttons.push(i)
      }
      if (totalPages > 4) {
        buttons.push('...')
        buttons.push(totalPages)
      } else if (totalPages > 1) {
        buttons.push(totalPages)
      }
    } else if (currentPage >= totalPages - 3) {
      if (totalPages > 5) {
        buttons.push('...')
      }
      for (let i = Math.max(2, totalPages - 3); i <= totalPages; i++) {
        buttons.push(i)
      }
    } else {
      buttons.push('...')
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        buttons.push(i)
      }
      buttons.push('...')
      buttons.push(totalPages)
    }

    return buttons
  }

  const navLinks = getNavLinksForRole(currentUser?.role)
  const combinedNotices = [...extraNotices, ...boardNotices]

  return (
    <div className="board-page">
      <div className="board-shell">
        <HeaderLanding
          navLinks={navLinks}
          role={currentUser?.role}
          onLogoClick={onNavigateHome}
          onLogin={onLogin}
          onNavClick={onNavLink}
          isLoggedIn={isLoggedIn}
          onLogout={onLogout}
          onNotifications={onNotifications}
          unreadCount={unreadCount}
          onMenu={onMenu}
        />

        <section className="board-hero">
          <div>
            <h1>게시판</h1>
            <p>RE:WEAR 커뮤니티의 소식과 이야기를 확인하세요.</p>
          </div>
          <form className="board-search-container" onSubmit={handleSearch}>
            <select
              className="search-filter-select"
              value={searchScope}
              onChange={(e) => setSearchScope(e.target.value)}
            >
              <option value="all">제목+작성자</option>
              <option value="title">제목</option>
              <option value="writer">작성자</option>
            </select>
            <input
              type="search"
              className="board-search-input"
              placeholder="게시글 검색..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(e)
                }
              }}
            />
            <button type="submit" className="search-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>
          </form>
        </section>

        <div className="board-type-tabs">
          <button
            className={`board-type-tab ${selectedBoardType === 'all' ? 'active' : ''}`}
            type="button"
            onClick={() => setSelectedBoardType('all')}
          >
            전체 게시판
          </button>
          <button
            className={`board-type-tab ${selectedBoardType === 'review' ? 'active' : ''}`}
            type="button"
            onClick={() => setSelectedBoardType('review')}
          >
            기부 후기
          </button>
          <button
            className={`board-type-tab ${selectedBoardType === 'request' ? 'active' : ''}`}
            type="button"
            onClick={() => setSelectedBoardType('request')}
          >
            요청 게시판
          </button>
        </div>

        <div className="board-tabs-row">
          <div className="board-tabs">
            {sortTabs.map(tab => (
              <button
                key={tab.value}
                className={selectedSort === tab.value ? 'active' : ''}
                type="button"
                onClick={() => setSelectedSort(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="board-write"
            onClick={() => {
              if (!isLoggedIn) {
                onLogin()
              } else {
                const targetType = selectedBoardType === 'request' ? 'request' : 'review'
                onGoToBoardWrite({ boardType: targetType })
              }
            }}
          >
            글쓰기
          </button>
        </div>

        <div className="board-table">
          <div className="board-header">
            <span>번호</span>
            <span>제목</span>
            <span>작성자</span>
            <span>조회수</span>
            <span>날짜</span>
          </div>

          {combinedNotices.map(notice => (
            <div 
              key={notice.id} 
              className="board-row notice"
              onClick={() => onGoToBoardDetail(notice.id, 'notice')}
              style={{ cursor: 'pointer' }}
            >
              <span>
                <i className="board-icon" aria-hidden="true">
                  📌
                </i>
              </span>
              <span className="board-title">{notice.title}</span>
              <span>{notice.writer}</span>
              <span>{notice.views}</span>
              <span>{notice.date}</span>
            </div>
          ))}

          {loading ? (
            <div className="board-empty">
              <p>게시글을 불러오는 중...</p>
            </div>
          ) : filteredAndSortedPosts.length === 0 ? (
            <div className="board-empty">
              <p>{searchQuery.trim() ? '검색 결과가 없습니다.' : '게시글이 없습니다.'}</p>
            </div>
          ) : (
            currentPosts.map((post, index) => {
              // 게시글 타입 결정 (reviewPosts에 있으면 review, requestPosts에 있으면 request)
              const postType =
                post.boardType ||
                (reviewPosts.some(p => p.id === post.id)
                  ? 'review'
                  : requestPosts.some(p => p.id === post.id)
                  ? 'request'
                  : boardPosts.review?.some(p => p.id === post.id)
                  ? 'review'
                  : 'request')
              
              return (
                <div 
                  key={post.id} 
                  className="board-row"
                  onClick={() => onGoToBoardDetail(post.id, postType)}
                  style={{ cursor: 'pointer' }}
                >
                  <span>{startIndex + index + 1}</span>
              <span className="board-title">{post.title}</span>
              <span>{post.writer}</span>
              <span>{post.views}</span>
              <span>{post.date}</span>
            </div>
              )
            })
          )}
        </div>

        {totalPages > 1 && (
        <div className="board-pagination">
            {getPaginationButtons().map((page, index) => (
              <button
                key={page === '...' ? `ellipsis-${index}` : page}
                type="button"
                className={page === currentPage ? 'active' : ''}
                onClick={() => typeof page === 'number' && setCurrentPage(page)}
                disabled={page === '...'}
              >
                {page}
            </button>
          ))}
        </div>
        )}
      </div>
    </div>
  )
}

