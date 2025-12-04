import HeaderLanding from '../components/HeaderLanding'

export default function InquiryAnswersPage({
  onNavigateHome,
  onNavLink,
  onNotifications,
  isLoggedIn,
  onLogout,
  unreadCount,
  onBackToFaq,
  inquiries = [],
  onMenu = () => {},
  currentUser = null
}) {
  const ordered = [...inquiries].sort((a, b) => (a.submittedAt > b.submittedAt ? -1 : 1))

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
          onMenu={onMenu}
        />

        <article className="faq-panel">
          <div className="faq-hero">
            <p className="eyebrow">문의 답변</p>
            <h2>내 문의 답변 보기</h2>
            <p>답변이 등록되면 알림을 받고 여기에서 내용을 확인하실 수 있습니다.</p>
          </div>

          {ordered.length === 0 ? (
            <p className="admin-empty">아직 등록한 문의가 없어요.</p>
          ) : (
            <div className="answer-list">
              {ordered.map(inquiry => {
                const isAnswered = inquiry.status === 'answered'
                return (
                  <article key={inquiry.id} className={`answer-card${isAnswered ? ' answered' : ' pending'}`}>
                  <div className="answer-card-meta">
                      <span>{inquiry.nickname || inquiry.requester}</span>
                    <span>{inquiry.submittedAt}</span>
                      <span className={`answer-status ${isAnswered ? 'done' : 'waiting'}`}>
                        {isAnswered ? '답변 완료' : '답변 대기중.'}
                      </span>
                  </div>
                    <h3>{inquiry.title || inquiry.question}</h3>
                    <p className="answer-request">{inquiry.message || inquiry.description}</p>
                    <div className={`answer-body${isAnswered ? '' : ' pending'}`}>
                      <strong>{isAnswered ? '답변' : '담당자 확인 중'}</strong>
                      <p>{isAnswered ? inquiry.answer : '관리자가 확인 후 순차적으로 답변됩니다.'}</p>
                  </div>
                </article>
                )
              })}
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

