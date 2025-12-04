import { useState, useEffect, useRef } from 'react'
import HeaderLanding from '../components/HeaderLanding'
import { getNavLinksForRole, reviewPosts, requestPosts, boardNotices } from '../constants/landingData'
import '../styles/board-detail.css'

export default function BoardDetailPage({
  onNavigateHome = () => {},
  onLogin = () => {},
  onNavLink,
  isLoggedIn = false,
  onLogout = () => {},
  onNotifications = () => {},
  unreadCount = 0,
  onMenu = () => {},
  currentUser = null,
  postId = null,
  postType = 'review',
  onGoBack = () => {},
  boardPosts = { review: [], request: [] },
  boardViews = {},
  onUpdateViews = () => {},
  onDeletePost = () => {},
  notices = []
}) {
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const viewedPostId = useRef(null) // 조회한 게시글 ID 저장

  // 조회수 증가는 postId가 변경될 때 한 번만 실행
  useEffect(() => {
    if (!postId) {
      setLoading(false)
      return
    }

    // 공지사항은 조회수 증가 안 함
    if (typeof postId === 'string' && postId.startsWith('notice-')) {
      return
    }

    // 이전에 본 게시글이 아니면 조회수 증가
    if (viewedPostId.current !== postId) {
      // 게시글 타입 찾기 (ID 타입 통일)
      const postIdNum = Number(postId)
      let foundType = postType
      if (boardPosts.review?.some(p => Number(p.id) === postIdNum)) {
        foundType = 'review'
      } else if (boardPosts.request?.some(p => Number(p.id) === postIdNum)) {
        foundType = 'request'
      } else if (reviewPosts.some(p => Number(p.id) === postIdNum)) {
        foundType = 'review'
      } else if (requestPosts.some(p => Number(p.id) === postIdNum)) {
        foundType = 'request'
      }
      
      onUpdateViews(postId, foundType)
      viewedPostId.current = postId // 현재 게시글 ID 저장
    }
  }, [postId, postType, boardPosts, onUpdateViews])

  // 게시글 데이터 로드 및 조회수 표시 업데이트
  useEffect(() => {
    if (!postId) {
      setLoading(false)
      return
    }

    let foundPost = null
    let foundType = postType

    const combinedNotices = [...notices, ...boardNotices]

    // 공지사항 확인 (문자열 ID)
    if (typeof postId === 'string' && postId.startsWith('notice-')) {
      foundPost = combinedNotices.find(n => String(n.id) === String(postId))
      if (foundPost) foundType = 'notice'
    }

    // 일반 게시글 찾기
    if (!foundPost) {
      const postIdNum = Number(postId)

      // 작성된 게시글에서 찾기 (먼저 확인)
      if (boardPosts.review && boardPosts.review.length > 0) {
        foundPost = boardPosts.review.find(p => Number(p.id) === postIdNum)
        if (foundPost) foundType = 'review'
      }
      if (!foundPost && boardPosts.request && boardPosts.request.length > 0) {
        foundPost = boardPosts.request.find(p => Number(p.id) === postIdNum)
        if (foundPost) foundType = 'request'
      }

      // 상수 데이터에서 찾기
      if (!foundPost) {
        foundPost = reviewPosts.find(p => Number(p.id) === postIdNum)
        if (foundPost) foundType = 'review'
      }
      if (!foundPost) {
        foundPost = requestPosts.find(p => Number(p.id) === postIdNum)
        if (foundPost) foundType = 'request'
      }
    }

    if (foundPost) {
      // 조회수 표시 (공지사항은 기본 조회수만, 일반 게시글은 기본 조회수 + 증가한 조회수)
      const baseViews = foundPost.views || 0
      const increment = (foundType === 'notice') ? 0 : (boardViews[postId] || 0)
      const updatedViews = baseViews + increment
      
      setPost({ 
        ...foundPost, 
        views: updatedViews,
        content: foundPost.content || `${foundPost.title}에 대한 상세 내용입니다.` 
      })
    }

    setLoading(false)
  }, [postId, postType, boardPosts, boardViews, notices])

  if (loading) {
    return (
      <div className="board-detail-page">
        <div className="board-detail-shell">
          <p>로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="board-detail-page">
        <div className="board-detail-shell">
          <div className="detail-error">
            <p>게시글을 찾을 수 없습니다.</p>
            <button className="btn-back-to-list" onClick={onGoBack}>목록으로</button>
          </div>
        </div>
      </div>
    )
  }

  const currentPostType = (typeof postId === 'string' && postId.startsWith('notice-')) ? 'notice' :
                         reviewPosts.some(p => Number(p.id) === Number(postId)) ? 'review' : 
                         requestPosts.some(p => Number(p.id) === Number(postId)) ? 'request' :
                         boardPosts.review?.some(p => Number(p.id) === Number(postId)) ? 'review' : 'request'

  // 현재 사용자가 게시글 작성자인지 확인 (공지사항은 삭제 불가)
  const isAuthor =
    currentUser &&
    post &&
    currentPostType !== 'notice' &&
    ((post.author && currentUser.username === post.author) || (!post.author && currentUser.username === post.writer))

  const handleDelete = () => {
    if (!window.confirm('정말 이 게시글을 삭제하시겠습니까?')) {
      return
    }
    const success = onDeletePost(postId, currentPostType)
    if (success) {
      onGoBack()
    }
  }

  const navLinks = getNavLinksForRole(currentUser?.role)

  return (
    <div className="board-detail-page">
      <div className="board-detail-shell">
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

        <div className="board-detail-header">
          <button type="button" className="btn-back" onClick={onGoBack}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1>게시글 상세</h1>
        </div>

        <div className="board-detail-content">
          <div className="detail-meta">
            <div className="detail-category">
              {currentPostType === 'notice' ? '공지사항' : 
               currentPostType === 'review' ? '기부 후기' : '요청 게시판'}
            </div>
            <div className="detail-info">
              <span>작성자: {post.writer}</span>
              <span>작성일: {post.date}</span>
              <div className="views-with-delete">
                <span>조회수: {post.views}</span>
                {isAuthor && (
                  <button 
                    type="button" 
                    className="btn-delete-post" 
                    onClick={handleDelete}
                  >
                    삭제하기
                  </button>
                )}
              </div>
            </div>
          </div>

          <h2 className="detail-title">{post.title}</h2>

          <div className="detail-body">
            {post.content || '내용이 없습니다.'}
          </div>
        </div>
      </div>
    </div>
  )
}

