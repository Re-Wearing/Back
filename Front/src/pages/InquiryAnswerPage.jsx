import HeaderLanding from '../components/HeaderLanding'

export default function InquiryAnswerPage({
  onNavigateHome,
  onNavLink,
  onNotifications,
  isLoggedIn,
  onLogout,
  unreadCount,
  onBackToFaq,
  inquiries = [],
  onDeleteInquiry = () => {},
  currentUser = null
}) {
  const answered = inquiries.filter(item => item.status === 'answered')

  return (
    <section className="main-page faq-page">
      <div className="main-shell faq-shell">
        <HeaderLanding
          role={currentUser?.role}
          onLogoClick={onNavigateHome}
          onNavClick={onNavLink}
          onNotifications={onNotifications}
          isLoggedIn={isLoggedIn}
          onLogout={onLogout}
          unreadCount={unreadCount}
        />

        <article className="faq-panel">
          <div className="faq-hero">
            <p className="eyebrow">문의 답변</p>
            <h2>내 문의 답변 보기</h2>
            <p>답변이 등록되면 알림을 받고 여기에서 내용을 확인하실 수 있습니다.</p>
          </div>

          {answered.length === 0 ? (
            <p className="admin-empty">아직 답변이 등록되지 않았습니다.</p>
          ) : (
            <div className="answer-list">
              {answered.map(inquiry => (
                <article key={inquiry.id} className="answer-card">
                  <div className="answer-card-meta">
                    <span>{inquiry.submittedAt}</span>
                    <span>{inquiry.name}</span>
                    <span>{inquiry.role}</span>
                  </div>
                  <h3>{inquiry.question}</h3>
                  <p className="answer-request">{inquiry.description}</p>
                  <div className="answer-body">
                    <strong>답변</strong>
                    <p>{inquiry.answer}</p>
                  </div>
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => onDeleteInquiry(inquiry.id)}
                  >
                    삭제
                  </button>
                </article>
              ))}
            </div>
          )}

          <div className="faq-footer">
            <button type="button" className="btn secondary" onClick={onBackToFaq}>
              FAQ로 돌아가기
            </button>
          </div>
        </article>
      </div>
    </section>
  )
}