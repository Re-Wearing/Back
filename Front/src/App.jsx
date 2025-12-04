import { useEffect, useMemo, useRef, useState } from 'react'
import IntroLanding from './pages/IntroLanding'
import SignupPage from './pages/SignupPage'
import LoginPage from './pages/LoginPage'
import BoardPage from './pages/BoardPage'
import BoardWritePage from './pages/BoardWritePage'
import BoardDetailPage from './pages/BoardDetailPage'
import ExperienceLanding from './pages/ExperienceLanding'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ForgotIdPage from './pages/ForgotIdPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import VerificationPage from './pages/VerificationPage'
import NotificationPage from './pages/NotificationPage'
import MyPage from './pages/MyPage'
import AdminManagePage from './pages/AdminManagePage'
import AdminFaqPage from './pages/AdminFaqPage'
import FaqPage from './pages/FaqPage'
import InquiryPage from './pages/InquiryPage'
import InquiryAnswerPage from './pages/InquiryAnswerPage'
import DonationStatusPage from './pages/DonationStatusPage'
import OrganizationDonationStatusPage from './pages/OrganizationDonationStatusPage'
import CategoryMenu from './components/CategoryMenu'
import DeliveryCheckPage from './pages/DeliveryCheckPage'
import "./styles/delivery-check.css";
import BusinessIntroPage from './pages/BusinessIntroPage';
import './styles/business-intro.css'
import DonationPage from './pages/DonationPage'
import './styles/donation.css'
import './styles/board-write.css'
import './styles/board-detail.css'



import './styles/common.css'
import './styles/intro.css'
import './styles/signup.css'
import './styles/main.css'
import './styles/board.css'
import './styles/notification.css'
import './styles/mypage.css'
import './styles/faq.css'
import './styles/category-menu.css'
import './styles/donation-status.css'
import { ADMIN_FAQ_SEED } from './constants/adminFaqData'
import { formatPhoneNumber, stripPhoneNumber } from './utils/phone'

const INITIAL_ACCOUNTS = {
  admin: {
    password: 'admin',
    role: '관리자 회원',
    name: '리웨어 관리자',
    email: 'admin@rewear.com'
  },
  user: {
    password: 'user',
    role: '일반 회원',
    name: '권석현',
    email: 'user@rewear.com'
  },
  organ: {
    password: 'organ',
    role: '기관 회원',
    name: '임당초등학교',
    email: 'organ@rewear.com'
  },
  organ1: {
    password: 'organ1',
    role: '기관 회원',
    name: '임당중학교',
    email: 'organ1@rewear.com'
  }
}

const INITIAL_PROFILES = {
  admin: {
    fullName: '리웨어 관리자',
    nickname: 'RE:WEAR 관리자',
    phone: '010-0000-0000',
    address: '서울시 중구 한강대로 416',
    allowEmail: true,
    useAnonymousName: false
  },
  user: {
    fullName: '권석현',
    nickname: '일반회원',
    phone: '010-1234-5678',
    address: '서울시 강남구 테헤란로 231',
    allowEmail: true,
    useAnonymousName: false
  },
  organ: {
    fullName: '임당초등학교',
    nickname: '임당초등학교',
    phone: '02-9876-5432',
    address: '부산시 해운대구 바닷가로 12',
    allowEmail: false,
    useAnonymousName: false
  },
  organ1: {
    fullName: '임당중학교',
    nickname: '임당중학교',
    phone: '031-555-7890',
    address: '경기도 성남시 판교로 123',
    allowEmail: true,
    useAnonymousName: false
  }
}

const INITIAL_SHIPMENTS = [
  {
    id: '20240917-01',
    product: '양털후리스 외 2개',
    startDate: '2024/09/17',
    receiver: '임당초등학교',
    status: '배송완료',
    sender: '권석현',
    link: 'https://tracker.delivery/'
  },
  {
    id: '20240917-02',
    product: '원피스 외 3개',
    startDate: '2024/09/17',
    receiver: '임당초등학교',
    status: '배송중',
    sender: '권석현',
    link: 'https://tracker.delivery/'
  },
  {
    id: '20240917-03',
    product: '바지 외 5개',
    startDate: '2024/09/17',
    receiver: '임당초등학교',
    status: '배송대기',
    sender: '권석현',
    link: 'https://tracker.delivery/'
  },
  {
    id: '20240917-04',
    product: '운동화 세트',
    startDate: '2024/09/18',
    receiver: '임당중학교',
    status: '배송완료',
    sender: '권석현',
    link: 'https://tracker.delivery/'
  }
]

const INITIAL_DONATION_ITEMS = {
  user: [
    {
      id: 'don-20250201-01',
      referenceCode: 'REQ-20250201-01',
      date: '2025-02-01',
      registeredAt: '2025-02-01',
      name: '겨울 패딩 세트',
      category: '아우터',
      items: '겨울 패딩 세트 (L, A급)',
      organization: '자동 매칭',
      donationOrganization: null,
      donationOrganizationId: null,
      donationMethod: '자동 매칭',
      status: '매칭됨',
      matchingInfo: '임당초등학교와 매칭되었습니다.',
      matchedOrganization: '임당초등학교',
      pendingOrganization: null,
      rejectionReason: '',
      deliveryMethod: '택배 배송',
      desiredDate: '2025-02-10',
      memo: '주말 수거 희망',
      itemDescription: '따뜻한 패딩 2벌과 머플러 구성',
      contact: '010-1234-5678',
      donorName: '권석현',
      isAnonymous: false,
      donationOrganization: null,
      images: [
        {
          id: 'img-coat-1',
          url: 'https://images.unsplash.com/photo-1521335629791-ce4aec67ddaf?auto=format&fit=crop&w=640&q=80'
        }
      ]
    },
    {
      id: 'don-20250205-02',
      referenceCode: 'REQ-20250205-02',
      date: '2025-02-05',
      registeredAt: '2025-02-05',
      name: '생활용품 세트',
      category: '잡화',
      items: '생활용품 8종 세트',
      organization: '자동 매칭',
      donationOrganization: null,
      donationOrganizationId: null,
      donationMethod: '자동 매칭',
      status: '매칭대기',
      matchingInfo: '기관 매칭을 기다리는 중입니다.',
      matchedOrganization: null,
      pendingOrganization: null,
      rejectionReason: '',
      deliveryMethod: '택배 배송',
      desiredDate: '2025-02-20',
      memo: '',
      itemDescription: '주방, 욕실, 세탁 필수품 묶음입니다.',
      contact: '010-1234-5678',
      donorName: '권석현',
      isAnonymous: false,
      donationOrganization: null,
      images: [
        {
          id: 'img-life-1',
          url: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=640&q=80'
        }
      ]
    },
    {
      id: 'don-20250210-03',
      referenceCode: 'REQ-20250210-03',
      date: '2025-02-10',
      registeredAt: '2025-02-10',
      name: '운동화 세트',
      category: '신발',
      items: '운동화 세트 (260mm, A급)',
      organization: '임당초등학교',
      donationOrganization: '임당초등학교',
      donationOrganizationId: null,
      donationMethod: '자동 매칭',
      status: '매칭됨',
      matchingInfo: '임당초등학교와 매칭되었습니다.',
      matchedOrganization: '임당초등학교',
      pendingOrganization: null,
      rejectionReason: '',
      deliveryMethod: '택배 배송',
      desiredDate: '2025-02-22',
      memo: '',
      itemDescription: '새 운동화, 박스 포함',
      contact: '010-1234-5678',
      donorName: '권석현',
      isAnonymous: false,
      donationOrganization: null,
      images: [
        {
          id: 'img-shoes-1',
          url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=640&q=80'
        }
      ]
    },
    {
      id: 'don-20250212-04',
      referenceCode: 'REQ-20250212-04',
      date: '2025-02-12',
      registeredAt: '2025-02-12',
      name: '피트니스 용품',
      category: '잡화',
      items: '피트니스 용품 세트 (미사용)',
      organization: '임당중학교',
      donationOrganization: '임당중학교',
      donationOrganizationId: null,
      donationMethod: '자동 매칭',
      status: '배송대기',
      matchingInfo: '배송 준비 중입니다.',
      matchedOrganization: '임당중학교',
      pendingOrganization: null,
      rejectionReason: '',
      deliveryMethod: '택배 배송',
      desiredDate: '2025-02-25',
      memo: '',
      itemDescription: '헬스 기구 3종',
      contact: '010-1234-5678',
      donorName: '권석현',
      isAnonymous: false,
      donationOrganization: null,
      images: [
        {
          id: 'img-fit-1',
          url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=640&q=80'
        }
      ]
    },
    {
      id: 'don-20250215-05',
      referenceCode: 'REQ-20250215-05',
      date: '2025-02-15',
      registeredAt: '2025-02-15',
      name: '정장 세트',
      category: '정장',
      items: '남성 정장 세트 (M, B급)',
      organization: '자동 매칭',
      donationOrganization: null,
      donationOrganizationId: null,
      donationMethod: '자동 매칭',
      status: '거절됨',
      matchingInfo: '오염 상태 추가 확인이 필요해 거절되었습니다.',
      matchedOrganization: null,
      pendingOrganization: null,
      rejectionReason: '오염 상태 추가 확인 필요',
      deliveryMethod: '직접 배송',
      desiredDate: '2025-02-28',
      memo: '보관 중 약간의 주름 있음',
      itemDescription: '남성 정장 세트, 사용감 보통',
      contact: '010-1234-5678',
      donorName: '권석현',
      isAnonymous: false,
      donationOrganization: null,
      images: [
        {
          id: 'img-suit-1',
          url: 'https://images.unsplash.com/photo-1526925539332-aa3b66e35444?auto=format&fit=crop&w=640&q=80'
        }
      ]
    }
  ]
}

const INITIAL_PENDING_ORGANIZATIONS = [
  {
    id: 'org-req-202502-01',
    username: 'hanbit',
    organizationName: '한빛초등학교',
    contactName: '김한빛',
    email: 'contact@hanbit.edu',
    phone: '02-345-6789',
    address: '서울특별시 중구 한빛로 12',
    submittedAt: '2025-02-15',
    status: 'pending',
    memo: '경기도권 저소득층 아동 대상 프로그램 운영',
    rejectionReason: ''
  },
  {
    id: 'org-req-202502-02',
    username: 'nicole',
    organizationName: '나눔 중학교',
    contactName: '이중현',
    email: 'hello@nanum.ms.kr',
    phone: '031-123-7890',
    address: '경기도 성남시 나눔길 45',
    submittedAt: '2025-02-18',
    status: 'pending',
    memo: '청소년 체육복 지원 프로젝트 진행 예정',
    rejectionReason: ''
  }
]

const INITIAL_MATCHING_INVITES = []

const INITIAL_NOTIFICATIONS = {
  admin: [
    {
      id: 'admin-1',
      title: '시스템 점검 안내',
      type: 'info',
      date: '2025-02-10',
      read: true
    }
  ],
  user: [
    {
      id: 'user-1',
      title: '새 수거 요청이 도착했어요',
      type: 'alert',
      date: '2025-03-01',
      read: false
    },
    {
      id: 'user-2',
      title: '리워드 포인트가 적립됐어요',
      type: 'reward',
      date: '2025-02-26',
      read: false
    },
    {
      id: 'user-3',
      title: '새로운 드라이버가 배정됐어요',
      type: 'truck',
      date: '2025-02-20',
      read: false
    },
    {
      id: 'user-4',
      title: '지난주 활동 리포트',
      type: 'info',
      date: '2025-02-10',
      read: true
    }
  ],
  organ: [
    {
      id: 'organ-1',
      title: '기부 신청이 접수됐어요',
      type: 'info',
      date: '2025-01-15',
      read: true
    }
  ],
  organ1: [
    {
      id: 'organ1-1',
      title: '새로운 기부가 도착했어요',
      type: 'info',
      date: '2025-03-05',
      read: false
    }
  ]
}

const LANDING_KEY = 'rewearLandingSeen'
const ADMIN_INQUIRIES_KEY = 'rewearAdminInquiries'
const PENDING_ORGS_KEY = 'rewearPendingOrganizations'
const DONATIONS_KEY = 'rewearDonations'
const BOARD_POSTS_KEY = 'rewearBoardPosts'
const BOARD_NOTICES_KEY = 'rewearBoardNotices'

const hasSeenLanding = () => {
  if (typeof window === 'undefined') return false
  return window.sessionStorage.getItem(LANDING_KEY) === 'true'
}

const loadAdminInquiries = () => {
  if (typeof window === 'undefined') return []
  try {
    const stored = window.sessionStorage.getItem(ADMIN_INQUIRIES_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Failed to load admin inquiries:', e)
  }
  return []
}

export default function App() {
  const [showLanding, setShowLanding] = useState(() => {
    if (typeof window === 'undefined') return true
    return !hasSeenLanding()
  })
  const [activePage, setActivePage] = useState('main')
  const [currentUser, setCurrentUser] = useState(null)
  const isLoggedIn = Boolean(currentUser)
  const [currentPath, setCurrentPath] = useState('/main')
  const [recoveryContext, setRecoveryContext] = useState(null)
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)
  const [accounts, setAccounts] = useState(INITIAL_ACCOUNTS)
  const [profiles, setProfiles] = useState(INITIAL_PROFILES)
  const getUserDisplayName = username => {
    if (!username) return '익명'
    const profile = profiles[username]
    return profile?.nickname || profile?.fullName || accounts[username]?.name || username
  }
  const [shipments] = useState(() => {
    if (typeof window === 'undefined') return INITIAL_SHIPMENTS
    const stored = window.sessionStorage.getItem('rewearShipments')
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (error) {
        console.error('Failed to parse stored shipments', error)
      }
    }
    window.sessionStorage.setItem('rewearShipments', JSON.stringify(INITIAL_SHIPMENTS))
    return INITIAL_SHIPMENTS
  })
  const currentUserRef = useRef(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [adminInquiries, setAdminInquiries] = useState(ADMIN_FAQ_SEED)
  const [isBootstrapped, setIsBootstrapped] = useState(() => typeof window === 'undefined')
  const [donations, setDonations] = useState(() => {
    if (typeof window === 'undefined') return INITIAL_DONATION_ITEMS
    const stored = window.sessionStorage.getItem(DONATIONS_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (error) {
        console.error('Failed to parse stored donations', error)
      }
    }
    window.sessionStorage.setItem(DONATIONS_KEY, JSON.stringify(INITIAL_DONATION_ITEMS))
    return INITIAL_DONATION_ITEMS
  }) // username별로 기부 내역 관리
  const [pendingOrganizations, setPendingOrganizations] = useState(() => {
    if (typeof window === 'undefined') return INITIAL_PENDING_ORGANIZATIONS
    const stored = window.sessionStorage.getItem(PENDING_ORGS_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (error) {
        console.error('Failed to parse stored pending organizations', error)
      }
    }
    window.sessionStorage.setItem(PENDING_ORGS_KEY, JSON.stringify(INITIAL_PENDING_ORGANIZATIONS))
    return INITIAL_PENDING_ORGANIZATIONS
  })
  const [matchingInvites, setMatchingInvites] = useState(INITIAL_MATCHING_INVITES)

  const organizationOptions = useMemo(
    () =>
      Object.entries(accounts)
        .filter(([, acc]) => acc.role === '기관 회원')
        .map(([username, acc]) => ({
          username,
          name: profiles[username]?.fullName || profiles[username]?.nickname || acc.name || username,
          email: acc.email
        })),
    [accounts, profiles]
  )

  const allDonationItems = useMemo(
    () =>
      Object.entries(donations).flatMap(([owner, items]) =>
        (items || []).map(item => ({
          owner,
          ownerName: profiles[owner]?.fullName || accounts[owner]?.name || owner,
          ...item
        }))
      ),
    [donations, accounts, profiles]
  )

  const findOrganizationUsernameByName = name => {
    if (!name) return null
    const entry = Object.entries(accounts).find(([username, acc]) => {
      if (acc.role !== '기관 회원') return false
      const profile = profiles[username]
      return acc.name === name || profile?.fullName === name || profile?.nickname === name
    })
    return entry ? entry[0] : null
  }
  const getOrganizationUsername = identifier => {
    if (!identifier) return null
    if (accounts[identifier]?.role === '기관 회원') {
      return identifier
    }
    return findOrganizationUsernameByName(identifier)
  }
  const loadStoredBoardPosts = () => {
    if (typeof window === 'undefined') return { review: [], request: [] }
    const stored = window.sessionStorage.getItem(BOARD_POSTS_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        return {
          review: Array.isArray(parsed.review) ? parsed.review : [],
          request: Array.isArray(parsed.request) ? parsed.request : []
        }
      } catch (error) {
        console.warn('Failed to parse stored board posts', error)
      }
    }
    return { review: [], request: [] }
  }
  const loadStoredBoardNotices = () => {
    if (typeof window === 'undefined') return []
    const stored = window.sessionStorage.getItem(BOARD_NOTICES_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        return Array.isArray(parsed) ? parsed : []
      } catch (error) {
        console.warn('Failed to parse stored board notices', error)
      }
    }
    return []
  }
  const [boardPosts, setBoardPosts] = useState(loadStoredBoardPosts) // 작성된 게시글 관리
  const [boardNoticesDynamic, setBoardNoticesDynamic] = useState(loadStoredBoardNotices)
  const [boardViews, setBoardViews] = useState({}) // 게시글 조회수 관리 { 'postId': views }
  const [boardWriteType, setBoardWriteType] = useState('review')
  const [selectedBoardType, setSelectedBoardType] = useState('all')
  const [selectedPostId, setSelectedPostId] = useState(null)
  const [selectedPostType, setSelectedPostType] = useState('review')
  const [boardRefreshKey, setBoardRefreshKey] = useState(0) // 게시판 목록 새로고침용
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(BOARD_POSTS_KEY, JSON.stringify(boardPosts))
    }
  }, [boardPosts])
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(BOARD_NOTICES_KEY, JSON.stringify(boardNoticesDynamic))
    }
  }, [boardNoticesDynamic])
  const [adminPanel, setAdminPanel] = useState('members')
  const updatePath = (path, { replace = false } = {}) => {
    setCurrentPath(path)
    if (typeof window === 'undefined' || !window.history) return
    const state = { path }
    if (replace) {
      window.history.replaceState(state, '', path)
    } else {
      window.history.pushState(state, '', path)
    }
  }

  useEffect(() => {
    if (!showLanding) {
      window.sessionStorage.setItem(LANDING_KEY, 'true')
    }
  }, [showLanding])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.sessionStorage.setItem(PENDING_ORGS_KEY, JSON.stringify(pendingOrganizations))
  }, [pendingOrganizations])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.sessionStorage.setItem(DONATIONS_KEY, JSON.stringify(donations))
  }, [donations])

  useEffect(() => {
    currentUserRef.current = currentUser
  }, [currentUser])

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsBootstrapped(true)
      return undefined
    }
    const storedUser = window.sessionStorage.getItem('rewearUser')
    let matched = null
    if (storedUser && INITIAL_ACCOUNTS[storedUser]) {
      matched = { username: storedUser, ...INITIAL_ACCOUNTS[storedUser] }
      setCurrentUser(matched)
      setShowLanding(false)
      currentUserRef.current = matched
    }
    const initialPath = window.location.pathname === '/' ? '/main' : window.location.pathname
    navigateByPath(initialPath, { userOverride: matched, replace: true })

    const handlePopState = event => {
      const path = event.state?.path || window.location.pathname
      navigateByPath(path, { userOverride: currentUserRef.current })
    }
    window.addEventListener('popstate', handlePopState)
    setIsBootstrapped(true)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    setAccounts(prev => ({
      ...prev,
      user: { ...prev.user, password: 'user' }
    }))
  }, [])

  const goToMain = async (path = '/main', options = {}) => {
    const { push = true, replace = false } = options
    setShowLanding(false)
    setActivePage('main')
    
    // sessionStorage에 사용자 정보가 있으면 백엔드에서 최신 정보 가져오기
    if (typeof window !== 'undefined' && window.sessionStorage.getItem('rewearUser')) {
      await fetchCurrentUser()
    }
    
    if (push) updatePath(path, { replace })
    else if (replace) updatePath(path, { replace: true })
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.sessionStorage.setItem(ADMIN_INQUIRIES_KEY, JSON.stringify(adminInquiries))
  }, [adminInquiries])

  const goToSignup = (options = {}) => {
    const { push = true, replace = false } = options
    setShowLanding(false)
    setActivePage('signup')
    if (push) updatePath('/signup', { replace })
    else if (replace) updatePath('/signup', { replace: true })
  }

  const goToLogin = (options = {}) => {
    const { push = true, replace = false } = options
    setShowLanding(false)
    setActivePage('login')
    if (push) updatePath('/signin', { replace })
    else if (replace) updatePath('/signin', { replace: true })
  }

  const goToBoard = (options = {}) => {
    const { push = true, replace = false } = options
    setShowLanding(false)
    setActivePage('board')
    // 게시판으로 이동할 때마다 목록 새로고침
    setBoardRefreshKey(prev => prev + 1)
    if (push) updatePath('/board', { replace })
    else if (replace) updatePath('/board', { replace: true })
  }

  const goToBoardWrite = (options = {}) => {
    const { push = true, replace = false, boardType = 'review' } = options
    if (!currentUser) {
      goToLogin(options)
      return
    }
    const userRole = currentUser?.role || ''
    const canWriteReview = ['일반 회원', '기관 회원', '관리자 회원'].includes(userRole)
    const canWriteRequest = userRole === '기관 회원' || userRole === '관리자 회원'
    if (boardType === 'request' && !canWriteRequest) {
      window.alert('요청 게시판은 기관 회원만 작성할 수 있습니다.')
      return
    }
    if (boardType === 'review' && !canWriteReview) {
      window.alert('게시글 작성 권한이 없습니다.')
      return
    }
    setBoardWriteType(boardType === 'request' ? 'request' : 'review')
    setShowLanding(false)
    setActivePage('boardWrite')
    if (push) updatePath('/board/write', { replace })
    else if (replace) updatePath('/board/write', { replace: true })
  }

  const handleBoardPostSubmit = postData => {
    const authorUsername = currentUser?.username || 'guest'
    const displayName = getUserDisplayName(authorUsername)
    const timestamp = Date.now()
    const commonPost = {
      id: timestamp,
      title: postData.title,
      content: postData.content,
      writer: displayName,
      author: authorUsername,
      authorRole: currentUser?.role,
      boardType: postData.boardType,
      views: 0,
      date: new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
        .replace(/\./g, '.')
        .replace(/\s/g, '')
    }

    if (currentUser?.role === '관리자 회원') {
      const noticePost = {
        ...commonPost,
        id: `notice-${timestamp}`,
        noticeType: postData.boardType
      }
      setBoardNoticesDynamic(prev => [noticePost, ...prev])
      return { success: true, notice: true }
    }

    setBoardPosts(prev => ({
      ...prev,
      [postData.boardType]: [commonPost, ...(prev[postData.boardType] || [])]
    }))

    return { success: true }
  }

  const goToBoardDetail = (postId, postType = 'review', options = {}) => {
    const { push = true, replace = false } = options
    setSelectedPostId(postId)
    setSelectedPostType(postType)
    setShowLanding(false)
    setActivePage('boardDetail')
    // 공지사항은 문자열 ID이므로 그대로 사용
    const encodedPostId = typeof postId === 'string' ? encodeURIComponent(postId) : postId
    if (push) updatePath(`/board/${encodedPostId}`, { replace })
    else if (replace) updatePath(`/board/${encodedPostId}`, { replace: true })
  }

  const handleBoardViewsUpdate = (postId, postType) => {
    // 조회수 증가 (상태 관리) - 한 번만 증가
    setBoardViews(prev => {
      // 이미 조회수가 증가했는지 확인 (0보다 크면 이미 증가함)
      if (prev[postId] && prev[postId] > 0) {
        return prev // 이미 증가했으면 그대로 반환
      }
      // 처음 방문하면 +1
      return {
        ...prev,
        [postId]: 1
      }
    })
  }

  const handleBoardPostDelete = (postId, postType) => {
    // 작성된 게시글에서만 삭제 가능 (상수 데이터는 삭제 불가)
    setBoardPosts(prev => ({
      ...prev,
      [postType]: (prev[postType] || []).filter(post => Number(post.id) !== Number(postId))
    }))
    
    // 조회수 데이터도 삭제
    setBoardViews(prev => {
      const updated = { ...prev }
      delete updated[postId]
      return updated
    })
    
    return true
  }

  const goToFaq = (options = {}) => {
    const { push = true, replace = false } = options
    // 관리자는 관리자 FAQ 페이지로 이동
    if (currentUser && currentUser.role === '관리자 회원') {
      goToAdminFaq(options, currentUser)
      return
    }
    // 일반 사용자와 비로그인 사용자는 모두 FAQ 페이지 접근 가능
    setShowLanding(false)
    setActivePage('faq')
    if (push) updatePath('/faq', { replace })
    else if (replace) updatePath('/faq', { replace: true })
  }

  const goToInquiry = (options = {}) => {
    const { push = true, replace = false } = options
    // 로그인 체크
    if (!currentUser) {
      goToLogin(options)
      return
    }
    setShowLanding(false)
    setActivePage('inquiry')
    if (push) updatePath('/inquiry', { replace })
    else if (replace) updatePath('/inquiry', { replace: true })
  }

  const goToInquiryAnswers = (options = {}) => {
    const { push = true, replace = false } = options
    if (!currentUser) {
      goToLogin(options)
      return
    }
    setShowLanding(false)
    setActivePage('inquiryAnswers')
    if (push) updatePath('/faq/answers', { replace })
    else if (replace) updatePath('/faq/answers', { replace: true })
  }

  const goToDonationStatus = (options = {}, userOverride) => {
    const { push = true, replace = false } = options
    const targetUser = userOverride || currentUser
    if (!targetUser) {
      goToLogin(options)
      return
    }
    if (targetUser.role === '관리자 회원') {
      goToMain('/main', options)
      return
    }
    setShowLanding(false)
    setActivePage(targetUser.role === '기관 회원' ? 'organizationDonationStatus' : 'donationStatus')
    if (push) updatePath('/donation-status', { replace })
    else if (replace) updatePath('/donation-status', { replace: true })
  }
  const goToDeliveryCheck = (options = {}) => {
    const { push = true, replace = false } = options
    setShowLanding(false)
    setActivePage('deliveryCheck')
    if (push) updatePath('/delivery-check', { replace })
    else if (replace) updatePath('/delivery-check', { replace: true })
  }
  const goToBusinessIntro = (options = {}) => {
    const { push = true, replace = false } = options;
    setShowLanding(false);
    setActivePage('businessIntro');
    if (push) updatePath('/business', { replace });
    else if (replace) updatePath('/business', { replace: true });
  };

  const goToDonation = (options = {}) => {
    const { push = true, replace = false } = options;
    setShowLanding(false);
    setActivePage('donation');
    if (push) updatePath('/donation', { replace });
    else if (replace) updatePath('/donation', { replace: true });
  };
  
  

  // 현재 로그인한 사용자 정보를 백엔드에서 가져오기
  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/users/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          // 로그인되지 않은 경우
          setCurrentUser(null)
          if (typeof window !== 'undefined') {
            window.sessionStorage.removeItem('rewearUser')
          }
          return null
        }
        throw new Error('사용자 정보를 가져오는데 실패했습니다.')
      }
      
      const data = await response.json()
      
      if (data.ok === true && data.user) {
        const user = data.user
        const updatedUser = {
          username: user.username,
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          address: user.address || '',
          role: user.role,
          id: user.id,
        }
        
        setCurrentUser(updatedUser)
        
        // profiles 상태도 업데이트
        setProfiles(prev => ({
          ...prev,
          [user.username]: {
            ...prev[user.username],
            fullName: user.name,
            nickname: user.nickname || user.name,
            phone: user.phone || '',
            address: user.address || '',
          }
        }))
        
        return updatedUser
      }
      
      return null
    } catch (error) {
      console.error('Fetch current user error:', error)
      return null
    }
  }

  const goToMyPage = async (options = {}, userOverride) => {
    const { push = true, replace = false, panel } = options
    const targetUser = userOverride || currentUser
    
    if (!targetUser) {
      goToLogin(options)
      return
    }
    
    // 마이페이지 진입 시 사용자 정보 최신화
    if (!userOverride) {
      await fetchCurrentUser()
    }
    
    setShowLanding(false)
    if (targetUser.role === '관리자 회원') {
      const nextPanel = panel || adminPanel || 'members'
      setAdminPanel(nextPanel)
      setActivePage('adminManage')
      const adminPath = nextPanel === 'members' ? '/admin/manage' : `/admin/manage/${nextPanel}`
      if (push) updatePath(adminPath, { replace })
      else if (replace) updatePath(adminPath, { replace: true })
    } else {
      setActivePage('mypage')
      if (push) updatePath('/mypage', { replace })
      else if (replace) updatePath('/mypage', { replace: true })
    }
  }

  const goToNotifications = (options = {}, userOverride) => {
    const { push = true, replace = false } = options
    const targetUser = userOverride || currentUser
    if (!targetUser) {
      goToLogin(options)
      return
    }
    setShowLanding(false)
    setActivePage('notification')
    if (push) updatePath('/notification', { replace })
    else if (replace) updatePath('/notification', { replace: true })
  }

  const goToAdminFaq = (options = {}, userOverride) => {
    const { push = true, replace = false } = options
    const targetUser = userOverride || currentUser
    if (!targetUser || targetUser.role !== '관리자 회원') {
      goToMain(options)
      return
    }
    setShowLanding(false)
    setActivePage('adminFaq')
    if (push) updatePath('/admin/faq', { replace })
    else if (replace) updatePath('/admin/faq', { replace: true })
  }

  const goToForgotPassword = (options = {}) => {
    const { push = true, replace = false } = options
    setShowLanding(false)
    setActivePage('forgotPassword')
    if (push) updatePath('/forgot-password', { replace })
    else if (replace) updatePath('/forgot-password', { replace: true })
  }

  const goToForgotId = (options = {}) => {
    const { push = true, replace = false } = options
    setShowLanding(false)
    setActivePage('forgotId')
    if (push) updatePath('/forgot-id', { replace })
    else if (replace) updatePath('/forgot-id', { replace: true })
  }

  const goToVerification = (options = {}) => {
    const { push = true, replace = false } = options
    setShowLanding(false)
    setActivePage('verification')
    if (push) updatePath('/verification', { replace })
    else if (replace) updatePath('/verification', { replace: true })
  }

  const goToResetPassword = (options = {}) => {
    const { push = true, replace = false } = options
    setShowLanding(false)
    setActivePage('resetPassword')
    if (push) updatePath('/reset-password', { replace })
    else if (replace) updatePath('/reset-password', { replace: true })
  }

  const formatIsoDate = date => date.toISOString().split('T')[0]

  const handleLoginSubmit = async (username, password) => {
    try {
      const normalizedId = username.trim().toLowerCase()
      const trimmedPw = password.trim()

      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // 세션 쿠키를 포함하기 위해 필요
        body: JSON.stringify({
          username: normalizedId,
          password: trimmedPw,
        }),
      })

      // 응답 상태 확인
      if (!response.ok) {
        // 401, 403 등의 에러 응답 처리
        let errorData
        try {
          errorData = await response.json()
          console.log('Login error response:', errorData) // 디버깅용
        } catch (e) {
          // JSON 파싱 실패 시 기본 메시지
          console.error('Failed to parse error response:', e)
          errorData = { ok: false, message: '로그인에 실패했습니다.', errorType: 'UNKNOWN' }
        }
        return { 
          success: false, 
          reason: errorData.reason || null,
          errorType: errorData.errorType || 'UNKNOWN',
          message: errorData.message || '로그인에 실패했습니다.'
        }
      }

      const data = await response.json()

      if (data.ok === true) {
        // 로그인 성공
        const user = data.user
        const role = data.role || 'USER'
        
        const current = {
          username: user.username,
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          role: role,
          id: user.id,
        }
        
        setCurrentUser(current)
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem('rewearUser', normalizedId)
        }
        return { success: true, role: role }
      } else {
        // 로그인 실패
        return { 
          success: false, 
          reason: data.reason || null,
          errorType: data.errorType || 'UNKNOWN',
          message: data.message || '로그인에 실패했습니다.'
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { 
        success: false, 
        errorType: 'NETWORK_ERROR',
        message: '로그인 중 오류가 발생했습니다.' 
      }
    }
  }

  const handleInquirySubmit = ({ title, message }) => {
  if (!currentUser) {
    return { success: false, message: '로그인이 필요합니다.' }
  }
  const trimmedTitle = title.trim()
  const trimmedMessage = message.trim()
  if (!trimmedTitle || !trimmedMessage) {
    return { success: false, message: '문의 제목과 내용을 모두 입력해주세요.' }
  }
  const date = formatIsoDate(new Date())
  const requester = currentUser.username
  const role = currentUser.role
  const nickname = profiles[requester]?.nickname || accounts[requester]?.name || requester
  const displayEmail = accounts[requester]?.email || '등록된 이메일 정보 없음'
  const entryId = `user-inquiry-${Date.now()}`
  const entry = {
    id: entryId,
    question: trimmedTitle,
    title: trimmedTitle,
    message: trimmedMessage,
    description: trimmedMessage,
    email: displayEmail,
    nickname,
    role,
    submittedAt: date,
    requester,
    status: 'pending',
    answer: ''
  }
  setAdminInquiries(prev => [entry, ...prev])
  setNotifications(prev => {
    const adminList = prev.admin || []
    const notification = {
      id: `admin-inquiry-${entryId}`,
      title: `새 문의: ${trimmedTitle}`,
      type: 'alert',
      date,
      read: false,
      target: 'adminFaq'
    }
    return { ...prev, admin: [notification, ...adminList] }
  })
  return { success: true }
  }

  const handleAnswerSubmit = (inquiryId, answerText) => {
  const trimmed = answerText?.trim()
  if (!trimmed) return
  const target = adminInquiries.find(entry => entry.id === inquiryId)
  if (!target) return
  const wasAnswered = target.status === 'answered'
  const answeredAt = formatIsoDate(new Date())
  setAdminInquiries(prev =>
    prev.map(entry =>
      entry.id === inquiryId
        ? {
            ...entry,
            answer: trimmed,
            status: 'answered',
            answeredAt,
            answeredBy: currentUser?.username || 'admin'
          }
        : entry
    )
  )
  if (!wasAnswered && target.requester && accounts[target.requester]) {
    const notification = {
      id: `inquiry-answer-${Date.now()}`,
      title: `문의 답변: ${target.question}`,
      type: 'info',
      date: answeredAt,
      read: false,
      target: 'inquiryAnswers'
    }
    setNotifications(prev => ({
      ...prev,
      [target.requester]: [notification, ...(prev[target.requester] || [])]
    }))
  }
  }

  const handleLogout = () => {
  setCurrentUser(null)
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem('rewearUser')
  }
  goToMain()
  }

  const handleForgotPasswordSubmit = async ({ username, email }) => {
    try {
      const response = await fetch('/api/users/find-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          email: email.trim().toLowerCase(),
        }),
      })

      const data = await response.json()

      if (data.ok === true) {
        setRecoveryContext({
          type: 'password',
          username: username.trim().toLowerCase(),
          email: email.trim().toLowerCase(),
        })
        goToVerification()
        return { success: true }
      } else {
        return { success: false, message: data.message || '일치하는 계정을 찾을 수 없습니다.' }
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      return { success: false, message: '비밀번호 찾기 중 오류가 발생했습니다.' }
    }
  }

  const handleForgotIdSubmit = async ({ name, email }) => {
    try {
      const response = await fetch('/api/users/find-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
        }),
      })

      const data = await response.json()

      if (data.ok === true) {
        setRecoveryContext({
          type: 'id',
          name: name.trim(),
          email: email.trim().toLowerCase(),
        })
        goToVerification()
        return { success: true }
      } else {
        return { success: false, message: data.message || '일치하는 정보를 찾을 수 없습니다.' }
      }
    } catch (error) {
      console.error('Forgot ID error:', error)
      return { success: false, message: '아이디 찾기 중 오류가 발생했습니다.' }
    }
  }

  const clearRecoveryContext = () => {
    setRecoveryContext(null)
  }

  const handleResetPasswordSubmit = async ({ username, email, newPassword }) => {
    try {
      if (!recoveryContext || !recoveryContext.code) {
        return { success: false, message: '인증 정보가 만료되었습니다. 다시 시도해주세요.' }
      }

      const response = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          email: email.trim().toLowerCase(),
          code: recoveryContext.code, // VerificationPage에서 저장한 인증 코드
          newPassword: newPassword.trim(),
        }),
      })

      const data = await response.json()

      if (data.ok === true) {
        // 성공 시 로그인 화면으로 이동
        clearRecoveryContext()
        return { success: true, message: '비밀번호가 성공적으로 변경되었습니다.' }
      } else {
        return { success: false, message: data.message || '비밀번호 재설정에 실패했습니다.' }
      }
    } catch (error) {
      console.error('Reset password error:', error)
      return { success: false, message: '비밀번호 재설정 중 오류가 발생했습니다.' }
    }
  }

  const handleProfileSave = async updates => {
    if (!currentUser) {
      return { success: false, message: '로그인이 필요합니다.' }
    }
    
    try {
      const formattedPhone = formatPhoneNumber(stripPhoneNumber(updates.phone || ''))
      
      const response = await fetch('/api/users/me/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          nickname: updates.nickname,
          email: updates.email,
          phone: formattedPhone,
          address: updates.address
        }),
      })
      
      const data = await response.json()
      
      if (data.ok === true) {
        // 성공 시 사용자 정보 다시 가져오기
        await fetchCurrentUser()
        
        // 로컬 상태도 업데이트 (allowEmail 등)
        const username = currentUser.username
        setProfiles(prev => ({
          ...prev,
          [username]: {
            ...prev[username],
            nickname: updates.nickname,
            phone: formattedPhone,
            address: updates.address,
            allowEmail: updates.allowEmail,
            useAnonymousName:
              typeof updates.useAnonymousName === 'boolean'
                ? updates.useAnonymousName
                : prev[username]?.useAnonymousName
          }
        }))
        
        return { success: true, message: data.message || '프로필이 저장되었습니다.' }
      } else {
        return { success: false, message: data.message || '프로필 저장에 실패했습니다.' }
      }
    } catch (error) {
      console.error('Profile save error:', error)
      return { success: false, message: '프로필 저장 중 오류가 발생했습니다.' }
    }
  }

  const handlePasswordChange = async (currentPassword, newPassword) => {
    if (!currentUser) {
      return { success: false, message: '로그인이 필요합니다.' }
    }
    
    try {
      const response = await fetch('/api/users/me/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: currentPassword,
          newPassword: newPassword
        }),
      })
      
      const data = await response.json()
      
      if (data.ok === true) {
        return { success: true, message: data.message || '비밀번호가 변경되었습니다.' }
      } else {
        return { success: false, message: data.message || '비밀번호 변경에 실패했습니다.' }
      }
    } catch (error) {
      console.error('Password change error:', error)
      return { success: false, message: '비밀번호 변경 중 오류가 발생했습니다.' }
    }
  }

  const handleChangeEmail = async ({ email, code }) => {
    if (!currentUser) {
      return { success: false, message: '로그인이 필요합니다.' }
    }
    
    try {
      const response = await fetch('/api/users/me/email', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: email,
          code: code
        }),
      })
      
      const data = await response.json()
      
      if (data.ok === true) {
        // 성공 시 사용자 정보 다시 가져오기
        await fetchCurrentUser()
        return { success: true, message: data.message || '이메일이 성공적으로 변경되었습니다.' }
      } else {
        return { success: false, message: data.message || '이메일 변경에 실패했습니다.' }
      }
    } catch (error) {
      console.error('Email change error:', error)
      return { success: false, message: '이메일 변경 중 오류가 발생했습니다.' }
    }
  }

  const handleWithdraw = async () => {
    if (!currentUser) {
      return { success: false, message: '로그인이 필요합니다.' }
    }
    
    if (currentUser.role === '관리자 회원') {
      return { success: false, message: '관리자는 웹에서 탈퇴할 수 없습니다.' }
    }
    
    try {
      const response = await fetch('/api/users/me', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      
      const data = await response.json()
      
      if (data.ok === true) {
        // 로컬 상태 정리
        const username = currentUser.username
        setAccounts(prev => {
          const next = { ...prev }
          delete next[username]
          return next
        })
        setProfiles(prev => {
          const next = { ...prev }
          delete next[username]
          return next
        })
        setNotifications(prev => {
          const next = { ...prev }
          delete next[username]
          return next
        })
        if (typeof window !== 'undefined') {
          window.sessionStorage.removeItem('rewearUser')
        }
        setCurrentUser(null)
        goToMain()
        return { success: true, message: data.message || '회원 탈퇴가 완료되었습니다.' }
      } else {
        return { success: false, message: data.message || '회원 탈퇴에 실패했습니다.' }
      }
    } catch (error) {
      console.error('Withdraw error:', error)
      return { success: false, message: '회원 탈퇴 중 오류가 발생했습니다.' }
    }
  }

  const handleAdminPasswordReset = (username, newPassword) => {
    if (!accounts[username]) {
      return { success: false, message: '해당 사용자가 없습니다.' }
    }
    setAccounts(prev => ({
      ...prev,
      [username]: { ...prev[username], password: newPassword }
    }))
    return { success: true }
  }

  const handleAdminDeleteUser = username => {
    if (!accounts[username] || username === 'admin') {
      return { success: false, message: '삭제할 수 없습니다.' }
    }
    setAccounts(prev => {
      const next = { ...prev }
      delete next[username]
      return next
    })
    setProfiles(prev => {
      const next = { ...prev }
      delete next[username]
      return next
    })
    setNotifications(prev => {
      const next = { ...prev }
      delete next[username]
      return next
    })
    return { success: true }
  }

  const handleNotificationDelete = id => {
    if (!currentUser) return
    setNotifications(prev => {
      const list = prev[currentUser.username] || []
      return {
        ...prev,
        [currentUser.username]: list.filter(notification => notification.id !== id)
      }
    })
  }

  const handleNotificationRead = id => {
    if (!currentUser) return
    const username = currentUser.username
    setNotifications(prev => {
      const list = prev[username] || []
      let changed = false
      const nextList = list.map(notification => {
        if (notification.id === id) {
          if (!notification.read) {
            changed = true
          }
          return { ...notification, read: true }
        }
        return notification
      })
      if (!changed) return { ...prev, [username]: nextList }
      return {
        ...prev,
        [username]: nextList
      }
    })
  }

  const pushUserNotification = (username, { title, description, type = 'info', target }) => {
    if (!username) return
    setNotifications(prev => {
      const list = prev[username] || []
      const newNotification = {
        id: `${username}-notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title,
        type,
        date: new Date().toISOString().split('T')[0],
        read: false,
        description,
        target
      }
      return {
        ...prev,
        [username]: [newNotification, ...list]
      }
    })
  }

  const getDonationItemSnapshot = (owner, itemId) => {
    const list = donations[owner] || []
    return list.find(item => item.id === itemId)
  }

  const getStatusLabel = status => {
    switch (status) {
      case '승인대기':
        return '승인 대기'
      case '매칭대기':
        return '매칭 대기'
      case '매칭됨':
        return '매칭 완료'
      case '거절됨':
        return '거절됨'
      case '배송대기':
        return '배송 대기'
      case '배송완료':
        return '배송 완료'
      default:
        return status
    }
  }

  const updateDonationItem = (owner, itemId, updates) => {
    setDonations(prev => {
      const targetList = prev[owner] || []
      const nextList = targetList.map(item => {
        if (item.id !== itemId) return item
        const patch = typeof updates === 'function' ? updates(item) : updates
        return { ...item, ...patch }
      })
      return { ...prev, [owner]: nextList }
    })
  }

  const handleApproveOrganizationRequest = requestId => {
    const request = pendingOrganizations.find(req => req.id === requestId)
    if (!request) return
    setPendingOrganizations(prev =>
      prev.map(req =>
        req.id === requestId
          ? { ...req, status: 'approved', reviewedAt: new Date().toISOString(), rejectionReason: '' }
          : req
      )
    )
    if (!accounts[request.username]) {
      setAccounts(prev => ({
        ...prev,
        [request.username]: {
          password: request.password || 'organ123!',
          role: '기관 회원',
          name: request.organizationName,
          email: request.email
        }
      }))
    }
    if (!profiles[request.username]) {
      setProfiles(prev => ({
        ...prev,
        [request.username]: {
          fullName: request.organizationName,
          nickname: request.organizationName,
          phone: request.phone,
          address: request.address,
          allowEmail: true,
          useAnonymousName: false
        }
      }))
    }
  }

  const handleRejectOrganizationRequest = (requestId, reason) => {
    setPendingOrganizations(prev =>
      prev.map(req =>
        req.id === requestId
          ? {
              ...req,
              status: 'rejected',
              reviewedAt: new Date().toISOString(),
              rejectionReason: reason
            }
          : req
      )
    )
  }

  const handleDonationStatusChange = (owner, itemId, nextStatus, options = {}) => {
    const itemSnapshot = getDonationItemSnapshot(owner, itemId)
    const statusLabel = getStatusLabel(nextStatus)
    const directMatchOrgId =
      options.directMatchOrganizationId || itemSnapshot?.donationOrganizationId || null
    const directMatchOrgName =
      options.directMatchOrganization ||
      options.pendingOrganization ||
      itemSnapshot?.pendingOrganization ||
      itemSnapshot?.donationOrganization ||
      itemSnapshot?.organization ||
      ''
    const shouldAutoInvite =
      nextStatus === '매칭대기' &&
      itemSnapshot &&
      itemSnapshot.donationMethod === '직접 매칭' &&
      (directMatchOrgId || directMatchOrgName) &&
      !itemSnapshot.inviteId
    updateDonationItem(owner, itemId, item => ({
      status: nextStatus,
      matchingInfo:
        options.matchingInfo ??
        (nextStatus === '매칭대기'
          ? '기관 매칭을 기다리는 중입니다.'
          : nextStatus === '승인대기'
          ? '관리자 검토 중입니다.'
          : item.matchingInfo),
      matchedOrganization: options.matchedOrganization ?? (nextStatus === '거절됨' ? null : item.matchedOrganization),
      pendingOrganization: options.pendingOrganization ?? (nextStatus === '거절됨' ? null : item.pendingOrganization),
      rejectionReason: options.rejectionReason ?? (nextStatus === '거절됨' ? options.rejectionReason || '' : ''),
      inviteId: options.inviteId ?? item.inviteId
    }))
    if (itemSnapshot) {
      pushUserNotification(owner, {
        title: '기부 물품 상태 변경',
        description:
          nextStatus === '거절됨' && options.rejectionReason
            ? `'${itemSnapshot.name || itemSnapshot.items}'이(가) 거절되었습니다. 사유: ${options.rejectionReason}`
            : `'${itemSnapshot.name || itemSnapshot.items}' 상태가 '${statusLabel}'로 변경되었습니다.`,
        target: 'donationStatus'
      })
      if (shouldAutoInvite) {
        const orgIdentifier = directMatchOrgId || directMatchOrgName
        const orgUsername = getOrganizationUsername(orgIdentifier)
        if (orgUsername) {
          handleSendMatchingInvite(owner, itemId, orgUsername, {
            notifyDonor: false,
            organizationNameOverride: directMatchOrgName || itemSnapshot?.donationOrganization
          })
        }
      }
    }
  }

  const handleSendMatchingInvite = (owner, itemId, organizationUsername, options = {}) => {
    const { notifyDonor = true, organizationNameOverride } = options
    const organizationAccount = accounts[organizationUsername]
    if (!organizationAccount) return
    const organizationName =
      organizationNameOverride ||
      profiles[organizationUsername]?.fullName ||
      profiles[organizationUsername]?.nickname ||
      organizationAccount.name ||
      organizationUsername

    const inviteId = `invite-${Date.now()}`
    const itemSnapshot = getDonationItemSnapshot(owner, itemId)
    setMatchingInvites(prev => [
      {
        id: inviteId,
        itemId,
        owner,
        itemName: itemSnapshot?.name || itemSnapshot?.items || itemId,
        itemDescription: itemSnapshot?.itemDescription || '',
        deliveryMethod: itemSnapshot?.deliveryMethod || '',
        desiredDate: itemSnapshot?.desiredDate || '',
        memo: itemSnapshot?.memo || '',
        contact: itemSnapshot?.contact || '',
        images: itemSnapshot?.images ? [...itemSnapshot.images] : [],
        donorName: profiles[owner]?.fullName || accounts[owner]?.name || owner,
        organizationUsername,
        organizationName,
        status: 'pending',
        createdAt: new Date().toISOString(),
        message: `${organizationName}에 매칭을 요청했습니다.`
      },
      ...prev
    ])

    pushUserNotification(organizationUsername, {
      title: '새로운 매칭 제안',
      description: `'${itemSnapshot?.name || itemSnapshot?.items || itemId}' 매칭 제안을 확인해주세요.`,
      type: 'alert',
      target: 'organizationDonationStatus'
    })

    updateDonationItem(owner, itemId, item => ({
      ...item,
      status: '매칭대기',
      matchingInfo: `${organizationName} 기관 확인 중입니다.`,
      pendingOrganization: organizationName,
      inviteId
    }))
    if (notifyDonor && itemSnapshot) {
      pushUserNotification(owner, {
        title: '기관 매칭 진행',
        description: `${organizationName} 기관에 '${itemSnapshot?.name || itemSnapshot?.items || '기부 물품'}' 매칭을 요청했습니다.`,
        target: 'donationStatus'
      })
    }
  }

  const handleRespondMatchingInvite = (inviteId, decision, reason) => {
    const targetInvite = matchingInvites.find(invite => invite.id === inviteId)
    if (!targetInvite) return
    setMatchingInvites(prev =>
      prev.map(invite =>
        invite.id === inviteId
          ? {
              ...invite,
              status: decision === 'accept' ? 'accepted' : 'rejected',
              respondedAt: new Date().toISOString(),
              responseReason: reason || ''
            }
          : invite
      )
    )

    if (decision === 'accept') {
      updateDonationItem(targetInvite.owner, targetInvite.itemId, item => ({
        ...item,
        status: '매칭됨',
        matchingInfo:
          item.deliveryMethod === '직접 배송'
            ? '직접 배송을 진행해주세요.'
            : `${targetInvite.organizationName}과 매칭되었습니다.`,
        matchedOrganization: targetInvite.organizationName,
        pendingOrganization: null,
        rejectionReason: ''
      }))
      pushUserNotification(targetInvite.owner, {
        title: '기관 매칭 결과',
        description: `${targetInvite.organizationName}이(가) '${targetInvite.itemName || targetInvite.itemId}' 매칭을 수락했습니다.`,
        target: 'donationStatus'
      })
    } else {
      updateDonationItem(targetInvite.owner, targetInvite.itemId, item => ({
        ...item,
        status: '매칭대기',
        matchingInfo: reason ? `기관 거절: ${reason}` : '기관 매칭을 다시 진행합니다.',
        matchedOrganization: null,
        pendingOrganization: null,
        rejectionReason: reason || ''
      }))
      pushUserNotification(targetInvite.owner, {
        title: '기관 매칭 결과',
        description: reason
          ? `${targetInvite.organizationName}이(가) '${targetInvite.itemName || targetInvite.itemId}' 매칭을 거절했습니다. 사유: ${reason}`
          : `${targetInvite.organizationName}이(가) '${targetInvite.itemName || targetInvite.itemId}' 매칭을 거절했습니다.`,
        target: 'donationStatus'
      })
    }
  }

  const handleAddDonation = (donationData) => {
    if (!currentUser) return
    const username = currentUser.username
    const profile = profiles[username] || {}
    const donorDisplayName = donationData.isAnonymous ? '익명' : profile.fullName || currentUser.name || username
    const contactInfo = formatPhoneNumber(stripPhoneNumber(donationData.contact || profile.phone || ''))
    const donationId = `donation-${Date.now()}`
    const now = new Date()
    const formattedDate = now.toISOString().split('T')[0]
    const referenceSuffix = Math.floor(Math.random() * 900 + 100)
    const referenceCode = `REQ-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}-${referenceSuffix}`
    const directOrgName =
      donationData.donationMethod === '직접 매칭'
        ? donationData.donationOrganizationName || donationData.donationOrganization || null
        : null
    const directOrgId =
      donationData.donationMethod === '직접 매칭' ? donationData.donationOrganizationId || null : null
    const newDonation = {
      id: donationId,
      referenceCode,
      date: formattedDate,
      registeredAt: formattedDate,
      name: donationData.itemDetail || donationData.itemType || '내 기부 물품',
      category: donationData.itemType || '기부 물품',
      items: `${donationData.itemType} - ${donationData.itemDetail || ''} (${donationData.itemSize}, ${donationData.itemCondition})`,
      organization:
        donationData.donationMethod === '자동 매칭' ? '자동 매칭' : directOrgName || donationData.donationOrganization || '미정',
      donationMethod: donationData.donationMethod,
      status: '승인대기',
      matchingInfo: '관리자 검토 중입니다.',
      matchedOrganization: donationData.donationMethod === '직접 매칭' ? directOrgName : null,
      donationOrganization: directOrgName,
      donationOrganizationId: directOrgId,
      pendingOrganization: null,
      rejectionReason: '',
      inviteId: null,
      images: donationData.images || [],
      deliveryMethod: donationData.deliveryMethod,
      desiredDate: donationData.desiredDate,
      memo: donationData.memo,
      itemDescription: donationData.itemDescription,
      contact: contactInfo,
      donorName: donorDisplayName,
      isAnonymous: Boolean(donationData.isAnonymous),
      donationOrganization: donationData.donationMethod === '직접 매칭' ? donationData.donationOrganization || null : null
    }
    setDonations(prev => ({
      ...prev,
      [username]: [...(prev[username] || []), newDonation]
    }))
  }

  const handleCancelDonation = (owner, itemId) => {
    const itemSnapshot = getDonationItemSnapshot(owner, itemId)
    if (!itemSnapshot) return false
    const normalizedStatus = String(itemSnapshot.status || '').replace(/\s+/g, '')
    if (!['승인대기', '매칭대기'].includes(normalizedStatus)) return false

    updateDonationItem(owner, itemId, {
      status: '취소됨',
      matchingInfo: '기부자가 신청을 취소했습니다.',
      matchedOrganization: null,
      pendingOrganization: null,
      inviteId: null
    })
    setMatchingInvites(prev => prev.filter(invite => invite.itemId !== itemId))
    pushUserNotification(owner, {
      title: '기부 신청 취소',
      description: `'${itemSnapshot.name || itemSnapshot.items}' 신청을 취소했습니다.`,
      target: 'donationStatus'
    })
    return true
  }

  const handleSignup = async (formData, membership, options = {}) => {
    const { emailVerified = false } = options
    const username = (formData[`username-${membership}`] || '').trim().toLowerCase()
    const password = (formData[`password-${membership}`] || '').trim()
    const fullName =
      (formData[`fullName-${membership}`] || '').trim() ||
      (formData[`manager-${membership}`] || '').trim()
    const email = (formData[`email-${membership}`] || '').trim().toLowerCase()
    const phone = stripPhoneNumber(formData[`phone-${membership}`] || '')
    const nickname =
      (formData[`nickname-${membership}`] || '').trim() ||
      (formData[`orgName-${membership}`] || '').trim() ||
      fullName
    const address = formData[`address-${membership}`] || ''
    const addressDetail = formData[`addressDetail-${membership}`] || ''
    const postalCode =
      formData[`zipCode-${membership}`] ||
      formData[`postalCode-${membership}`] ||
      ''
    
    // 상세주소를 주소에 포함
    const fullAddress = addressDetail 
      ? `${address} ${addressDetail}`.trim()
      : address

    if (!username || !password || !fullName || !email) {
      window.alert('필수 항목을 입력해주세요.')
      return
    }
    if (!emailVerified) {
      window.alert('이메일 인증을 완료해주세요.')
      return
    }

    try {
      if (membership === 'organization') {
        // 기관 회원 가입
        const orgName = formData[`orgName-${membership}`] || nickname
        const businessNumber = formData[`businessNumber-${membership}`] || ''
        
        if (!orgName || !businessNumber) {
          window.alert('기관명과 사업자번호를 입력해주세요.')
          return
        }

        const response = await fetch('/api/users/signup/organ', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            password,
            manager: fullName,
            email,
            phone: phone || '01000000000', // 기본값
            zipCode: postalCode || '00000',
            address: fullAddress || '주소 미입력',
            orgName,
            businessNumber
          }),
          credentials: 'include'
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: '회원가입에 실패했습니다.' }))
          throw new Error(errorData.message || '기관 회원가입에 실패했습니다.')
        }

        const data = await response.json()
        window.alert(data.message || '기관 가입 신청이 접수되었습니다. 관리자 승인 후 로그인 가능합니다.')
        goToLogin()
      } else {
        // 일반 회원 가입
        const response = await fetch('/api/users/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            password,
            name: fullName,
            email,
            phone: phone || '01000000000', // 기본값
            addressPostcode: postalCode || '00000',
            address: fullAddress || '주소 미입력',
            nickname: nickname || username
          }),
          credentials: 'include'
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: '회원가입에 실패했습니다.' }))
          throw new Error(errorData.message || '회원가입에 실패했습니다.')
        }

        const user = await response.json()
        
        // 로컬 상태에도 저장 (임시로 프론트엔드 상태 유지)
        setAccounts(prev => ({
          ...prev,
          [username]: {
            password,
            role: '일반 회원',
            name: fullName,
            email: user.email
          }
        }))

        setProfiles(prev => ({
          ...prev,
          [username]: {
            fullName,
            nickname: nickname || fullName,
            phone: phone || '01000000000',
            address,
            addressDetail,
            postalCode,
            allowEmail: true,
            useAnonymousName: false
          }
        }))

        window.alert('회원가입이 완료되었습니다!')
        goToLogin()
      }
    } catch (error) {
      console.error('회원가입 실패:', error)
      window.alert(error.message || '회원가입 중 오류가 발생했습니다.')
    }
  }
  
  const handleNotificationNavigate = notification => {
    if (!notification?.target) return
    switch (notification.target) {
      case 'adminFaq':
        goToAdminFaq({ push: true }, currentUser)
        break
      case 'inquiryAnswers':
        goToInquiryAnswers({ push: true })
        break
      case 'donationStatus':
        goToDonationStatus({ push: true })
        break
      case 'organizationDonationStatus':
        goToDonationStatus({ push: true }, currentUser)
        break
      case 'deliveryCheck':
        goToDeliveryCheck({ push: true })
        break
      default:
        if (typeof notification.target === 'string' && notification.target.startsWith('/')) {
          navigateByPath(notification.target, { userOverride: currentUser })
        }
        break
    }
  }

  const activeNotifications = currentUser
    ? notifications[currentUser.username] || []
    : []
  const unreadCount = activeNotifications.filter(item => !item.read).length
  const currentProfile = currentUser ? profiles[currentUser.username] : null
  const userInquiries = currentUser
    ? adminInquiries.filter(inquiry => inquiry.requester === currentUser.username)
    : []
  const answeredInquiryCount = userInquiries.filter(inquiry => inquiry.status === 'answered').length

  const handleNavRedirection = link => {
    const href = typeof link === 'string' ? link : link.href
    if (href === '/donation-status' || href === '#donation-status') {
      // 기관 회원이면 기관용 페이지로, 일반 회원이면 일반용 페이지로
      if (currentUser?.role === '기관 회원') {
        goToDonationStatus(undefined, currentUser)
      } else {
        goToDonationStatus()
      }
    } else if (href === '/faq' || href === '#faq') {
      goToFaq()
    } else if (href === '/business' || href === '#about') {
      goToBusinessIntro()
    } else if (href === '/inquiry' || href === '#inquiry') {
      if (currentUser?.role === '관리자 회원') {
        goToAdminFaq()
      } else {
        goToInquiry()
      }
    } else if (href === '/delivery-check' || href === '#delivery-check') {
      goToDeliveryCheck()
    } else if (href === '/donation' || href === '#donation') {
      goToDonation()
    } else if (href === '#board') {
      goToBoard()
    } else if (href === '#mypage') {
      goToMyPage()
    } else if (href === '/admin/manage' || href === '/admin/manage/members') {
      goToMyPage({ panel: 'members' })
    } else if (href === '/admin/manage/orgs' || href === '/admin/organization-approval') {
      goToMyPage({ panel: 'orgs' })
    } else if (href === '/admin/manage/items' || href === '/admin/donation-approval') {
      goToMyPage({ panel: 'items' })
    } else if (href === '/admin/manage/matching' || href === '/admin/matched-donations') {
      goToMyPage({ panel: 'matching' })
    } else if (href === '/admin/faq') {
      goToAdminFaq()
    } else if (href === '/admin/delivery') {
      goToMyPage({ panel: 'items' })
    } else {
      goToMain('/main')
    }
    return true
  }

  const navigateByPath = (path, { userOverride } = {}) => {
    // 동적 라우팅: /board/:id 형태 처리
    if (path.startsWith('/board/')) {
      const pathPart = path.split('/board/')[1]
      if (pathPart && path !== '/board/write') {
        // 공지사항인지 확인 (notice-로 시작하는 경우)
        let postId = pathPart
        let postType = 'review'
        
        if (pathPart.startsWith('notice-')) {
          postId = decodeURIComponent(pathPart)
          postType = 'notice'
        } else {
          const parsedId = parseInt(pathPart)
          if (parsedId) {
            postId = parsedId
            // 게시글 타입은 기본값으로 설정 (나중에 개선 가능)
          } else {
            // 숫자로 변환할 수 없으면 문자열 그대로 사용
            postId = decodeURIComponent(pathPart)
          }
        }
        
        goToBoardDetail(postId, postType, { push: false, replace: true })
        return
      }
    }

    switch (path) {
      case '/':
      case '/main':
        goToMain('/main', { push: false, replace: true })
        break
      case '/signup':
        goToSignup({ push: false, replace: true })
        break
      case '/signin':
        goToLogin({ push: false, replace: true })
        break
      case '/board':
        goToBoard({ push: false, replace: true })
        break
      case '/board/write':
        goToBoardWrite({ push: false, replace: true })
        break
      case '/faq':
        goToFaq({ push: false, replace: true })
        break
      case '/faq/answers':
        goToInquiryAnswers({ push: false, replace: true })
        break
      case '/inquiry':
        goToInquiry({ push: false, replace: true })
        break
      case '/mypage':
        goToMyPage({ push: false, replace: true }, userOverride)
        break
      case '/admin/manage':
        goToMyPage({ push: false, replace: true, panel: 'members' }, userOverride ?? currentUser)
        break
      case '/admin/manage/members':
        goToMyPage({ push: false, replace: true, panel: 'members' }, userOverride ?? currentUser)
        break
      case '/admin/manage/orgs':
      case '/admin/organization-approval':
        goToMyPage({ push: false, replace: true, panel: 'orgs' }, userOverride ?? currentUser)
        break
      case '/admin/manage/items':
      case '/admin/donation-approval':
      case '/admin/delivery':
        goToMyPage({ push: false, replace: true, panel: 'items' }, userOverride ?? currentUser)
        break
      case '/admin/manage/matching':
      case '/admin/matched-donations':
        goToMyPage({ push: false, replace: true, panel: 'matching' }, userOverride ?? currentUser)
        break
      case '/notification':
        goToNotifications({ push: false, replace: true }, userOverride)
        break
      case '/admin/faq':
        goToAdminFaq({ push: false, replace: true }, userOverride)
        break
      case '/forgot-password':
        goToForgotPassword({ push: false, replace: true })
        break
      case '/forgot-id':
        goToForgotId({ push: false, replace: true })
        break
      case '/reset-password':
        goToResetPassword({ push: false, replace: true })
        break
      case '/verification':
        goToVerification({ push: false, replace: true })
        break
      case '/donation-status':
        goToDonationStatus({ push: false, replace: true }, userOverride)
        break
      case '/delivery-check':
        goToDeliveryCheck({ push: false, replace: true })
        break
      case '/business':
        goToBusinessIntro({ push: false, replace: true })
        break
      case '/donation':
        goToDonation({ push: false, replace: true })
        break
      default:
        goToMain('/main', { push: false, replace: true })
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const handlePopState = event => {
      const path = event.state?.path || window.location.pathname
      navigateByPath(path)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [currentUser])

  if (!isBootstrapped) {
    return null
  }

  return (
    <div className="app-root">
      <CategoryMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onNavClick={handleNavRedirection}
        role={currentUser?.role}
      />
      {showLanding ? (
        <IntroLanding onClose={goToMain} onLogin={goToLogin} onSignup={goToSignup} />
      ) : activePage === 'signup' ? (
        <SignupPage
          onNavigateHome={goToMain}
          onGoLogin={goToLogin}
          onNavLink={handleNavRedirection}
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
          onNotifications={goToNotifications}
          unreadCount={unreadCount}
          onSignupSubmit={handleSignup}

          onMenu={() => setIsMenuOpen(true)}
          currentUser={currentUser}
        />
      ) : activePage === 'login' ? (
        <LoginPage
          onNavigateHome={goToMain}
          onGoSignup={goToSignup}
          onNavLink={handleNavRedirection}
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
          onNotifications={goToNotifications}
          onLoginSubmit={handleLoginSubmit}
          onForgotPassword={goToForgotPassword}
          onForgotId={goToForgotId}
          unreadCount={unreadCount}
          onMenu={() => setIsMenuOpen(true)}
          currentUser={currentUser}
        />
      ) : activePage === 'board' ? (
        <BoardPage
          key={boardRefreshKey}
          onNavigateHome={goToMain}
          onLogin={goToLogin}
          onNavLink={handleNavRedirection}
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
          onNotifications={goToNotifications}
          unreadCount={unreadCount}
          onMenu={() => setIsMenuOpen(true)}
          onGoToBoardWrite={goToBoardWrite}
          currentUser={currentUser}
          selectedBoardType={selectedBoardType}
          boardPosts={boardPosts}
          boardViews={boardViews}
          onGoToBoardDetail={goToBoardDetail}
          extraNotices={boardNoticesDynamic}
        />
      ) : activePage === 'boardDetail' ? (
        <BoardDetailPage
          onNavigateHome={goToMain}
          onLogin={goToLogin}
          onNavLink={handleNavRedirection}
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
          onNotifications={goToNotifications}
          unreadCount={unreadCount}
          onMenu={() => setIsMenuOpen(true)}
          currentUser={currentUser}
          postId={selectedPostId}
          postType={selectedPostType}
          onGoBack={() => goToBoard({ push: false, replace: true })}
          boardPosts={boardPosts}
          boardViews={boardViews}
          onUpdateViews={handleBoardViewsUpdate}
          onDeletePost={handleBoardPostDelete}
          notices={boardNoticesDynamic}
        />
      ) : activePage === 'boardWrite' ? (
        <BoardWritePage
          onNavigateHome={goToMain}
          onLogin={goToLogin}
          onNavLink={handleNavRedirection}
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
          onNotifications={goToNotifications}
          unreadCount={unreadCount}
          onMenu={() => setIsMenuOpen(true)}
          currentUser={currentUser}
          onGoBack={() => goToBoard({ push: false, replace: true })}
          boardType={boardWriteType || 'review'}
          onSubmit={handleBoardPostSubmit}
        />
      ) : activePage === 'notification' ? (
        <NotificationPage
          notifications={activeNotifications}
          onDelete={handleNotificationDelete}
          onMarkRead={handleNotificationRead}
          onNavigate={handleNotificationNavigate}
          onClose={() => goToMain()}
        />
      ) : activePage === 'mypage' ? (
        <MyPage
          user={currentUser}
          profile={currentProfile}
          onSaveProfile={handleProfileSave}
          onChangePassword={handlePasswordChange}
          onChangeEmail={handleChangeEmail}
          onWithdraw={handleWithdraw}
          onNavigateHome={goToMain}
          onRequireLogin={goToLogin}
        />
      ) : activePage === 'adminManage' ? (
        <AdminManagePage
          accounts={accounts}
          profiles={profiles}
          notifications={notifications}
          shipments={shipments}
          pendingOrganizations={pendingOrganizations}
          donationItems={allDonationItems}
          organizationOptions={organizationOptions}
          matchingInvites={matchingInvites}
          onApproveOrganization={handleApproveOrganizationRequest}
          onRejectOrganization={handleRejectOrganizationRequest}
          onUpdateDonationStatus={handleDonationStatusChange}
          onSendMatchingInvite={handleSendMatchingInvite}
          onResetPassword={handleAdminPasswordReset}
          onDeleteUser={handleAdminDeleteUser}
          onNavigateHome={goToMain}
          initialPanel={adminPanel}
          onPanelChange={setAdminPanel}
        />
      ) : activePage === 'inquiryAnswers' ? (
        <InquiryAnswersPage
          onNavigateHome={goToMain}
          onNavLink={handleNavRedirection}
          onNotifications={goToNotifications}
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
          unreadCount={unreadCount}
          onBackToFaq={() => goToFaq()}
          inquiries={userInquiries}
          onMenu={() => setIsMenuOpen(true)}
          currentUser={currentUser}
        />
      ) : activePage === 'adminFaq' ? (
        <AdminFaqPage
          onNavigateHome={goToMain}
          onNavLink={handleNavRedirection}
          onNotifications={goToNotifications}
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
          unreadCount={unreadCount}
          onBackToAdmin={() => goToMyPage({ push: false, replace: true }, currentUser)}
          adminInquiries={adminInquiries}
          onSubmitAnswer={handleAnswerSubmit}
          onMenu={() => setIsMenuOpen(true)}
          currentUser={currentUser}
        />
      ) : activePage === 'forgotPassword' ? (
        <ForgotPasswordPage
          onNavigateHome={goToMain}
          onSubmit={handleForgotPasswordSubmit}
          onBackToLogin={goToLogin}
        />
      ) : activePage === 'forgotId' ? (
        <ForgotIdPage
          onNavigateHome={goToMain}
          onSubmit={handleForgotIdSubmit}
          onBackToLogin={goToLogin}
        />
      ) : activePage === 'verification' ? (
        <VerificationPage
          context={recoveryContext}
          onResend={async () => {
            if (recoveryContext) {
              try {
                // 인증 코드 재발송
                if (recoveryContext.type === 'id') {
                  await fetch('/api/users/find-id', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                      name: recoveryContext.name,
                      email: recoveryContext.email,
                    }),
                  })
                } else if (recoveryContext.type === 'password') {
                  await fetch('/api/users/find-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                      username: recoveryContext.username,
                      email: recoveryContext.email,
                    }),
                  })
                } else if (recoveryContext.email) {
                  await fetch('/api/auth/send-verification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ email: recoveryContext.email }),
                  })
                }
              } catch (error) {
                console.error('Resend error:', error)
              }
            }
          }}
          onComplete={() => {
            clearRecoveryContext()
            if (recoveryContext?.type === 'id') {
              goToLogin()
            } else {
              goToMain()
            }
          }}
          onVerifySuccess={(verifiedContext) => {
            if (verifiedContext.type === 'password') {
              // 비밀번호 재설정 화면으로 이동
              setRecoveryContext(verifiedContext)
              goToResetPassword()
            }
          }}
          onNavigateHome={goToMain}
        />
      ) : activePage === 'resetPassword' ? (
        <ResetPasswordPage
          onNavigateHome={goToMain}
          onSubmit={handleResetPasswordSubmit}
          onBackToLogin={goToLogin}
          context={recoveryContext}
        />
      ) : activePage === 'faq' ? (
        <FaqPage
          onNavigateHome={goToMain}
          onNavLink={handleNavRedirection}
          onInquiry={goToInquiry}
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
          onNotifications={goToNotifications}
          unreadCount={unreadCount}
          hasInquiries={userInquiries.length > 0}
          answeredCount={answeredInquiryCount}
          onViewAnswers={() => goToInquiryAnswers()}
          onMenu={() => setIsMenuOpen(true)}
          currentUser={currentUser}
        />
      ) : activePage === 'inquiry' ? (
        <InquiryPage
          onNavigateHome={goToMain}
          onNavLink={handleNavRedirection}
          onBack={() => goToFaq()}
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
          onNotifications={goToNotifications}
          unreadCount={unreadCount}
          onSubmitInquiry={handleInquirySubmit}
          onMenu={() => setIsMenuOpen(true)}
          currentUser={currentUser}
        />
      ) : activePage === 'donationStatus' ? (
        <DonationStatusPage
          onNavigateHome={goToMain}
          onNavLink={handleNavRedirection}
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
          onNotifications={goToNotifications}
          unreadCount={unreadCount}
          onMenu={() => setIsMenuOpen(true)}
          currentUser={currentUser}
          onRequireLogin={goToLogin}
          shipments={shipments}
          donationItems={currentUser ? donations[currentUser.username] || [] : []}
          onNavigateDeliveryStatus={() => goToDeliveryCheck()}
          onCancelDonation={itemId => currentUser && handleCancelDonation(currentUser.username, itemId)}
        />
      ) : activePage === 'deliveryCheck' ? (
        <DeliveryCheckPage
          onNavigateHome={goToMain}
          onNavLink={handleNavRedirection}
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
          onNotifications={goToNotifications}
          unreadCount={unreadCount}
          onMenu={() => setIsMenuOpen(true)}
          currentUser={currentUser}
          currentProfile={currentProfile}
          shipments={shipments}
          donorProfile={profiles.user}
          organizationProfile={currentUser ? profiles[currentUser.username] : null}
        />
      ) : activePage === 'organizationDonationStatus' ? (
        <OrganizationDonationStatusPage
          onNavigateHome={goToMain}
          onNavLink={handleNavRedirection}
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
          onNotifications={goToNotifications}
          unreadCount={unreadCount}
          onMenu={() => setIsMenuOpen(true)}
          currentUser={currentUser}
          onRequireLogin={goToLogin}
          isBootstrapped={isBootstrapped}
          shipments={shipments}
          matchingInvites={matchingInvites}
          onRespondMatchingInvite={handleRespondMatchingInvite}
        />
      ) : activePage === 'businessIntro' ? (
        <BusinessIntroPage
          onNavigateHome={goToMain}
          onLogin={goToLogin}
          onNavLink={handleNavRedirection}
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
          onNotifications={goToNotifications}
          unreadCount={unreadCount}
          onMenu={() => setIsMenuOpen(true)}
          currentUser={currentUser}
        />
      ) : activePage === 'donation' ? (
        <DonationPage
          onNavigateHome={goToMain}
          onNavLink={handleNavRedirection}
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
          onNotifications={goToNotifications}
          unreadCount={unreadCount}
          onMenu={() => setIsMenuOpen(true)}
          currentUser={currentUser}
          currentProfile={currentProfile}
          onRequireLogin={goToLogin}
          onAddDonation={handleAddDonation}
          onGoToDonationStatus={goToDonationStatus}
          availableOrganizations={organizationOptions}
        />
      ) : (
        <ExperienceLanding
          onLogin={goToLogin}
          onSignup={goToSignup}
          onNavLink={handleNavRedirection}
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
          onNotifications={goToNotifications}
          unreadCount={unreadCount}
          onMenu={() => setIsMenuOpen(true)}
          currentUser={currentUser}
        />
      )}
    </div>
  )
}
