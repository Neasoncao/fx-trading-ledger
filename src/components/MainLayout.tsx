import { Outlet, Link, useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Shield,
  LogOut,
  LogIn,
  TrendingUp,
} from "lucide-react";

export function MainLayout() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
  ];

  return (
    <div className="min-h-screen bg-gradient-forex">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-[#2a2a2a] bg-[#0a0a0a]/90 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#c41e3a] to-[#8b1538]">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-wide text-[#f0d78c]">
                外汇交易台账
              </h1>
              <p className="text-[10px] tracking-widest text-[#8b7355] uppercase">
                FX Trading Ledger
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={location.pathname === item.path ? "default" : "ghost"}
                  size="sm"
                  className={`gap-2 ${
                    location.pathname === item.path
                      ? "bg-[#c41e3a] hover:bg-[#a01830] text-white"
                      : "text-[#b8a88a] hover:text-[#f0d78c] hover:bg-[#1a1a1a]"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin">
                <Button
                  variant={location.pathname === "/admin" ? "default" : "ghost"}
                  size="sm"
                  className={`gap-2 ${
                    location.pathname === "/admin"
                      ? "bg-[#c41e3a] hover:bg-[#a01830] text-white"
                      : "text-[#b8a88a] hover:text-[#f0d78c] hover:bg-[#1a1a1a]"
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  管理后台
                </Button>
              </Link>
            )}
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1a1a1a] border border-[#2a2a2a]">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[#d4a843] to-[#8b6914] flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {(user?.name || "U").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm text-[#f0d78c]">{user?.name || "User"}</span>
                  {isAdmin && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#c41e3a]/20 text-[#c41e3a] border border-[#c41e3a]/30">
                      管理员
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-[#8b7355] hover:text-[#c41e3a] hover:bg-[#c41e3a]/10"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Link to="/login">
                <Button
                  size="sm"
                  className="gap-2 bg-[#c41e3a] hover:bg-[#a01830] text-white"
                >
                  <LogIn className="h-4 w-4" />
                  登录
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
