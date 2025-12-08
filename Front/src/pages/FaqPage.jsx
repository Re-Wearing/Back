import { useState, useEffect } from 'react'
import HeaderLanding from '../components/HeaderLanding'

// 기본 FAQ 데이터 (API 실패 시 fallback)
const DEFAULT_FAQ_ENTRIES = [
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
  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [questionInput, setQuestionInput] = useState('')
  const [showQuestionForm, setShowQuestionForm] = useState(false)

  // API에서 FAQ 목록 가져오기
  useEffect(() => {
    const fetchFAQs = async () => {
      setLoading(true)
      try {
        console.log('FAQ 목록 조회 시작...')
        const response = await fetch('http://localhost:8080/api/faq', {
          credentials: 'include'
        })
        
        console.log('FAQ API 응답 상태:', response.status, response.statusText)
        
        if (response.ok) {
          const faqData = await response.json()
          console.log('FAQ API 응답 데이터:', faqData)
          console.log('FAQ 개수:', faqData.length)
          
          if (Array.isArray(faqData) && faqData.length > 0) {
            const faqList = faqData.map(faq => ({
              question: faq.question,
              answer: faq.answer || '답변 대기 중입니다.'
            }))
            console.log('변환된 FAQ 목록:', faqList)
            setFaqs(faqList)
          } else {
            console.warn('FAQ 데이터가 비어있습니다.')
            setFaqs([])
          }
        } else {
          const errorText = await response.text()
          console.error('FAQ API 응답 실패:', response.status, errorText)
          // API 실패 시 빈 배열로 설정 (기본 데이터 사용 안 함)
          setFaqs([])
        }
      } catch (error) {
        console.error('FAQ 목록 조회 실패:', error)
        // 에러 발생 시 빈 배열로 설정
        setFaqs([])
      } finally {
        setLoading(false)
      }
    }

    fetchFAQs()
  }, [])

  // 질문 등록 핸들러
  const handleSubmitQuestion = async (e) => {
    e.preventDefault()
    
    if (!questionInput.trim()) {
      window.alert('질문을 입력해주세요.')
      return
    }

    if (!isLoggedIn) {
      window.alert('질문을 등록하려면 로그인이 필요합니다.')
      return
    }

    try {
      const response = await fetch('http://localhost:8080/api/faq/question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          question: questionInput.trim()
        })
      })

      if (response.ok) {
        window.alert('질문이 등록되었습니다. 관리자가 답변을 작성하면 확인할 수 있습니다.')
        setQuestionInput('')
        setShowQuestionForm(false)
      } else {
        const errorData = await response.json()
        window.alert(errorData.error || '질문 등록에 실패했습니다.')
      }
    } catch (error) {
      console.error('질문 등록 실패:', error)
      window.alert('질문 등록 중 오류가 발생했습니다.')
    }
  }

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

          {loading ? (
            <div className="faq-loading">
              <p>FAQ를 불러오는 중...</p>
            </div>
          ) : (
            <div className="faq-list">
              {faqs.length === 0 ? (
                <div className="faq-empty">
                  <p>등록된 FAQ가 없습니다.</p>
                </div>
              ) : (
                faqs.map((item, index) => {
                  const isOpen = openIndexes.has(index)
                  return (
                    <article key={index} className={`faq-item${isOpen ? ' active' : ''}`}>
                      <button
                        type="button"
                        className="faq-question"
                        onClick={() => toggleItem(index)}
                      >
                        <span>{item.question}</span>
                        <span className="faq-icon" aria-hidden="true">
                          {isOpen ? '−' : '+'}
                        </span>
                      </button>
                      <div className={`faq-answer${isOpen ? '' : ' hidden'}`}>{item.answer}</div>
                    </article>
                  )
                })
              )}
            </div>
          )}

          <div className="faq-footer">
            <p>그 외 궁금한 점이 있다면?</p>
            <div className="faq-inquiry">
              {isLoggedIn ? (
                <>
                  <button 
                    type="button" 
                    className="btn secondary" 
                    onClick={() => setShowQuestionForm(!showQuestionForm)}
                  >
                    질문 등록하기
                  </button>
                  {hasInquiries ? (
                    <button type="button" className="btn primary" onClick={onViewAnswers}>
                      답변 확인하기
                    </button>
                  ) : null}
                </>
              ) : (
                <button 
                  type="button" 
                  className="btn secondary" 
                  onClick={onInquiry}
                >
                  문의하기
                </button>
              )}
            </div>
            
            {/* 질문 등록 폼 */}
            {showQuestionForm && isLoggedIn && (
              <form className="faq-question-form" onSubmit={handleSubmitQuestion}>
                <textarea
                  className="faq-question-input"
                  placeholder="궁금한 점을 입력해주세요..."
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  rows={4}
                  required
                />
                <div className="faq-question-actions">
                  <button 
                    type="button" 
                    className="btn-cancel"
                    onClick={() => {
                      setShowQuestionForm(false)
                      setQuestionInput('')
                    }}
                  >
                    취소
                  </button>
                  <button type="submit" className="btn-submit">
                    등록하기
                  </button>
                </div>
              </form>
            )}
          </div>
        </article>
      </div>
    </section>
  )
}

