// 한글 폰트를 jsPDF에 추가하기 위한 유틸리티
// Noto Sans KR 폰트를 base64로 인코딩해서 사용

// 한글 폰트를 로드하는 함수
// 실제로는 폰트 파일을 프로젝트에 포함시키는 것이 가장 확실합니다
export const loadKoreanFont = async (doc) => {
  try {
    // 방법 1: 로컬 폰트 파일 사용 (권장)
    // public/fonts 폴더에 NotoSansKR-Regular.ttf 파일을 넣고 로드
    try {
      const response = await fetch('/fonts/NotoSansKR-Regular.ttf')
      if (response.ok) {
        const fontArrayBuffer = await response.arrayBuffer()
        // 큰 파일의 경우 ArrayBuffer를 직접 base64로 변환
        const bytes = new Uint8Array(fontArrayBuffer)
        let binary = ''
        const len = bytes.byteLength
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i])
        }
        const fontBase64 = btoa(binary)
        
        doc.addFileToVFS('NotoSansKR-Regular.ttf', fontBase64)
        doc.addFont('NotoSansKR-Regular.ttf', 'NotoSansKR', 'normal')
        
        // 폰트가 실제로 사용 가능한지 테스트
        try {
          // 폰트 목록 확인
          const fontList = doc.getFontList()
          if (!fontList || !fontList['NotoSansKR']) {
            console.warn('한글 폰트가 폰트 목록에 없습니다.')
            return false
          }
          
          // 실제로 폰트를 사용해보기 (오류가 발생하면 폰트가 제대로 로드되지 않은 것)
          const originalFont = doc.getFont()
          doc.setFont('NotoSansKR', 'normal')
          // 간단한 텍스트로 테스트 (화면 밖에 그려서 보이지 않게)
          try {
            doc.text('테스트', -100, -100)
          } catch (textError) {
            console.warn('폰트 텍스트 렌더링 테스트 실패:', textError)
            doc.setFont(originalFont.fontName, originalFont.fontStyle)
            return false
          }
          // 원래 폰트로 복원
          doc.setFont(originalFont.fontName, originalFont.fontStyle)
          
          console.log('한글 폰트 로드 성공 (로컬 파일)')
          return true
        } catch (fontError) {
          console.warn('폰트 등록 확인 실패:', fontError)
          return false
        }
      }
    } catch (e) {
      console.warn('로컬 폰트 파일 로드 실패:', e)
    }
    
    // 방법 2: CDN에서 폰트 로드 (CORS 문제 가능)
    // 실제 폰트 파일 URL 사용
    try {
      // jsDelivr CDN 사용 (CORS 문제 적음)
      const fontUrl = 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notosanskr/NotoSansKR-Regular.ttf'
      const response = await fetch(fontUrl, { mode: 'cors' })
      
      if (response.ok) {
        const fontArrayBuffer = await response.arrayBuffer()
        // 큰 파일의 경우 ArrayBuffer를 직접 base64로 변환
        const bytes = new Uint8Array(fontArrayBuffer)
        let binary = ''
        const len = bytes.byteLength
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i])
        }
        const fontBase64 = btoa(binary)
        
        doc.addFileToVFS('NotoSansKR-Regular.ttf', fontBase64)
        doc.addFont('NotoSansKR-Regular.ttf', 'NotoSansKR', 'normal')
        
        // 폰트가 실제로 사용 가능한지 테스트
        try {
          // 폰트 목록 확인
          const fontList = doc.getFontList()
          if (!fontList || !fontList['NotoSansKR']) {
            console.warn('한글 폰트가 폰트 목록에 없습니다.')
            return false
          }
          
          // 실제로 폰트를 사용해보기 (오류가 발생하면 폰트가 제대로 로드되지 않은 것)
          const originalFont = doc.getFont()
          doc.setFont('NotoSansKR', 'normal')
          // 간단한 텍스트로 테스트 (화면 밖에 그려서 보이지 않게)
          try {
            doc.text('테스트', -100, -100)
          } catch (textError) {
            console.warn('폰트 텍스트 렌더링 테스트 실패:', textError)
            doc.setFont(originalFont.fontName, originalFont.fontStyle)
            return false
          }
          // 원래 폰트로 복원
          doc.setFont(originalFont.fontName, originalFont.fontStyle)
          
          console.log('한글 폰트 로드 성공 (CDN)')
          return true
        } catch (fontError) {
          console.warn('폰트 등록 확인 실패:', fontError)
          return false
        }
      }
    } catch (e) {
      console.warn('CDN 폰트 로드 실패:', e)
    }
    
    // 방법 3: 한글 지원이 안 되지만 기본 폰트로 PDF 생성은 가능하도록
    console.warn('한글 폰트를 로드할 수 없습니다. 기본 폰트(helvetica)를 사용합니다.')
    return false
  } catch (error) {
    console.warn('한글 폰트 로드 실패, 기본 폰트 사용:', error)
    return false
  }
}
