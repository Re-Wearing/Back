import { useEffect, useMemo, useState } from 'react'
import HeaderLanding from '../components/HeaderLanding'
import { getNavLinksForRole, membershipOptions, membershipForms } from '../constants/landingData'

const EyeIcon = ({ crossed = false }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 5C6 5 1.73 9.11.05 12c1.68 2.89 5.95 7 11.95 7s10.27-4.11 11.95-7C22.27 9.11 18 5 12 5Zm0 12a5 5 0 1 1 5-5 5 5 0 0 1-5 5Z" />
    {crossed ? <path d="m3 4.27 16.73 16.73L18 22.73 1.27 6Z" /> : null}
  </svg>
)

export default function SignupPage({
  onNavigateHome = () => {},
  onGoLogin = () => {},
  onNavLink = () => {},
  isLoggedIn = false,
  onLogout = () => {},
  onNotifications = () => {},
  unreadCount = 0,
  onMenu = () => {},
  currentUser = null,
  onSignupSubmit = () => {}
}) {
  const [membership, setMembership] = useState(membershipOptions[0].value)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(true)
  const [formData, setFormData] = useState({})
  const [emailCodes, setEmailCodes] = useState({})
  const [verifiedEmails, setVerifiedEmails] = useState({})
  const [addressReady, setAddressReady] = useState(false)

  const fields = useMemo(() => membershipForms[membership] ?? [], [membership])
  const navLinks = getNavLinksForRole(currentUser?.role)

  const togglePassword = () => setPasswordVisible(prev => !prev)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.daum?.Postcode) {
      setAddressReady(true)
      return
    }
    const script = document.createElement('script')
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    script.async = true
    script.onload = () => setAddressReady(true)
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const getFieldKey = id => `${id}-${membership}`

  const handleChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }))
    if (key.startsWith('email-')) {
      setVerifiedEmails(prev => ({ ...prev, [membership]: false }))
    }
  }

  const handleSendEmailCode = async () => {
    const emailKey = getFieldKey('email')
    const email = formData[emailKey]?.trim()
    if (!email) {
      window.alert('이메일을 먼저 입력해주세요.')
      return
    }
    
    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
        credentials: 'include' // 세션 쿠키 전송
      })
      
      const data = await response.json()
      
      if (data.ok) {
        setVerifiedEmails(prev => ({ ...prev, [membership]: false }))
        window.alert('인증코드가 발송되었습니다. 이메일을 확인해주세요.')
      } else {
        window.alert(data.message || '인증코드 발송에 실패했습니다.')
      }
    } catch (error) {
      console.error('이메일 인증코드 발송 실패:', error)
      window.alert('인증코드 발송 중 오류가 발생했습니다.')
    }
  }

  const handleVerifyEmailCode = async () => {
    const inputCode = formData[getFieldKey('emailCode')]?.trim()
    const emailKey = getFieldKey('email')
    const email = formData[emailKey]?.trim()
    
    if (!inputCode) {
      window.alert('인증코드를 입력해주세요.')
      return
    }
    
    if (!email) {
      window.alert('이메일을 먼저 입력해주세요.')
      return
    }
    
    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code: inputCode }),
        credentials: 'include' // 세션 쿠키 전송
      })
      
      const data = await response.json()
      
      if (data.ok) {
        setVerifiedEmails(prev => ({ ...prev, [membership]: true }))
        window.alert('이메일 인증이 완료되었습니다.')
      } else {
        window.alert(data.message || '인증코드가 올바르지 않거나 만료되었습니다.')
      }
    } catch (error) {
      console.error('이메일 인증 실패:', error)
      window.alert('인증 중 오류가 발생했습니다.')
    }
  }

  const handleAddressSearch = () => {
    if (!addressReady || !window.daum?.Postcode) {
      window.alert('주소 검색 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.')
      return
    }
    new window.daum.Postcode({
      oncomplete: data => {
        const zonecode = data.zonecode
        const selectedAddress = data.roadAddress || data.jibunAddress
        setFormData(prev => ({
          ...prev,
          [getFieldKey('zipCode')]: zonecode,
          [getFieldKey('address')]: selectedAddress
        }))
      }
    }).open()
  }

  return (
    <div className="signup-page">
      <div className="signup-shell">
        <HeaderLanding
          navLinks={navLinks}
          role={currentUser?.role}
          onLogoClick={onNavigateHome}
          onLogin={onGoLogin}
          onNavClick={onNavLink}
          isLoggedIn={isLoggedIn}
          onLogout={onLogout}
          onNotifications={onNotifications}
          unreadCount={unreadCount}
          onMenu={onMenu}
        />

        <section className="signup-stage">
          <div className="signup-card">
            <h1>Sign up to RE:WEAR</h1>

            <div className="membership-select">
              <label htmlFor="membership">회원 유형</label>
              <select
                id="membership"
                value={membership}
                onChange={event => {
                  setMembership(event.target.value)
                  setPasswordVisible(false)
                }}
              >
                {membershipOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <form className="signup-form">
              {fields.map(field => {
                if (field.toggleable) {
                  return (
                    <label key={field.id} className="form-field" htmlFor={`${field.id}-${membership}`}>
                      <span>{field.label}</span>
                      <div className="password-field">
                      <input
  id={`${field.id}-${membership}`}
  type={passwordVisible ? 'text' : 'password'}
  placeholder={field.placeholder}
  value={formData[`${field.id}-${membership}`] || ""}
  onChange={(e) =>
    setFormData({
      ...formData,
      [`${field.id}-${membership}`]: e.target.value,
    })
  }
/>

                        <button
                          type="button"
                          className={`password-eye ${passwordVisible ? 'active' : ''}`}
                          onClick={togglePassword}
                          aria-label={passwordVisible ? '비밀번호 숨기기' : '비밀번호 보기'}
                        >
                          <EyeIcon crossed={passwordVisible} />
                        </button>
                      </div>
                    </label>
                  )
                }

                const inputId = `${field.id}-${membership}`
                const isReadOnly =
                  field.readOnly ||
                  field.id === 'zipCode' ||
                  field.id === 'address'

                if (field.id === 'zipCode') {
                  return (
                    <label key={field.id} className="form-field" htmlFor={inputId}>
                      <span>{field.label}</span>
                      <input
                        id={inputId}
                        type="text"
                        placeholder="주소 검색으로 자동 입력됩니다"
                        readOnly
                        value={formData[inputId] || ''}
                      />
                      <small>주소 검색을 누르면 우편번호가 자동 입력됩니다.</small>
                    </label>
                  )
                }

                if (field.id === 'address') {
                  return (
                    <label key={field.id} className="form-field" htmlFor={inputId}>
                      <span>{field.label}</span>
                      <div className="form-field-control">
                        <input
                          id={inputId}
                          type="text"
                          placeholder="우편번호와 주소를 검색하세요"
                          readOnly
                          value={formData[inputId] || ''}
                        />
                        <button
                          type="button"
                          className="inline-action"
                          onClick={handleAddressSearch}
                        >
                          주소 검색
                        </button>
                      </div>
                      <small>도로명 주소가 자동으로 입력되며 상세 주소만 직접 입력해주세요.</small>
                    </label>
                  )
                }

                return (
                  <label key={field.id} className="form-field" htmlFor={inputId}>
                    <span>{field.label}</span>
                    <div className="form-field-control">
                    <input
  id={inputId}
  type={field.type}
  placeholder={field.placeholder}
  readOnly={isReadOnly}
  disabled={isReadOnly}
  value={formData[inputId] || ""}
    onChange={(e) => handleChange(inputId, e.target.value)}
/>

                      {field.actionLabel ? (
                        <button
                          type="button"
                          className="inline-action"
                          onClick={
                            field.id === 'email'
                              ? handleSendEmailCode
                              : field.id === 'emailCode'
                              ? handleVerifyEmailCode
                              : undefined
                          }
                        >
                          {field.actionLabel}
                        </button>
                      ) : null}
                    </div>
                    {field.helper ? <small>{field.helper}</small> : null}
                    {field.id === 'email' && verifiedEmails[membership] && (
                      <small className="status-success">이메일 인증이 완료되었습니다.</small>
                    )}
                  </label>
                )
              })}

              <label className="terms-row">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={event => setAgreeTerms(event.target.checked)}
                />
                <span>
                  I agree to the <strong>Terms of Service</strong> and <strong>Privacy Policy</strong>.
                </span>
              </label>

              <button
  type="button"
  className="submit-button"
  disabled={!agreeTerms}
   onClick={() =>
     onSignupSubmit(formData, membership, {
       emailVerified: Boolean(verifiedEmails[membership])
     })
   }
>
  CREATE AN ACCOUNT
</button>


              <p className="signup-footer">
                이미 계정이 있으신가요?{' '}
                <button type="button" className="link-button" onClick={onGoLogin}>
                  Login
                </button>
              </p>
              <p className="signup-meta">© {new Date().getFullYear()} · RE:WEAR · All Rights Reserved.</p>
            </form>
          </div>
        </section>
      </div>
    </div>
  )
}

