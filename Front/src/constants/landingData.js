export const mainNavLinks = [
  { label: '사업소개', href: '/business' },
  { label: '게시판', href: '#board' },
  { label: '마이페이지', href: '#mypage' },
  { label: 'FAQ', href: '#faq' }
]

export const getNavLinksForRole = role => {
  if (role === '관리자 회원') {
    return [
      { label: '회원 관리', href: '/admin/manage/members' },
      { label: '기관 가입 승인', href: '/admin/manage/orgs' },
      { label: '물품 승인', href: '/admin/manage/items' },
      { label: '자동매칭', href: '/admin/manage/matching' },
      { label: '택배 관리', href: '/admin/manage/delivery-input' },
      { label: 'FAQ', href: '/admin/faq' },
      { label: '게시판', href: '#board' },
      { label: '배송 관리', href: '/admin/manage/delivery' }
    ]
  }
  if (role === '기관 회원') {
    return [
      { label: '사업소개', href: '/business' },
      { label: '내 기부 관리', href: '/donation-status' },
      { label: '배송 조회', href: '#delivery-check' },
      { label: '게시판', href: '#board' },
      { label: '마이페이지', href: '#mypage' },
      { label: 'FAQ', href: '#faq' }
    ]
  }
  if (role === '일반 회원') {
    return [
      { label: '사업소개', href: '/business' },
      { label: '기부하기', href: '#donation' },
      { label: '내 기부 관리', href: '/donation-status' },
      { label: '게시판', href: '#board' },
      { label: '마이페이지', href: '#mypage' },
      { label: 'FAQ', href: '#faq' }
    ]
  }
  return mainNavLinks
}

export const experienceStats = [
  { value: '48,200벌', label: '연간 순환 의류' },
  { value: '72시간', label: '평균 회수 리드타임' },
  { value: '99%', label: '배송 추적율' }
]

export const liveUpdates = [
  { time: '09:41', message: '성수동 수거 요청 배차 완료' },
  { time: '10:05', message: '관악 검수허브 입고' },
  { time: '10:47', message: '강서구 기관 배송 픽업' },
  { time: '11:20', message: '탄소 절감 리포트 2건 발행' }
]

export const controlTowerModules = [
  {
    tag: 'Pickup OS',
    title: '수거 오더 자동화',
    body: '지역/시간대/차량 용량을 고려해 최적 드라이버에게 자동 배차합니다.'
  },
  {
    tag: 'Inventory Lens',
    title: '품목 인텔리전스',
    body: '사이즈와 시즌 데이터를 축적해 겹치는 물품을 미리 조정합니다.'
  },
  {
    tag: 'Impact Feed',
    title: '실시간 리포트',
    body: '배송 · 검수 · 감사 피드백을 하나의 타임라인으로 기록합니다.'
  },
  {
    tag: 'Partner API',
    title: '기관 연동',
    body: '파트너 기관 ERP와 연동해 수요 요청을 자동으로 가져옵니다.'
  }
]

export const journeyTimeline = [
  {
    step: '01',
    title: '요청 접수 · 예약',
    body: '문 앞 사진과 희망 일정을 입력하면 즉시 수거 슬롯을 확보합니다.',
    detail: 'AI 라우팅으로 도심/지방 전 지역 대응'
  },
  {
    step: '02',
    title: '검수 · 등급화',
    body: '소재/컨디션 기반으로 등급을 나누고, 세탁 완료품만 다음 단계로 이동.',
    detail: '센터별 품목 현황을 대시보드에서 확인'
  },
  {
    step: '03',
    title: '기관 매칭',
    body: '수요 데이터(사이즈/성별/긴급도)를 맞춰 자동 배정 및 중복 방지.',
    detail: '기관 승인 후 즉시 배송지 생성'
  },
  {
    step: '04',
    title: '영향 공유',
    body: '사진, 감사 메시지, 절감 탄소량을 기부자에게 실시간으로 전달.',
    detail: '모든 내역은 PDF 리포트로 다운로드'
  }
]

export const partnerQuotes = [
  {
    quote: '“수거 예약부터 리포트까지 한 화면에서 보여서 운영팀이 매일 쓰는 툴이 됐어요.”',
    author: '한마음복지관 운영팀',
    role: '서울 · 기관 회원'
  },
  {
    quote: '“필요한 사이즈만 받으니 창고가 비었어요. 요청-배정 과정이 덜 번거롭습니다.”',
    author: '희망드림센터',
    role: '부산 · 아동 기관'
  }
]

export const membershipOptions = [
  { value: 'general', label: '일반 회원' },
  { value: 'organization', label: '기관 회원' }
]

export const membershipForms = {
  general: [
    { id: 'username', label: '아이디', type: 'text', placeholder: '아이디를 입력하세요' },
    {
      id: 'password',
      label: '비밀번호',
      type: 'password',
      placeholder: '비밀번호를 입력하세요',
      toggleable: true
    },
    { id: 'fullName', label: '이름', type: 'text', placeholder: '홍길동' },
    {
      id: 'email',
      label: '이메일',
      type: 'email',
      placeholder: 'example@example.com',
      actionLabel: '인증코드 전송'
    },
    {
      id: 'emailCode',
      label: '인증코드',
      type: 'text',
      placeholder: '인증코드를 입력하세요',
      actionLabel: '인증 확인'
    },
    { id: 'phone', label: '전화번호', type: 'tel', placeholder: '숫자만 입력 (예: 01012345678)', helper: '숫자만 입력해주세요' },
    { id: 'address', label: '주소', type: 'text', placeholder: '주소를 입력하세요' },
{ id: 'addressDetail', label: '상세주소', type: 'text', placeholder: '상세주소를 입력하세요' },
{ id: 'zipCode', label: '우편번호', type: 'text', placeholder: '00000' },

    {
      id: 'nickname',
      label: '닉네임(선택사항)',
      type: 'text',
      placeholder: '닉네임을 입력하세요',
      optional: true
    }
  ],
  organization: [
    { id: 'username', label: '아이디', type: 'text', placeholder: '아이디를 입력하세요' },
    {
      id: 'password',
      label: '비밀번호',
      type: 'password',
      placeholder: '비밀번호를 입력하세요',
      toggleable: true
    },
    { id: 'manager', label: '이름', type: 'text', placeholder: '담당자 이름' },
    {
      id: 'email',
      label: '이메일',
      type: 'email',
      placeholder: 'example@example.com',
      actionLabel: '인증코드 전송'
    },
    {
      id: 'emailCode',
      label: '인증코드',
      type: 'text',
      placeholder: '인증코드를 입력하세요',
      actionLabel: '인증 확인'
    },
    {
      id: 'phone',
      label: '전화번호',
      type: 'tel',
      placeholder: '숫자만 입력 (예: 01012345678)',
      helper: '숫자만 입력해주세요'
    },
    {
      id: 'nicknameInfo',
      label: '닉네임',
      type: 'text',
      placeholder: '기관명과 동일하게 표시됩니다',
      readOnly: true,
      readOnlyValue: '기관명과 동일하게 표시됩니다'
    },
    {
      id: 'orgName',
      label: '기관명',
      type: 'text',
      placeholder: '기관명을 입력하세요'
    },
    {
      id: 'businessNumber',
      label: '사업자 번호',
      type: 'text',
      placeholder: '000-00-00000'
    },
    { id: 'address', label: '주소', type: 'text', placeholder: '주소를 입력하세요' },
{ id: 'addressDetail', label: '상세주소', type: 'text', placeholder: '상세주소를 입력하세요' },
{ id: 'zipCode', label: '우편번호', type: 'text', placeholder: '00000' }

  ]
}

export const boardTypes = [
  { label: '기부 후기', value: 'review', active: true },
  { label: '요청 게시판', value: 'request' }
]

export const boardTabs = [
  { label: '최신순', value: 'latest', active: true },
  { label: '가장 많이 본', value: 'popular' },
  { label: '오래된순', value: 'oldest' }
]

export const boardNotices = [
  {
    id: 'notice-1',
    title: 'RE:WEAR 서비스 오픈 안내',
    writer: '관리자',
    views: 324,
    date: '2025.10.30',
    content: `안녕하세요, RE:WEAR 관리자입니다.

🎉 RE:WEAR 서비스가 정식 오픈되었습니다. RE:WEAR는 사용하지 않는 의류를 기부하고, 필요한 곳에 전달하는 기부 플랫폼입니다.

주요 기능:
- 의류 기부 신청 및 관리
- 기부 물품 추적 및 배송 확인
- 기관과의 매칭 서비스
- 커뮤니티를 통한 나눔 후기 공유

서비스 이용을 위해 회원가입을 진행해주시기 바랍니다.
일반 회원과 기관 회원을 구분하여 서비스를 제공하고 있습니다.

문의사항이 있으시면 고객센터로 연락 주시기 바랍니다.
감사합니다.`
  },
  {
    id: 'notice-2',
    title: '서비스 이용 가이드',
    writer: '관리자',
    views: 275,
    date: '2025.10.28',
    content: `📚 RE:WEAR 서비스 이용 가이드입니다.

【일반 회원 이용 방법】

1. 기부하기
   - 마이페이지에서 기부 신청을 진행하세요
   - 기부할 의류의 사진과 상태를 입력하세요
   - 배송 정보를 입력하면 기부가 완료됩니다

2. 기부 현황 확인
   - 기부 현황 조회 메뉴에서 자신의 기부 내역을 확인할 수 있습니다
   - 직접 매칭을 선택하면, 원하는 기관에 바로 기부를 진행할 수 있습니다
   - 자동 매칭을 선택하면, 기부 현황 조회 페이지에서 배송 상태와 수령 기관을 확인할 수 있습니다

3. 커뮤니티 활용
   - 기부 후기 게시판에 나눔 경험을 공유할 수 있습니다
   - 다른 회원들의 후기를 확인할 수 있습니다

【기관 회원 이용 방법】

1. 기부 요청하기
   - 요청 게시판에 필요한 의류를 게시하세요
   - 필요한 의류의 종류와 수량을 명시하세요

2. 기부 접수
   - 기부 현황 조회에서 기관에 접수된 기부 물품을 확인하세요
   - 배송 완료 후 수령 확인을 진행하세요

자세한 문의는 고객센터로 연락 주시기 바랍니다.`
  }
]

export const reviewPosts = [
  {
    id: 4,
    title: '좋은 선물 받아서 아이들이 좋아합니다',
    writer: '마더테레사',
    views: 423,
    date: '2025.10.15'
  },
  {
    id: 3,
    title: '기부 후 감사 메시지 받았어요!',
    writer: '나눔천사',
    views: 89,
    date: '2025.10.10'
  },
  {
    id: 2,
    title: '기부한 옷이 유용하게 쓰이고 있어요',
    writer: '기부자123',
    views: 156,
    date: '2025.10.08'
  },
  {
    id: 1,
    title: '뜻깊은 나눔 후기 공유합니다',
    writer: '환경지킴이',
    views: 234,
    date: '2025.10.05'
  }
]

export const requestPosts = [
  {
    id: 11,
    title: '겨울 옷 기부 요청드립니다',
    writer: '희망센터',
    views: 189,
    date: '2025.10.25'
  },
  {
    id: 10,
    title: '아동복 긴급 기부 요청',
    writer: '사랑나눔',
    views: 245,
    date: '2025.10.22'
  },
  {
    id: 9,
    title: '청소년 의류 기부 요청',
    writer: '미래재단',
    views: 156,
    date: '2025.10.20'
  },
  {
    id: 8,
    title: '여성 의류 기부가 필요합니다',
    writer: '여성센터',
    views: 312,
    date: '2025.10.18'
  },
  {
    id: 7,
    title: '남성 정장 기부 요청',
    writer: '취업지원센터',
    views: 198,
    date: '2025.10.15'
  }
]