"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import {
  IconReceipt,
  IconRepeat,
  IconSettings,
  IconLogout,
} from "@tabler/icons-react"

const navItems = [
  {
    href: "/transactions",
    label: "Transactions",
    icon: <IconReceipt className="size-4" />,
  },
  {
    href: "/subscriptions",
    label: "Subscriptions",
    icon: <IconRepeat className="size-4" />,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: <IconSettings className="size-4" />,
  },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user) router.replace("/login")
  }, [user, loading, router])

  if (loading || !user) return null

  return (
    <div className="flex min-h-svh">
      <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-sidebar">
        <div className="px-4 py-5">
          <h1 className="text-sm font-semibold tracking-tight">
            Merchant Portal
          </h1>
          <p className="text-xs text-muted-foreground">{user}</p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-2">
          {navItems.map((item) => (
            <Button
              key={item.href}
              variant={pathname === item.href ? "secondary" : "ghost"}
              size="sm"
              className="justify-start gap-2"
              asChild
            >
              <Link href={item.href}>
                {item.icon}
                {item.label}
              </Link>
            </Button>
          ))}
        </nav>
        <div className="border-t border-border p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={logout}
          >
            <IconLogout className="size-4" />
            Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  )
}
