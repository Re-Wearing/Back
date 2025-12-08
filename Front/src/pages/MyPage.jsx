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
  const [withdrawInput, setWithdrawInput] = useState('')
  const [withdrawMessage, setWithdrawMessage] = useState('')

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
  const withdrawToken = `${displayNickname}/탈퇴한다.`

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

  const handleWithdrawSubmit = () => {
    if (withdrawInput !== withdrawToken) {
      setWithdrawMessage(`"${withdrawToken}" 문구를 정확히 입력해주세요.`)
      return
    }
    const result = onWithdraw()
    setWithdrawMessage(result.message || (result.success ? '회원 탈퇴가 완료되었습니다.' : '실패했습니다.'))
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
            <button type="button" className="danger" onClick={handleWithdrawSubmit}>
              회원탈퇴
            </button>
          </div>
          <div className="mypage-withdraw-info">
            <p>회원탈퇴를 진행하려면 아래 문구를 입력해주세요.</p>
            <code>{withdrawToken}</code>
            <input
              type="text"
              value={withdrawInput}
              onChange={event => setWithdrawInput(event.target.value)}
              placeholder="확인 문구 입력"
            />
            {withdrawMessage ? <p className="helper danger">{withdrawMessage}</p> : null}
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
    </div>
  )
}

