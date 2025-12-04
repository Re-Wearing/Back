import { useEffect, useState } from 'react'
import HeaderLanding from '../components/HeaderLanding'
import { getNavLinksForRole } from '../constants/landingData'

const EyeIcon = ({ crossed = false }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 5C6 5 1.73 9.11.05 12c1.68 2.89 5.95 7 11.95 7s10.27-4.11 11.95-7C22.27 9.11 18 5 12 5Zm0 12a5 5 0 1 1 5-5 5 5 0 0 1-5 5Z" />
    {crossed ? <path d="m3 4.27 16.73 16.73L18 22.73 1.27 6Z" /> : null}
  </svg>
)

export default function LoginPage({
  onNavigateHome = () => {},
  onGoSignup = () => {},
  onNavLink = () => {},
  onLoginSubmit = () => ({ success: false }),
  isLoggedIn = false,
  onLogout = () => {},
  onNotifications = () => {},
  onForgotPassword = () => {},
  onForgotId = () => {},
  unreadCount = 0,
  onMenu = () => {},
  currentUser = null
}) {
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [form, setForm] = useState({ username: '', password: '' })
  const [message, setMessage] = useState('')
  const navLinks = getNavLinksForRole(currentUser?.role)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('rewearRememberId')
      if (saved) {
        setForm(prev => ({ ...prev, username: saved }))
        setRememberMe(true)
      }
    }
  }, [])

  const toggle = () => setPasswordVisible(prev => !prev)

  const handleChange = event => {
    const { name, value } = event.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async event => {
    event?.preventDefault()
    setMessage('') // 이전 메시지 초기화
    
    try {
      const result = await onLoginSubmit(form.username, form.password)
      if (result?.success) {
        if (typeof window !== 'undefined') {
          if (rememberMe) {
            window.localStorage.setItem('rewearRememberId', form.username.trim())
          } else {
            window.localStorage.removeItem('rewearRememberId')
          }
        }
        onNavigateHome()
      } else {
        // 에러 타입에 따라 다른 메시지 표시
        console.log('Login result:', result) // 디버깅용
        const errorType = result?.errorType || 'UNKNOWN'
        if (errorType === 'ORG_PENDING' || result?.reason === 'orgPending') {
          setMessage('기관 계정은 관리자 승인 후 로그인할 수 있습니다.')
        } else if (errorType === 'ACCOUNT_LOCKED') {
          setMessage('이용이 정지된 계정입니다. 관리자에게 문의해주세요.')
        } else if (errorType === 'BAD_CREDENTIALS' || errorType === 'USER_NOT_FOUND') {
          setMessage('아이디 또는 비밀번호가 올바르지 않습니다.')
        } else {
          // 백엔드에서 보낸 메시지가 있으면 그대로 사용
          const backendMessage = result?.message
          if (backendMessage && backendMessage.includes('승인')) {
            setMessage('기관 계정은 관리자 승인 후 로그인할 수 있습니다.')
          } else if (backendMessage && backendMessage.includes('정지')) {
            setMessage('이용이 정지된 계정입니다. 관리자에게 문의해주세요.')
          } else {
            setMessage(backendMessage || '로그인에 실패했습니다.')
          }
        }
      }
    } catch (error) {
      console.error('Login submit error:', error)
      setMessage('로그인 중 오류가 발생했습니다. 다시 시도해주세요.')
    }
  }

  return (
    <div className="login-page">
      <div className="auth-shell">
        <HeaderLanding
          navLinks={navLinks}
          role={currentUser?.role}
          onLogoClick={onNavigateHome}
          onLogin={() => {}}
          onNavClick={onNavLink}
          isLoggedIn={isLoggedIn}
          onLogout={onLogout}
          onNotifications={onNotifications}
          unreadCount={unreadCount}
          onMenu={onMenu}
        />

        <section className="auth-stage">
          <div className="login-card">
            <h1>Log In to RE:WEAR</h1>

            <form className="login-form" onSubmit={handleSubmit}>
              <label className="form-field" htmlFor="login-username">
                <span>아이디</span>
                <input
                  id="login-username"
                  name="username"
                  type="text"
                  placeholder="아이디를 입력하세요"
                  value={form.username}
                  onChange={handleChange}
                />
              </label>

              <label className="form-field" htmlFor="login-password">
                <span>비밀번호</span>
                <div className="password-field">
                  <input
                    id="login-password"
                    name="password"
                    type={passwordVisible ? 'text' : 'password'}
                    placeholder="비밀번호를 입력하세요"
                    value={form.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className={`password-eye ${passwordVisible ? 'active' : ''}`}
                    onClick={toggle}
                    aria-label={passwordVisible ? '비밀번호 숨기기' : '비밀번호 보기'}
                  >
                    <EyeIcon crossed={passwordVisible} />
                  </button>
                </div>
              </label>

              <div className="login-meta">
                <label className="terms-row">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={event => setRememberMe(event.target.checked)}
                  />
                  <span>Remember Me</span>
                </label>
                <div className="login-links">
                  <button type="button" className="link-button" onClick={onForgotId}>
                    Forgot ID
                  </button>
                  <button type="button" className="link-button" onClick={onForgotPassword}>
                    Forgot Password?
                  </button>
                </div>
              </div>

              <button type="submit" className="submit-button">
                Login
              </button>

              <p className={`login-message ${message && message.includes('환영') ? 'success' : ''}`}>
                {message}
              </p>

              <p className="login-footer">
                아직 계정이 없으신가요?{' '}
                <button type="button" className="link-button" onClick={onGoSignup}>
                  Sign up
                </button>
              </p>
            </form>
          </div>
        </section>
      </div>
    </div>
  )
}

