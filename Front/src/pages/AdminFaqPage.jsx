import { useState } from 'react'
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

  const handleChange = (id, value) => {
    setResponses(prev => ({ ...prev, [id]: value }))
  }

  const handleSubmit = id => {
    const target = adminInquiries.find(inquiry => inquiry.id === id)
    if (!target || target.status === 'answered') {
      return
    }
    const text = responses[id]?.trim()
    if (!text) return
    onSubmitAnswer(id, text)
    setResponses(prev => ({ ...prev, [id]: '' }))
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

          {adminInquiries.length === 0 ? (
            <p className="admin-empty">등록된 문의가 없습니다.</p>
          ) : (
            <div className="admin-inquiry-grid">
              {adminInquiries.map(inquiry => {
                const isAnswered = inquiry.status === 'answered'
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
                        <span className="admin-status">답변 완료</span>
                    </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </article>
      </div>
    </section>
  )
}

