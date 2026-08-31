"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  CalendarClock,
  FileVideo,
  MonitorSmartphone,
  Settings,
  LogOut,
  Menu,
  Clock,
  Image as ImageIcon
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const sidebarNavItems = [
  { title: "Overview", href: "/", icon: LayoutDashboard },
  { title: "Mosque Config", href: "/mosque", icon: Building2 },
  { title: "Prayer Schedule", href: "/prayer", icon: CalendarClock },
  { title: "Content", href: "/content", icon: FileVideo },
  { title: "Media", href: "/media", icon: ImageIcon },
  { title: "Devices", href: "/devices", icon: MonitorSmartphone },
  { title: "Settings", href: "/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform border-r bg-card/50 backdrop-blur-xl transition-transform duration-200 ease-in-out lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center px-6 border-b border-border/50">
          <Clock className="h-6 w-6 text-primary mr-3" />
          <span className="text-lg font-bold tracking-tight">Jam Digital</span>
        </div>
        
        <nav className="flex-1 space-y-1 px-3 py-4">
          {sidebarNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className={cn("mr-3 h-5 w-5", pathname === item.href ? "text-primary" : "text-muted-foreground group-hover:text-accent-foreground")} />
              {item.title}
            </Link>
          ))}
        </nav>

        <div className="border-t border-border/50 p-4">
          <Link href="/login" className="flex items-center rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between border-b bg-background/50 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center lg:hidden">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="-ml-2">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open sidebar</span>
            </Button>
          </div>
          <div className="flex flex-1 justify-end items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium text-muted-foreground">System Online</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              A
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
