const getMenuCategories = role => {
  if (role === '관리자 회원') {
    return [
      {
        title: '승인 관리',
        items: [
          { label: '기관 계정 승인', href: '/admin/organization-approval' },
          { label: '기부 승인 대기', href: '/admin/donation-approval' }
        ]
      },
      {
        title: '회원 관리',
        items: [
          { label: '회원 목록', href: '/admin/manage' }
        ]
      },
      {
        title: 'FAQ',
        items: [
          { label: 'FAQ 관리', href: '/admin/faq' }
        ]
      },
      {
        title: '기부 관리',
        items: [
          { label: '매칭된 기부 관리', href: '/admin/matched-donations' },
          { label: '배송 관리', href: '/admin/delivery' }
        ]
      }
    ]
  }
  
  if (role === '기관 회원') {
    return [
      {
        title: '기부 관리',
        items: [
          { label: '내 기부 관리', href: '/donation-status' }
        ]
      },
      {
        title: '게시판',
        items: [
          { label: '게시판', href: '#board' }
        ]
      },
      {
        title: '마이페이지',
        items: [
          { label: '마이페이지', href: '#mypage' }
        ]
      },
      {
        title: 'FAQ',
        items: [
          { label: 'FAQ', href: '/faq', action: 'FaqPage' },
          { label: '문의하기', href: '/inquiry', action: 'InquiryPage' }
        ]
      }
    ]
  }
  
  return [
    {
      title: '기부하기',
      items: [
        { label: '기부하기', href: '#donation' },
        { label: '배송 조회', href: '#delivery-check' }
      ]
    },
    {
      title: '게시판',
      items: [
        { label: '게시판', href: '#board' }
      ]
    },
    {
      title: '마이페이지',
      items: [
        { label: '마이페이지', href: '#mypage' },
        { label: '내 기부 관리', href: '/donation-status' }
      ]
    },
    {
      title: 'FAQ',
      items: [
        { label: 'FAQ', href: '/faq', action: 'FaqPage' },
        { label: '문의하기', href: '/inquiry', action: 'InquiryPage' }
      ]
    }
  ]
}

export default function CategoryMenu({ isOpen, onClose, onNavClick, role }) {
  if (!isOpen) return null

  const menuCategories = getMenuCategories(role)

  const handleNavClick = (event, item) => {
    event.preventDefault()
    if (onNavClick) {
      onNavClick({ href: item.href, label: item.label })
    }
    onClose()
  }

  return (
    <>
      <div className="category-menu-overlay" onClick={onClose} />
      <div className="category-menu">
        <div className="category-menu-header">
          <h3>메뉴</h3>
          <button type="button" className="category-menu-close" onClick={onClose} aria-label="메뉴 닫기">
            ×
          </button>
        </div>
        <div className={`category-menu-content ${role === '관리자 회원' ? 'admin-menu' : ''}`}>
          {menuCategories.map((category, index) => (
            <div key={index} className="category-menu-column">
              <h4 className="category-menu-column-title">{category.title}</h4>
              <nav className="category-menu-column-nav">
                {category.items.map((item, itemIndex) => (
                  <a
                    key={itemIndex}
                    href={item.href}
                    className="category-menu-item"
                    onClick={event => handleNavClick(event, item)}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

