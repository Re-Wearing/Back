import logoSrc from '../assets/rewear-logo.png'

export default function Logo({ showText = false, tagline = '', size = 'md', className = '' }) {
  return (
    <div className={`logo-mark ${size} ${showText ? 'with-text' : ''} ${className}`.trim()}>
      <img src={logoSrc} alt="RE:WEAR 로고" />
      {showText && (
        <div className="logo-text">
          <strong>RE:WEAR</strong>
          {tagline ? <span>{tagline}</span> : null}
        </div>
      )}
    </div>
  )
}

