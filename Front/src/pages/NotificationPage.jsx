import Logo from '../components/Logo'

const ICONS = {
  alert: '⚠️',
  reward: '🎁',
  truck: '🚚',
  info: 'ℹ️',
  question: '❓'
}

export default function NotificationPage({
  notifications = [],
  onDelete = () => {},
  onMarkRead = () => {},
  onNavigate = () => {},
  onClose = () => {}
}) {
  return (
    <div className="notification-page">
      <div className="notification-card">
        <header className="notification-header">
          <Logo size="sm" />
          <button type="button" aria-label="close" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="notification-body">
          <h1>알림</h1>
          <ul className="notification-list">
            {notifications.length === 0 ? (
              <li className="notification-empty">새로운 알림이 없습니다.</li>
            ) : (
              notifications.map(item => (
                <NotificationRow
                  key={item.id}
                  item={item}
                  onDelete={() => onDelete(item.id)}
                  onMarkRead={() => onMarkRead(item.id)}
                  onNavigate={() => onNavigate(item)}
                />
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}

function NotificationRow({ item, onDelete, onMarkRead, onNavigate }) {
  const icon = ICONS[item.type] || '🔔'
  const isUnread = !item.read
  const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  const handleRowClick = () => {
    if (isUnread) {
      onMarkRead()
    }
    if (item.target) {
      onNavigate()
    }
  }

  return (
    <li className={`notification-item ${isUnread ? 'unread' : ''}`} onClick={handleRowClick}>
      <div className="notification-icon">{icon}</div>
      <div className="notification-content">
        <p className="notification-title">{item.title}</p>
        {item.description && <p className="notification-description">{item.description}</p>}
        <span className="notification-date">{formattedDate}</span>
      </div>
      <button
        type="button"
        className="notification-delete"
        aria-label="delete"
        onClick={event => {
          event.stopPropagation()
          onDelete()
        }}
      >
        ×
      </button>
    </li>
  )
}

