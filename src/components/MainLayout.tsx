import { Outlet, Link, useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Shield,
  TrendingUp,
  Settings,
} from "lucide-react";

export function MainLayout() {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "首页", icon: LayoutDashboard },
  ];

  return (
    <div className="min-h-screen bg-gradient-forex">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img 
              src="/logo-zijin.jpg" 
              alt="紫金投资" 
              className="h-9 w-auto object-contain"
            />
            <div>
              <h1 className="text-lg font-bold tracking-wide text-gray-900">
                紫金投资
              </h1>
              <p className="text-[10px] tracking-widest text-gray-500 uppercase">
                ZiJin Investment · FX Trading Ledger
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
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
            <Link to="/admin">
              <Button
                variant={location.pathname === "/admin" ? "default" : "ghost"}
                size="sm"
                className={`gap-2 ${
                  location.pathname === "/admin"
                    ? "bg-[#c41e3a] hover:bg-[#a01830] text-white"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <Shield className="h-4 w-4" />
                后台维护
              </Button>
            </Link>
          </nav>

          {/* Right side - Forex badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#c41e3a]/10 border border-[#c41e3a]/20">
              <TrendingUp className="h-4 w-4 text-[#c41e3a]" />
              <span className="text-sm font-medium text-[#c41e3a]">外汇台账</span>
            </div>
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
