import { useState } from 'react'
import HeaderLanding from '../components/HeaderLanding'

const FAQ_ENTRIES = [
  {
    question: '기부 물품은 어떻게 접수하나요?',
    answer:
      '웹에서 기부 신청서를 작성한 뒤, 가까운 수거 파트너가 방문하여 픽업합니다. 미리 제시한 시간에만 방문하니 안심하세요.'
  },
  {
    question: '기부 물품의 상태는 어떻게 확인할 수 있나요?',
    answer:
      '검수 후 사진과 상태를 알림으로 받아보실 수 있습니다.'
  },
  {
    question: '자동 매칭은 어떻게 하나나요?',
    answer:
      'RE:WEAR는 의류 상태와 용도를 기준으로 필요한 기관과 자동 매칭합니다. 기부하기에서 자동 매칭을 선택해 주세요!'
  },
  {
    question: '직접 매칭은 어떻게 하나요?',
    answer:
      'RE:WEAR는 의류 상태와 용도를 기준으로 필요한 기관과 매칭합니다. 특정 기관을 지정하고 싶으시면 직접 매칭을 선택해 주세요!'
  },
  {
    question: '기부 취소는 어떻게 하나요?',
    answer:
      '대기 상태라면 즉시 취소할 수 있고, 대기 상태 이후에는 하단의 문의하기 버튼으로 문의하시면 상황에 따라 조정해드립니다.'
  },
  {
    question: '계정이 잠겼어요. 어떻게 푸나요?',
    answer:
      '하단의 문의하기 버튼을 눌러 관리자에게 문의하여 주시길 바랍니다.'
  }
]

export default function FaqPage({
  onNavLink,
  onNavigateHome,
  onInquiry,
  isLoggedIn,
  onLogout,
  onNotifications,
  unreadCount,
  hasInquiries = false,
  answeredCount = 0,
  onViewAnswers = () => {},
  onMenu = () => {},
  currentUser = null
}) {
  const [openIndexes, setOpenIndexes] = useState(() => new Set())

  const toggleItem = index => {
    setOpenIndexes(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

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
            <p className="eyebrow">Frequently Asked</p>
            <h2>자주 묻는 질문</h2>
            <p>
              RE:WEAR 이용 중 궁금한 점은 여기서 빠르게 확인하세요. 더 자세한 문의는 하단의 문의하기 버튼을 눌러
              남겨주시면 담당자가 답변드립니다.
            </p>
          </div>

          <div className="faq-list">
            {FAQ_ENTRIES.map((item, index) => {
              const isOpen = openIndexes.has(index)
              return (
                <article key={item.question} className={`faq-item${isOpen ? ' active' : ''}`}>
                <button
                  type="button"
                  className="faq-question"
                  onClick={() => toggleItem(index)}
                >
                  <span>{item.question}</span>
                  <span className="faq-icon" aria-hidden="true">
                    +
                  </span>
                </button>
                  <div className={`faq-answer${isOpen ? '' : ' hidden'}`}>{item.answer}</div>
              </article>
              )
            })}
          </div>

          <div className="faq-footer">
            <p>그 외 궁금한 점이 있다면?</p>
            <div className="faq-inquiry">
              <button type="button" className="btn secondary" onClick={onInquiry}>
                문의하기
              </button>
              {hasInquiries ? (
                <button type="button" className="btn primary" onClick={onViewAnswers}>
                  답변 확인하기
                </button>
              ) : null}
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}

