import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Shield,
  TrendingUp,
  ChevronDown,
  Menu,
  BookOpen,
} from "lucide-react";

const LEDGERS = [
  { value: "report", label: "报表敞口台账", color: "#c41e3a" },
  { value: "trading", label: "交易敞口台账", color: "#b8860b" },
  { value: "proprietary", label: "自营交易台账", color: "#2e8b57" },
];

export function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";

  return (
    <div className="min-h-screen bg-gradient-forex">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img 
              src="./logo-zijin.jpg" 
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

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            {/* Ledger Selector Dropdown - sits to the left of the menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  <BookOpen className="h-4 w-4" />
                  <span className="hidden sm:inline">台账</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white border-gray-200">
                {LEDGERS.map((ledger) => (
                  <DropdownMenuItem
                    key={ledger.value}
                    onClick={() => {
                      if (!isHome) navigate("/");
                      // Dispatch a custom event to switch ledger on Home page
                      window.dispatchEvent(
                        new CustomEvent("switch-ledger", { detail: ledger.value })
                      );
                    }}
                    className="flex items-center gap-2 cursor-pointer focus:bg-gray-50"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: ledger.color }}
                    />
                    <span className="text-sm text-gray-700">{ledger.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Main Menu Dropdown - top right */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  <Menu className="h-4 w-4" />
                  <span className="hidden sm:inline">菜单</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 bg-white border-gray-200">
                <DropdownMenuItem
                  onClick={() => navigate("/")}
                  className={`flex items-center gap-2 cursor-pointer focus:bg-gray-50 ${
                    isHome ? "bg-gray-50" : ""
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4 text-[#b8860b]" />
                  <span className="text-sm text-gray-700">首页</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate("/admin")}
                  className={`flex items-center gap-2 cursor-pointer focus:bg-gray-50 ${
                    location.pathname === "/admin" ? "bg-gray-50" : ""
                  }`}
                >
                  <Shield className="h-4 w-4 text-[#c41e3a]" />
                  <span className="text-sm text-gray-700">后台维护</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* FX badge */}
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
