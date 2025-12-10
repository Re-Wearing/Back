import { useEffect, useState } from 'react';
import '../styles/admin-manage.css';

export default function AdminPostManagePage({
  onNavigateHome,
  onGoToBoardWrite
}) {
  const [apiPosts, setApiPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [viewingPost, setViewingPost] = useState(null);
  const [imageModal, setImageModal] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    images: []
  });
  const [editImagePreviews, setEditImagePreviews] = useState([]);

  // API에서 게시물 목록 조회
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        
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
        const posts = (data.content || []).map(post => ({
          ...post,
          isPinned: post.isPinned || false // 기본값 설정
        }));
        setApiPosts(posts);
      } catch (err) {
        console.error('게시물 목록 조회 오류:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPosts();
  }, []);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

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
      setViewingPost({
        ...post,
        isPinned: post.isPinned || false // 기본값 설정
      });
      setEditForm({
        title: post.title || '',
        content: post.content || '',
        images: []
      });
      
      // 기존 이미지 미리보기 설정
      if (post.images && post.images.length > 0) {
        const previews = post.images.map(img => {
          const url = img.url || img.dataUrl || img;
          if (url && !url.startsWith('http') && !url.startsWith('data:')) {
            return url.startsWith('/') ? url : `/${url}`;
          }
          return url;
        });
        setEditImagePreviews(previews);
      } else {
        setEditImagePreviews([]);
      }
      setIsEditing(false);
    } catch (err) {
      console.error('게시물 조회 오류:', err);
      showToast(err.message || '게시물 조회에 실패했습니다.');
    }
  };

  // 게시물 수정 핸들러
  const handleEditPost = async () => {
    if (!viewingPost) return;
    
    if (!editForm.title.trim()) {
      showToast('제목을 입력해주세요.');
      return;
    }
    
    if (!editForm.content.trim()) {
      showToast('내용을 입력해주세요.');
      return;
    }
    
    try {
      // 새로 추가한 이미지만 Base64로 변환
      const base64Images = [];
      const existingImageUrls = [];
      
      editImagePreviews.forEach((preview) => {
        if (preview.startsWith('data:')) {
          base64Images.push(preview);
        } else if (preview.startsWith('/')) {
          const filename = preview.split('/').pop();
          if (filename) {
            existingImageUrls.push(filename);
          }
        }
      });
      
      const allImages = [...existingImageUrls, ...base64Images];
      
      const response = await fetch(`/api/posts/${viewingPost.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          postType: viewingPost.postType,
          title: editForm.title.trim(),
          content: editForm.content.trim(),
          isAnonymous: viewingPost.isAnonymous || false,
          images: allImages.length > 0 ? allImages : []
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '게시물 수정에 실패했습니다.');
      }
      
      const updatedPost = await response.json();
      showToast('게시물이 수정되었습니다.');
      setIsEditing(false);
      
      // 상세 정보 업데이트
      setViewingPost(updatedPost);
      
      // 목록 새로고침
      const refreshResponse = await fetch('/api/posts?page=0&size=100', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setApiPosts(data.content || []);
      }
      
      // 수정 폼도 업데이트
      setEditForm({
        title: updatedPost.title || '',
        content: updatedPost.content || '',
        images: []
      });
      
      if (updatedPost.images && updatedPost.images.length > 0) {
        const previews = updatedPost.images.map(img => {
          const url = img.url || img.dataUrl || img;
          if (url && !url.startsWith('http') && !url.startsWith('data:')) {
            return url.startsWith('/') ? url : `/${url}`;
          }
          return url;
        });
        setEditImagePreviews(previews);
      } else {
        setEditImagePreviews([]);
      }
    } catch (err) {
      console.error('게시물 수정 오류:', err);
      showToast(err.message || '게시물 수정에 실패했습니다.');
    }
  };

  // 이미지 파일 선택 핸들러 (수정용)
  const handleEditImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const remainingSlots = 5 - editImagePreviews.length;
    if (files.length > remainingSlots) {
      showToast(`이미지는 최대 5개까지 업로드할 수 있습니다. (현재 ${editImagePreviews.length}개)`);
      e.target.value = '';
      return;
    }

    const newImages = [];
    const newPreviews = [...editImagePreviews];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        showToast(`${file.name}은(는) 이미지 파일이 아닙니다.`);
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        showToast(`${file.name}의 크기가 너무 큽니다. (최대 5MB)`);
        continue;
      }

      newImages.push(file);
      
      const preview = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      newPreviews.push(preview);
    }

    setEditForm(prev => ({
      ...prev,
      images: [...prev.images, ...newImages]
    }));
    setEditImagePreviews(newPreviews);
    e.target.value = '';
  };

  // 이미지 제거 핸들러 (수정용)
  const handleRemoveEditImage = (index) => {
    setEditImagePreviews(prev => prev.filter((_, i) => i !== index));
    setEditForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
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
      
      setApiPosts(prev => prev.filter(post => post.id !== postId));
      if (viewingPost && viewingPost.id === postId) {
        setViewingPost(null);
      }
    } catch (err) {
      console.error('게시물 삭제 오류:', err);
      showToast(err.message || '게시물 삭제에 실패했습니다.');
    }
  };

  // 게시물 고정/고정 해제 핸들러
  const handleTogglePin = async (postId, isPinned) => {
    try {
      const response = await fetch(`/api/posts/${postId}/pin`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ isPinned })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '게시물 고정 처리에 실패했습니다.');
      }
      
      const data = await response.json();
      showToast(data.message || (isPinned ? '게시물이 고정되었습니다.' : '게시물 고정이 해제되었습니다.'));
      
      // 목록 새로고침
      const refreshResponse = await fetch('/api/posts?page=0&size=100', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        const refreshedPosts = (refreshData.content || []).map(post => ({
          ...post,
          isPinned: post.isPinned || false // 기본값 설정
        }));
        setApiPosts(refreshedPosts);
      }
      
      // 상세보기 중인 게시물이면 업데이트
      if (viewingPost && viewingPost.id === postId) {
        const detailResponse = await fetch(`/api/posts/${postId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        if (detailResponse.ok) {
          const updatedPost = await detailResponse.json();
          setViewingPost({
            ...updatedPost,
            isPinned: updatedPost.isPinned || false // 기본값 설정
          });
        }
      }
    } catch (err) {
      console.error('게시물 고정 처리 오류:', err);
      showToast(err.message || '게시물 고정 처리에 실패했습니다.');
    }
  };

  return (
    <div className="admin-manage-page">
      {toast && <div className="toast">{toast}</div>}

      <div className="admin-manage-header">
        <h1>게시물 관리</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {onGoToBoardWrite && (
            <button 
              type="button" 
              className="btn primary" 
              onClick={() => onGoToBoardWrite({ boardType: 'review' })}
            >
              글쓰기
            </button>
          )}
          <button type="button" className="btn primary" onClick={() => onNavigateHome('/main')}>
            메인으로
          </button>
        </div>
      </div>

      <section className="admin-panel">
        <h2>게시물 관리</h2>
        {loading ? (
          <p className="empty-hint">게시물을 불러오는 중...</p>
        ) : error ? (
          <p className="empty-hint" style={{ color: 'red' }}>오류: {error}</p>
        ) : apiPosts.length === 0 ? (
          <p className="empty-hint">등록된 게시물이 없습니다.</p>
        ) : (
          <div className="admin-table-wrapper">
            <p style={{ marginBottom: '1rem', color: '#666' }}>총 {apiPosts.length}개의 게시물</p>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>타입</th>
                  <th>제목</th>
                  <th>작성자</th>
                  <th>조회수</th>
                  <th>작성일</th>
                  <th>고정</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {apiPosts && apiPosts.length > 0 ? apiPosts.map((post) => (
                  <tr key={post.id}>
                    <td>{post.id}</td>
                    <td>
                      <span className={`type-badge ${post.postType === 'DONATION_REVIEW' ? 'review' : 'request'}`}>
                        {post.postType === 'DONATION_REVIEW' ? '기부 후기' : '요청 게시물'}
                      </span>
                    </td>
                    <td>
                      <div className="text-strong">{post.title}</div>
                    </td>
                    <td>
                      <div className="text-strong">{post.writer || '익명'}</div>
                      {post.writerType && (
                        <span className="anon-chip">
                          {post.writerType === 'admin' ? '관리자 회원' : 
                           post.writerType === 'user' ? '일반 회원' : 
                           '기관 회원'}
                        </span>
                      )}
                    </td>
                    <td>{post.viewCount || 0}</td>
                    <td>
                      {post.createdAt 
                        ? new Date(post.createdAt).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : '-'}
                    </td>
                    <td>
                      {(post.isPinned === true) ? (
                        <span style={{ color: '#ff9800', fontWeight: '600' }}>📌</span>
                      ) : (
                        <span style={{ color: '#ccc' }}>-</span>
                      )}
                    </td>
                    <td>
                      <div className="admin-card-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="small-btn"
                          onClick={() => handleViewPost(post.id)}
                          style={{ 
                            padding: '6px 12px', 
                            border: '1px solid #ddd', 
                            borderRadius: '4px', 
                            background: '#fff',
                            cursor: 'pointer'
                          }}
                        >
                          상세보기
                        </button>
                        <button
                          type="button"
                          className="small-btn"
                          onClick={() => handleTogglePin(post.id, !(post.isPinned === true))}
                          disabled={false}
                          style={{ 
                            padding: '6px 12px', 
                            border: `1px solid ${(post.isPinned === true) ? '#ff9800' : '#ddd'}`, 
                            borderRadius: '4px', 
                            background: (post.isPinned === true) ? '#fff3e0' : '#fff',
                            color: (post.isPinned === true) ? '#ff9800' : '#666',
                            cursor: 'pointer',
                            opacity: 1
                          }}
                        >
                          {(post.isPinned === true) ? '📌 고정됨' : '고정'}
                        </button>
                        <button
                          type="button"
                          className="small-btn danger"
                          onClick={() => handleDeletePost(post.id)}
                          style={{ 
                            padding: '6px 12px', 
                            border: '1px solid #d32f2f', 
                            borderRadius: '4px', 
                            background: '#fff',
                            color: '#d32f2f',
                            cursor: 'pointer'
                          }}
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                      게시물이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {viewingPost && (
        <div className="modal-overlay" onClick={() => {
          setViewingPost(null);
          setIsEditing(false);
        }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '1000px', maxHeight: '95vh', overflowY: 'auto', width: '90%' }}>
            <h2>{isEditing ? '게시물 수정' : '게시물 상세보기'}</h2>
            
            <div className="modal-content" style={{ padding: '1rem 0' }}>
              <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <label style={{ fontWeight: '600' }}>게시물 타입:</label>
                  <span className={`type-badge ${viewingPost.postType === 'DONATION_REVIEW' ? 'review' : 'request'}`}>
                    {viewingPost.postType === 'DONATION_REVIEW' ? '기부 후기' : '요청 게시물'}
                  </span>
                </div>
                {(viewingPost.isPinned === true) && (
                  <span style={{ 
                    padding: '4px 8px', 
                    background: '#fff3e0', 
                    color: '#ff9800', 
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}>
                    📌 상단 고정
                  </span>
                )}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>제목</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
                    placeholder="제목을 입력하세요"
                  />
                ) : (
                  <div style={{ padding: '0.75rem', background: '#f5f5f5', borderRadius: '4px', border: '1px solid #ddd' }}>
                    {viewingPost.title}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>내용</label>
                {isEditing ? (
                  <textarea
                    value={editForm.content}
                    onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', minHeight: '200px', resize: 'vertical' }}
                    placeholder="내용을 입력하세요"
                  />
                ) : (
                  <div style={{ padding: '0.75rem', background: '#f5f5f5', borderRadius: '4px', border: '1px solid #ddd', minHeight: '150px', whiteSpace: 'pre-wrap' }}>
                    {viewingPost.content}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>작성자</label>
                <div style={{ padding: '0.75rem', background: '#f5f5f5', borderRadius: '4px', border: '1px solid #ddd' }}>
                  {viewingPost.writer || '익명'}
                  {viewingPost.writerType && (
                    <span className="anon-chip" style={{ marginLeft: '0.5rem' }}>
                      {viewingPost.writerType === 'admin' ? '관리자 회원' : 
                       viewingPost.writerType === 'user' ? '일반 회원' : 
                       '기관 회원'}
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

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>이미지</label>
                {isEditing ? (
                  <>
                    {editImagePreviews.length < 5 && (
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleEditImageChange}
                        style={{ marginBottom: '0.5rem' }}
                      />
                    )}
                    {editImagePreviews.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.5rem', marginTop: '0.5rem' }}>
                        {editImagePreviews.map((preview, index) => (
                          <div key={index} style={{ position: 'relative' }}>
                            <img
                              src={preview}
                              alt={`미리보기 ${index + 1}`}
                              style={{ 
                                width: '100%', 
                                height: '150px', 
                                objectFit: 'cover', 
                                borderRadius: '4px',
                                border: '1px solid #ddd'
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveEditImage(index)}
                              style={{
                                position: 'absolute',
                                top: '4px',
                                right: '4px',
                                background: 'rgba(255, 0, 0, 0.7)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '24px',
                                height: '24px',
                                cursor: 'pointer',
                                fontSize: '14px'
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                      이미지는 최대 5개까지 업로드할 수 있습니다. ({editImagePreviews.length}/5)
                    </p>
                  </>
                ) : viewingPost.images && viewingPost.images.length > 0 ? (
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
                ) : (
                  <p className="text-muted">등록된 이미지가 없습니다.</p>
                )}
              </div>
            </div>

            <div className="modal-buttons">
              {isEditing ? (
                <>
                  <button
                    className="small-btn"
                    onClick={() => {
                      setIsEditing(false);
                      // 수정 취소 시 원래 데이터로 복원
                      setEditForm({
                        title: viewingPost.title || '',
                        content: viewingPost.content || '',
                        images: []
                      });
                      if (viewingPost.images && viewingPost.images.length > 0) {
                        const previews = viewingPost.images.map(img => {
                          const url = img.url || img.dataUrl || img;
                          if (url && !url.startsWith('http') && !url.startsWith('data:')) {
                            return url.startsWith('/') ? url : `/${url}`;
                          }
                          return url;
                        });
                        setEditImagePreviews(previews);
                      } else {
                        setEditImagePreviews([]);
                      }
                    }}
                  >
                    취소
                  </button>
                  <button
                    className="small-btn primary"
                    onClick={handleEditPost}
                  >
                    저장
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="small-btn"
                    onClick={() => setIsEditing(true)}
                  >
                    수정
                  </button>
                  <button
                    className="small-btn"
                    onClick={() => handleTogglePin(viewingPost.id, !(viewingPost.isPinned === true))}
                    disabled={false}
                    style={{
                      borderColor: (viewingPost.isPinned === true) ? '#ff9800' : '#ddd',
                      background: (viewingPost.isPinned === true) ? '#fff3e0' : '#fff',
                      color: (viewingPost.isPinned === true) ? '#ff9800' : '#666',
                      cursor: 'pointer',
                      opacity: 1
                    }}
                  >
                    {(viewingPost.isPinned === true) ? '📌 고정 해제' : '📌 고정'}
                  </button>
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
                    onClick={() => {
                      setViewingPost(null);
                      setIsEditing(false);
                    }}
                  >
                    닫기
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {imageModal && (
        <div className="modal-overlay" onClick={() => setImageModal(null)}>
          <div className="modal image-modal" onClick={e => e.stopPropagation()}>
            <h2>{imageModal.title || '게시물 이미지'}</h2>
            {imageModal.images?.length ? (
              imageModal.images.map((img, index) => {
                const imageUrl = img.dataUrl || img.url || img;
                return (
                  <img 
                    key={img.id || index} 
                    src={imageUrl} 
                    alt="게시물 이미지" 
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
    </div>
  );
}

