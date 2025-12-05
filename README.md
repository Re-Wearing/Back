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

## 🚀 시작하기

### 사전 요구사항

- **Java**: 21 이상
- **Node.js**: 최신 LTS 버전
- **MySQL**: 8.0 이상
- **Gradle**: 7.x 이상 (또는 Gradle Wrapper 사용)

### 설치 및 실행

#### 1. 데이터베이스 설정

MySQL 데이터베이스를 생성하고 설정합니다:

```sql
CREATE DATABASE rewear CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'rewear'@'localhost' IDENTIFIED BY 'admin';
GRANT ALL PRIVILEGES ON rewear.* TO 'rewear'@'localhost';
FLUSH PRIVILEGES;
```

#### 2. Backend 설정

```bash
cd Back

# application.properties 파일 수정
# 데이터베이스 연결 정보 및 이메일 설정 확인

# Gradle Wrapper를 사용하여 빌드 및 실행
./gradlew build
./gradlew bootRun

# 또는 Windows의 경우
gradlew.bat build
gradlew.bat bootRun
```

백엔드 서버는 기본적으로 `http://localhost:8080`에서 실행됩니다.

#### 3. Frontend 설정

```bash
cd Front

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
```

프론트엔드 개발 서버는 기본적으로 `http://localhost:5174`에서 실행됩니다.

## ⚙️ 환경 설정

### Backend (application.properties)

주요 설정 항목:

- **데이터베이스**: MySQL 연결 정보
- **이메일**: Gmail SMTP 설정
- **파일 업로드**: 최대 파일 크기 및 업로드 디렉토리
- **로그**: 로그 레벨 및 파일 저장 경로

### 기본 계정

프로젝트 실행 시 다음 기본 계정이 생성됩니다:

- **관리자**: `admin` / `admin`
- **일반 사용자**: `user01` / `user01`
- **기관**: `organ01` / `organ01` (사업자번호: `1234567890`)

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

