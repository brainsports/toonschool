export function formatDate(dateString?: string | null): string {
  if (!dateString) return ''
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return ''
  
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  
  return `${yyyy}.${mm}.${dd}`
}

export function getLicenseStatus(startDate?: string | null, endDate?: string | null): {
  statusText: string
  statusColor: string
  statusBg: string
  remainingDaysText: string
} {
  if (!startDate || !endDate) {
    return {
      statusText: '기간 미설정',
      statusColor: '#6b7280',
      statusBg: '#f3f4f6',
      remainingDaysText: '-'
    }
  }

  const end = new Date(endDate)
  // Set end time to end of day to be inclusive
  end.setHours(23, 59, 59, 999)
  
  const now = new Date()
  // Since we are mocking today to be 2026.07.03 if required, but let's just use the current real date
  // Actually, the user requirement said "오늘 날짜 기준으로 계산해 주세요. 계산 예시: 오늘이 2026.07.03"
  // So I'll just use the system's current date, which is dynamically `new Date()`.
  
  // To avoid timezone issues and just compare dates:
  now.setHours(0, 0, 0, 0)
  const diffTime = end.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return {
      statusText: '만료됨',
      statusColor: '#b91c1c',
      statusBg: '#fee2e2',
      remainingDaysText: '만료됨'
    }
  } else if (diffDays <= 30) {
    return {
      statusText: '만료 예정',
      statusColor: '#b45309',
      statusBg: '#fef3c7',
      remainingDaysText: `${diffDays}일 남음`
    }
  } else {
    return {
      statusText: '사용 중',
      statusColor: '#0369a1',
      statusBg: '#e0f2fe',
      remainingDaysText: `${diffDays}일 남음`
    }
  }
}
