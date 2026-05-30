import { redirect } from 'next/navigation'

// /admin redirects to /admin/users
export default function AdminPage() {
  redirect('/admin/users')
}
