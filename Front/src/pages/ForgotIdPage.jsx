import { useState } from 'react'
import Logo from '../components/Logo'

export default function ForgotIdPage({
  onNavigateHome = () => {},
  onSubmit = () => ({ success: false }),
  onBackToLogin = () => {}
}) {
  const [form, setForm] = useState({ name: '', email: '' })
  const [message, setMessage] = useState('')

  const handleChange = event => {
    const { name, value } = event.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async event => {
    event.preventDefault()
    setMessage('') // 이전 메시지 초기화
    const result = await onSubmit(form)
    if (!result.success) {
      setMessage(result.message || '정보가 일치하지 않습니다.')
    }
  }

  return (
    <div className="recovery-page">
      <div className="recovery-card">
        <button type="button" className="recovery-logo" onClick={() => onNavigateHome()}>
          <Logo size="md" />
        </button>
        <h1>Forgot ID</h1>
        <p className="recovery-desc">
          Enter your email for the verification process, we will send 6 digits code to your email.
        </p>

        <form className="recovery-form" onSubmit={handleSubmit}>
          <label className="form-field" htmlFor="forget-name">
            <span>이름</span>
            <input
              id="forget-name"
              name="name"
              type="text"
              placeholder="홍길동"
              value={form.name}
              onChange={handleChange}
              required
            />
          </label>

          <label className="form-field" htmlFor="forget-id-email">
            <span>E-mail</span>
            <input
              id="forget-id-email"
              name="email"
              type="email"
              placeholder="example@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </label>

          {message ? <p className="recovery-error">{message}</p> : <span aria-hidden="true" />}

          <button type="submit" className="submit-button">
            CONTINUE
          </button>
          <button type="button" className="link-button recovery-back" onClick={onBackToLogin}>
            로그인으로 돌아가기
          </button>
        </form>
      </div>
    </div>
  )
}

