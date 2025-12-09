import { useEffect, useState } from 'react'
import { formatPhoneNumber, stripPhoneNumber } from '../utils/phone'
import Logo from '../components/Logo'

export default function MyPage({
  user,
  profile,
  onSaveProfile,
  onChangePassword,
  onWithdraw,
  onNavigateHome,
  onRequireLogin = () => {},
  onChangeEmail = async () => ({ success: false })
}) {
  const [form, setForm] = useState({
    nickname: '',
    phone: '',
    address: '',
    allowEmail: true,
    email: ''
  })
  const [profileMessage, setProfileMessage] = useState('')
  const [emailVerification, setEmailVerification] = useState({
    newEmail: '',
    code: '',
    isVerified: false,
    isSending: false,
    message: ''
  })
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    next: '',
    confirm: ''
  })
  const [passwordMessage, setPasswordMessage] = useState('')
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAgreed, setWithdrawAgreed] = useState(false)
  const [withdrawVerification, setWithdrawVerification] = useState({
    code: '',
    isSending: false,
    isVerified: false,
    message: ''
  })

  const isOrganization = Boolean(user?.role === '기관 회원')

  const syncForm = () => {
    if (profile && user) {
      const fallbackNickname = profile.nickname || user.name
      const forcedNickname = isOrganization ? profile.fullName || user.name : fallbackNickname
      setForm({
        nickname: forcedNickname,
        phone: stripPhoneNumber(profile.phone || ''),
        address: profile.address || '',
        allowEmail: Boolean(profile.allowEmail),
        email: user.email || ''
      })
      // 이메일 변경 상태 초기화
      setEmailVerification({
        newEmail: '',
        code: '',
        isVerified: false,
        isSending: false,
        message: ''
      })
    }
  }

  useEffect(() => {
    syncForm()
  }, [profile, user])

  if (!user || !profile) {
    return (
      <div className="mypage-page">
        <div className="mypage-card basic">
          <p>로그인이 필요합니다.</p>
          <button className="btn primary" type="button" onClick={onRequireLogin}>
            로그인으로 이동
          </button>
        </div>
      </div>
    )
  }

  const memberName = profile.fullName || user.name
  const displayNickname = isOrganization ? memberName : profile.nickname || memberName

  const handleProfileChange = event => {
    const { name, value, type, checked } = event.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : name === 'phone' ? stripPhoneNumber(value) : value
    }))
  }

  const handleProfileSubmit = async event => {
    event.preventDefault()
    const formattedPhone = formatPhoneNumber(form.phone)
    const payload = isOrganization
      ? { ...form, nickname: memberName, phone: formattedPhone }
      : { ...form, phone: formattedPhone }
    const result = await onSaveProfile(payload)
    setProfileMessage(result.message || (result.success ? '저장되었습니다.' : '실패했습니다.'))
  }

  const handlePasswordSubmit = async event => {
    event.preventDefault()
    if (!passwordForm.current || !passwordForm.next) {
      setPasswordMessage('비밀번호를 모두 입력해주세요.')
      return
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordMessage('새 비밀번호가 일치하지 않습니다.')
      return
    }
    const result = await onChangePassword(passwordForm.current, passwordForm.next)
    setPasswordMessage(result.message || (result.success ? '비밀번호가 변경되었습니다.' : '실패했습니다.'))
    if (result.success) {
      setPasswordForm({ current: '', next: '', confirm: '' })
    }
  }

  const handleOpenWithdrawModal = () => {
    setShowWithdrawModal(true)
    setWithdrawAgreed(false)
    setWithdrawVerification({
      code: '',
      isSending: false,
      isVerified: false,
      message: ''
    })
  }

  const handleCloseWithdrawModal = () => {
    setShowWithdrawModal(false)
    setWithdrawAgreed(false)
    setWithdrawVerification({
      code: '',
      isSending: false,
      isVerified: false,
      message: ''
    })
  }

  const handleSendWithdrawVerification = async () => {
    setWithdrawVerification(prev => ({ ...prev, isSending: true, message: '' }))

    try {
      const response = await fetch('/api/users/me/withdraw/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      const data = await response.json()

      if (data.ok === true) {
        setWithdrawVerification(prev => ({
          ...prev,
          isSending: false,
          message: '인증코드가 발송되었습니다. 이메일을 확인해주세요.'
        }))
      } else {
        setWithdrawVerification(prev => ({
          ...prev,
          isSending: false,
          message: data.message || '인증코드 전송에 실패했습니다.'
        }))
      }
    } catch (error) {
      console.error('Withdraw verification send error:', error)
      setWithdrawVerification(prev => ({
        ...prev,
        isSending: false,
        message: '인증코드 전송 중 오류가 발생했습니다.'
      }))
    }
  }

  const handleVerifyWithdrawCode = async () => {
    if (!withdrawVerification.code || withdrawVerification.code.trim().length !== 6) {
      setWithdrawVerification(prev => ({
        ...prev,
        message: '인증코드 6자리를 입력해주세요.'
      }))
      return
    }

    try {
      const response = await fetch('/api/users/me/withdraw/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          code: withdrawVerification.code.trim()
        }),
      })

      const data = await response.json()

      if (data.ok === true) {
        setWithdrawVerification(prev => ({
          ...prev,
          isVerified: true,
          message: '인증이 완료되었습니다.'
        }))
      } else {
        setWithdrawVerification(prev => ({
          ...prev,
          isVerified: false,
          message: data.message || '인증코드가 올바르지 않습니다.'
        }))
      }
    } catch (error) {
      console.error('Withdraw verification error:', error)
      setWithdrawVerification(prev => ({
        ...prev,
        isVerified: false,
        message: '인증코드 확인 중 오류가 발생했습니다.'
      }))
    }
  }

  const handleWithdrawSubmit = async () => {
    if (!withdrawAgreed) {
      setWithdrawVerification(prev => ({
        ...prev,
        message: '약관에 동의해주세요.'
      }))
      return
    }

    if (!withdrawVerification.isVerified) {
      setWithdrawVerification(prev => ({
        ...prev,
        message: '이메일 인증을 완료해주세요.'
      }))
      return
    }

    const result = await onWithdraw()
    if (result.success) {
      handleCloseWithdrawModal()
    } else {
      setWithdrawVerification(prev => ({
        ...prev,
        message: result.message || '회원 탈퇴에 실패했습니다.'
      }))
    }
  }

  const handleSendEmailVerification = async () => {
    if (!emailVerification.newEmail || !emailVerification.newEmail.trim()) {
      setEmailVerification(prev => ({
        ...prev,
        message: '새 이메일을 입력해주세요.'
      }))
      return
    }

    setEmailVerification(prev => ({ ...prev, isSending: true, message: '' }))

    try {
      const response = await fetch('/api/users/me/email/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: emailVerification.newEmail.trim()
        }),
      })

      const data = await response.json()

      if (data.ok === true) {
        setEmailVerification(prev => ({
          ...prev,
          isSending: false,
          message: '인증코드가 발송되었습니다.'
        }))
      } else {
        setEmailVerification(prev => ({
          ...prev,
          isSending: false,
          message: data.message || '인증코드 전송에 실패했습니다.'
        }))
      }
    } catch (error) {
      console.error('Email verification send error:', error)
      setEmailVerification(prev => ({
        ...prev,
        isSending: false,
        message: '인증코드 전송 중 오류가 발생했습니다.'
      }))
    }
  }

  const handleChangeEmail = async () => {
    if (!emailVerification.newEmail || !emailVerification.code) {
      setEmailVerification(prev => ({
        ...prev,
        message: '이메일과 인증코드를 모두 입력해주세요.'
      }))
      return
    }

    const result = await onChangeEmail({
      email: emailVerification.newEmail.trim(),
      code: emailVerification.code.trim()
    })

    if (result.success) {
      setEmailVerification({
        newEmail: '',
        code: '',
        isVerified: false,
        isSending: false,
        message: ''
      })
      // 폼 동기화하여 변경된 이메일 반영
      syncForm()
    } else {
      setEmailVerification(prev => ({
        ...prev,
        message: result.message || '이메일 변경에 실패했습니다.'
      }))
    }
  }

  return (
    <div className="mypage-page">
      <div className="mypage-header">
        <button type="button" className="mypage-logo" onClick={onNavigateHome}>
          <Logo size="md" />
        </button>
      </div>
      <div className="mypage-layout">
        <aside className="mypage-profile-card">
          <div className="mypage-avatar">👤</div>
          <div className="mypage-identity">
            <span className="mypage-role">{user.role}</span>
            <strong className="mypage-realname">{memberName}</strong>
            <p className="mypage-nickname">닉네임 {displayNickname}</p>
          </div>
          <p className="mypage-email">{form.email}</p>

          <ul className="mypage-meta">
            <li>
              <span>회원 아이디</span>
              <strong>{user.username}</strong>
            </li>
            <li>
              <span>회원 유형</span>
              <strong>{user.role}</strong>
            </li>
          </ul>

          <div className="mypage-actions">
            <button type="button" className="outline">
              비밀번호 변경
            </button>
            <button type="button" className="danger" onClick={handleOpenWithdrawModal}>
              회원탈퇴
            </button>
          </div>
        </aside>

        <section className="mypage-content">
          <form className="mypage-form" onSubmit={handleProfileSubmit}>
            <h2>프로필 편집</h2>
            <label>
              이름
              <input value={memberName} readOnly />
            </label>
            <label>
              닉네임
              <input
                name="nickname"
                value={form.nickname}
                onChange={handleProfileChange}
                readOnly={isOrganization}
                placeholder="닉네임 입력"
              />
            </label>
            <label>
              현재 이메일
              <input name="email" value={form.email} readOnly />
            </label>
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#f9f9f9', borderRadius: '10px' }}>
              <h3 style={{ marginTop: 0, marginBottom: '0.8rem', fontSize: '1rem' }}>이메일 변경</h3>
              <label>
                새 이메일
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.3rem' }}>
                  <input
                    type="email"
                    value={emailVerification.newEmail}
                    onChange={e => setEmailVerification(prev => ({ ...prev, newEmail: e.target.value, message: '' }))}
                    placeholder="변경할 이메일을 입력하세요"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn primary"
                    onClick={handleSendEmailVerification}
                    disabled={emailVerification.isSending}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {emailVerification.isSending ? '전송 중...' : '인증코드 전송'}
                  </button>
                </div>
              </label>
              {emailVerification.newEmail && (
                <label style={{ marginTop: '0.8rem' }}>
                  인증코드
                  <input
                    type="text"
                    value={emailVerification.code}
                    onChange={e => setEmailVerification(prev => ({ ...prev, code: e.target.value, message: '' }))}
                    placeholder="인증코드 6자리 입력"
                    maxLength={6}
                    style={{ marginTop: '0.3rem' }}
                  />
                </label>
              )}
              {emailVerification.message && (
                <p className={`helper ${emailVerification.message.includes('성공') || emailVerification.message.includes('발송') ? '' : 'danger'}`} style={{ marginTop: '0.5rem' }}>
                  {emailVerification.message}
                </p>
              )}
              {emailVerification.newEmail && emailVerification.code && (
                <button
                  type="button"
                  className="btn primary"
                  onClick={handleChangeEmail}
                  style={{ marginTop: '0.8rem', width: '100%' }}
                >
                  이메일 변경
                </button>
              )}
            </div>
            <label>
              휴대전화번호
              <span className="input-hint">숫자만 입력해주세요</span>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleProfileChange}
                placeholder="숫자만 입력 (예: 01012345678)"
                inputMode="numeric"
              />
            </label>
            <label>
              주소
              <input name="address" value={form.address} onChange={handleProfileChange} placeholder="주소를 입력하세요" />
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                name="allowEmail"
                checked={form.allowEmail}
                onChange={handleProfileChange}
              />
              이메일 알림 수신
            </label>
            {profileMessage ? <p className="helper">{profileMessage}</p> : null}
            <div className="mypage-form-actions">
              <button type="button" className="btn ghost" onClick={syncForm}>
                취소
              </button>
              <button type="submit" className="btn primary">
                저장
              </button>
            </div>
          </form>

          <form className="mypage-form secondary" onSubmit={handlePasswordSubmit}>
            <h3>비밀번호 변경</h3>
            <label>
              현재 비밀번호
              <input
                type="password"
                value={passwordForm.current}
                onChange={event =>
                  setPasswordForm(prev => ({
                    ...prev,
                    current: event.target.value
                  }))
                }
              />
            </label>
            <label>
              새 비밀번호
              <input
                type="password"
                value={passwordForm.next}
                onChange={event =>
                  setPasswordForm(prev => ({
                    ...prev,
                    next: event.target.value
                  }))
                }
              />
            </label>
            <label>
              새 비밀번호 확인
              <input
                type="password"
                value={passwordForm.confirm}
                onChange={event =>
                  setPasswordForm(prev => ({
                    ...prev,
                    confirm: event.target.value
                  }))
                }
              />
            </label>
            {passwordMessage ? <p className="helper">{passwordMessage}</p> : null}
            <div className="mypage-form-actions">
              <button type="submit" className="btn primary">
                변경
              </button>
            </div>
          </form>
        </section>
      </div>

      {/* 회원탈퇴 모달 */}
      {showWithdrawModal && (
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
          onClick={handleCloseWithdrawModal}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
              회원탈퇴
            </h2>

            {/* 약관 동의 */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontWeight: '600' }}>
                회원탈퇴 약관
              </h3>
              <div style={{
                padding: '1rem',
                backgroundColor: '#f9f9f9',
                borderRadius: '8px',
                maxHeight: '200px',
                overflowY: 'auto',
                fontSize: '0.9rem',
                lineHeight: '1.6',
                marginBottom: '1rem'
              }}>
                <p style={{ margin: '0.5rem 0' }}>
                  <strong>제1조 (회원탈퇴의 효과)</strong><br />
                  회원탈퇴 시 회원님의 모든 개인정보는 즉시 삭제되며, 복구할 수 없습니다.
                </p>
                <p style={{ margin: '0.5rem 0' }}>
                  <strong>제2조 (기부 내역)</strong><br />
                  회원탈퇴 시 진행 중인 기부 내역은 모두 취소되며, 완료된 기부 내역은 삭제됩니다.
                </p>
                <p style={{ margin: '0.5rem 0' }}>
                  <strong>제3조 (게시물)</strong><br />
                  회원탈퇴 시 작성한 게시물과 댓글은 모두 삭제됩니다.
                </p>
                <p style={{ margin: '0.5rem 0' }}>
                  <strong>제4조 (재가입)</strong><br />
                  탈퇴 후 동일한 이메일로 재가입이 가능하나, 이전 데이터는 복구되지 않습니다.
                </p>
                <p style={{ margin: '0.5rem 0' }}>
                  <strong>제5조 (면책)</strong><br />
                  회원탈퇴로 인해 발생하는 모든 불이익에 대해 RE:WEAR는 책임을 지지 않습니다.
                </p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={withdrawAgreed}
                  onChange={(e) => setWithdrawAgreed(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span>위 약관을 읽었으며, 회원탈퇴에 동의합니다.</span>
              </label>
            </div>

            {/* 이메일 인증 */}
            {withdrawAgreed && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontWeight: '600' }}>
                  이메일 인증
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                  회원탈퇴를 위해 등록된 이메일({form.email})로 인증코드를 발송합니다.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <button
                    type="button"
                    className="btn primary"
                    onClick={handleSendWithdrawVerification}
                    disabled={withdrawVerification.isSending || withdrawVerification.isVerified}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {withdrawVerification.isSending ? '전송 중...' : '인증코드 전송'}
                  </button>
                </div>
                {(withdrawVerification.message && withdrawVerification.message.includes('발송')) || withdrawVerification.code ? (
                  <label style={{ display: 'block', marginTop: '1rem' }}>
                    인증코드
                    <input
                      type="text"
                      value={withdrawVerification.code}
                      onChange={(e) => setWithdrawVerification(prev => ({ 
                        ...prev, 
                        code: e.target.value.replace(/\D/g, '').slice(0, 6)
                        // message는 유지 (입력 필드가 사라지지 않도록)
                      }))}
                      placeholder="인증코드 6자리 입력"
                      maxLength={6}
                      disabled={withdrawVerification.isVerified}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        marginTop: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '1rem'
                      }}
                    />
                  </label>
                ) : null}
                {withdrawVerification.code && withdrawVerification.code.length === 6 && !withdrawVerification.isVerified && (
                  <button
                    type="button"
                    className="btn primary"
                    onClick={handleVerifyWithdrawCode}
                    style={{ marginTop: '0.5rem', width: '100%' }}
                  >
                    인증코드 확인
                  </button>
                )}
                {withdrawVerification.message && (
                  <p className={`helper ${withdrawVerification.isVerified ? '' : 'danger'}`} style={{ marginTop: '0.5rem' }}>
                    {withdrawVerification.message}
                  </p>
                )}
              </div>
            )}

            {/* 버튼 */}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn ghost"
                onClick={handleCloseWithdrawModal}
              >
                취소
              </button>
              <button
                type="button"
                className="danger"
                onClick={handleWithdrawSubmit}
                disabled={!withdrawAgreed || !withdrawVerification.isVerified}
                style={{
                  borderColor: '#f26363',
                  color: '#f26363',
                  background: '#fff5f5',
                  border: '1px solid #f26363',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '10px',
                  fontWeight: '600',
                  opacity: (!withdrawAgreed || !withdrawVerification.isVerified) ? 0.5 : 1,
                  cursor: (!withdrawAgreed || !withdrawVerification.isVerified) ? 'not-allowed' : 'pointer'
                }}
              >
                회원 탈퇴
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

