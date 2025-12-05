import { useEffect, useMemo, useRef, useState } from 'react'
import Logo from '../components/Logo'

const CODE_LENGTH = 6

export default function VerificationPage({
  context,
  onResend = () => {},
  onComplete = () => {},
  onNavigateHome = () => {},
  onVerifySuccess = null
}) {
  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(''))
  const [status, setStatus] = useState('pending') // pending | success | error
  const [message, setMessage] = useState('')
  const [timeLeft, setTimeLeft] = useState(600) // 10분 = 600초
  const [foundUsername, setFoundUsername] = useState(null) // 아이디 찾기 성공 시 아이디 저장
  const inputsRef = useRef([])

  useEffect(() => {
    if (!context) {
      onNavigateHome()
    } else {
      setDigits(Array(CODE_LENGTH).fill(''))
      setStatus('pending')
      setMessage('')
      setTimeLeft(600) // 10분으로 리셋
      setFoundUsername(null) // 아이디 초기화
      requestAnimationFrame(() => inputsRef.current[0]?.focus())
    }
  }, [context, onNavigateHome])

  // 타이머 효과
  useEffect(() => {
    if (!context || status === 'success') return
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [context, status])

  const handleChange = (index, value) => {
    // 숫자만 허용하고 한 자리만
    const sanitized = value.replace(/[^0-9]/g, '').slice(-1) // 마지막 문자만 가져오기
    setDigits(prev => {
      const next = [...prev]
      next[index] = sanitized
      return next
    })
    // 다음 필드로 자동 이동
    if (sanitized && index < CODE_LENGTH - 1) {
      setTimeout(() => {
        inputsRef.current[index + 1]?.focus()
      }, 0)
    }
  }

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // 현재 필드가 비어있으면 이전 필드로 이동
        inputsRef.current[index - 1]?.focus()
      } else {
        // 현재 필드에 값이 있으면 현재 필드 비우기
        setDigits(prev => {
          const next = [...prev]
          next[index] = ''
          return next
        })
      }
    } else if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault()
      inputsRef.current[index - 1]?.focus()
    } else if (event.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
      event.preventDefault()
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handleSubmit = async event => {
    event.preventDefault()
    if (!context) return
    const value = digits.join('')
    if (value.length !== CODE_LENGTH) {
      setMessage('인증 코드를 모두 입력해주세요.')
      setStatus('error')
      return
    }

    try {
      let response
      if (context.type === 'id') {
        // 아이디 찾기 인증
        response = await fetch('/api/users/find-id/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            name: context.name,
            email: context.email,
            code: value,
          }),
        })
      } else if (context.type === 'password') {
        // 비밀번호 찾기 인증 (인증 코드만 확인)
        response = await fetch('/api/auth/verify-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            email: context.email,
            code: value,
          }),
        })
      } else {
        // 기존 방식 (회원가입 등)
        response = await fetch('/api/auth/verify-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            email: context.email || context.account?.email,
            code: value,
          }),
        })
      }

      const data = await response.json()

      if (data.ok === true) {
        setStatus('success')
        setMessage('인증 성공')
        
        // 아이디 찾기인 경우 아이디를 상태에 저장
        if (context.type === 'id' && data.username) {
          setFoundUsername(data.username)
          if (onVerifySuccess) {
            onVerifySuccess({ ...context, username: data.username })
          }
        } else if (context.type === 'password') {
          // 비밀번호 찾기인 경우 인증 코드를 context에 저장
          if (onVerifySuccess) {
            onVerifySuccess({ ...context, code: value })
          }
        } else if (onVerifySuccess) {
          onVerifySuccess(context)
        }
      } else {
        setStatus('error')
        setMessage(data.message || '잘못된 인증번호입니다.')
      }
    } catch (error) {
      console.error('Verification error:', error)
      setStatus('error')
      setMessage('인증 중 오류가 발생했습니다.')
    }
  }

  const borderClass = useMemo(() => {
    if (status === 'success') return 'success'
    if (status === 'error') return 'error'
    return ''
  }, [status])

  return (
    <div className="recovery-page">
      <div className="recovery-card verification">
        <button type="button" className="recovery-logo" onClick={() => onNavigateHome()}>
          <Logo size="md" />
        </button>
        <h1>Verification</h1>
        <p className="recovery-desc">
          Enter your 6 digits code that you received on your email.
        </p>

        <form className="verification-form" onSubmit={handleSubmit}>
          <div className={`verification-grid ${borderClass}`}>
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={el => (inputsRef.current[index] = el)}
                className="verification-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={digit}
                onChange={event => handleChange(index, event.target.value)}
                onKeyDown={event => handleKeyDown(index, event)}
                onPaste={event => {
                  event.preventDefault()
                  const pasted = event.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, CODE_LENGTH)
                  if (pasted.length > 0) {
                    const newDigits = Array(CODE_LENGTH).fill('')
                    pasted.split('').forEach((char, i) => {
                      if (i < CODE_LENGTH) newDigits[i] = char
                    })
                    setDigits(newDigits)
                    const nextIndex = Math.min(pasted.length, CODE_LENGTH - 1)
                    setTimeout(() => {
                      inputsRef.current[nextIndex]?.focus()
                    }, 0)
                  }
                }}
                onFocus={event => {
                  // 포커스 시 전체 선택 (한 번에 교체 가능)
                  event.target.select()
                }}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                maxLength={1}
                disabled={status === 'success' || timeLeft === 0}
              />
            ))}
          </div>
          <p className={`verification-timer ${status === 'error' ? 'error' : ''} ${timeLeft === 0 ? 'expired' : ''}`}>
            {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
          </p>
          <p className="verification-message">{message}</p>
          <button type="submit" className="submit-button">
            CONTINUE
          </button>
          <p className="verification-resend">
            If you didn’t receive a code!{' '}
            <button
              type="button"
              className="link-button"
              onClick={() => {
                onResend()
                setDigits(Array(CODE_LENGTH).fill(''))
                setStatus('pending')
                setMessage('인증 코드가 재전송되었습니다.')
                inputsRef.current[0]?.focus()
              }}
            >
              Resend
            </button>
          </p>
        </form>

        {status === 'success' && (
          <SuccessModal 
            context={context} 
            foundUsername={foundUsername}
            onComplete={onComplete}
            onResetPassword={context?.type === 'password' ? onVerifySuccess : null}
          />
        )}
      </div>
    </div>
  )
}

function SuccessModal({ context, foundUsername, onComplete, onResetPassword }) {
  if (context?.type === 'id') {
    // 아이디 찾기 성공
    return (
      <div className="modal-overlay">
        <div className="modal-card">
          <div className="modal-icon">✓</div>
          <h2>아이디 찾기 성공</h2>
          <p>아이디: {foundUsername || context.username || '알 수 없음'}</p>
          <button type="button" className="submit-button" onClick={onComplete}>
            로그인하기
          </button>
        </div>
      </div>
    )
  } else if (context?.type === 'password') {
    // 비밀번호 찾기 성공 - 비밀번호 재설정 화면으로 이동
    if (onResetPassword) {
      onResetPassword(context)
    }
    return null
  } else {
    // 기존 방식 (회원가입 등)
    return (
      <div className="modal-overlay">
        <div className="modal-card">
          <div className="modal-icon">✓</div>
          <h2>Successfully</h2>
          {context?.account && (
            <>
              <p>ID : {context.account.username}</p>
              {context.account.password && <p>PW : {context.account.password}</p>}
            </>
          )}
          <button type="button" className="submit-button" onClick={onComplete}>
            메인으로
          </button>
        </div>
      </div>
    )
  }
}

