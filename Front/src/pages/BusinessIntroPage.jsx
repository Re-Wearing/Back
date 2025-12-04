import HeaderLanding from "../components/HeaderLanding"
import { getNavLinksForRole } from "../constants/landingData"
import "../styles/business-intro.css"

export default function BusinessIntroPage({
  onNavigateHome,
  onNavLink,
  onLogin = () => {},
  isLoggedIn,
  onLogout,
  onNotifications,
  unreadCount,
  onMenu = () => {},
  currentUser = null
}) {
  const navLinks = getNavLinksForRole(currentUser?.role)

  return (
    <section className="main-page business-page">
      <div className="main-shell">

        <HeaderLanding
          navLinks={navLinks}
          role={currentUser?.role}
          onLogoClick={onNavigateHome}
          onNavClick={onNavLink}
          onLogin={onLogin}
          isLoggedIn={isLoggedIn}
          onLogout={onLogout}
          onNotifications={onNotifications}
          unreadCount={unreadCount}
          onMenu={onMenu}
        />

        {/* Hero Section */}
        <div className="hero-section business-hero">
          <div className="hero-content">
            <h2>RE:WEAR</h2>
            <p className="hero-lead">
              버려지는 옷에 새로운 가치를 더하는 웹 기반 의류 기부 플랫폼
            </p>
            <p className="hero-sub">
            우리는 계절이 바뀌고 유행이 지나면서 더 이상 입지 않는 옷들을 쉽게 옷장 속에 방치하거나 버리곤 합니다. 하지만 이 옷들은 누군가에게는 꼭 필요한 ‘생활 필수품’이 될 수 있습니다.
            RE:WEAR는 이렇게 남겨진 옷들의 가치를 다시 연결하기 위해 만들어진 웹 기반 의류 기부 플랫폼입니다.
            </p>
          </div>

          <div className="hero-visual">
            <div className="visual-photo business-photo" />
          </div>
        </div>

        {/* Mission Panel */}
        <div className="mission-panel business-mission">
          <h3>우리의 목표</h3>
          <p>
            계절 변화와 유행으로 방치되는 옷들의 문제를 해결하고, 그 가치가 다시 필요한 사람들에게 
            도달하도록 돕습니다. RE:WEAR는 누구나 손쉽게 기부에 참여하도록 설계된 플랫폼입니다.
          </p>
        </div>

        {/* Problem Grid */}
        <div className="value-grid">
          <article>
            <h4>버려지는 의류 증가</h4>
            <p>사용 가능한 옷이 계절이나 유행 때문에 버려지고 있습니다.</p>
          </article>
          <article>
            <h4>복잡한 기부 과정</h4>
            <p>기부 절차가 번거롭고 정보가 흩어져 있습니다.</p>
          </article>
          <article>
            <h4>기부자-기관 단절문제</h4>
            <p>필요한 기관과 연결되지 못해 기부가 낭비되는 경우가 있습니다.</p>
          </article>
          <article>
            <h4>불투명한 기부 흐름</h4>
            <p>기부가 어디로 어떻게 전달되는지 확인이 어려웠습니다.</p>
          </article>
        </div>

        {/* Solution / Process Section */}
        <div className="process-section">
          <div className="section-header">
            <h3>RE:WEAR가 해결합니다</h3>
          </div>

          <ul className="process-list">
            <li>
              <h4>간편한 기부 신청</h4>
              <p>누구나 쉽게 기부 신청을 할 수 있도록 직관적인 서비스 제공</p>
            </li>
            <li>
              <h4>맞춤형 매칭</h4>
              <p>기관의 필요 정보를 기반으로 자동/수동 매칭 지원</p>
            </li>
            <li>
              <h4>투명한 배송 조회</h4>
              <p>기부 물품의 이동 과정을 실시간으로 확인 가능</p>
            </li>
            <li>
              <h4>기관 요청 반영</h4>
              <p>기관별 필요한 품목을 등록하고 기부자가 쉽게 확인 가능</p>
            </li>
          </ul>
        </div>

        <div className="cta-panel">
          <h3>옷의 가치를 다시 연결하는 경험을 시작해보세요</h3>
        </div>

      </div>
    </section>
  )
}
