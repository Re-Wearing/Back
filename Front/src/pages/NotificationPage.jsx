import { useState, useEffect } from 'react'
import Logo from '../components/Logo'

const ICONS = {
  alert: '⚠️',
  reward: '🎁',
  truck: '🚚',
  info: 'ℹ️',
  question: '❓'
}

export default function NotificationPage({
  onNavigate = () => {},
  onClose = () => {},
  onUnreadCountChange = () => {}
}) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 알림 목록 조회
  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/notifications', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      if (!response.ok) {
        if (response.status === 401) {
          // 로그인되지 않은 경우
          setNotifications([])
          return
        }
        throw new Error('알림 목록을 불러오는데 실패했습니다.')
      }

      const data = await response.json()
      const notificationList = (data.notifications || []).map(notif => ({
        id: notif.id,
        title: notif.title,
        description: notif.description,
        read: notif.read,
        date: notif.date,
        type: notif.type || 'info',
        relatedId: notif.relatedId,
        relatedType: notif.relatedType
      }))

      setNotifications(notificationList)
      
      // 읽지 않은 알림 개수 변경 콜백 호출
      if (onUnreadCountChange && data.unreadCount !== undefined) {
        onUnreadCountChange(data.unreadCount)
      }
    } catch (err) {
      console.error('알림 목록 조회 실패:', err)
      setError(err.message)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  // 개별 알림 읽음 처리
  const handleMarkRead = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('알림 읽음 처리에 실패했습니다.')
      }

      const data = await response.json()
      
      // 알림 목록 업데이트
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      )

      // 읽지 않은 알림 개수 변경 콜백 호출
      if (onUnreadCountChange && data.unreadCount !== undefined) {
        onUnreadCountChange(data.unreadCount)
      }
    } catch (err) {
      console.error('알림 읽음 처리 실패:', err)
      alert('알림 읽음 처리에 실패했습니다.')
    }
  }

  // 전체 알림 읽음 처리
  const handleMarkAllRead = async () => {
    if (!window.confirm('모든 알림을 읽음 처리하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('전체 알림 읽음 처리에 실패했습니다.')
      }

      const data = await response.json()
      
      // 알림 목록 업데이트
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })))

      // 읽지 않은 알림 개수 변경 콜백 호출
      if (onUnreadCountChange && data.unreadCount !== undefined) {
        onUnreadCountChange(data.unreadCount)
      }
    } catch (err) {
      console.error('전체 알림 읽음 처리 실패:', err)
      alert('전체 알림 읽음 처리에 실패했습니다.')
    }
  }

  // 알림 삭제 (현재는 API가 없으므로 로컬에서만 제거)
  const handleDelete = (notificationId) => {
    if (!window.confirm('이 알림을 삭제하시겠습니까?')) {
      return
    }
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
  }

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h1>알림</h1>
            {notifications.length > 0 && notifications.some(n => !n.read) && (
              <button 
                type="button" 
                onClick={handleMarkAllRead}
                style={{ 
                  padding: '0.5rem 1rem', 
                  background: 'var(--primary)', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                모두 읽음
              </button>
            )}
          </div>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>로딩 중...</div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>{error}</div>
          ) : (
            <ul className="notification-list">
              {notifications.length === 0 ? (
                <li className="notification-empty">새로운 알림이 없습니다.</li>
              ) : (
                notifications.map(item => (
                  <NotificationRow
                    key={item.id}
                    item={item}
                    onDelete={() => handleDelete(item.id)}
                    onMarkRead={() => handleMarkRead(item.id)}
                    onNavigate={() => onNavigate(item)}
                  />
                ))
              )}
            </ul>
          )}
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

