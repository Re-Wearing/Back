import { useEffect, useState } from 'react'
import HeaderLanding from '../components/HeaderLanding'
import { formatPhoneNumber, stripPhoneNumber } from '../utils/phone'

const ITEM_CATEGORIES = [
  '남성 의류',
  '여성 의류',
  '아동 의류',
  '공용 의류',
  '액세서리리'
]

const ITEM_DETAILS = {
  '남성 의류': ['상의', '하의', '아우터', '한 벌 옷', '기타 의류'],
  '여성 의류': ['상의', '하의', '아우터', '한 벌 옷', '기타 의류'],
  '아동 의류': ['상의', '하의', '아우터', '한 벌 옷', '기타 의류'],
  '공용 의류': ['상의', '하의', '아우터', '한 벌 옷', '기타 의류'],
  '액세서리리': ['시계', '가방', '모자', '장갑', '스카프', '기타 액세서리'],
}

const ITEM_SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'FREE', '기타 사이즈']

const ITEM_CONDITIONS = ['새상품', '사용감 적음', '사용감 보통', '사용감 많음']

const DONATION_METHODS = ['자동 매칭', '직접 매칭']
const DELIVERY_METHODS = ['직접 배송', '택배 배송']

const GENDER_MAP = {
  '남성 의류': 'MALE',
  '여성 의류': 'FEMALE',
  '아동 의류': 'CHILD',
  '공용 의류': 'UNISEX',
  '액세서리리': 'UNISEX'
}

const DETAIL_TO_CLOTH_MAP = {
  '남성 의류': 'ETC',
  '여성 의류': 'ETC',
  '아동 의류': 'ETC',
  '공용 의류': 'ETC',
  '액세서리리': 'ACCESSORY',
  상의: 'TOP',
  하의: 'BOTTOM',
  아우터: 'OUTERWEAR',
  '한 벌 옷': 'ETC',
  '기타 의류': 'ETC',
  신발: 'SHOES',
  시계: 'ACCESSORY',
  가방: 'ACCESSORY',
  모자: 'ACCESSORY',
  장갑: 'ACCESSORY',
  스카프: 'ACCESSORY',
  '기타 액세서리': 'ACCESSORY'
}

const SIZE_MAP = {
  S: 'S',
  M: 'M',
  L: 'L',
  XL: 'XL',
  XXL: 'XXL',
  FREE: 'F',
  '기타 사이즈': 'F'
}

const MATCH_TYPE_MAP = {
  '자동 매칭': 'INDIRECT',
  '직접 매칭': 'DIRECT'
}

const DELIVERY_METHOD_MAP = {
  '직접 배송': 'DIRECT_DELIVERY',
  '택배 배송': 'PARCEL_DELIVERY'
}

const mapGenderType = (itemType) => GENDER_MAP[itemType] || 'UNISEX'

const mapClothType = (detail, fallback) => {
  if (detail && DETAIL_TO_CLOTH_MAP[detail]) {
    return DETAIL_TO_CLOTH_MAP[detail]
  }
  if (fallback && DETAIL_TO_CLOTH_MAP[fallback]) {
    return DETAIL_TO_CLOTH_MAP[fallback]
  }
  return 'ETC'
}

const mapSizeType = (size) => SIZE_MAP[size] || 'F'
const mapMatchType = (method) => MATCH_TYPE_MAP[method] || null
const mapDeliveryMethod = (method) => DELIVERY_METHOD_MAP[method] || null

export default function DonationPage({
  onNavigateHome,
  onNavLink,
  isLoggedIn = false,
  onLogout = () => {},
  onNotifications = () => {},
  unreadCount = 0,
  onMenu = () => {},
  currentUser,
  currentProfile,
  onRequireLogin,
  onAddDonation,
  onGoToDonationStatus,
  availableOrganizations = []
}) {
  const today = new Date().toISOString().split('T')[0]
  const [itemType, setItemType] = useState('')
  const [itemDetail, setItemDetail] = useState('')
  const [itemSize, setItemSize] = useState('')
  const [itemCondition, setItemCondition] = useState('')
  const [itemDescription, setItemDescription] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [images, setImages] = useState([])
  const [errors, setErrors] = useState({})
  const [step, setStep] = useState('item') // 'item' or 'application'
  
  // 기부 신청 폼 상태
  const [donationMethod, setDonationMethod] = useState('')
  const [donationOrganization, setDonationOrganization] = useState('')
  const [donationOrganizationLabel, setDonationOrganizationLabel] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [contact, setContact] = useState('')
  const [desiredDate, setDesiredDate] = useState(today)
  const [memo, setMemo] = useState('')
  const [applicationErrors, setApplicationErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')
  const applicantName = currentProfile?.fullName || currentUser?.name || currentUser?.username || '신청자'

  const fileToDataURL = file =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const handleItemTypeChange = (value) => {
    setItemType(value)
    setItemDetail('')
  }

  const handleImageUpload = async (e, type) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    try {
      const items = await Promise.all(
        files.map(async file => ({
          id: `${Date.now()}-${Math.random()}`,
          type,
          dataUrl: await fileToDataURL(file),
          file
        }))
      )
      setImages(prev => [...prev, ...items])
      setServerError('')
    } catch (error) {
      console.error('Failed to read files', error)
    } finally {
      if (e.target) {
        e.target.value = ''
      }
    }
  }

  const handleRemoveImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!itemType) {
      newErrors.itemType = '물품 종류를 선택해주세요.'
    }

    if (itemType && itemType !== '기타' && !itemDetail) {
      newErrors.itemDetail = '물품 상세를 선택해주세요.'
    }

    if (!itemSize) {
      newErrors.itemSize = '물품 사이즈를 선택해주세요.'
    }

    if (!itemCondition) {
      newErrors.itemCondition = '물품 상태 정보를 선택해주세요.'
    }

    if (!itemDescription.trim()) {
      newErrors.itemDescription = '물품 상세 정보를 입력해주세요.'
    }

    if (quantity < 1) {
      newErrors.quantity = '수량은 1개 이상이어야 합니다.'
    }

    if (images.length === 0 || images.every(img => !img.file)) {
      newErrors.images = '사진을 최소 1개 이상 업로드해주세요.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!isLoggedIn || !currentUser) {
      if (onRequireLogin) {
        onRequireLogin()
      }
      return
    }

    if (!validateForm()) {
      return
    }

    setServerError('')
    setApplicationErrors({})
    setStep('application')
  }

  const requiresShippingFields = donationMethod === '자동 매칭' || donationMethod === '직접 매칭'

  useEffect(() => {
    if (!contact && (currentProfile?.phone || currentUser?.phone)) {
      const fallbackPhone = currentProfile?.phone || currentUser?.phone || ''
      if (fallbackPhone) {
        setContact(formatPhoneNumber(fallbackPhone))
      }
    }
  }, [contact, currentProfile, currentUser])

  const validateApplicationForm = () => {
    const newErrors = {}

    if (!donationMethod) {
      newErrors.donationMethod = '기부 방법을 선택해주세요.'
    }

    if (donationMethod === '직접 매칭') {
      if (!donationOrganization) {
        newErrors.donationOrganization = '기부할 기관을 선택해주세요.'
      }
    }

    if (requiresShippingFields) {
      if (!deliveryMethod) {
        newErrors.deliveryMethod = '배송 방법을 선택해주세요.'
      }
      if (deliveryMethod && deliveryMethod !== '직접 배송' && !desiredDate) {
        newErrors.desiredDate = '희망일을 선택해주세요.'
      }
    }

    if (!contact.trim()) {
      newErrors.contact = '연락처를 입력해주세요.'
    }

    setApplicationErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const buildDonationDescription = () => {
    const summary = [
      itemDescription && `상세 정보: ${itemDescription.trim()}`,
      itemCondition && `물품 상태: ${itemCondition}`,
      quantity && `수량: ${quantity}`,
      contact && `연락처: ${formatPhoneNumber(stripPhoneNumber(contact))}`,
      desiredDate && `희망일: ${desiredDate}`,
      memo && memo.trim() && `메모: ${memo.trim()}`
    ].filter(Boolean)
    return summary.join('\n')
  }

  const resetForms = () => {
    setStep('item')
    setItemType('')
    setItemDetail('')
    setItemSize('')
    setItemCondition('')
    setItemDescription('')
    setQuantity(1)
    setImages([])
    setDonationMethod('')
    setDonationOrganization('')
    setDonationOrganizationLabel('')
    setDeliveryMethod('')
    setIsAnonymous(false)
    setContact('')
    setDesiredDate(today)
    setMemo('')
    setApplicationErrors({})
    setErrors({})
    setServerError('')
  }
    
  const handleApplicationSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    
    if (!validateApplicationForm()) {
      return
    }

    const genderTypeEnum = mapGenderType(itemType)
    const clothTypeEnum = mapClothType(itemDetail, itemType)
    const sizeEnum = mapSizeType(itemSize)
    const matchTypeEnum = mapMatchType(donationMethod)
    const deliveryMethodEnum = mapDeliveryMethod(deliveryMethod)

    if (!matchTypeEnum) {
      setServerError('기부 방법을 다시 선택해주세요.')
      return
    }

    if (!deliveryMethodEnum) {
      setServerError('배송 방법을 다시 선택해주세요.')
      return
    }

    let organIdValue = null
    if (matchTypeEnum === 'DIRECT') {
      organIdValue = Number(donationOrganization)
      if (!organIdValue) {
        setApplicationErrors(prev => ({
          ...prev,
          donationOrganization: '기관 목록을 다시 확인해주세요.'
        }))
        setServerError('기관 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
        return
      }
    }

    if (images.length === 0 || images.every(image => !image.file)) {
      setServerError('이미지를 다시 업로드해주세요.')
      return
    }

    const formData = new FormData()
    formData.append('genderType', genderTypeEnum)
    formData.append('mainCategory', clothTypeEnum)
    if (itemDetail) {
      formData.append('detailCategory', itemDetail)
    }
    formData.append('size', sizeEnum)
    formData.append('description', buildDonationDescription())
    formData.append('matchType', matchTypeEnum)
    formData.append('deliveryMethod', deliveryMethodEnum)
    formData.append('isAnonymous', String(isAnonymous))
    if (organIdValue) {
      formData.append('organId', organIdValue)
    }
    images.forEach(image => {
      if (image.file) {
        formData.append('images', image.file)
      }
    })

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/donations', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      let data = null
      try {
        data = await response.json()
      } catch (jsonError) {
        data = null
      }

      if (!response.ok || (data && data.ok === false)) {
        throw new Error(data?.message || '기부 신청에 실패했습니다.')
      }

      if (onAddDonation) {
        const formattedContact = formatPhoneNumber(stripPhoneNumber(contact))
        onAddDonation({
          itemType,
          itemDetail,
          itemSize,
          itemCondition,
          itemDescription,
          donationMethod,
          donationOrganizationId: organIdValue,
          donationOrganizationName: organIdValue ? donationOrganizationLabel : null,
          deliveryMethod,
          isAnonymous,
          contact: formattedContact,
          desiredDate,
          memo,
          images
        })
      }

      alert('기부 신청이 완료되었습니다! 감사합니다.')
      resetForms()

      if (onGoToDonationStatus) {
        onGoToDonationStatus()
      } else {
        onNavigateHome()
      }
    } catch (error) {
      setServerError(error.message || '기부 신청 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const directMatchOptions = Array.isArray(availableOrganizations)
    ? availableOrganizations
        .map(org => ({
          label: org.name || org.orgName || org.label || org.value,
          value:
            org.id !== undefined
              ? String(org.id)
              : org.username || org.value || org.label || org.name || ''
        }))
        .filter(option => option.value)
    : []

  const renderShippingFields = () => (
    <>
      <div className="form-group">
        <label htmlFor="deliveryMethod">
          배송 방법
          {applicationErrors.deliveryMethod && (
            <span className="error-message">{applicationErrors.deliveryMethod}</span>
          )}
        </label>
        <div className="select-wrapper">
          <select
            id="deliveryMethod"
            value={deliveryMethod}
            onChange={(e) => {
              setDeliveryMethod(e.target.value)
              setServerError('')
            }}
            className={applicationErrors.deliveryMethod ? 'error' : ''}
          >
            <option value="">선택하세요</option>
            {DELIVERY_METHODS.map(method => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
          {deliveryMethod && (
            <>
              <span className="check-icon" aria-label="선택됨">✓</span>
              <button
                type="button"
                className="btn-clear"
                onClick={() => {
                  setDeliveryMethod('')
                  setServerError('')
                }}
                aria-label="선택 취소"
              >
                ×
              </button>
            </>
          )}
        </div>
      </div>

      {deliveryMethod && (
        <>
          {deliveryMethod !== '직접 배송' && (
            <div className="form-group">
              <label htmlFor="desiredDate">
                희망일
                {applicationErrors.desiredDate && (
                  <span className="error-message">{applicationErrors.desiredDate}</span>
                )}
              </label>
              <input
                id="desiredDate"
                type="date"
                min={today}
                value={desiredDate}
                onChange={(e) => {
                  setDesiredDate(e.target.value)
                  setServerError('')
                }}
                className={applicationErrors.desiredDate ? 'error' : ''}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="memo">메모</label>
            <textarea
              id="memo"
              value={memo}
              onChange={(e) => {
                setMemo(e.target.value)
                setServerError('')
              }}
              placeholder="추가로 전달하고 싶은 내용이 있으면 입력하세요"
              rows={4}
            />
          </div>
        </>
      )}
    </>
  )

  // 기부 신청 단계
  if (step === 'application') {
    return (
      <section className="main-page donation-page">
        <div className="main-shell donation-shell">
          <HeaderLanding
            role={currentUser?.role}
            onLogoClick={onNavigateHome}
            onNavClick={onNavLink}
            isLoggedIn={isLoggedIn}
            onLogout={onLogout}
            onNotifications={onNotifications}
            unreadCount={unreadCount}
            onMenu={onMenu}
          />

          <div className="donation-content">
            <div className="donation-header">
              <button
                type="button"
                className="btn-back"
                onClick={() => {
                  setServerError('')
                  setStep('item')
                }}
                aria-label="뒤로 가기"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
              <h1>기부 신청</h1>
            </div>

            <form onSubmit={handleApplicationSubmit} className="donation-form">
              {/* 기부 방법 */}
              <div className="form-group">
                <label htmlFor="donationMethod">
                  기부 방법
                  {applicationErrors.donationMethod && (
                    <span className="error-message">{applicationErrors.donationMethod}</span>
                  )}
                </label>
                <div className="select-wrapper">
                  <select
                    id="donationMethod"
                    value={donationMethod}
                    onChange={(e) => {
                      setDonationMethod(e.target.value)
                      setDonationOrganization('')
                      setDonationOrganizationLabel('')
                      setDeliveryMethod('')
                      setServerError('')
                    }}
                    className={applicationErrors.donationMethod ? 'error' : ''}
                  >
                    <option value="">선택하세요</option>
                    {DONATION_METHODS.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                  {donationMethod && (
                    <>
                      <span className="check-icon" aria-label="선택됨">✓</span>
                      <button
                        type="button"
                        className="btn-clear"
                        onClick={() => {
                          setDonationMethod('')
                          setDonationOrganization('')
                          setDonationOrganizationLabel('')
                          setDeliveryMethod('')
                          setServerError('')
                        }}
                        aria-label="선택 취소"
                      >
                        ×
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* 직접 매칭인 경우 */}
              {donationMethod === '직접 매칭' && (
                <>
                  {/* 기관 선택 */}
                  <div className="form-group">
                    <label htmlFor="donationOrganization">
                      기관 선택
                      {applicationErrors.donationOrganization && (
                        <span className="error-message">{applicationErrors.donationOrganization}</span>
                      )}
                    </label>
                    <div className="select-wrapper">
                      <select
                        id="donationOrganization"
                        value={donationOrganization}
                        onChange={(e) => {
                          const option = e.target.selectedOptions[0]
                          setDonationOrganization(e.target.value)
                          setDonationOrganizationLabel(option?.dataset?.label || option?.textContent || '')
                          setServerError('')
                        }}
                        className={applicationErrors.donationOrganization ? 'error' : ''}
                        disabled={directMatchOptions.length === 0}
                      >
                        <option value="">선택하세요</option>
                        {directMatchOptions.map(org => (
                          <option key={org.value} value={org.value} data-label={org.label}>
                            {org.label}
                          </option>
                        ))}
                      </select>
                      {donationOrganization && (
                        <>
                          <span className="check-icon" aria-label="선택됨">✓</span>
                          <button
                            type="button"
                            className="btn-clear"
                            onClick={() => {
                              setDonationOrganization('')
                              setDonationOrganizationLabel('')
                              setServerError('')
                            }}
                            aria-label="선택 취소"
                          >
                            ×
                          </button>
                        </>
                      )}
                    </div>
                    {directMatchOptions.length === 0 && (
                      <p className="input-hint">
                        승인된 기관 목록을 불러오는 중입니다. 잠시 후 다시 시도하거나 자동 매칭을 이용해주세요.
                      </p>
                    )}
                  </div>

                </>
              )}

              {donationMethod && (
                <>
                  <div className="form-group">
                    <div className="form-group-header">
                      <label>신청자</label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={isAnonymous}
                          onChange={(e) => setIsAnonymous(e.target.checked)}
                        />
                        <span>익명으로 표시</span>
                      </label>
                    </div>
                    <div className="applicant-info">
                      <strong>{applicantName}</strong>
                      <p>{isAnonymous ? '기관에는 익명으로 전달됩니다.' : '관리자가 실명으로 확인합니다.'}</p>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="contact">
                      연락처
                      {applicationErrors.contact ? (
                        <span className="error-message">{applicationErrors.contact}</span>
                      ) : (
                        <span className="input-hint">숫자만 입력해주세요</span>
                      )}
                    </label>
                    <input
                      id="contact"
                      type="tel"
                      value={contact}
                      onChange={(e) => {
                        setContact(stripPhoneNumber(e.target.value))
                        setServerError('')
                      }}
                      placeholder="숫자만 입력 (예: 01012345678)"
                      className={applicationErrors.contact ? 'error' : ''}
                      inputMode="numeric"
                    />
                  </div>

                  {renderShippingFields()}
                </>
              )}

              {/* 제출 버튼 */}
              {((donationMethod === '자동 매칭') || (donationMethod === '직접 매칭' && deliveryMethod)) && (
                <div className="donation-actions">
                  {serverError && <p className="error-message">{serverError}</p>}
                  <button type="submit" className="btn-submit" disabled={isSubmitting}>
                    {isSubmitting ? '신청 중...' : '기부 신청하기'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </section>
    )
  }

  // 물품 등록 단계
  return (
    <section className="main-page donation-page">
      <div className="main-shell donation-shell">
        <HeaderLanding
          role={currentUser?.role}
          onLogoClick={onNavigateHome}
          onNavClick={onNavLink}
          isLoggedIn={isLoggedIn}
          onLogout={onLogout}
          onNotifications={onNotifications}
          unreadCount={unreadCount}
          onMenu={onMenu}
        />

        <div className="donation-content">
          <div className="donation-header">
            <h1>기부 물품 등록</h1>
          </div>

          <form onSubmit={handleSubmit} className="donation-form">
            {/* 물품 종류 */}
            <div className="form-group">
              <label htmlFor="itemType">
                물품 종류
                {errors.itemType && <span className="error-message">{errors.itemType}</span>}
              </label>
              <div className="select-wrapper">
                <select
                  id="itemType"
                  value={itemType}
                  onChange={(e) => handleItemTypeChange(e.target.value)}
                  className={errors.itemType ? 'error' : ''}
                >
                  <option value="">선택하세요</option>
                  {ITEM_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {itemType && (
                  <>
                    <span className="check-icon" aria-label="선택됨">✓</span>
                    <button
                      type="button"
                      className="btn-clear"
                      onClick={() => handleItemTypeChange('')}
                      aria-label="선택 취소"
                    >
                      ×
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 물품 상세 */}
            <div className="form-group">
              <label htmlFor="itemDetail">
                물품 상세
                {errors.itemDetail && <span className="error-message">{errors.itemDetail}</span>}
              </label>
              <div className="select-wrapper">
                <select
                  id="itemDetail"
                  value={itemDetail}
                  onChange={(e) => setItemDetail(e.target.value)}
                  className={errors.itemDetail ? 'error' : ''}
                  disabled={!itemType}
                >
                  <option value="">선택하세요</option>
                  {itemType && ITEM_DETAILS[itemType]?.map(detail => (
                    <option key={detail} value={detail}>{detail}</option>
                  ))}
                </select>
                {itemDetail && (
                  <>
                    <span className="check-icon" aria-label="선택됨">✓</span>
                    <button
                      type="button"
                      className="btn-clear"
                      onClick={() => setItemDetail('')}
                      aria-label="선택 취소"
                    >
                      ×
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 물품 사이즈 */}
            <div className="form-group">
              <label htmlFor="itemSize">
                물품 사이즈
                {errors.itemSize && <span className="error-message">{errors.itemSize}</span>}
              </label>
              <div className="select-wrapper">
                <select
                  id="itemSize"
                  value={itemSize}
                  onChange={(e) => setItemSize(e.target.value)}
                  className={errors.itemSize ? 'error' : ''}
                >
                  <option value="">선택하세요</option>
                  {ITEM_SIZES.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
                {itemSize && (
                  <>
                    <span className="check-icon" aria-label="선택됨">✓</span>
                    <button
                      type="button"
                      className="btn-clear"
                      onClick={() => setItemSize('')}
                      aria-label="선택 취소"
                    >
                      ×
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 물품 상태 정보 */}
            <div className="form-group">
              <label htmlFor="itemCondition">
                물품 상태 정보
                {errors.itemCondition && <span className="error-message">{errors.itemCondition}</span>}
              </label>
              <div className="select-wrapper">
                <select
                  id="itemCondition"
                  value={itemCondition}
                  onChange={(e) => setItemCondition(e.target.value)}
                  className={errors.itemCondition ? 'error' : ''}
                >
                  <option value="">선택하세요</option>
                  {ITEM_CONDITIONS.map(condition => (
                    <option key={condition} value={condition}>{condition}</option>
                  ))}
                </select>
                {itemCondition && (
                  <>
                    <span className="check-icon" aria-label="선택됨">✓</span>
                    <button
                      type="button"
                      className="btn-clear"
                      onClick={() => setItemCondition('')}
                      aria-label="선택 취소"
                    >
                      ×
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 물품 상세 정보 */}
            <div className="form-group">
              <div className="form-group-header">
                <label htmlFor="itemDescription">
                  물품 상세 정보
                </label>
                <span className="required-text">* 필수 입력 항목입니다.</span>
              </div>
              <textarea
                id="itemDescription"
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                placeholder="물품에 대한 상세 정보를 입력해주세요"
                className={errors.itemDescription ? 'error' : ''}
                rows={6}
              />
              {errors.itemDescription && (
                <span className="error-message">{errors.itemDescription}</span>
              )}
            </div>

            {/* 수량 */}
            <div className="form-group">
              <label htmlFor="quantity">
                수량
                {errors.quantity && <span className="error-message">{errors.quantity}</span>}
              </label>
              <input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className={errors.quantity ? 'error' : ''}
              />
            </div>

            {/* 사진 업로드 */}
            <div className="form-group">
              <div className="form-group-header">
                <label>사진 업로드</label>
                <span className="required-text">* 필수 입력 항목입니다.</span>
              </div>
              {errors.images && (
                <span className="error-message">{errors.images}</span>
              )}
              <div className="upload-buttons">
                <label className="upload-button">
                  <input
                    type="file"
                    accept="video/*"
                    multiple
                    onChange={(e) => handleImageUpload(e, 'video')}
                    style={{ display: 'none' }}
                  />
                  동영상
                </label>
                <label className="upload-button">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleImageUpload(e, 'image')}
                    style={{ display: 'none' }}
                  />
                  이미지
                </label>
              </div>
                {images.length > 0 && (
                <div className="upload-preview">
                  {images.map(img => (
                    <div key={img.id} className="preview-item">
                      <img src={img.dataUrl} alt="미리보기" />
                      <button
                        type="button"
                        className="btn-remove-preview"
                        onClick={() => handleRemoveImage(img.id)}
                        aria-label="삭제"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 제출 버튼 */}
            <div className="donation-actions">
              <button type="submit" className="btn-submit">
                물품 등록하기
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
