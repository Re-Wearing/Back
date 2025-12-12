import { useState } from 'react'
import Logo from '../components/Logo'

const EyeIcon = ({ crossed = false }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 5C6 5 1.73 9.11.05 12c1.68 2.89 5.95 7 11.95 7s10.27-4.11 11.95-7C22.27 9.11 18 5 12 5Zm0 12a5 5 0 1 1 5-5 5 5 0 0 1-5 5Z" />
    {crossed ? <path d="m3 4.27 16.73 16.73L18 22.73 1.27 6Z" /> : null}
  </svg>
)

export default function ResetPasswordPage({
  onNavigateHome = () => {},
  onSubmit = () => ({ success: false }),
  onBackToLogin = () => {},
  context = null
}) {
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' })
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false)
  const [message, setMessage] = useState('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const handleChange = event => {
    const { name, value } = event.target
    setForm(prev => ({ ...prev, [name]: value }))
    setMessage('') // 입력 시 메시지 초기화
  }

  const handleSubmit = async event => {
    event.preventDefault()
    setMessage('')

    // 유효성 검사
    if (!form.newPassword || form.newPassword.trim().length < 5) {
      setMessage('비밀번호는 최소 5자 이상이어야 합니다.')
      return
    }

    if (form.newPassword !== form.confirmPassword) {
      setMessage('비밀번호가 일치하지 않습니다.')
      return
    }

    if (!context || !context.username || !context.email) {
      setMessage('세션 정보가 만료되었습니다. 다시 시도해주세요.')
      return
    }

    const result = await onSubmit({
      username: context.username,
      email: context.email,
      newPassword: form.newPassword.trim()
    })

    if (result.success) {
      // 성공 모달 표시
      setShowSuccessModal(true)
    } else {
      setMessage(result.message || '비밀번호 재설정에 실패했습니다.')
    }
  }

  return (
    <div className="recovery-page">
      <div className="recovery-card">
        <button type="button" className="recovery-logo" onClick={() => onNavigateHome()}>
          <Logo size="md" />
        </button>
        <h1>비밀번호 재설정</h1>
        <p className="recovery-desc">
          새로운 비밀번호를 입력해주세요.
        </p>

        <form className="recovery-form" onSubmit={handleSubmit}>
          <label className="form-field" htmlFor="reset-new-password">
            <span>새 비밀번호</span>
            <div className="password-field">
              <input
                id="reset-new-password"
                name="newPassword"
                type={passwordVisible ? 'text' : 'password'}
                placeholder="새 비밀번호를 입력하세요 (최소 5자)"
                value={form.newPassword}
                onChange={handleChange}
                required
                minLength={5}
              />
              <button
                type="button"
                className={`password-eye ${passwordVisible ? 'active' : ''}`}
                onClick={() => setPasswordVisible(prev => !prev)}
                aria-label={passwordVisible ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                <EyeIcon crossed={passwordVisible} />
              </button>
            </div>
          </label>

          <label className="form-field" htmlFor="reset-confirm-password">
            <span>비밀번호 확인</span>
            <div className="password-field">
              <input
                id="reset-confirm-password"
                name="confirmPassword"
                type={confirmPasswordVisible ? 'text' : 'password'}
                placeholder="비밀번호를 다시 입력하세요"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                minLength={5}
              />
              <button
                type="button"
                className={`password-eye ${confirmPasswordVisible ? 'active' : ''}`}
                onClick={() => setConfirmPasswordVisible(prev => !prev)}
                aria-label={confirmPasswordVisible ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                <EyeIcon crossed={confirmPasswordVisible} />
              </button>
            </div>
          </label>

          {message ? (
            <p className={`recovery-error ${message.includes('성공') ? 'success' : ''}`}>
              {message}
            </p>
          ) : (
            <span aria-hidden="true" />
          )}

          <button type="submit" className="submit-button">
            비밀번호 변경
          </button>
          <button type="button" className="link-button recovery-back" onClick={onBackToLogin}>
            로그인으로 돌아가기
          </button>
        </form>
      </div>

      {showSuccessModal && (
        <SuccessModal
          onClose={() => {
            setShowSuccessModal(false)
            onBackToLogin()
          }}
        />
      )}
    </div>
  )
}

function SuccessModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-icon">✓</div>
        <h2>비밀번호 재설정 완료</h2>
        <p>비밀번호가 성공적으로 변경되었습니다.</p>
        <button 
          type="button" 
          className="submit-button" 
          onClick={onClose}
          style={{ width: '100%', marginTop: '16px' }}
        >
          로그인하기
        </button>
      </div>
    </div>
  )
}

