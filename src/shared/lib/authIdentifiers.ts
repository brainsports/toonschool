const STUDENT_INTERNAL_EMAIL_DOMAIN = 'student.toonschool.local'

export function normalizeLoginIdentifier(value: string) {
  return value.trim().toLowerCase()
}

export function isEmailIdentifier(value: string) {
  return normalizeLoginIdentifier(value).includes('@')
}

export function toStudentInternalEmail(value: string) {
  return `${normalizeLoginIdentifier(value)}@${STUDENT_INTERNAL_EMAIL_DOMAIN}`
}

export function toAuthEmailFromLoginIdentifier(value: string) {
  const normalized = normalizeLoginIdentifier(value)
  return isEmailIdentifier(normalized) ? normalized : toStudentInternalEmail(normalized)
}

export function isStudentInternalEmail(value: string) {
  return normalizeLoginIdentifier(value).endsWith(`@${STUDENT_INTERNAL_EMAIL_DOMAIN}`)
}
