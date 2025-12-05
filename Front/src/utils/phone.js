export const stripPhoneNumber = (value = '') => value.replace(/\D/g, '')

export const formatPhoneNumber = (value = '') => {
  const digits = stripPhoneNumber(value)
  if (!digits) return ''

  if (digits.startsWith('02')) {
    if (digits.length <= 2) return digits
    if (digits.length <= 5) return `02-${digits.slice(2)}`
    const middle = digits.length === 9 ? digits.slice(2, 5) : digits.slice(2, digits.length - 4)
    return `02-${middle}-${digits.slice(-4)}`
  }

  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`
}

