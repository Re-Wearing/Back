import { useEffect, useState } from 'react'
import HeaderLanding from '../components/HeaderLanding'
import { getNavLinksForRole } from '../constants/landingData'

export default function ExperienceLanding({
  onLogin = () => {},
  onSignup = () => {},
  onNavLink,
  isLoggedIn = false,
  onLogout = () => {},
  onNotifications = () => {},
  unreadCount = 0,
  onMenu = () => {},
  currentUser = null
}) {
  const [localUser, setLocalUser] = useState(currentUser)
  
  // 컴포넌트 마운트 시 로그인 상태 확인 및 사용자 정보 가져오기
  useEffect(() => {
    const fetchUser = async () => {
      // sessionStorage에 사용자 정보가 있으면 백엔드에서 최신 정보 가져오기
      if (typeof window !== 'undefined' && window.sessionStorage.getItem('rewearUser')) {
        try {
          const response = await fetch('/api/users/me', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          })
          
          if (response.ok) {
            const data = await response.json()
            if (data.ok === true && data.user) {
              setLocalUser({
                username: data.user.username,
                name: data.user.name,
                email: data.user.email,
                phone: data.user.phone || '',
                address: data.user.address || '',
                role: data.user.role,
                id: data.user.id,
              })
            }
          }
        } catch (error) {
          console.error('Failed to fetch user info:', error)
        }
      } else {
        // currentUser prop이 있으면 사용
        setLocalUser(currentUser)
      }
    }
    
    fetchUser()
  }, [currentUser])
  
  const navLinks = getNavLinksForRole(localUser?.role)
  
  return (
    <section className="main-page experience-page soft-hero">
      <div className="main-shell">
        <HeaderLanding
          navLinks={navLinks}
          role={localUser?.role}
          onLogin={onLogin}
          onNavClick={onNavLink}
          isLoggedIn={Boolean(localUser) || isLoggedIn}
          onLogout={onLogout}
          onNotifications={onNotifications}
          unreadCount={unreadCount}
          onMenu={onMenu}
        />

        <section className="warm-hero">
          <div className="hero-panel">
            <div className="hero-illustration" aria-hidden="true">
              <img
                src="https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=1100&q=80"
                alt="따뜻한 옷 나눔"
              />
            </div>
            <div className="hero-info">
              <p className="hero-eyebrow">지금 이 순간에도</p>
              <h1>
                RE:WEAR를 통해
                <br />
                따뜻한 옷이 전달되고 있어요.
              </h1>
              <ul className="impact-list">
                <li>
                  <span>👕</span>
                  <div>
                    <strong>000벌</strong>
                    <p>지금까지 기부된 옷</p>
                  </div>
                </li>
                <li>
                  <span>🏫</span>
                  <div>
                    <strong>00곳</strong>
                    <p>함께하는 기관</p>
                  </div>
                </li>
                <li>
                  <span>🧑‍🤝‍🧑</span>
                  <div>
                    <strong>00명</strong>
                    <p>누적 참여자</p>
                  </div>
                </li>
              </ul>
              <div className="hero-cta">
                <button className="hero-btn light" onClick={() => onNavLink?.({ href: '/donation-status' })}>
                  나의 기부 현황 조회
                </button>
                <button className="hero-btn dark" onClick={onSignup}>
                  지금 바로 기부하기 📦
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="journey-section soft">
          <div className="section-header">
            <p className="eyebrow">Journey</p>
            <h3>옷이 도착하기까지의 짧은 여정</h3>
          </div>
          <div className="journey-cards">
            <article>
              <span>01</span>
              <h4>문 앞에서 수거</h4>
              <p>앱에서 신청하면 가장 가까운 파트너가 직접 방문합니다.</p>
            </article>
            <article>
              <span>02</span>
              <h4>정성스러운 검수</h4>
              <p>세탁과 분류를 거쳐 꼭 필요한 상태로 다시 준비됩니다.</p>
            </article>
            <article>
              <span>03</span>
              <h4>기관 연결</h4>
              <p>필요한 곳에 맞춰 자동 매칭되고 이동을 추적합니다.</p>
            </article>
          </div>
        </section>

        <section className="story-panel">
          <div className="story-text">
            <p className="hero-eyebrow">함께 바뀌는 일상</p>
            <h2>“아이들이 받은 패딩을 입고 바로 운동장으로 나갔어요.”</h2>
            <p>
              RE:WEAR는 기부자가 떠나보낸 옷과 기관이 꼭 필요로 하는 물품을 더 빠르게 연결합니다.
              기부자는 앱에서 진행 현황을 확인하고, 기관은 필요한 때 필요한 만큼만 받습니다.
            </p>
          </div>
          <div className="story-visual" aria-hidden="true">
            <img
              src="https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=80"
              alt="감사 이야기"
            />
          </div>
        </section>

        <section className="cta-split cozy">
          <div>
            <p className="eyebrow">지금 바로</p>
            <h3>함께하면, 옷의 다음 주인이 조금 더 빨리 웃습니다.</h3>
          </div>
          <div className="cta-actions">
            <button className="btn primary" onClick={onSignup}>
              기부 이야기 시작하기
            </button>
            <button className="btn secondary" onClick={() => onNavLink?.({ href: '/donation-status' })}>
              내 기록 살펴보기
            </button>
          </div>
        </section>

        <footer className="landing-footer">
          <p>© {new Date().getFullYear()} RE:WEAR · 따뜻함이 이어지는 곳</p>
        </footer>
      </div>
    </section>
  )
}

