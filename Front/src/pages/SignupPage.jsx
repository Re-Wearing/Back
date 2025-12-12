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
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [formData, setFormData] = useState({})
  const [emailCodes, setEmailCodes] = useState({})
  const [verifiedEmails, setVerifiedEmails] = useState({})
  const [addressReady, setAddressReady] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)

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

  // 필수 필드가 모두 입력되었는지 확인 (닉네임 제외)
  const isAllRequiredFieldsFilled = () => {
    if (membership === 'general') {
      const username = (formData[getFieldKey('username')] || '').trim()
      const password = (formData[getFieldKey('password')] || '').trim()
      const fullName = (formData[getFieldKey('fullName')] || '').trim()
      const email = (formData[getFieldKey('email')] || '').trim()
      const zipCode = (formData[getFieldKey('zipCode')] || '').trim()
      const address = (formData[getFieldKey('address')] || '').trim()
      const emailVerified = Boolean(verifiedEmails[membership])
      
      return username && password && fullName && email && zipCode && address && emailVerified
    } else if (membership === 'organization') {
      const username = (formData[getFieldKey('username')] || '').trim()
      const password = (formData[getFieldKey('password')] || '').trim()
      const manager = (formData[getFieldKey('manager')] || '').trim()
      const email = (formData[getFieldKey('email')] || '').trim()
      const orgName = (formData[getFieldKey('orgName')] || '').trim()
      const businessNumber = (formData[getFieldKey('businessNumber')] || '').trim()
      const zipCode = (formData[getFieldKey('zipCode')] || '').trim()
      const address = (formData[getFieldKey('address')] || '').trim()
      const emailVerified = Boolean(verifiedEmails[membership])
      
      return username && password && manager && email && orgName && businessNumber && zipCode && address && emailVerified
    }
    return false
  }

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
                  <strong 
                    onClick={(e) => {
                      e.preventDefault()
                      setShowTermsModal(true)
                    }}
                    style={{ cursor: 'pointer', color: '#0066cc', textDecoration: 'underline' }}
                  >
                    서비스 이용약관
                  </strong>
                  {' 및 '}
                  <strong 
                    onClick={(e) => {
                      e.preventDefault()
                      setShowPrivacyModal(true)
                    }}
                    style={{ cursor: 'pointer', color: '#0066cc', textDecoration: 'underline' }}
                  >
                    개인정보 처리방침
                  </strong>
                  에 동의합니다.
                </span>
              </label>

              <button
                type="button"
                className="submit-button"
                disabled={!isAllRequiredFieldsFilled() || !agreeTerms}
                onClick={() => {
                  const allFieldsFilled = isAllRequiredFieldsFilled()
                  
                  if (!allFieldsFilled) {
                    window.alert('필수 정보를 입력하여야 합니다.')
                    return
                  }
                  
                  if (!agreeTerms) {
                    window.alert('약관에 동의하셔야 합니다.')
                    return
                  }
                  
                  onSignupSubmit(formData, membership, {
                    emailVerified: Boolean(verifiedEmails[membership])
                  })
                }}
                style={{
                  opacity: (isAllRequiredFieldsFilled() && agreeTerms) ? 1 : 0.6,
                  cursor: (isAllRequiredFieldsFilled() && agreeTerms) ? 'pointer' : 'not-allowed'
                }}
              >
                계정 만들기
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

      {/* 서비스 이용약관 모달 */}
      {showTermsModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowTermsModal(false)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '700px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
              서비스 이용약관
            </h2>
            <div style={{ lineHeight: '1.8', fontSize: '0.95rem' }}>
              <h3 style={{ marginTop: '1.5rem', marginBottom: '0.8rem', fontSize: '1.1rem', fontWeight: '600' }}>
                제1조 (목적)
              </h3>
              <p style={{ marginBottom: '1rem' }}>
                본 약관은 RE:WEAR(이하 "회사")가 제공하는 중고 의류 거래 및 기부 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
              </p>

              <h3 style={{ marginTop: '1.5rem', marginBottom: '0.8rem', fontSize: '1.1rem', fontWeight: '600' }}>
                제2조 (정의)
              </h3>
              <p style={{ marginBottom: '1rem' }}>
                1. "서비스"란 회사가 제공하는 중고 의류 거래 플랫폼 및 기부 서비스를 의미합니다.<br />
                2. "이용자"란 본 약관에 동의하고 회사가 제공하는 서비스를 이용하는 회원 및 비회원을 의미합니다.<br />
                3. "회원"이란 회사에 개인정보를 제공하여 회원등록을 한 자로서, 회사의 정보를 지속적으로 제공받으며 서비스를 이용할 수 있는 자를 의미합니다.
              </p>

              <h3 style={{ marginTop: '1.5rem', marginBottom: '0.8rem', fontSize: '1.1rem', fontWeight: '600' }}>
                제3조 (약관의 게시와 개정)
              </h3>
              <p style={{ marginBottom: '1rem' }}>
                1. 회사는 본 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.<br />
                2. 회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.<br />
                3. 회사가 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행약관과 함께 서비스 초기화면에 그 적용일자 7일 이전부터 적용일자 전일까지 공지합니다.
              </p>

              <h3 style={{ marginTop: '1.5rem', marginBottom: '0.8rem', fontSize: '1.1rem', fontWeight: '600' }}>
                제4조 (서비스의 제공 및 변경)
              </h3>
              <p style={{ marginBottom: '1rem' }}>
                1. 회사는 다음과 같은 서비스를 제공합니다:<br />
                - 중고 의류 거래 중개 서비스<br />
                - 의류 기부 서비스<br />
                - 기부 물품 매칭 서비스<br />
                - 기타 회사가 추가 개발하거나 제휴계약 등을 통해 회원에게 제공하는 일체의 서비스<br />
                2. 회사는 필요한 경우 서비스의 내용을 변경할 수 있으며, 변경 시에는 사전에 공지합니다.
              </p>

              <h3 style={{ marginTop: '1.5rem', marginBottom: '0.8rem', fontSize: '1.1rem', fontWeight: '600' }}>
                제5조 (이용자의 의무)
              </h3>
              <p style={{ marginBottom: '1rem' }}>
                1. 이용자는 다음 행위를 하여서는 안 됩니다:<br />
                - 신청 또는 변경 시 허위내용의 등록<br />
                - 타인의 정보 도용<br />
                - 회사가 게시한 정보의 변경<br />
                - 회사가 정한 정보 이외의 정보 등의 송신 또는 게시<br />
                - 회사와 기타 제3자의 저작권 등 지적재산권에 대한 침해<br />
                - 회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위<br />
                - 외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 공개 또는 게시하는 행위
              </p>

              <h3 style={{ marginTop: '1.5rem', marginBottom: '0.8rem', fontSize: '1.1rem', fontWeight: '600' }}>
                제6조 (회원의 의무)
              </h3>
              <p style={{ marginBottom: '1rem' }}>
                1. 회원은 본 약관 및 관련 법령을 준수하여야 합니다.<br />
                2. 회원은 자신의 계정 정보를 안전하게 관리할 책임이 있으며, 제3자에게 계정을 양도하거나 대여할 수 없습니다.<br />
                3. 회원은 서비스 이용 중 발생한 모든 책임을 부담합니다.
              </p>

              <h3 style={{ marginTop: '1.5rem', marginBottom: '0.8rem', fontSize: '1.1rem', fontWeight: '600' }}>
                제7조 (서비스 이용의 제한)
              </h3>
              <p style={{ marginBottom: '1rem' }}>
                회사는 이용자가 본 약관의 의무를 위반하거나 서비스의 정상적인 운영을 방해한 경우, 경고, 일시정지, 영구이용정지 등으로 서비스 이용을 단계적으로 제한할 수 있습니다.
              </p>

              <h3 style={{ marginTop: '1.5rem', marginBottom: '0.8rem', fontSize: '1.1rem', fontWeight: '600' }}>
                제8조 (면책조항)
              </h3>
              <p style={{ marginBottom: '1rem' }}>
                1. 회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.<br />
                2. 회사는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여는 책임을 지지 않습니다.<br />
                3. 회사는 회원이 서비스를 이용하여 기대하는 수익을 상실한 것에 대하여 책임을 지지 않으며, 그 밖의 서비스를 통하여 얻은 자료로 인한 손해에 관하여 책임을 지지 않습니다.
              </p>

              <h3 style={{ marginTop: '1.5rem', marginBottom: '0.8rem', fontSize: '1.1rem', fontWeight: '600' }}>
                제9조 (준거법 및 관할법원)
              </h3>
              <p style={{ marginBottom: '1rem' }}>
                1. 회사와 이용자 간에 발생한 전자상거래 분쟁에 관한 소송은 제소 당시의 이용자의 주소에 의하고, 주소가 없는 경우에는 거소를 관할하는 지방법원의 전속관할로 합니다.<br />
                2. 회사와 이용자 간에 발생한 분쟁에 관한 소송은 대한민국 법을 준거법으로 합니다.
              </p>

              <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#666' }}>
                본 약관은 2025년 1월 1일부터 시행됩니다.
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button
                type="button"
                className="btn primary"
                onClick={() => setShowTermsModal(false)}
                style={{ padding: '0.75rem 2rem' }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 개인정보 처리방침 모달 */}
      {showPrivacyModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowPrivacyModal(false)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '700px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
              개인정보 처리방침
            </h2>
            <div style={{ lineHeight: '1.8', fontSize: '0.95rem' }}>
              <h3 style={{ marginTop: '1.5rem', marginBottom: '0.8rem', fontSize: '1.1rem', fontWeight: '600' }}>
                제1조 (개인정보의 처리목적)
              </h3>
              <p style={{ marginBottom: '1rem' }}>
                RE:WEAR(이하 "회사")는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보 보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.<br />
                1. 회원 가입 및 관리: 회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 서비스 부정이용 방지, 각종 고지·통지 목적<br />
                2. 재화 또는 서비스 제공: 물품배송, 서비스 제공, 콘텐츠 제공, 맞춤 서비스 제공, 본인인증<br />
                3. 마케팅 및 광고 활용: 신규 서비스 개발 및 맞춤 서비스 제공, 이벤트 및 광고성 정보 제공 및 참여기회 제공
              </p>

              <h3 style={{ marginTop: '1.5rem', marginBottom: '0.8rem', fontSize: '1.1rem', fontWeight: '600' }}>
                제2조 (개인정보의 처리 및 보유기간)
              </h3>
              <p style={{ marginBottom: '1rem' }}>
                1. 회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.<br />
                2. 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다:<br />
                - 회원 가입 및 관리: 회원 탈퇴 시까지 (단, 관계 법령 위반에 따른 수사·조사 등이 진행중인 경우에는 해당 수사·조사 종료 시까지)<br />
                - 재화 또는 서비스 제공: 재화·서비스 공급완료 및 요금결제·정산 완료 시까지<br />
                - 마케팅 및 광고 활용: 회원 탈퇴 시까지 또는 동의 철회 시까지
              </p>

              <h3 style={{ marginTop: '1.5rem', marginBottom: '0.8rem', fontSize: '1.1rem', fontWeight: '600' }}>
                제3조 (처리하는 개인정보의 항목)
              </h3>
              <p style={{ marginBottom: '1rem' }}>
                회사는 다음의 개인정보 항목을 처리하고 있습니다:<br />
                1. 회원 가입 및 관리: 아이디, 비밀번호, 이름, 이메일, 전화번호, 주소, 닉네임<br />
                2. 재화 또는 서비스 제공: 이름, 전화번호, 주소, 이메일<br />
                3. 마케팅 및 광고 활용: 이메일, 전화번호
              </p>

              <h3 style={{ marginTop: '1.5rem', marginBottom: '0.8rem', fontSize: '1.1rem', fontWeight: '600' }}>
                제4조 (개인정보의 제3자 제공)
              </h3>
              <p style={{ marginBottom: '1rem' }}>
                회사는 정보주체의 개인정보를 제1조(개인정보의 처리목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 개인정보 보호법 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.
              </p>

              <h3 style={{ marginTop: '1.5rem', marginBottom: '0.8rem', fontSize: '1.1rem', fontWeight: '600' }}>
                제5조 (개인정보처리의 위탁)
              </h3>
              <p style={{ marginBottom: '1rem' }}>
                1. 회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다:<br />
                - 배송 서비스: 배송 업체에 배송에 필요한 최소한의 정보(이름, 전화번호, 주소) 제공<br />
                2. 회사는 위탁계약 체결 시 개인정보 보호법 제26조에 따라 위탁업무 수행목적 외 개인정보 처리금지, 기술적·관리적 보호조치, 재위탁 제한, 수탁자에 대한 관리·감독, 손해배상 등에 관한 사항을 계약서 등 문서에 명시하고, 수탁자가 개인정보를 안전하게 처리하는지를 감독하고 있습니다.
              </p>

              <h3 style={{ marginTop: '1.5rem', marginBottom: '0.8rem', fontSize: '1.1rem', fontWeight: '600' }}>
                제6조 (정보주체의 권리·의무 및 그 행사방법)
              </h3>
              <p style={{ marginBottom: '1rem' }}>
                1. 정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다:<br />
                - 개인정보 처리정지 요구권<br />
                - 개인정보 열람요구권<br />
                - 개인정보 정정·삭제요구권<br />
                - 개인정보 처리정지 요구권<br />
                2. 제1항에 따른 권리 행사는 회사에 대해 서면, 전자우편, 모사전송(FAX) 등을 통하여 하실 수 있으며 회사는 이에 대해 지체 없이 조치하겠습니다.
              </p>

              <h3 style={{ marginTop: '1.5rem', marginBottom: '0.8rem', fontSize: '1.1rem', fontWeight: '600' }}>
                제7조 (개인정보의 파기)
              </h3>
              <p style={{ marginBottom: '1rem' }}>
                1. 회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.<br />
                2. 개인정보 파기의 절차 및 방법은 다음과 같습니다:<br />
                - 파기절차: 회사는 파기 사유가 발생한 개인정보를 선정하고, 회사의 개인정보 보호책임자의 승인을 받아 개인정보를 파기합니다.<br />
                - 파기방법: 회사는 전자적 파일 형태로 기록·저장된 개인정보는 기록을 재생할 수 없도록 파기하며, 종이 문서에 기록·저장된 개인정보는 분쇄기로 분쇄하거나 소각하여 파기합니다.
              </p>

              <h3 style={{ marginTop: '1.5rem', marginBottom: '0.8rem', fontSize: '1.1rem', fontWeight: '600' }}>
                제8조 (개인정보 보호책임자)
              </h3>
              <p style={{ marginBottom: '1rem' }}>
                회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.<br />
                - 개인정보 보호책임자: RE:WEAR 관리자<br />
                - 연락처: rewear0903@gmail.com
              </p>

              <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#666' }}>
                본 방침은 2025년 1월 1일부터 시행됩니다.
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button
                type="button"
                className="btn primary"
                onClick={() => setShowPrivacyModal(false)}
                style={{ padding: '0.75rem 2rem' }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

