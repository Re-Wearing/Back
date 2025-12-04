import HeaderLanding from "../components/HeaderLanding"

export default function DeliveryCheckPage({
  onNavigateHome,
  onNavLink,
  isLoggedIn,
  onLogout,
  onNotifications,
  unreadCount,
  onMenu = () => {},
  currentUser,
  currentProfile,
  shipments = [],
  donorProfile,
  organizationProfile
}) {
  const isDonorView = currentUser?.role !== '기관 회원'
  const fallbackDonorProfile = donorProfile || currentProfile
  const effectiveDonorProfile = isDonorView ? currentProfile : fallbackDonorProfile
  const senderName = effectiveDonorProfile?.useAnonymousName
    ? '익명 기부자'
    : effectiveDonorProfile?.fullName ||
      effectiveDonorProfile?.nickname ||
      currentUser?.name ||
      '일반 기부자'
  const senderContact = effectiveDonorProfile?.phone || '연락처 미등록'
  const receiverName =
    organizationProfile?.nickname || organizationProfile?.fullName || '협약 기관 물류센터'

  const tableData =
    Array.isArray(shipments) && shipments.length > 0
      ? shipments
          .filter(item => {
            if (isDonorView) {
              return (
                !item.sender ||
                item.sender === effectiveDonorProfile?.fullName ||
                item.sender === effectiveDonorProfile?.nickname
              )
            }
            return (
              item.receiver === currentUser?.name || item.receiver === currentUser?.nickname
            )
          })
          .map(item => ({
            ...item,
            sender: item.sender || senderName,
            receiver: item.receiver || receiverName
          }))
      : []

  const statusColor = status => {
    switch (status) {
      case "배송완료":
        return "status-complete"
      case "배송중":
        return "status-progress"
      case "배송대기":
        return "status-wait"
      default:
        return ""
    }
  }

  return (
    <section className="main-page delivery-check-page">
      <div className="main-shell delivery-check-shell">

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

        <div className="delivery-check-content">
          <h1>배송 조회</h1>

          <table className="delivery-table">
            <thead>
              <tr>
                <th>송장번호</th>
                <th>보내는 사람</th>
                <th>배송 시작</th>
                <th>받는 곳</th>
                <th>상태</th>
                <th>조회</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.id}</td>
                  <td>{senderName}</td>
                  <td>{row.startDate}</td>
                  <td>{row.receiver}</td>
                  <td>
                    <span className={`status-badge ${statusColor(row.status)}`}>
                      {row.status}
                    </span>
                  </td>
                  <td>
                  <button
  className="delivery-link"
  onClick={() => alert("상세조회 기능은 준비중입니다.")}
>
  상세조회 →
</button>

                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>
      </div>
    </section>
  )
}
