import { useState, useEffect } from 'react'
import HeaderLanding from '../components/HeaderLanding'

export default function AdminFaqPage({
  onNavigateHome,
  onNavLink,
  onNotifications,
  isLoggedIn,
  onLogout,
  unreadCount,
  adminInquiries = [],
  onSubmitAnswer = () => {},
  onMenu = () => {},
  currentUser = null
}) {
  const [responses, setResponses] = useState({})
  const [apiInquiries, setApiInquiries] = useState([])
  const [publishedFAQs, setPublishedFAQs] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingFAQ, setEditingFAQ] = useState(null) // 수정 중인 FAQ ID
  const [editForm, setEditForm] = useState({ question: '', answer: '' }) // 수정 폼 데이터

  // API에서 사용자 질문 목록과 공개 FAQ 가져오기
  useEffect(() => {
    const fetchAdminQuestions = async () => {
      setLoading(true)
      try {
        // 사용자 질문 목록 조회
        const questionsResponse = await fetch('http://localhost:8080/api/admin/faq/questions', {
          credentials: 'include'
        })
        
        // 공개 FAQ 목록 조회 (published 엔드포인트가 작동하지 않으면 all에서 필터링)
        const publishedResponse = await fetch('http://localhost:8080/api/admin/faq/all', {
          credentials: 'include'
        })
        
        if (questionsResponse.ok) {
          const questionData = await questionsResponse.json()
          const inquiryList = questionData.map(q => ({
            id: q.id,
            question: q.question,
            answer: q.answer,
            description: q.question,
            submittedAt: q.createdAt ? new Date(q.createdAt).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            }).replace(/\s/g, '.') : '',
            status: q.isActive ? 'registered' : (q.answer ? 'answered' : 'pending'),
            requester: q.authorName || '사용자',
            nickname: q.authorName || '사용자',
            role: '일반 회원',
            email: null,
            isPublished: false // 사용자 질문
          }))
          setApiInquiries(inquiryList)
        } else {
          setApiInquiries(adminInquiries)
        }

        if (publishedResponse.ok) {
          const allData = await publishedResponse.json()
          // 공개 FAQ만 필터링 (author가 null이고 isActive가 true인 것만)
          const publishedData = allData.filter(q => !q.authorName && q.isActive)
          const publishedList = publishedData.map(q => ({
            id: q.id,
            question: q.question,
            answer: q.answer,
            description: q.question,
            submittedAt: q.createdAt ? new Date(q.createdAt).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            }).replace(/\s/g, '.') : '',
            status: 'published', // 공개 FAQ
            requester: '관리자',
            nickname: '관리자',
            role: '관리자',
            email: null,
            isPublished: true // 공개 FAQ
          }))
          setPublishedFAQs(publishedList)
        }
      } catch (error) {
        console.error('관리자 질문 목록 조회 실패:', error)
        setApiInquiries(adminInquiries)
      } finally {
        setLoading(false)
      }
    }

    fetchAdminQuestions()
  }, [])

  // API와 기존 데이터 병합 (API 데이터 우선)
  const allInquiries = apiInquiries.length > 0 ? apiInquiries : adminInquiries
  
  // 사용자 질문과 공개 FAQ 합치기
  const allItems = [...allInquiries, ...publishedFAQs]

  const handleChange = (id, value) => {
    setResponses(prev => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async id => {
    const target = allInquiries.find(inquiry => inquiry.id === id)
    if (!target || target.status === 'answered') {
      return
    }
    const text = responses[id]?.trim()
    if (!text) {
      window.alert('답변을 입력해주세요.')
      return
    }

    try {
      // API로 답변 등록
      const response = await fetch(`http://localhost:8080/api/admin/faq/${id}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          answer: text
        })
      })

      if (response.ok) {
        window.alert('답변이 등록되었습니다. FAQ에 등록하려면 등록 버튼을 클릭해주세요.')
        // 기존 핸들러도 호출 (호환성 유지)
        onSubmitAnswer(id, text)
        setResponses(prev => ({ ...prev, [id]: '' }))
        
        // 목록 새로고침
        const refreshResponse = await fetch('http://localhost:8080/api/admin/faq/questions', {
          credentials: 'include'
        })
        if (refreshResponse.ok) {
          const questionData = await refreshResponse.json()
          const inquiryList = questionData.map(q => ({
            id: q.id,
            question: q.question,
            answer: q.answer,
            description: q.question,
            submittedAt: q.createdAt ? new Date(q.createdAt).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            }).replace(/\s/g, '.') : '',
            status: q.answer ? 'answered' : 'pending',
            requester: q.authorName || '사용자',
            nickname: q.authorName || '사용자',
            role: '일반 회원',
            email: null
          }))
          setApiInquiries(inquiryList)
        }
      } else {
        const errorData = await response.json()
        window.alert(errorData.error || '답변 등록에 실패했습니다.')
      }
    } catch (error) {
      console.error('답변 등록 실패:', error)
      window.alert('답변 등록 중 오류가 발생했습니다.')
    }
  }

  // FAQ 수정 핸들러
  const handleUpdateFAQ = async id => {
    if (!editForm.question.trim() || !editForm.answer.trim()) {
      window.alert('질문과 답변을 모두 입력해주세요.')
      return
    }

    try {
      const response = await fetch(`http://localhost:8080/api/admin/faq/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          question: editForm.question.trim(),
          answer: editForm.answer.trim(),
          displayOrder: 0,
          isActive: true
        })
      })

      if (response.ok) {
        window.alert('FAQ가 수정되었습니다.')
        setEditingFAQ(null)
        setEditForm({ question: '', answer: '' })
        
        // 목록 새로고침
        const refreshResponse = await fetch('http://localhost:8080/api/admin/faq/all', {
          credentials: 'include'
        })
        if (refreshResponse.ok) {
          const allData = await refreshResponse.json()
          const publishedData = allData.filter(q => !q.authorName && q.isActive)
          const publishedList = publishedData.map(q => ({
            id: q.id,
            question: q.question,
            answer: q.answer,
            description: q.question,
            submittedAt: q.createdAt ? new Date(q.createdAt).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            }).replace(/\s/g, '.') : '',
            status: 'published',
            requester: '관리자',
            nickname: '관리자',
            role: '관리자',
            email: null,
            isPublished: true
          }))
          setPublishedFAQs(publishedList)
        }
      } else {
        const errorData = await response.json()
        window.alert(errorData.error || 'FAQ 수정에 실패했습니다.')
      }
    } catch (error) {
      console.error('FAQ 수정 실패:', error)
      window.alert('FAQ 수정 중 오류가 발생했습니다.')
    }
  }

  // FAQ 삭제 핸들러
  const handleDeleteFAQ = async id => {
    if (!window.confirm('정말 이 FAQ를 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch(`http://localhost:8080/api/admin/faq/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        window.alert('FAQ가 삭제되었습니다.')
        
        // 목록 새로고침
        const refreshResponse = await fetch('http://localhost:8080/api/admin/faq/all', {
          credentials: 'include'
        })
        if (refreshResponse.ok) {
          const allData = await refreshResponse.json()
          const publishedData = allData.filter(q => !q.authorName && q.isActive)
          const publishedList = publishedData.map(q => ({
            id: q.id,
            question: q.question,
            answer: q.answer,
            description: q.question,
            submittedAt: q.createdAt ? new Date(q.createdAt).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            }).replace(/\s/g, '.') : '',
            status: 'published',
            requester: '관리자',
            nickname: '관리자',
            role: '관리자',
            email: null,
            isPublished: true
          }))
          setPublishedFAQs(publishedList)
        }
      } else {
        const errorData = await response.json()
        window.alert(errorData.error || 'FAQ 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('FAQ 삭제 실패:', error)
      window.alert('FAQ 삭제 중 오류가 발생했습니다.')
    }
  }

  // FAQ 등록 핸들러
  const handleRegister = async id => {
    try {
      const response = await fetch(`http://localhost:8080/api/admin/faq/${id}/register`, {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        window.alert('FAQ에 등록되었습니다.')
        // 목록 새로고침
        const refreshResponse = await fetch('http://localhost:8080/api/admin/faq/questions', {
          credentials: 'include'
        })
        if (refreshResponse.ok) {
          const questionData = await refreshResponse.json()
          const inquiryList = questionData.map(q => ({
            id: q.id,
            question: q.question,
            answer: q.answer,
            description: q.question,
            submittedAt: q.createdAt ? new Date(q.createdAt).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            }).replace(/\s/g, '.') : '',
            status: q.isActive ? 'registered' : (q.answer ? 'answered' : 'pending'),
            requester: q.authorName || '사용자',
            nickname: q.authorName || '사용자',
            role: '일반 회원',
            email: null
          }))
          setApiInquiries(inquiryList)
        }
      } else {
        const errorData = await response.json()
        window.alert(errorData.error || 'FAQ 등록에 실패했습니다.')
      }
    } catch (error) {
      console.error('FAQ 등록 실패:', error)
      window.alert('FAQ 등록 중 오류가 발생했습니다.')
    }
  }

  return (
    <section className="main-page admin-faq-page">
      <div className="main-shell admin-faq-shell">
        <HeaderLanding
          role={currentUser?.role}
          onLogoClick={onNavigateHome}
          onNavClick={onNavLink}
          onNotifications={onNotifications}
          isLoggedIn={isLoggedIn}
          onLogout={onLogout}
          unreadCount={unreadCount}
          onMenu={onMenu}
        />

        <article className="admin-faq-panel">
          <header className="admin-faq-header">
              <p className="eyebrow">관리자 전용</p>
              <h2>문의 답변 관리</h2>
            <p>접수된 문의를 확인하고 답변을 등록해 이용자에게 빠르게 안내해 주세요.</p>
          </header>

          {loading ? (
            <p className="admin-empty">질문 목록을 불러오는 중...</p>
          ) : allItems.length === 0 ? (
            <p className="admin-empty">등록된 문의가 없습니다.</p>
          ) : (
            <>
              {/* 공개 FAQ 섹션 */}
              {publishedFAQs.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ marginBottom: '1rem', fontSize: '1.3rem', fontWeight: '600' }}>등록된 FAQ</h3>
                  <div className="admin-inquiry-grid">
                    {publishedFAQs.map(faq => (
                      <article
                        key={faq.id}
                        className="admin-inquiry-card answered"
                        style={{ borderColor: 'rgba(82, 214, 163, 0.7)' }}
                      >
                        <div className="admin-inquiry-meta">
                          <span className="admin-chip" style={{ background: '#52d6a3', color: '#fff' }}>공개 FAQ</span>
                          <span className="admin-nickname">{faq.nickname}</span>
                          <span>{faq.submittedAt}</span>
                        </div>
                        {editingFAQ === faq.id ? (
                          <>
                            <div style={{ marginBottom: '1rem' }}>
                              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>질문</label>
                              <textarea
                                className="admin-answer"
                                value={editForm.question}
                                onChange={(e) => setEditForm({ ...editForm, question: e.target.value })}
                                rows={2}
                              />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>답변</label>
                              <textarea
                                className="admin-answer"
                                value={editForm.answer}
                                onChange={(e) => setEditForm({ ...editForm, answer: e.target.value })}
                                rows={4}
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <h3>{faq.question}</h3>
                            <p className="admin-inquiry-message">{faq.description}</p>
                            <div className="admin-answer-view">
                              <strong>등록된 답변</strong>
                              <p>{faq.answer}</p>
                            </div>
                          </>
                        )}
                        <div className="admin-inquiry-actions">
                          {editingFAQ === faq.id ? (
                            <>
                              <button 
                                type="button" 
                                className="btn primary" 
                                onClick={() => handleUpdateFAQ(faq.id)}
                              >
                                저장하기
                              </button>
                              <button 
                                type="button" 
                                className="btn secondary" 
                                onClick={() => {
                                  setEditingFAQ(null)
                                  setEditForm({ question: '', answer: '' })
                                }}
                              >
                                취소
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                type="button" 
                                className="btn primary" 
                                onClick={() => {
                                  setEditingFAQ(faq.id)
                                  setEditForm({ question: faq.question, answer: faq.answer })
                                }}
                              >
                                수정하기
                              </button>
                              <button 
                                type="button" 
                                className="btn secondary" 
                                onClick={() => handleDeleteFAQ(faq.id)}
                                style={{ background: '#f05f24', color: '#fff', border: 'none' }}
                              >
                                삭제하기
                              </button>
                            </>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}

              {/* 사용자 질문 섹션 */}
              {allInquiries.length > 0 && (
                <div>
                  {publishedFAQs.length > 0 && (
                    <h3 style={{ marginBottom: '1rem', fontSize: '1.3rem', fontWeight: '600' }}>사용자 문의</h3>
                  )}
                  <div className="admin-inquiry-grid">
                    {allInquiries.map(inquiry => {
                      const isAnswered = inquiry.status === 'answered' || inquiry.status === 'registered'
                      return (
                        <article
                          key={inquiry.id}
                          className={`admin-inquiry-card${isAnswered ? ' answered' : ''}`}
                        >
                          <div className="admin-inquiry-meta">
                            <span className="admin-chip">{inquiry.role}</span>
                            <span className="admin-nickname">{inquiry.nickname || inquiry.requester}</span>
                            <span>{inquiry.submittedAt}</span>
                          </div>
                          {inquiry.email ? (
                            <p className="admin-inquiry-email">회신 이메일: {inquiry.email}</p>
                          ) : null}
                          <h3>{inquiry.question}</h3>
                          <p className="admin-inquiry-message">{inquiry.description || inquiry.message}</p>

                          {isAnswered ? (
                            <div className="admin-answer-view">
                              <strong>등록된 답변</strong>
                              <p>{inquiry.answer}</p>
                            </div>
                          ) : (
                            <textarea
                              className="admin-answer"
                              placeholder="답변 내용을 등록하고 답변 등록 버튼을 눌러주세요."
                              value={responses[inquiry.id] ?? inquiry.answer ?? ''}
                              onChange={event => handleChange(inquiry.id, event.target.value)}
                            />
                          )}

                          {!isAnswered ? (
                            <div className="admin-inquiry-actions">
                              <button type="button" className="btn primary" onClick={() => handleSubmit(inquiry.id)}>
                                답변 등록하기
                              </button>
                              <span className="admin-status">답변 대기 중</span>
                            </div>
                          ) : (
                            <div className="admin-inquiry-actions">
                              {inquiry.status === 'registered' ? (
                                <span className="admin-status">FAQ 등록 완료</span>
                              ) : (
                                <>
                                  <button type="button" className="btn primary" onClick={() => handleRegister(inquiry.id)}>
                                    FAQ에 등록하기
                                  </button>
                                  <span className="admin-status">답변 완료</span>
                                </>
                              )}
                            </div>
                          )}
                        </article>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </article>
      </div>
    </section>
  )
}

