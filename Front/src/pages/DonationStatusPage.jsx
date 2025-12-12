import { useEffect, useMemo, useState } from 'react'
import HeaderLanding from '../components/HeaderLanding'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { loadKoreanFont } from '../utils/koreanFont'

export default function DonationStatusPage({
  onNavigateHome,
  onNavLink,
  isLoggedIn,
  onLogout,
  onNotifications,
  unreadCount,
  onMenu = () => {},
  currentUser,
  onRequireLogin,
  shipments = [],
  donationItems = [], // 하위 호환성을 위해 유지
  onCancelDonation = null,
  onLogin = () => {}
}) {
  if (!isLoggedIn || !currentUser) {
    if (onRequireLogin) {
      onRequireLogin()
    }
    return null
  }

  if (currentUser.role === '기관 회원' || currentUser.role === '관리자 회원') {
    if (onNavigateHome) {
      onNavigateHome()
    }
    return null
  }

  const normalizeStatus = status => String(status || '').replace(/\s+/g, '').toLowerCase()
  const isCompletedShipment = status => {
    const normalized = normalizeStatus(status)
    return normalized === '배송완료' || normalized === '완료' || normalized.endsWith('완료')
  }

  const [activeTab, setActiveTab] = useState('approval')
  const [apiData, setApiData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedDonation, setSelectedDonation] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState(null)
  const [showDeliveryModal, setShowDeliveryModal] = useState(false)
  const [deliveryLoading, setDeliveryLoading] = useState(false)
  const [showPdfSelectModal, setShowPdfSelectModal] = useState(false)
  const [pdfSelectedItems, setPdfSelectedItems] = useState(new Set())

  // API에서 기부 상태 데이터 가져오기
  useEffect(() => {
    const fetchDonationStatus = async () => {
      if (!isLoggedIn || !currentUser) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        console.log('기부 상태 조회 시작...')
        
        const response = await fetch('/api/donations/status', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include' // 세션 쿠키 포함
        })

        console.log('API 응답 상태:', response.status, response.statusText)

        // 응답 본문 확인
        const responseText = await response.text()
        console.log('API 응답 본문:', responseText)

        if (!response.ok) {
          console.error('API 오류 응답:', responseText)
          let errorMessage = `기부 상태 조회에 실패했습니다. (${response.status})`
          try {
            const errorData = JSON.parse(responseText)
            errorMessage = errorData.message || errorMessage
          } catch (e) {
            // JSON 파싱 실패 시 원본 텍스트 사용
            if (responseText) {
              errorMessage = responseText
            }
          }
          throw new Error(errorMessage)
        }

        // 응답 본문이 비어있는 경우 처리
        if (!responseText || responseText.trim().length === 0) {
          console.warn('API 응답 본문이 비어있습니다.')
          throw new Error('서버에서 빈 응답을 받았습니다.')
        }

        let data
        try {
          data = JSON.parse(responseText)
        } catch (e) {
          console.error('JSON 파싱 오류:', e, '응답 본문:', responseText)
          throw new Error('서버 응답을 파싱할 수 없습니다.')
        }

        console.log('API 응답 데이터:', data)

        // 배송 정보를 포함한 형태로 보강 (deliveryId, deliveryStatus)
        const enhanced = { ...data }
        if (data?.approvalItems) {
          enhanced.approvalItems = data.approvalItems.map(item => ({
            ...item,
            deliveryId: item.deliveryId ?? null,
            deliveryStatus: item.deliveryStatus ?? null
          }))
        }
        if (data?.completedDonations) {
          enhanced.completedDonations = data.completedDonations.map(item => ({
            ...item,
            deliveryId: item.deliveryId ?? null,
            deliveryStatus: item.deliveryStatus ?? null
          }))
        }

        setApiData(enhanced)
      } catch (err) {
        console.error('기부 상태 조회 오류:', err)
        setError(err.message || '기부 상태를 불러오는 중 오류가 발생했습니다.')
        // API 실패 시 기존 donationItems prop 사용 (하위 호환성)
        setApiData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchDonationStatus()
  }, [isLoggedIn, currentUser])

  const approvalStatusDescriptions = {
    승인대기: '관리자 검토 중입니다.',
    매칭대기: '기관 매칭을 기다리는 중입니다.',
    매칭됨: '기관과 매칭이 완료되었어요.',
    거절됨: '사유를 확인 후 다시 신청해주세요.',
    배송대기: '배송 준비 중입니다.',
    배송중: '배송 중입니다.',
    취소됨: '기부자가 신청을 취소했습니다.',
    완료: '기부가 완료되었습니다.'
  }

  const getApprovalStatus = status => {
    const normalized = normalizeStatus(status)
    if (!normalized) return '승인대기'
    if (normalized.includes('취소')) return '취소됨'
    if (normalized.includes('배송중')) return '배송중'
    if (normalized.includes('배송대기')) return '배송대기'
    if (normalized.includes('거절') || normalized.includes('reject')) return '거절됨'
    if (normalized.includes('매칭됨') || normalized.includes('matched')) return '매칭됨'
    if (normalized === '승인대기' || normalized.includes('승인대기')) return '승인대기'
    if (normalized.includes('매칭대기') || normalized.includes('approved')) return '매칭대기'
    // "완료" 상태는 approvalItems에 포함되지 않아야 하지만, 혹시 모를 경우를 대비
    if (normalized.includes('완료')) return '완료'
    return '승인대기'
  }

  const getApprovalStatusColor = status => {
    switch (status) {
      case '승인대기':
        return '#ffb347'
      case '매칭대기':
        return '#64d1ff'
      case '매칭됨':
        return '#4eed90'
      case '거절됨':
        return '#ff6b6b'
      case '배송대기':
        return '#7a6b55'
      case '배송중':
        return '#4a90e2'
      case '취소됨':
        return '#b0b0b0'
      case '완료':
        return '#4eed90'
      default:
        return '#7a6b55'
    }
  }

  // API 데이터가 있으면 사용, 없으면 기존 donationItems prop 사용 (하위 호환성)
  const approvalItems = useMemo(() => {
    if (apiData && apiData.approvalItems) {
      // API 데이터의 status를 정규화하여 일관성 유지
      return apiData.approvalItems.map(item => ({
        ...item,
        status: getApprovalStatus(item.status)
      }))
    }
    // 기존 donationItems prop 사용 (하위 호환성)
    return (donationItems || []).map((item = {}, index) => {
      const statusLabel = getApprovalStatus(item.status)
      return {
        id: item.id || item.referenceCode || `donation-${index}`,
        name: item.name || item.items || item.productName || '등록한 기부 물품',
        category: item.category || item.itemType || '분류 미지정',
        registeredAt: item.registeredAt || item.date || item.createdAt || '-',
        status: statusLabel,
        matchingInfo:
          item.matchingInfo ||
          item.matchingSummary ||
          (statusLabel === '매칭대기'
            ? item.pendingOrganization ||
              item.donationOrganization ||
              (item.donationMethod === '직접 매칭' && item.organization && item.organization !== '자동 매칭')
              ? `${item.pendingOrganization || item.donationOrganization || item.organization} 기관 확인 중입니다.`
              : '기관 매칭을 기다리는 중입니다.'
            : statusLabel === '매칭됨'
            ? `${item.organization || item.matchedOrganization || '매칭된 기관'}과 연결되었어요.`
            : statusLabel === '승인대기'
            ? '관리자 검토 중입니다.'
            : statusLabel === '거절됨'
            ? item.rejectionReason
              ? `거절 사유: ${item.rejectionReason}`
              : '사유 확인 후 다시 신청해주세요.'
            : '-'),
        matchedOrganization: item.matchedOrganization || (statusLabel === '매칭됨' ? item.organization : null),
        referenceCode: item.referenceCode || item.id || `donation-${index}`,
        deliveryId: item.deliveryId || null // 하위 호환성을 위해 null 허용
      }
    })
  }, [apiData, donationItems])

  const approvalStatusOrder = ['승인대기', '매칭대기', '매칭됨', '거절됨', '배송대기', '배송중', '취소됨']
  const handleCancelRequest = async itemId => {
    const confirmed = window.confirm('기부 신청을 취소하시겠어요? 승인 대기 또는 매칭 대기 상태에서만 취소할 수 있습니다.')
    if (!confirmed) return

    try {
      const response = await fetch(`/api/donations/${itemId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      const result = await response.json()

      if (result.success) {
        window.alert('기부 신청이 취소되었습니다.')
        // 데이터 새로고침
        const refreshResponse = await fetch('/api/donations/status', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        })
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json()
          setApiData(refreshData)
        }
      } else {
        window.alert(result.message || '취소할 수 없는 상태입니다.')
      }
    } catch (err) {
      console.error('기부 취소 오류:', err)
      // API 실패 시 기존 onCancelDonation 콜백 사용 (하위 호환성)
      if (typeof onCancelDonation === 'function') {
        const result = onCancelDonation(itemId)
        if (result === false) {
          window.alert('취소할 수 없는 상태입니다.')
        }
      } else {
        window.alert('기부 취소 중 오류가 발생했습니다.')
      }
    }
  }


  const approvalCounts = useMemo(() => {
    // API 데이터가 있으면 statusCounts 사용 (완료 제외)
    if (apiData && apiData.statusCounts) {
      return {
        승인대기: apiData.statusCounts.승인대기 || 0,
        매칭대기: apiData.statusCounts.매칭대기 || 0,
        매칭됨: apiData.statusCounts.매칭됨 || 0,
        거절됨: apiData.statusCounts.거절됨 || 0,
        배송대기: apiData.statusCounts.배송대기 || 0,
        배송중: apiData.statusCounts.배송중 || 0,
        취소됨: apiData.statusCounts.취소됨 || 0
      }
    }
    // 기존 방식 (하위 호환성)
    const counts = approvalStatusOrder.reduce((acc, key) => {
      acc[key] = 0
      return acc
    }, {})
    approvalItems.forEach(item => {
      counts[item.status] = (counts[item.status] || 0) + 1
    })
    return counts
  }, [apiData, approvalItems])

  // 배송 상세 정보 조회
  const handleViewDeliveryDetail = async (deliveryId, event) => {
    // 이벤트 전파 방지
    if (event) {
      event.stopPropagation()
      event.preventDefault()
    }

    if (!deliveryId) {
      window.alert('배송 정보가 아직 없습니다.')
      return
    }

    console.log('배송 상세 조회 시작:', deliveryId)

    try {
      setDeliveryLoading(true)
      const response = await fetch(`/api/deliveries/${deliveryId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('배송 상세 정보를 불러오는데 실패했습니다.')
      }

      const data = await response.json()
      console.log('배송 상세 정보:', data)
      setSelectedDelivery(data)
      setShowDeliveryModal(true)
    } catch (err) {
      console.error('배송 상세 조회 실패:', err)
      alert('배송 상세 정보를 불러오는데 실패했습니다.')
    } finally {
      setDeliveryLoading(false)
    }
  }


  const handleRowClick = async (itemId, event) => {
    // 버튼 클릭 시에는 모달을 열지 않음
    if (event.target.tagName === 'BUTTON' || event.target.closest('button')) {
      return
    }

    try {
      setDetailLoading(true)
      const response = await fetch(`/api/donations/${itemId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('기부 상세 정보를 불러올 수 없습니다.')
      }

      const result = await response.json()
      if (result.success && result.donation) {
        setSelectedDonation(result.donation)
      } else {
        window.alert(result.message || '기부 상세 정보를 불러올 수 없습니다.')
      }
    } catch (err) {
      console.error('기부 상세 조회 오류:', err)
      window.alert('기부 상세 정보를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setDetailLoading(false)
    }
  }

  const completedDonations = useMemo(() => {
    // API 데이터가 있으면 사용
    if (apiData && apiData.completedDonations) {
      return apiData.completedDonations
    }
    // 기존 shipments prop 사용 (하위 호환성)
    if (!currentUser) return []
    return (shipments || [])
      .filter(
        shipment =>
          isCompletedShipment(shipment.status) &&
          (!shipment.sender || shipment.sender === currentUser.name || shipment.sender === currentUser.nickname)
      )
      .map(shipment => ({
        id: shipment.id,
        date: shipment.startDate,
        items: shipment.product,
        organization: shipment.receiver,
        status: '완료'
      }))
  }, [apiData, shipments, currentUser])

  const [selectedItems, setSelectedItems] = useState(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    setSelectedItems(prev => {
      const next = new Set()
      completedDonations.forEach(donation => {
        // ID를 문자열로 변환하여 비교 (타입 일관성 유지)
        const donationId = donation.id ? String(donation.id) : null
        if (donationId) {
          const prevIds = Array.from(prev).map(id => String(id))
          if (prevIds.includes(donationId)) {
            next.add(donationId)
          }
        }
      })
      return next
    })
  }, [completedDonations])

  const handleSelectAll = event => {
    if (event.target.checked) {
      // ID를 문자열로 변환하여 저장 (타입 일관성 유지)
      const allIds = completedDonations
        .filter(d => d && d.id)
        .map(d => String(d.id))
      setSelectedItems(new Set(allIds))
    } else {
      setSelectedItems(new Set())
    }
  }

  const handleSelectItem = (id, checked) => {
    const newSelected = new Set(selectedItems)
    // ID를 문자열로 변환하여 저장 (타입 일관성 유지)
    const idStr = String(id)
    if (checked) {
      newSelected.add(idStr)
    } else {
      newSelected.delete(idStr)
    }
    setSelectedItems(newSelected)
  }

  // ID를 문자열로 변환하여 비교
  const validDonationIds = completedDonations
    .filter(d => d && d.id)
    .map(d => String(d.id))
  const selectedIds = Array.from(selectedItems)
  const isAllSelected = validDonationIds.length > 0 && 
    validDonationIds.every(id => selectedIds.includes(id))
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < validDonationIds.length

  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentDonations = completedDonations.slice(startIndex, endIndex)
  const totalPages = Math.ceil(completedDonations.length / itemsPerPage)

  const getStatusColor = status => {
    switch (status) {
      case '완료':
        return '#4eed90'
      case '배송중':
        return '#64d1ff'
      case '승인':
        return '#ffa500'
      case '대기':
        return '#ff6b6b'
      default:
        return '#7a6b55'
    }
  }

  // PDF 선택 모달 열기
  const handleOpenPdfSelectModal = () => {
    if (completedDonations.length === 0) {
      window.alert('출력할 완료된 기부 내역이 없습니다.')
      return
    }
    // 메인 테이블에서 선택한 항목을 PDF 선택 모달로 동기화
    // selectedItems에 있는 항목 중 완료된 기부만 PDF 선택에 포함
    const mainSelectedIds = Array.from(selectedItems)
      .map(id => String(id))
      .filter(id => {
        // completedDonations에 있는 항목인지 확인
        return completedDonations.some(d => String(d.id) === id)
      })
    
    console.log('PDF 모달 열기 - 메인 테이블 선택 항목:', mainSelectedIds)
    setPdfSelectedItems(new Set(mainSelectedIds))
    setShowPdfSelectModal(true)
  }

  // PDF 선택 모달에서 전체 선택/해제 (단일 선택만 가능하므로 사용 안 함)
  // 주의: 단일 선택 모드에서는 전체 선택 기능을 사용하지 않습니다.

  // PDF 선택 모달에서 개별 선택/해제 (단일 선택만 가능)
  const handlePdfSelectItem = (id, checked) => {
    // ID를 문자열로 변환하여 저장 (타입 일관성 유지)
    const idStr = String(id)
    if (checked) {
      // 하나만 선택 가능하므로 새로운 Set에 현재 선택한 항목만 추가
      setPdfSelectedItems(new Set([idStr]))
      console.log('PDF 선택 변경 (단일 선택):', { id, idStr, checked })
    } else {
      // 해제 시 빈 Set으로 설정
      setPdfSelectedItems(new Set())
      console.log('PDF 선택 해제:', { id, idStr })
    }
  }

  // PDF 출력 함수 (한글 폰트 지원)
  const handleExportToPDF = async () => {
    try {
      // 선택된 항목 ID를 문자열 배열로 변환
      const selectedIds = Array.from(pdfSelectedItems).map(id => String(id))
      
      // 디버깅: 선택된 항목 확인
      console.log('=== PDF 출력 시작 ===')
      console.log('선택된 항목 ID (문자열):', selectedIds)
      console.log('선택된 항목 개수:', selectedIds.length)
      console.log('완료된 기부 내역:', completedDonations.map(d => ({ 
        id: d.id, 
        idType: typeof d.id,
        idString: String(d.id),
        date: d.date, 
        items: d.items 
      })))
      
      // 선택된 항목만 출력 (ID 타입 안전하게 비교)
      const donationsToExport = completedDonations.filter(d => {
        if (!d || d.id === null || d.id === undefined) {
          console.log('ID가 없는 항목 제외:', d)
          return false
        }
        // ID를 문자열로 변환하여 비교 (타입 불일치 방지)
        const donationId = String(d.id)
        const isSelected = selectedIds.includes(donationId)
        console.log(`항목 비교 - ID: ${d.id} (${typeof d.id}), 문자열: ${donationId}, 선택됨: ${isSelected}`)
        return isSelected
      })

      console.log('출력할 기부 내역:', donationsToExport.length, '개')
      console.log('출력할 기부 내역 상세:', donationsToExport)

      if (donationsToExport.length === 0) {
        console.warn('출력할 기부 내역이 없습니다. 선택된 항목:', selectedIds)
        window.alert('출력할 기부 내역을 선택해주세요.')
        return
      }

      // PDF 생성
      const doc = new jsPDF('p', 'mm', 'a4')
      
      // 한글 폰트 로드 시도
      let fontLoaded = false
      let fontName = 'helvetica'
      
      try {
        fontLoaded = await loadKoreanFont(doc)
        if (fontLoaded) {
          // 폰트가 실제로 사용 가능한지 다시 확인
          try {
            doc.setFont('NotoSansKR', 'normal')
            fontName = 'NotoSansKR'
            console.log('한글 폰트 사용 가능:', fontName)
          } catch (fontCheckError) {
            console.warn('한글 폰트 사용 불가, 기본 폰트 사용:', fontCheckError)
            fontLoaded = false
            fontName = 'helvetica'
          }
        } else {
          console.warn('한글 폰트 로드 실패, 기본 폰트(helvetica) 사용')
        }
      } catch (error) {
        console.error('한글 폰트 로드 중 오류 발생:', error)
        fontLoaded = false
        fontName = 'helvetica'
      }
      
      // 제목 추가
      doc.setFontSize(16)
      if (fontLoaded) {
        doc.setFont(fontName, 'normal')
        doc.text('기부내역확인서', 105, 25, { align: 'center' })
      } else {
        doc.setFont('helvetica', 'bold')
        doc.text('Donation History Confirmation', 105, 25, { align: 'center' })
      }
      
      let currentY = 40
      const lineHeight = 8
      const sectionSpacing = 5
      const fontSize = 10
      const labelFontSize = 10
      
      // 폰트 설정
      if (fontLoaded) {
        doc.setFont(fontName, 'normal')
      } else {
        doc.setFont('helvetica', 'normal')
      }
      
      // 1. 기부자 섹션
      doc.setFontSize(12)
      if (fontLoaded) {
        doc.text('1. 기부자', 20, currentY)
      } else {
        doc.text('1. Donor', 20, currentY)
      }
      currentY += lineHeight
      
      doc.setFontSize(labelFontSize)
      const donorName = currentUser?.name || currentUser?.username || '-'
      const donorPhone = currentUser?.phone || '-'
      const donorAddress = currentUser?.address || '-'
      
      // 성명(법인명)
      if (fontLoaded) {
        doc.text('성명(법인명)', 20, currentY)
        doc.text(donorName, 60, currentY)
      } else {
        doc.text('Name (Corporate Name)', 20, currentY)
        doc.text(donorName, 60, currentY)
      }
      currentY += lineHeight
      
      // 주민(사업자)등록번호 -> 전화번호
      if (fontLoaded) {
        doc.text('주민(사업자)등록번호', 20, currentY)
        doc.text(donorPhone, 60, currentY)
      } else {
        doc.text('Phone Number', 20, currentY)
        doc.text(donorPhone, 60, currentY)
      }
      currentY += lineHeight
      
      // 주소(소재지)
      if (fontLoaded) {
        doc.text('주소(소재지)', 20, currentY)
        doc.text(donorAddress, 60, currentY)
      } else {
        doc.text('Address (Location)', 20, currentY)
        doc.text(donorAddress, 60, currentY)
      }
      currentY += sectionSpacing + lineHeight
      
      // 2. 수혜 기관 섹션
      doc.setFontSize(12)
      if (fontLoaded) {
        doc.text('2. 수혜 기관', 20, currentY)
      } else {
        doc.text('2. Beneficiary Organization', 20, currentY)
      }
      currentY += lineHeight
      
      doc.setFontSize(labelFontSize)
      // 첫 번째 기부 내역의 수혜 기관 정보 사용 (모든 기부가 같은 기관이라고 가정)
      const firstDonation = donationsToExport[0]
      const orgName = firstDonation?.organization || '-'
      const orgRegNumber = firstDonation?.businessNo || '-'
      const orgAddress = firstDonation?.organAddress || '-'
      
      // 단체명
      if (fontLoaded) {
        doc.text('단체명', 20, currentY)
        doc.text(orgName, 60, currentY)
      } else {
        doc.text('Organization Name', 20, currentY)
        doc.text(orgName, 60, currentY)
      }
      currentY += lineHeight
      
      // 사업자(고유)등록번호
      if (fontLoaded) {
        doc.text('사업자(고유)등록번호', 20, currentY)
        doc.text(orgRegNumber, 60, currentY)
      } else {
        doc.text('Business Registration Number', 20, currentY)
        doc.text(orgRegNumber, 60, currentY)
      }
      currentY += lineHeight
      
      // 소재지
      if (fontLoaded) {
        doc.text('소재지', 20, currentY)
        doc.text(orgAddress, 60, currentY)
      } else {
        doc.text('Location', 20, currentY)
        doc.text(orgAddress, 60, currentY)
      }
      currentY += sectionSpacing + lineHeight
      
      // 기부내용 테이블
      doc.setFontSize(12)
      if (fontLoaded) {
        doc.text('기부내용', 20, currentY)
      } else {
        doc.text('Donation Details', 20, currentY)
      }
      currentY += lineHeight

      // 기부내용 테이블 데이터 준비
      // 구분: 기부 물품 메인 카테고리
      // 연월일: 기부 일자
      // 품명: 기부 물품 상세 카테고리
      const tableData = donationsToExport.map(donation => {
        const mainCategory = donation.mainCategory || donation.items || '-'
        const detailCategory = donation.detailCategory || donation.items || '-'
        
        return [
          mainCategory, // 구분
          donation.date || '-', // 연월일
          detailCategory // 품명
        ]
      })

      // 테이블 생성 (한글 지원)
      let tableFont = 'helvetica'
      let finalTableHeaders = [['Category', 'Date', 'Item Name']]
      
      if (fontLoaded && fontName === 'NotoSansKR') {
        tableFont = 'NotoSansKR'
        finalTableHeaders = [['구분', '연월일', '품명']]
      }
      
      try {
        doc.autoTable({
          startY: currentY,
          head: finalTableHeaders,
          body: tableData,
          columnStyles: {
            0: { // 구분 컬럼
              cellWidth: 50,
              halign: 'left'
            },
            1: { // 연월일 컬럼
              cellWidth: 50,
              halign: 'center'
            },
            2: { // 품명 컬럼
              cellWidth: 'auto',
              halign: 'center' // 중앙 정렬로 변경
            }
          },
          styles: {
            fontSize: 9,
            cellPadding: 3,
            font: tableFont,
            halign: 'left',
            overflow: 'linebreak'
          },
          headStyles: {
            fillColor: [122, 107, 85], // #7a6b55
            textColor: 255,
            fontStyle: 'bold',
            font: tableFont,
            halign: 'center'
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245]
          },
          margin: { top: currentY, left: 20, right: 20 },
          // 한글 텍스트 처리
          didParseCell: function (data) {
            if (data.cell.text) {
              data.cell.text = String(data.cell.text)
            }
            // 헤더는 중앙 정렬
            if (data.section === 'head') {
              data.cell.styles.halign = 'center'
            }
            // 데이터 행은 컬럼별 정렬
            if (data.section === 'body') {
              if (data.column.index === 0) { // 구분
                data.cell.styles.halign = 'left'
              } else if (data.column.index === 1) { // 연월일
                data.cell.styles.halign = 'center'
              } else if (data.column.index === 2) { // 품명
                data.cell.styles.halign = 'center' // 중앙 정렬로 변경
              }
            }
          }
        })
      } catch (tableError) {
        console.error('테이블 생성 오류:', tableError)
        // 폰트 문제일 수 있으므로 기본 폰트로 재시도
        if (tableFont === 'NotoSansKR') {
          console.warn('한글 폰트로 테이블 생성 실패, 기본 폰트로 재시도')
          throw tableError // 양식 형태가 복잡하므로 재시도하지 않고 오류 처리
        } else {
          throw tableError
        }
      }

      // 파일명 생성
      const fileName = `기부내역_${currentUser?.name || currentUser?.username || 'user'}_${new Date().toISOString().split('T')[0]}.pdf`
      
      // PDF 저장
      doc.save(fileName)
      
      // 모달 닫기
      setShowPdfSelectModal(false)
      setPdfSelectedItems(new Set())
      
      window.alert(`PDF 파일이 다운로드되었습니다. (총 ${donationsToExport.length}건)`)
    } catch (error) {
      console.error('PDF 생성 오류:', error)
      console.error('오류 상세:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      window.alert(`PDF 생성 중 오류가 발생했습니다.\n\n오류: ${error.message || '알 수 없는 오류'}`)
    }
  }

  const renderApprovalTab = () => {
    if (loading) {
      return (
        <div className="donation-status-empty">
          <p>기부 정보를 불러오는 중...</p>
        </div>
      )
    }

    if (error) {
      return (
        <div className="donation-status-empty">
          <p style={{ color: '#ff6b6b', marginBottom: '8px' }}>⚠️ 기부 정보를 불러오는 중 오류가 발생했습니다.</p>
          <p style={{ fontSize: '14px', color: '#666' }}>{error}</p>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
            브라우저 콘솔(F12)을 확인해주세요.
          </p>
        </div>
      )
    }

    if (approvalItems.length === 0) {
      return (
        <div className="donation-status-empty">
          <p>아직 등록한 기부 물품이 없습니다.</p>
          <p>물품을 등록하면 승인 진행 상황을 확인할 수 있어요.</p>
        </div>
      )
    }

    return (
      <>
        <div className="approval-status-grid">
          {approvalStatusOrder.map(status => (
            <div
              key={status}
              className="approval-status-card"
              style={{ borderColor: getApprovalStatusColor(status) }}
            >
              <div className="approval-status-card-header">
                <span>{status}</span>
                <strong>{approvalCounts[status]}</strong>
              </div>
              <p>{approvalStatusDescriptions[status]}</p>
            </div>
          ))}
        </div>

        <div className="donation-table-container approval-table">
          <table className="donation-table">
            <thead>
              <tr>
                <th>등록일</th>
                <th>물품 정보</th>
                <th>진행 상태</th>
                <th>매칭 정보</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {approvalItems.map(item => (
                <tr 
                  key={item.id}
                  onClick={(e) => handleRowClick(item.id, e)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{item.registeredAt}</td>
                  <td>
                    <div className="approval-item-name">{item.name}</div>
                    <div className="approval-item-meta">{item.category}</div>
                  </td>
                  <td>
                    <span
                      className="donation-status-badge"
                      style={{ color: getApprovalStatusColor(item.status) }}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <div className="approval-item-matching">{item.matchingInfo}</div>
                    {item.matchedOrganization && (
                      <span className="approval-item-organization">{item.matchedOrganization}</span>
                    )}
                  </td>
                  <td>
                    <div className="approval-item-status-cell">
                      <span className="approval-item-placeholder">
                        {approvalStatusDescriptions[item.status] || '진행 중입니다.'}
                      </span>
                      {['승인대기', '매칭대기'].includes(item.status) && (
                        <button
                          type="button"
                          className="btn-cancel"
                          onClick={() => handleCancelRequest(item.id)}
                        >
                          기부 취소
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="donation-hint">승인 · 매칭 · 거절 상태가 바뀌면 알림으로 알려드릴게요.</p>
      </>
    )
  }

  const renderDonationDetailModal = () => {
    if (!selectedDonation) return null

    const donation = selectedDonation
    const item = donation.item || {}
    const organization = donation.organization || null
    const delivery = donation.delivery || null

    return (
      <div className="donation-modal-overlay" onClick={() => setSelectedDonation(null)}>
        <div className="donation-modal" onClick={e => e.stopPropagation()}>
          <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
            <h2 style={{ marginTop: 0, marginBottom: 0, color: '#2f261c' }}>
              기부 상세 정보
            </h2>
            <button
              type="button"
              onClick={() => setSelectedDonation(null)}
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                background: 'transparent',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#7a6b55',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#f5f5f5'
                e.target.style.color = '#2f261c'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent'
                e.target.style.color = '#7a6b55'
              }}
            >
              ×
            </button>
          </div>

          {/* 물품 정보 */}
          {(() => {
            // 이미지 URL 리스트 생성
            let imageList = []
            if (item.imageUrls && Array.isArray(item.imageUrls) && item.imageUrls.length > 0) {
              imageList = item.imageUrls
            } else if (item.imageUrl) {
              imageList = [item.imageUrl]
            }

            console.log('기부 상세 모달 - 이미지 정보:', {
              imageUrl: item.imageUrl,
              imageUrls: item.imageUrls,
              imageList: imageList
            })

            if (imageList.length === 0) {
              console.warn('기부 상세 모달 - 이미지가 없습니다.')
              return null
            }

            return (
              <div style={{ marginBottom: '1.5rem' }}>
                {imageList.map((imgUrl, idx) => {
                  // 이미지 URL 처리
                  let imageSrc = imgUrl
                  
                  if (!imageSrc) {
                    console.warn('기부 상세 모달 - 이미지 URL이 비어있습니다:', imgUrl)
                    return null
                  }

                  // 이미지 URL 정규화
                  if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://') || imageSrc.startsWith('data:')) {
                    // 이미 전체 URL이거나 data URL인 경우 그대로 사용
                    imageSrc = imageSrc
                  } else if (imageSrc.startsWith('/uploads/')) {
                    // /uploads/로 시작하는 경우 그대로 사용 (상대 경로)
                    imageSrc = imageSrc
                  } else {
                    // 파일명만 있는 경우 /uploads/ 경로 추가
                    imageSrc = `/uploads/${imageSrc}`
                  }

                  console.log(`기부 상세 모달 - 이미지 ${idx + 1} URL:`, imageSrc)
                  
                  return (
                    <div key={idx} style={{ marginBottom: idx < imageList.length - 1 ? '1rem' : 0 }}>
                      <img 
                        src={imageSrc}
                        alt={item.name || '기부 물품'} 
                        onError={(e) => {
                          console.error('이미지 로드 실패:', {
                            imageSrc,
                            originalUrl: imgUrl,
                            error: e
                          })
                          e.target.style.display = 'none'
                        }}
                        onLoad={() => {
                          console.log('이미지 로드 성공:', imageSrc)
                        }}
                        style={{ 
                          maxHeight: '400px', 
                          objectFit: 'contain',
                          width: '100%',
                          borderRadius: '12px',
                          border: '1px solid #eee',
                          display: 'block'
                        }}
                      />
                    </div>
                  )
                })}
              </div>
            )
          })()}

          <div className="image-meta">
            <div>
              <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#2f261c' }}>물품 정보</h3>
              <ul className="image-detail-list">
                {item.name && <li><strong>물품명:</strong> {item.name}</li>}
                {item.size && <li><strong>사이즈:</strong> {item.size}</li>}
                {item.genderType && <li><strong>성별:</strong> {item.genderType}</li>}
                {item.description && <li><strong>설명:</strong> {item.description}</li>}
              </ul>
            </div>

            <div>
              <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#2f261c' }}>기부 정보</h3>
              <ul className="image-detail-list">
                <li><strong>등록일:</strong> {donation.createdAt || '-'}</li>
                <li><strong>상태:</strong> 
                  <span 
                    className="donation-status-badge" 
                    style={{ color: getApprovalStatusColor(donation.status), marginLeft: '0.5rem' }}
                  >
                    {donation.status}
                  </span>
                </li>
                {organization && (
                  <li><strong>매칭 기관:</strong> {organization.name}</li>
                )}
                {donation.matchingInfo && (
                  <li><strong>매칭 정보:</strong> {donation.matchingInfo}</li>
                )}
                {delivery && (
                  <>
                    {delivery.status && (
                      <li><strong>배송 상태:</strong> {
                        delivery.status === 'DELIVERED' ? '완료' :
                        delivery.status === 'IN_TRANSIT' ? '배송중' :
                        (delivery.status === 'PENDING' || delivery.status === 'PREPARING') ? '대기' :
                        delivery.status === 'CANCELLED' ? '취소' : delivery.status
                      }</li>
                    )}
                    {delivery.carrier && <li><strong>택배사:</strong> {delivery.carrier}</li>}
                    {delivery.trackingNumber && <li><strong>송장번호:</strong> {delivery.trackingNumber}</li>}
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 배송 상세 정보 모달 렌더링
  const renderDeliveryDetailModal = () => {
    if (!showDeliveryModal || !selectedDelivery) return null

    const convertStatus = (status) => {
      switch (status) {
        case 'DELIVERED':
          return '완료'
        case 'IN_TRANSIT':
          return '배송중'
        case 'PREPARING':
        case 'PENDING':
          return '대기'
        case 'CANCELLED':
          return '취소'
        default:
          return '대기'
      }
    }

    const statusColor = (status) => {
      switch (status) {
        case '완료':
          return '#4eed90'
        case '배송중':
          return '#64d1ff'
        case '대기':
          return '#ffb347'
        case '취소':
          return '#ff6b6b'
        default:
          return '#7a6b55'
      }
    }

    const deliveryStatus = convertStatus(selectedDelivery.status)
    const statusColorValue = statusColor(deliveryStatus)

    return (
      <div 
        className="modal-overlay" 
        onClick={() => {
          setShowDeliveryModal(false)
          setSelectedDelivery(null)
        }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
      >
        <div 
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2>배송 상세 정보</h2>
            <button 
              onClick={() => {
                setShowDeliveryModal(false)
                setSelectedDelivery(null)
              }}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#7a6b55'
              }}
            >
              ×
            </button>
          </div>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <strong>송장번호:</strong> {selectedDelivery.trackingNumber || `DEL-${selectedDelivery.id}`}
            </div>
            <div>
              <strong>택배사:</strong> {selectedDelivery.carrier || '미정'}
            </div>
            <div>
              <strong>배송 상태:</strong> 
              <span 
                className="donation-status-badge" 
                style={{ color: statusColorValue, marginLeft: '0.5rem' }}
              >
                {deliveryStatus}
              </span>
            </div>
            
            <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem', marginTop: '1rem' }}>
              <h3 style={{ marginBottom: '0.5rem', color: '#2f261c' }}>보내는 사람</h3>
              <div><strong>이름:</strong> {selectedDelivery.senderName}</div>
              <div><strong>전화번호:</strong> {selectedDelivery.senderPhone}</div>
              <div><strong>주소:</strong> {selectedDelivery.senderAddress} {selectedDelivery.senderDetailAddress || ''}</div>
              {selectedDelivery.senderPostalCode && (
                <div><strong>우편번호:</strong> {selectedDelivery.senderPostalCode}</div>
              )}
            </div>
            
            <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem' }}>
              <h3 style={{ marginBottom: '0.5rem', color: '#2f261c' }}>받는 사람</h3>
              <div><strong>이름:</strong> {selectedDelivery.receiverName}</div>
              <div><strong>전화번호:</strong> {selectedDelivery.receiverPhone}</div>
              <div><strong>주소:</strong> {selectedDelivery.receiverAddress} {selectedDelivery.receiverDetailAddress || ''}</div>
              {selectedDelivery.receiverPostalCode && (
                <div><strong>우편번호:</strong> {selectedDelivery.receiverPostalCode}</div>
              )}
            </div>
            
            {selectedDelivery.donation && selectedDelivery.donation.donationItem && (
              <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                <h3 style={{ marginBottom: '0.5rem', color: '#2f261c' }}>배송 물품</h3>
                {(selectedDelivery.donation.donationItem.detailCategory || selectedDelivery.donation.donationItem.mainCategory) && (
                  <div><strong>카테고리:</strong> {selectedDelivery.donation.donationItem.detailCategory || selectedDelivery.donation.donationItem.mainCategory}</div>
                )}
                {selectedDelivery.donation.donationItem.size && (
                  <div><strong>사이즈:</strong> {selectedDelivery.donation.donationItem.size}</div>
                )}
                {selectedDelivery.donation.donationItem.genderType && (
                  <div><strong>성별:</strong> {selectedDelivery.donation.donationItem.genderType === 'MALE' ? '남성' : selectedDelivery.donation.donationItem.genderType === 'FEMALE' ? '여성' : '공용'}</div>
                )}
                {selectedDelivery.donation.donationItem.quantity && selectedDelivery.donation.donationItem.quantity > 1 && (
                  <div><strong>수량:</strong> {selectedDelivery.donation.donationItem.quantity}개</div>
                )}
                {selectedDelivery.donation.donationItem.description && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <strong>설명:</strong>
                    <div style={{ marginTop: '0.25rem', color: '#666', fontSize: '0.9rem' }}>
                      {selectedDelivery.donation.donationItem.description}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem' }}>
              <h3 style={{ marginBottom: '0.5rem', color: '#2f261c' }}>배송 일정</h3>
              {selectedDelivery.shippedAt && (
                <div><strong>배송 시작:</strong> {new Date(selectedDelivery.shippedAt).toLocaleString('ko-KR')}</div>
              )}
              {selectedDelivery.deliveredAt && (
                <div><strong>배송 완료:</strong> {new Date(selectedDelivery.deliveredAt).toLocaleString('ko-KR')}</div>
              )}
              {selectedDelivery.createdAt && (
                <div><strong>등록일:</strong> {new Date(selectedDelivery.createdAt).toLocaleString('ko-KR')}</div>
              )}
            </div>
          </div>
          
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                setShowDeliveryModal(false)
                setSelectedDelivery(null)
              }}
              style={{
                padding: '0.5rem 1rem',
                background: '#f5f5f5',
                color: '#2f261c',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderHistoryTab = () => (
    <>
      {/* 완료된 기부 개수 표시 */}
      {completedDonations.length > 0 && (
        <div className="approval-status-grid" style={{ marginBottom: '1.5rem' }}>
          <div
            className="approval-status-card"
            style={{ borderColor: '#4eed90' }}
          >
            <div className="approval-status-card-header">
              <span>완료</span>
              <strong style={{ fontSize: '2.5rem', fontWeight: '700', color: '#4eed90' }}>
                {completedDonations.length}
              </strong>
            </div>
            <p>기부가 완료되었습니다.</p>
          </div>
        </div>
      )}
      
      <div className="donation-status-actions">
        <div className="donation-search">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input type="search" placeholder="검색..." />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn-filter"
            onClick={handleOpenPdfSelectModal}
            disabled={completedDonations.length === 0}
            style={{
              padding: '0.5rem 1rem',
              background: completedDonations.length === 0 ? '#ccc' : '#7a6b55',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: completedDonations.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            PDF 출력
          </button>
          <button type="button" className="btn-cancel" onClick={onNavigateHome}>
            홈으로
          </button>
        </div>
      </div>

      {completedDonations.length === 0 ? (
        <div className="donation-status-empty">
          <p>아직 기부 내역이 없습니다.</p>
          <p>기부를 진행한 후 조회할 수 있습니다.</p>
        </div>
      ) : (
        <>
          <div className="donation-table-container">
            <table className="donation-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={input => {
                        if (input) input.indeterminate = isIndeterminate
                      }}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>기부 날짜 ↓</th>
                  <th>기부 내용 ↓</th>
                  <th>수혜 기관 ↓</th>
                  <th>배송 상태 ↓</th>
                  <th>배송 조회</th>
                </tr>
              </thead>
              <tbody>
                {currentDonations.map(donation => {
                  // ID를 문자열로 변환하여 비교 (타입 일관성 유지)
                  const donationId = donation.id ? String(donation.id) : null
                  const isChecked = donationId ? selectedItems.has(donationId) : false
                  
                  return (
                  <tr key={donation.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={e => handleSelectItem(donation.id, e.target.checked)}
                      />
                    </td>
                    <td>{donation.date}</td>
                    <td>{donation.items}</td>
                    <td>{donation.organization}</td>
                    <td>
                      <span className="donation-status-badge" style={{ color: getStatusColor(donation.status) }}>
                        {donation.status}
                      </span>
                    </td>
                  <td>
                    <button
                      type="button"
                      className="btn-filter"
                      disabled={!donation.deliveryId || deliveryLoading}
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        console.log('배송 조회 버튼 클릭:', donation.deliveryId)
                        handleViewDeliveryDetail(donation.deliveryId, e)
                      }}
                    >
                      {deliveryLoading ? '로딩...' : '배송 조회'}
                    </button>
                  </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="donation-pagination">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              if (i === 4 && totalPages > 5) {
                return (
                  <button key="ellipsis" type="button" className="pagination-ellipsis" disabled>
                    ...
                  </button>
                )
              }
              const pageNum = i + 1
              return (
                <button
                  key={pageNum}
                  type="button"
                  className={currentPage === pageNum ? 'active' : ''}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              )
            })}
            {totalPages > 5 && (
              <button
                type="button"
                className={currentPage === totalPages ? 'active' : ''}
                onClick={() => setCurrentPage(totalPages)}
              >
                {totalPages}
              </button>
            )}
          </div>
        </>
      )}
    </>
  )

  return (
    <section className="main-page donation-status-page">
      <div className="main-shell donation-status-shell">
        <HeaderLanding
          role={currentUser?.role}
          onLogoClick={onNavigateHome}
          onNavClick={onNavLink}
          isLoggedIn={isLoggedIn}
          onLogout={onLogout}
          onLogin={onLogin}
          onNotifications={onNotifications}
          unreadCount={unreadCount}
          onMenu={onMenu}
        />

        <div className="donation-status-content">
          <div className="donation-status-header">
            <div>
              <p className="donation-status-subtitle">내 기부 관리</p>
              <h1>내 기부 관리</h1>
              <p>물품 승인부터 배송 완료까지 한 화면에서 확인하세요.</p>
            </div>
            <button type="button" className="btn-cancel" onClick={onNavigateHome}>
              홈으로
            </button>
          </div>

          <div className="donation-status-tabs">
            <button
              type="button"
              className={activeTab === 'approval' ? 'active' : ''}
              onClick={() => setActiveTab('approval')}
            >
              물품 현황
            </button>
            <button
              type="button"
              className={activeTab === 'history' ? 'active' : ''}
              onClick={() => setActiveTab('history')}
            >
              기부 내역 조회
            </button>
          </div>

          {activeTab === 'approval' ? renderApprovalTab() : renderHistoryTab()}
        </div>
      </div>

      {renderDonationDetailModal()}
      {renderDeliveryDetailModal()}
      {renderPdfSelectModal()}
    </section>
  )

  // PDF 선택 모달 렌더링
  function renderPdfSelectModal() {
    if (!showPdfSelectModal) return null

    // ID를 문자열로 변환하여 비교
    const validDonationIds = completedDonations
      .filter(d => d && d.id)
      .map(d => String(d.id))
    const selectedIds = Array.from(pdfSelectedItems)
    const isAllSelected = validDonationIds.length > 0 && 
      validDonationIds.every(id => selectedIds.includes(id))
    const isIndeterminate = selectedIds.length > 0 && selectedIds.length < validDonationIds.length

    return (
      <div 
        className="modal-overlay" 
        onClick={() => {
          setShowPdfSelectModal(false)
          setPdfSelectedItems(new Set())
        }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
      >
        <div 
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0, color: '#2f261c' }}>PDF 출력할 기부 내역 선택</h2>
            <button 
              onClick={() => {
                setShowPdfSelectModal(false)
                setPdfSelectedItems(new Set())
              }}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#7a6b55'
              }}
            >
              ×
            </button>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <p style={{ margin: '0 0 1rem 0', color: '#666', fontSize: '14px' }}>
              완료된 기부 내역 중 출력할 항목을 하나만 선택해주세요. {pdfSelectedItems.size > 0 && `(${pdfSelectedItems.size}개 선택됨)`}
            </p>
          </div>

          <div style={{ border: '1px solid #eee', borderRadius: '4px', overflow: 'hidden', maxHeight: '400px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #eee', width: '40px' }}>
                    선택
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #eee' }}>기부 날짜</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #eee' }}>기부 내용</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #eee' }}>수혜 기관</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #eee' }}>상태</th>
                </tr>
              </thead>
              <tbody>
                {completedDonations.map(donation => {
                  // ID를 문자열로 변환하여 비교 (타입 일관성 유지)
                  const donationId = donation.id ? String(donation.id) : null
                  const isChecked = donationId ? pdfSelectedItems.has(donationId) : false
                  
                  return (
                  <tr key={donation.id || donation.date} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={e => {
                          console.log('체크박스 클릭:', { 
                            donationId: donation.id, 
                            donationIdType: typeof donation.id,
                            checked: e.target.checked 
                          })
                          handlePdfSelectItem(donation.id, e.target.checked)
                        }}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ padding: '0.75rem' }}>{donation.date}</td>
                    <td style={{ padding: '0.75rem' }}>{donation.items}</td>
                    <td style={{ padding: '0.75rem' }}>{donation.organization}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ color: getStatusColor(donation.status) }}>
                        {donation.status}
                      </span>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                setShowPdfSelectModal(false)
                setPdfSelectedItems(new Set())
              }}
              style={{
                padding: '0.5rem 1rem',
                background: '#f5f5f5',
                color: '#2f261c',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              취소
            </button>
            <button
              onClick={() => {
                console.log('PDF 출력 버튼 클릭 - 선택된 항목:', Array.from(pdfSelectedItems))
                console.log('선택된 항목 개수:', pdfSelectedItems.size)
                if (pdfSelectedItems.size === 0) {
                  window.alert('출력할 기부 내역을 선택해주세요.')
                  return
                }
                handleExportToPDF()
              }}
              disabled={pdfSelectedItems.size === 0}
              style={{
                padding: '0.5rem 1rem',
                background: pdfSelectedItems.size === 0 ? '#ccc' : '#7a6b55',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: pdfSelectedItems.size === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              PDF 출력
            </button>
          </div>
        </div>
      </div>
    )
  }
}

