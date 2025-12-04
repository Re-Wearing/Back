import { useEffect, useState } from 'react'
import HeaderLanding from '../components/HeaderLanding'
import '../styles/board-write.css'

export default function BoardWritePage({
  onNavigateHome = () => {},
  onLogin = () => {},
  onNavLink,
  isLoggedIn = false,
  onLogout = () => {},
  onNotifications = () => {},
  unreadCount = 0,
  onMenu = () => {},
  currentUser = null,
  onGoBack = () => {},
  boardType = 'review', // 'review' or 'request'
  onSubmit = () => {}
}) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [errors, setErrors] = useState({})
  
  // 사용자 역할에 따라 게시판 타입 제한
  const userRole = currentUser?.role || ''
  const canWriteReview = ['일반 회원', '기관 회원', '관리자 회원'].includes(userRole)
  const canWriteRequest = userRole === '기관 회원' || userRole === '관리자 회원'
  const initialBoardType =
    boardType === 'request'
      ? canWriteRequest
        ? 'request'
        : 'review'
      : canWriteReview
      ? 'review'
      : canWriteRequest
      ? 'request'
      : 'review'
  const [selectedBoardType, setSelectedBoardType] = useState(initialBoardType)

  useEffect(() => {
    setSelectedBoardType(
      boardType === 'request' && canWriteRequest ? 'request' : canWriteReview ? 'review' : initialBoardType
    )
  }, [boardType, canWriteRequest, canWriteReview])

  const handleSelectBoardType = type => {
    if (type === 'request' && !canWriteRequest) {
      window.alert('요청 게시판은 기관 회원만 작성할 수 있습니다.')
      return
    }
    if (type === 'review' && !canWriteReview) {
      window.alert('게시글 작성 권한이 없습니다.')
      return
    }
    setSelectedBoardType(type)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const newErrors = {}
    if (!title.trim()) {
      newErrors.title = '제목을 입력해주세요.'
    }
    if (!content.trim()) {
      newErrors.content = '내용을 입력해주세요.'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    if (selectedBoardType === 'request' && !canWriteRequest) {
      window.alert('요청 게시판 작성 권한이 없습니다.')
      return
    }
    if (selectedBoardType === 'review' && !canWriteReview) {
      window.alert('게시글 작성 권한이 없습니다.')
      return
    }

    const result = onSubmit({
      title: title.trim(),
      content: content.trim(),
      boardType: selectedBoardType,
      writer: currentUser?.username || '익명',
      date: new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\s/g, '.'),
      views: 0
    })

    if (result?.success !== false) {
      onGoBack()
    }
  }

  const handleCancel = () => {
    if (window.confirm('작성 중인 내용이 사라집니다. 정말 나가시겠습니까?')) {
      onGoBack()
    }
  }

  return (
    <div className="board-write-page">
      <div className="board-write-topbar">
        <HeaderLanding
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
      </div>
      <div className="board-write-shell">

        <div className="board-write-header">
          <button type="button" className="btn-back" onClick={handleCancel}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1>글쓰기</h1>
        </div>

        <form className="board-write-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <div className="form-group-header">
              <label htmlFor="board-type">게시판</label>
            </div>
            <div className="board-type-select">
              <button
                type="button"
                className={`type-btn ${selectedBoardType === 'review' ? 'active' : ''}`}
                onClick={() => handleSelectBoardType('review')}
                disabled={!canWriteReview}
              >
                기부 후기
              </button>
              <button
                type="button"
                className={`type-btn ${selectedBoardType === 'request' ? 'active' : ''}`}
                onClick={() => handleSelectBoardType('request')}
                disabled={!canWriteRequest}
              >
                요청 게시판
              </button>
            </div>
            {!canWriteRequest && (
              <p className="board-type-hint">요청 게시판 글쓰기는 기관 회원만 가능합니다.</p>
            )}
          </div>

          <div className="form-group">
            <div className="form-group-header">
              <label htmlFor="title">제목</label>
              <span className="required-text">*</span>
            </div>
            <input
              id="title"
              type="text"
              className={`form-input ${errors.title ? 'error' : ''}`}
              placeholder="제목을 입력하세요"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (errors.title) setErrors({ ...errors, title: '' })
              }}
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </div>

          <div className="form-group">
            <div className="form-group-header">
              <label htmlFor="content">내용</label>
              <span className="required-text">*</span>
            </div>
            <textarea
              id="content"
              className={`form-textarea ${errors.content ? 'error' : ''}`}
              placeholder="내용을 입력하세요"
              rows={15}
              value={content}
              onChange={(e) => {
                setContent(e.target.value)
                if (errors.content) setErrors({ ...errors, content: '' })
              }}
            />
            {errors.content && <span className="error-message">{errors.content}</span>}
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={handleCancel}>
              취소
            </button>
            <button type="submit" className="btn-submit">
              작성
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

