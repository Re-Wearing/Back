import Logo from './Logo'
import { mainNavLinks, getNavLinksForRole } from '../constants/landingData'

export default function HeaderLanding({
  navLinks,
  role,
  onLogin = () => {},
  onMenu = () => {},
  onNotifications = () => {},
  onLogoClick = null,
  onNavClick,
  isLoggedIn = false,
  onLogout = () => {},
  unreadCount = 0
}) {
  const logo = <Logo size="md" className="header_logo" />

  const handleNavClick = (event, link) => {
    event.preventDefault()
    if (onNavClick) {
      onNavClick(link)
    }
  }

  const resolvedNavLinks =
    (navLinks && navLinks.length ? navLinks : getNavLinksForRole(role)) || mainNavLinks

  return (
    <header className="header_landing">
      {onLogoClick ? (
        <button type="button" className="header_logo-button" onClick={() => onLogoClick()}>
          {logo}
        </button>
      ) : (
        logo
      )}

      {resolvedNavLinks.length > 0 && (
        <nav className="header_nav">
          {resolvedNavLinks.map(link => (
            <a key={link.href} href={link.href} onClick={event => handleNavClick(event, link)}>
              {link.label}
            </a>
          ))}
        </nav>
      )}

      <div className="header_actions">
        <button type="button" className="header_icon bell" aria-label="알림" onClick={onNotifications}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 21a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 21Zm8-5h-1V10a7 7 0 0 0-6-6.92V2a1 1 0 0 0-2 0v1.08A7 7 0 0 0 5 10v6H4a1 1 0 0 0 0 2h16a1 1 0 1 0 0-2Z" />
          </svg>
          {unreadCount > 0 ? <span className="header_badge">{unreadCount}</span> : null}
        </button>

        <button
          type="button"
          className="header_login"
          onClick={isLoggedIn ? onLogout : onLogin}
        >
          {isLoggedIn ? '로그아웃' : '로그인'}
        </button>

        <button type="button" className="header_icon menu" aria-label="메뉴 열기" onClick={onMenu}>
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  )
}

