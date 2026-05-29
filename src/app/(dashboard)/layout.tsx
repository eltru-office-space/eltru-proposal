export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 border-r border-zinc-200 bg-zinc-50 p-4">
        <p className="text-xs text-zinc-400">Navigation coming in Session 2-1</p>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
