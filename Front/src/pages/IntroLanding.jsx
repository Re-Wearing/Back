import Logo from '../components/Logo'

export default function IntroLanding({
  onClose = () => {},
  onLogin = () => {},
  onSignup = () => {}
}) {
  return (
    <section className="intro-landing" aria-labelledby="intro-heading">
      <div className="intro-overlay" />
      <div className="intro-inner">
        <header className="intro-header">
          <Logo size="lg" />
          <button
            type="button"
            className="intro-close"
            aria-label="랜딩 인트로 닫기"
            onClick={onClose}
          >
            &times;
          </button>
        </header>

        <div className="intro-body">
          <p className="intro-tagline">지속가능한 패션을 위한 중고 의류 거래 플랫폼</p>
          <h1 id="intro-heading">RE:WEAR</h1>
          <p className="intro-message">지금 시작해보세요!</p>

          <div className="intro-cta">
            <button className="btn primary" onClick={onSignup}>
              회원가입
            </button>
            <button className="btn secondary" onClick={onLogin}>
              로그인
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

