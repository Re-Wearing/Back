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
  const [selectedImage, setSelectedImage] = useState(null) // 확대할 이미지
  const viewedPostId = useRef(null) // 조회한 게시글 ID 저장

  // 조회수 증가는 postId가 변경될 때 한 번만 실행
  useEffect(() => {
    const incrementView = async () => {
      if (!postId) {
        return
      }

      // 공지사항은 조회수 증가 안 함
      if (typeof postId === 'string' && postId.startsWith('notice-')) {
        return
      }

      // 이전에 본 게시글이 아니면 조회수 증가
      if (viewedPostId.current !== postId) {
        const postIdNum = Number(postId)
        if (isNaN(postIdNum)) {
          return
        }

        try {
          // API로 조회수 증가
          await fetch(`http://localhost:8080/api/posts/${postIdNum}/view`, {
            method: 'PUT',
            credentials: 'include'
          })

          // 게시글 타입 찾기 (ID 타입 통일)
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
        } catch (error) {
          console.error('조회수 증가 실패:', error)
        }
      }
    }

    incrementView()
  }, [postId, postType, boardPosts, onUpdateViews])

  // 게시글 데이터 로드 및 조회수 표시 업데이트
  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) {
        setLoading(false)
        return
      }

      const combinedNotices = [...notices, ...boardNotices]

      // 공지사항 확인 (문자열 ID)
      if (typeof postId === 'string' && postId.startsWith('notice-')) {
        const foundPost = combinedNotices.find(n => String(n.id) === String(postId))
        if (foundPost) {
          setPost({ 
            ...foundPost, 
            views: foundPost.views || 0,
            content: foundPost.content || `${foundPost.title}에 대한 상세 내용입니다.` 
          })
          setLoading(false)
          return
        }
      }

      // API에서 게시글 상세 조회
      try {
        const postIdNum = Number(postId)
        if (isNaN(postIdNum)) {
          setLoading(false)
          return
        }

        const response = await fetch(`http://localhost:8080/api/posts/${postIdNum}`, {
          credentials: 'include'
        })

        if (response.ok) {
          const postData = await response.json()
          console.log('게시글 상세 데이터:', postData)
          console.log('이미지 데이터:', postData.images)
          setPost({
            id: postData.id,
            title: postData.title,
            content: postData.content,
            writer: postData.writer,
            views: postData.viewCount || 0,
            date: postData.createdAt ? new Date(postData.createdAt).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            }).replace(/\s/g, '.') : '',
            boardType: postData.postType === 'DONATION_REVIEW' ? 'review' : 'request',
            isAuthor: postData.isAuthor || false,
            images: postData.images || [] // 이미지 배열 추가
          })
        } else {
          // API에서 찾지 못한 경우 로컬 데이터에서 찾기
          const postIdNum = Number(postId)
          let foundPost = null
          let foundType = postType

          if (boardPosts.review && boardPosts.review.length > 0) {
            foundPost = boardPosts.review.find(p => Number(p.id) === postIdNum)
            if (foundPost) foundType = 'review'
          }
          if (!foundPost && boardPosts.request && boardPosts.request.length > 0) {
            foundPost = boardPosts.request.find(p => Number(p.id) === postIdNum)
            if (foundPost) foundType = 'request'
          }

          if (!foundPost) {
            foundPost = reviewPosts.find(p => Number(p.id) === postIdNum)
            if (foundPost) foundType = 'review'
          }
          if (!foundPost) {
            foundPost = requestPosts.find(p => Number(p.id) === postIdNum)
            if (foundPost) foundType = 'request'
          }

          if (foundPost) {
            const baseViews = foundPost.views || 0
            const increment = boardViews[postId] || 0
            const updatedViews = baseViews + increment
            
            setPost({ 
              ...foundPost, 
              views: updatedViews,
              content: foundPost.content || `${foundPost.title}에 대한 상세 내용입니다.` 
            })
          }
        }
      } catch (error) {
        console.error('게시글 상세 조회 실패:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
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
  const isAuthor = post?.isAuthor || (
    currentUser &&
    post &&
    currentPostType !== 'notice' &&
    ((post.author && currentUser.username === post.author) || (!post.author && currentUser.username === post.writer))
  )

  const handleDelete = async () => {
    if (!window.confirm('정말 이 게시글을 삭제하시겠습니까?')) {
      return
    }

    // 공지사항은 로컬 삭제
    if (typeof postId === 'string' && postId.startsWith('notice-')) {
      const success = onDeletePost(postId, currentPostType)
      if (success) {
        onGoBack()
      }
      return
    }

    // API로 게시글 삭제
    try {
      const postIdNum = Number(postId)
      if (isNaN(postIdNum)) {
        window.alert('잘못된 게시글 ID입니다.')
        return
      }

      const response = await fetch(`http://localhost:8080/api/posts/${postIdNum}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        const success = onDeletePost(postId, currentPostType)
        if (success) {
          onGoBack()
        }
      } else {
        const errorData = await response.json()
        window.alert(errorData.error || '게시글 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('게시글 삭제 실패:', error)
      window.alert('게시글 삭제 중 오류가 발생했습니다.')
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

          {/* 이미지 표시 */}
          {post.images && post.images.length > 0 && (
            <div className="detail-images">
              {post.images.map((image, index) => {
                const imageUrl = image.url || image.dataUrl || image
                const fullImageUrl = imageUrl.startsWith('http') 
                  ? imageUrl 
                  : imageUrl.startsWith('/') 
                    ? `http://localhost:8080${imageUrl}`
                    : `http://localhost:8080/uploads/${imageUrl}`
                
                console.log(`이미지 ${index + 1} URL:`, fullImageUrl)
                
                return (
                  <div 
                    key={index} 
                    className="detail-image-item"
                    onClick={() => setSelectedImage(fullImageUrl)}
                  >
                    <img 
                      src={fullImageUrl} 
                      alt={`게시글 이미지 ${index + 1}`}
                      onError={(e) => {
                        console.error('이미지 로드 실패:', fullImageUrl, '원본 데이터:', image)
                        e.target.style.display = 'none'
                      }}
                      onLoad={() => {
                        console.log('이미지 로드 성공:', fullImageUrl)
                      }}
                    />
                  </div>
                )
              })}
            </div>
          )}

          {/* 이미지 확대 모달 */}
          {selectedImage && (
            <div 
              className="image-modal" 
              onClick={() => setSelectedImage(null)}
            >
              <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
                <button 
                  className="image-modal-close"
                  onClick={() => setSelectedImage(null)}
                  aria-label="닫기"
                >
                  ×
                </button>
                <img src={selectedImage} alt="확대 이미지" />
              </div>
            </div>
          )}

          <div className="detail-body">
            {post.content || '내용이 없습니다.'}
          </div>
        </div>
      </div>
    </div>
  )
}

