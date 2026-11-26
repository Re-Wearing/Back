# RE:WEAR

버려지는 옷에 새로운 가치를 더하는 웹 기반 의류 기부 플랫폼

## 📋 프로젝트 소개

RE:WEAR는 계절이 바뀌고 유행이 지나면서 더 이상 입지 않는 옷들을 쉽게 기부할 수 있도록 도와주는 웹 기반 의류 기부 플랫폼입니다. 이렇게 남겨진 옷들의 가치를 다시 연결하여 필요한 사람들에게 전달하는 것을 목표로 합니다.

## 🎯 주요 기능

### 일반 사용자
- **회원가입/로그인**: 일반 회원 및 기관 회원 가입
- **의류 기부**: 사용하지 않는 의류를 기부할 수 있는 기능
- **기부 현황 조회**: 본인이 기부한 의류의 상태 및 매칭 현황 확인
- **게시판**: 기부 후기 작성 및 조회
- **배송 관리**: 기부 의류 배송 정보 관리
- **알림**: 기부 매칭, 배송 등 다양한 알림 수신
- **마이페이지**: 개인 정보 및 활동 내역 관리

### 기관 사용자
- **기관 등록**: 사업자 등록번호를 통한 기관 인증
- **의류 요청**: 필요한 의류에 대한 요청 게시물 작성
- **기부 수령**: 매칭된 기부 의류 수령 및 관리
- **기부 현황**: 기관별 기부 수령 현황 조회

### 관리자
- **사용자 관리**: 회원 및 기관 관리
- **기부 관리**: 기부 신청 승인/거부 및 자동 매칭 관리
- **배송 관리**: 배송 정보 관리
- **게시판 관리**: 게시물 관리
- **FAQ 관리**: 자주 묻는 질문 관리
- **문의 관리**: 사용자 문의 답변

## 🛠 기술 스택

### Backend
- **Framework**: Spring Boot 3.3.0
- **Language**: Java 21
- **Database**: MySQL
- **Security**: Spring Security
- **Template Engine**: Thymeleaf
- **Build Tool**: Gradle
- **Email**: Spring Mail (Gmail SMTP)

### Frontend
- **Framework**: React 19.1.1
- **Build Tool**: Vite 7.1.7
- **Language**: JavaScript (ES6+)

## 📁 프로젝트 구조

```
RE_WEAR/
├── Back/                    # Spring Boot 백엔드
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/rewear/
│   │   │   │   ├── admin/      # 관리자 기능
│   │   │   │   ├── common/     # 공통 기능
│   │   │   │   ├── delivery/   # 배송 관리
│   │   │   │   ├── donation/   # 기부 관리
│   │   │   │   ├── email/      # 이메일 기능
│   │   │   │   ├── faq/        # FAQ 관리
│   │   │   │   ├── notification/ # 알림 기능
│   │   │   │   ├── organ/      # 기관 관리
│   │   │   │   ├── post/       # 게시판
│   │   │   │   └── user/       # 사용자 관리
│   │   │   └── resources/
│   │   │       ├── application.properties
│   │   │       ├── static/     # 정적 리소스
│   │   │       └── templates/  # Thymeleaf 템플릿
│   │   └── test/               # 테스트 코드
│   ├── build.gradle
│   └── README.md
│
├── Front/                    # React 프론트엔드
│   ├── src/
│   │   ├── components/       # 재사용 컴포넌트
│   │   ├── pages/           # 페이지 컴포넌트
│   │   ├── styles/          # CSS 스타일
│   │   ├── utils/           # 유틸리티 함수
│   │   └── constants/       # 상수 데이터
│   ├── package.json
│   └── README.md
│
└── README.md                # 프로젝트 메인 README
```

## 시작하기

백엔드는 Java 21, Spring Boot 3.3.0, Spring Security, Spring Data JPA, MySQL 8.0, Gradle Wrapper를 사용합니다. React 개발 서버를 사용하려면 Node.js도 설치합니다.

### 격리된 로컬 DB

MySQL에서 별도의 빈 개발용 스키마와 해당 스키마에만 권한이 있는 전용 계정을 준비합니다. 비밀번호는 실행 환경에서 생성하고 비밀 저장소나 IDE 실행 구성으로 주입합니다. 기본 스키마 검증 모드는 validate입니다. 빈 로컬 개발 스키마를 초기화할 때만 DB_DDL_AUTO=update를 설정합니다.

### 환경변수

| 환경변수 | 설정값 |
| --- | --- |
| DB_URL | 로컬 전용 MySQL JDBC URL. 예시는 jdbc:mysql://localhost:3306/rewear_dev |
| DB_USERNAME, DB_PASSWORD | 개발용 DB 계정과 비밀번호 |
| SPRING_MAIL_USERNAME, SPRING_MAIL_PASSWORD | 전용 테스트 SMTP 계정과 자격증명 |
| REWEAR_ADMIN_USERNAME, REWEAR_ADMIN_PASSWORD | 앱 초기화용 관리자 계정 |
| REWEAR_ADMIN_EMAIL, REWEAR_ADMIN_PHONE | 로컬 관리자의 테스트 연락처 |
| REWEAR_USER_USERNAME, REWEAR_USER_PASSWORD | 앱 초기화용 일반 사용자 계정 |
| REWEAR_ORGAN_USERNAME, REWEAR_ORGAN_PASSWORD | 앱 초기화용 기관 계정 |
| REWEAR_ORGAN_BUSINESS_NO, REWEAR_ORGAN_NAME | 초기 기관의 테스트 사업자번호와 이름 |
| REWEAR_ADMIN_RESET_PASSWORD, REWEAR_USER_RESET_PASSWORD, REWEAR_ORGAN_RESET_PASSWORD | 기본값 false. 의도적으로 초기 계정의 비밀번호를 교체할 때만 true |
| REWEAR_ORGAN_AUTO_APPROVE | 기본값 false. 기존 로컬 데모처럼 초기 기관을 즉시 승인하려면 true |

세 초기화 계정의 아이디는 서로 달라야 하며 기존 일반 계정과 겹치지 않는 값을 사용합니다. 앱은 최초 생성 또는 사용자가 명시한 재설정 시 비밀번호를 BCrypt로 해시합니다. Spring Boot에 환경변수를 직접 전달합니다. .env 파일은 자동으로 로드되지 않습니다.

### 실행 및 테스트

1. 이 표에 있는 값을 백엔드 프로세스 환경에 주입합니다.
2. Back 디렉터리에서 Windows는 .\gradlew.bat bootRun, macOS와 Linux는 ./gradlew bootRun을 실행합니다. 백엔드 기본 포트는 8080입니다.
3. React 화면을 쓰려면 Front에서 npm ci와 npm run dev를 실행합니다. Vite는 /api와 /uploads를 백엔드로 프록시합니다.
4. Back에서 .\gradlew.bat test 또는 ./gradlew test를 실행합니다. 전체 컨텍스트 테스트는 격리된 인메모리 H2 DB를 사용하며 실제 메일을 발송하지 않습니다. 보안 필터만 검증하려면 .\gradlew.bat test --tests com.rewear.config.SecurityConfigTests로 실행합니다.

세션 API의 쓰기 요청은 GET /api/csrf에서 받은 헤더 이름과 토큰을 동일 세션으로 전송합니다. 로그인·로그아웃 후에는 토큰을 새로 받아야 합니다. 브라우저 외부 클라이언트는 두 요청 사이에 세션 쿠키를 유지합니다.

UUID 이름의 JPEG, PNG, GIF, WebP 이미지 URL은 게시판 동작을 위해 공개 제공됩니다. 개인 식별정보나 비공개 문서를 이 업로드 경로에 저장하지 마세요.

## 📝 주요 기능 상세

### 기부 프로세스
1. 사용자가 의류 기부 신청
2. 관리자가 기부 신청 승인
3. 자동 매칭 시스템이 기관의 요청과 매칭
4. 배송 정보 입력 및 배송 진행
5. 기관이 수령 확인

### 역할 기반 접근 제어
- **ROLE_USER**: 일반 회원
- **ROLE_ORGAN**: 기관 회원
- **ROLE_ADMIN**: 관리자

## 🤝 기여하기

프로젝트에 기여하고 싶으시다면 다음 단계를 따르세요:

1. 프로젝트를 Fork합니다
2. 기능 브랜치를 생성합니다 (`git checkout -b feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some Feature'`)
4. 브랜치에 Push합니다 (`git push origin feature`)
5. Pull Request를 생성합니다


## 📄 라이선스

이 프로젝트는 교육 목적으로 개발되었습니다.

## 👥 팀

RE:WEAR 개발팀

---

**RE:WEAR** - 버려지는 옷에 새로운 가치를 더합니다.

