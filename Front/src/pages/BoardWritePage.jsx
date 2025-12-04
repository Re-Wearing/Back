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
  const [images, setImages] = useState([]) // 선택한 이미지 파일들
  const [imagePreviews, setImagePreviews] = useState([]) // 이미지 미리보기 URL들
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

  const handleSubmit = async (e) => {
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

    try {
      const postType = selectedBoardType === 'review' ? 'DONATION_REVIEW' : 'ORGAN_REQUEST'
      
      // 이미지를 Base64로 변환
      const base64Images = await convertImagesToBase64()
      
      const response = await fetch('http://localhost:8080/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          postType: postType,
          title: title.trim(),
          content: content.trim(),
          isAnonymous: false,
          images: base64Images
        })
      })

      if (response.ok) {
        // API로 게시글이 저장되었으므로, 로컬 상태에는 추가하지 않음
        // 목록 페이지로 돌아가면 API에서 최신 목록을 가져옴
        onGoBack()
      } else {
        const errorData = await response.json()
        window.alert(errorData.error || '게시글 작성에 실패했습니다.')
      }
    } catch (error) {
      console.error('게시글 작성 실패:', error)
      window.alert('게시글 작성 중 오류가 발생했습니다.')
    }
  }

  const handleCancel = () => {
    if (window.confirm('작성 중인 내용이 사라집니다. 정말 나가시겠습니까?')) {
      onGoBack()
    }
  }

  // 이미지 파일 선택 핸들러
  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    // 최대 5개까지 제한
    const remainingSlots = 5 - images.length
    if (files.length > remainingSlots) {
      window.alert(`이미지는 최대 5개까지 업로드할 수 있습니다. (현재 ${images.length}개)`)
      e.target.value = '' // input 초기화
      return
    }

    const newImages = []
    const newPreviews = []

    for (const file of files) {
      // 이미지 파일만 허용
      if (!file.type.startsWith('image/')) {
        window.alert(`${file.name}은(는) 이미지 파일이 아닙니다.`)
        continue
      }

      // 파일 크기 제한 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        window.alert(`${file.name}의 크기가 너무 큽니다. (최대 5MB)`)
        continue
      }

      newImages.push(file)
      
      // 미리보기 URL 생성
      const preview = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      newPreviews.push(preview)
    }

    if (newImages.length > 0) {
      setImages(prev => [...prev, ...newImages])
      setImagePreviews(prev => [...prev, ...newPreviews])
    }
    
    // input 초기화 (같은 파일을 다시 선택할 수 있도록)
    e.target.value = ''
  }

  // 이미지 삭제 핸들러
  const handleRemoveImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  // 이미지를 Base64로 변환
  const convertImagesToBase64 = async () => {
    const base64Images = []
    for (const image of images) {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(image)
      })
      base64Images.push(base64)
    }
    return base64Images
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

          <div className="form-group">
            <div className="form-group-header">
              <label htmlFor="images">이미지</label>
              <span className="image-count">({images.length}/5)</span>
            </div>
            <div className="image-upload-section">
              <input
                id="images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                style={{ display: 'none' }}
                disabled={images.length >= 5}
              />
              <label
                htmlFor="images"
                className={`image-upload-button ${images.length >= 5 ? 'disabled' : ''}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                이미지 추가
              </label>
              {images.length >= 5 && (
                <p className="image-limit-hint">이미지는 최대 5개까지 업로드할 수 있습니다.</p>
              )}
            </div>
            
            {imagePreviews.length > 0 && (
              <div className="image-preview-container">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="image-preview-item">
                    <img src={preview} alt={`미리보기 ${index + 1}`} />
                    <button
                      type="button"
                      className="image-remove-button"
                      onClick={() => handleRemoveImage(index)}
                      aria-label="이미지 삭제"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
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

