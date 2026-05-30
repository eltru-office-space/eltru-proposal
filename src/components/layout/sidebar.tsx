'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/lib/auth/actions'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  BookOpen,
  ShieldCheck,
  Package,
  RefreshCw,
  ScrollText,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface SidebarUser {
  id: string
  full_name: string
  email: string
  role: 'admin' | 'salesperson'
}

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const mainNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Clients', href: '/clients', icon: Users },
  { label: 'Projects', href: '/projects', icon: FolderOpen },
  { label: 'My Rules', href: '/rules', icon: BookOpen },
]

const adminNav: NavItem[] = [
  { label: 'Users', href: '/admin/users', icon: ShieldCheck },
  { label: 'Product Catalog', href: '/admin/catalog', icon: Package },
  { label: 'Odoo Sync', href: '/admin/sync', icon: RefreshCw },
  { label: 'Global Rules', href: '/admin/rules', icon: ScrollText },
]

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname()
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
        isActive
          ? 'bg-zinc-700 text-white'
          : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {item.label}
    </Link>
  )
}

export default function Sidebar({ user }: { user: SidebarUser }) {
  return (
    <aside className="flex flex-col w-60 shrink-0 bg-zinc-900 h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5">
        <span className="text-xl font-bold text-white tracking-tight">Eltru</span>
      </div>

      <Separator className="bg-zinc-800" />

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {mainNav.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}

        {/* Admin section */}
        {user.role === 'admin' && (
          <>
            <div className="pt-4 pb-1 px-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Admin
              </span>
            </div>
            {adminNav.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </>
        )}
      </nav>

      <Separator className="bg-zinc-800" />

      {/* User footer */}
      <div className="px-4 py-4 space-y-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-200 truncate">{user.full_name}</p>
          <p className="text-xs text-zinc-500 truncate">{user.email}</p>
        </div>
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="w-full justify-start text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 px-2"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </form>
      </div>
    </aside>
  )
}
