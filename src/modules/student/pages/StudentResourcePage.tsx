import StudentPageShell from '../components/layout/StudentPageShell'
import ResourceInbox from '../../resources/pages/ResourceInbox'

export default function StudentResourcePage() {
  return (
    <StudentPageShell activeTab="none" maxWidth="xl">
      <ResourceInbox />
    </StudentPageShell>
  )
}
