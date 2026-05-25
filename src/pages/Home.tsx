import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/providers/trpc";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PieChart as PieChartIcon,
  TrendingUp,
  DollarSign,
  BarChart3,
  Activity,
  ChevronLeft,
  ChevronRight,
  Table2,
  Shield,
  Clock,
  Phone,
  User,
  BarChart as BarChartIcon,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const LEDGERS = [
  { value: "report" as const, label: "报表敞口台账", color: "#c41e3a" },
  { value: "trading" as const, label: "交易敞口台账", color: "#b8860b" },
  { value: "proprietary" as const, label: "自营交易台账", color: "#2e8b57" },
];

const COLORS = ["#c41e3a", "#b8860b", "#2e8b57", "#1e90ff", "#ff6b35", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b", "#6366f1"];

const PIE_OPTIONS = [
  { value: "currencyPair", label: "货币对" },
  { value: "counterparty", label: "交易对手" },
];

const BAR_OPTIONS = [
  { value: "currencyPair", label: "货币对" },
  { value: "counterparty", label: "交易对手" },
  { value: "tradeDate", label: "交易时间" },
];

const GROUP_BY_OPTIONS = [
  { value: "entity", label: "交易主体" },
  { value: "trader", label: "交易员" },
  { value: "counterparty", label: "交易对手" },
  { value: "expiryStatus", label: "是否到期" },
  { value: "closeStatus", label: "是否平仓" },
  { value: "direction", label: "交易方向" },
  { value: "productType", label: "衍生品类型" },
  { value: "currencyPair", label: "货币对" },
  { value: "callPut", label: "看涨看跌" },
];

// Format helpers
const formatNumber = (n: number) => {
  if (n === 0) return "-";
  if (Math.abs(n) >= 1e8) return (n / 1e8).toFixed(2) + "亿";
  if (Math.abs(n) >= 1e4) return (n / 1e4).toFixed(2) + "万";
  return n.toLocaleString("zh-CN", { maximumFractionDigits: 0 });
};

const formatCurrency = (n: number) => {
  if (n === 0) return "-";
  const prefix = n >= 0 ? "+" : "";
  return prefix + formatNumber(n);
};

const formatInteger = (val: string | number | null | undefined) => {
  if (val === null || val === undefined || val === "") return "-";
  const n = Number(val);
  if (isNaN(n)) return "-";
  return Math.round(n).toLocaleString("zh-CN");
};

const formatPrice4 = (val: string | number | null | undefined) => {
  if (val === null || val === undefined || val === "") return "-";
  const n = Number(val);
  if (isNaN(n)) return "-";
  return n.toFixed(4);
};

export default function Home() {
  const [activeLedger, setActiveLedger] = useState<(typeof LEDGERS)[number]>(LEDGERS[2]);
  const [page, setPage] = useState(1);
  const [positionTab, setPositionTab] = useState<"closed" | "open">("open");
  const [pieGroupBy, setPieGroupBy] = useState<"currencyPair" | "counterparty">("currencyPair");
  const [barGroupBy, setBarGroupBy] = useState<"currencyPair" | "counterparty" | "tradeDate">("currencyPair");
  const pageSize = 20;

  // Listen for ledger switch events from MainLayout
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const ledgerValue = e.detail;
      const ledger = LEDGERS.find((l) => l.value === ledgerValue);
      if (ledger) {
        setActiveLedger(ledger);
        setPage(1);
        setPositionTab("open");
      }
    };
    window.addEventListener("switch-ledger", handler as EventListener);
    return () => window.removeEventListener("switch-ledger", handler as EventListener);
  }, []);

  // Position tabs: open = 未平仓, closed = 已平仓
  const closeStatusFilter = positionTab === "open" ? "Open" : "Close";

  const { data: summary } = trpc.ledger.summary.useQuery({
    ledger: activeLedger.value,
  });

  const { data: listData } = trpc.ledger.list.useQuery({
    ledger: activeLedger.value,
    page,
    pageSize,
    filters: { closeStatus: closeStatusFilter },
  });

  const { data: pieData } = trpc.ledger.pieStats.useQuery({
    ledger: activeLedger.value,
    groupBy: pieGroupBy,
  });

  const { data: barData } = trpc.ledger.barStats.useQuery({
    ledger: activeLedger.value,
    groupBy: barGroupBy,
  });

  const { data: trendData } = trpc.ledger.trend.useQuery({
    ledger: activeLedger.value,
  });

  const totalPages = listData ? Math.ceil(listData.total / pageSize) : 0;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto relative">
      {/* Decorative top accent bar */}
      <div className="fixed top-0 left-0 right-0 h-1 z-50"
        style={{ background: "linear-gradient(90deg, #c41e3a 0%, #b8860b 50%, #c41e3a 100%)" }}
      />

      {/* Decorative background elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-[0.03]"
          style={{ background: "radial-gradient(circle, #c41e3a, transparent 70%)" }}
        />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full opacity-[0.03]"
          style={{ background: "radial-gradient(circle, #b8860b, transparent 70%)" }}
        />
      </div>

      <div className="relative z-10 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: activeLedger.color }}
          />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{activeLedger.label}</h2>
            <p className="text-sm text-gray-500 mt-1">
              实时查看名义本金、盈亏情况与统计分析
            </p>
          </div>
        </div>

      {/* Trend Section */}
      {trendData && (
        <Card className="bg-gradient-card border-gray-200 shadow-sm overflow-hidden">
          <CardHeader className="pb-2 border-b border-gray-100">
            <CardTitle className="text-gray-900 text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#c41e3a]" />
              历史变化趋势
              <span className="text-xs font-normal text-gray-400 ml-2">对比基准：日环比/周环比/月环比/年初至今</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
              {/* 交易笔数 */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-7 w-7 rounded-md bg-[#c41e3a]/10 flex items-center justify-center">
                    <Table2 className="h-4 w-4 text-[#c41e3a]" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-800">交易笔数</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { label: "日环比", data: trendData.count.daily },
                    { label: "周环比", data: trendData.count.weekly },
                    { label: "月环比", data: trendData.count.monthly },
                    { label: "年初至今", data: trendData.count.ytd },
                  ]).map(({ label, data }) => (
                    <div key={label} className="bg-gray-50/80 rounded-lg p-2.5">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                      <p className="text-sm font-bold text-gray-900">{data.current.toLocaleString()}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={`text-xs font-medium ${data.change >= 0 ? "text-red-600" : "text-green-600"}`}>
                          {data.change >= 0 ? "↑" : "↓"} {data.change > 0 ? "+" : ""}{data.change}
                        </span>
                        <span className={`text-[10px] ${data.changePct >= 0 ? "text-red-500" : "text-green-500"}`}>
                          ({data.changePct >= 0 ? "+" : ""}{data.changePct.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 交易金额 */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-7 w-7 rounded-md bg-[#b8860b]/10 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-[#b8860b]" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-800">交易金额</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { label: "日环比", data: trendData.notional.daily },
                    { label: "周环比", data: trendData.notional.weekly },
                    { label: "月环比", data: trendData.notional.monthly },
                    { label: "年初至今", data: trendData.notional.ytd },
                  ]).map(({ label, data }) => (
                    <div key={label} className="bg-gray-50/80 rounded-lg p-2.5">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                      <p className="text-sm font-bold text-gray-900">{formatNumber(data.current)}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={`text-xs font-medium ${data.change >= 0 ? "text-red-600" : "text-green-600"}`}>
                          {data.change >= 0 ? "↑" : "↓"} {data.change > 0 ? "+" : ""}{formatNumber(data.change)}
                        </span>
                        <span className={`text-[10px] ${data.changePct >= 0 ? "text-red-500" : "text-green-500"}`}>
                          ({data.changePct >= 0 ? "+" : ""}{data.changePct.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 盈亏 */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-7 w-7 rounded-md bg-purple-100 flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-800">盈亏</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { label: "日环比", data: trendData.pnl.daily },
                    { label: "周环比", data: trendData.pnl.weekly },
                    { label: "月环比", data: trendData.pnl.monthly },
                    { label: "年初至今", data: trendData.pnl.ytd },
                  ]).map(({ label, data }) => (
                    <div key={label} className="bg-gray-50/80 rounded-lg p-2.5">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                      <p className={`text-sm font-bold ${data.current >= 0 ? "text-red-600" : "text-green-600"}`}>
                        {formatCurrency(data.current)}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={`text-xs font-medium ${data.change >= 0 ? "text-red-600" : "text-green-600"}`}>
                          {data.change >= 0 ? "↑" : "↓"} {formatCurrency(data.change)}
                        </span>
                        <span className={`text-[10px] ${data.changePct >= 0 ? "text-red-500" : "text-green-500"}`}>
                          ({data.changePct >= 0 ? "+" : ""}{data.changePct.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 交易笔数 */}
        <Card className="bg-gradient-card border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 uppercase tracking-wider">交易笔数</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">存续交易笔数</p>
                <p className="text-xl font-bold text-gray-900">{summary?.openCount?.toLocaleString() ?? "-"}</p>
              </div>
              <div className="h-8 w-8 rounded-lg bg-[#c41e3a]/10 flex items-center justify-center">
                <Activity className="h-4 w-4 text-[#c41e3a]" />
              </div>
            </div>
            <div className="border-t border-gray-100" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">总交易笔数</p>
                <p className="text-xl font-bold text-gray-900">{summary?.totalCount?.toLocaleString() ?? "-"}</p>
              </div>
              <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <Table2 className="h-4 w-4 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 交易金额 */}
        <Card className="bg-gradient-card border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 uppercase tracking-wider">交易金额</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">持仓本金</p>
                <p className="text-xl font-bold text-[#b8860b]">{formatNumber(summary?.openNotional ?? 0)}</p>
              </div>
              <div className="h-8 w-8 rounded-lg bg-[#b8860b]/10 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-[#b8860b]" />
              </div>
            </div>
            <div className="border-t border-gray-100" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">交易本金</p>
                <p className="text-xl font-bold text-[#b8860b]">{formatNumber(summary?.totalNotional ?? 0)}</p>
              </div>
              <div className="h-8 w-8 rounded-lg bg-[#b8860b]/10 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-[#b8860b]" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 盈亏 */}
        <Card className="bg-gradient-card border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 uppercase tracking-wider">盈亏</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">已确认盈亏</p>
                <p className={`text-xl font-bold ${(summary?.realizedPnl ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(summary?.realizedPnl ?? 0)}
                </p>
              </div>
              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div className="border-t border-gray-100" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">持仓盈亏</p>
                <p className={`text-xl font-bold ${(summary?.unrealizedPnl ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(summary?.unrealizedPnl ?? 0)}
                </p>
              </div>
              <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <div className="border-t border-gray-100" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">总盈亏</p>
                <p className={`text-xl font-bold ${(summary?.totalPnl ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(summary?.totalPnl ?? 0)}
                </p>
              </div>
              <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section - Pie & Bar side by side */}
      {activeLedger.value !== "trading" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart - hidden for report & trading */}
          {activeLedger.value === "proprietary" && (
            <Card className="bg-gradient-card border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-gray-900 text-lg flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5 text-[#b8860b]" />
                    盈亏分布
                  </CardTitle>
                  <Select
                    value={pieGroupBy}
                    onValueChange={(v) => setPieGroupBy(v as any)}
                  >
                    <SelectTrigger className="w-[120px] bg-white border-gray-200 text-gray-900 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      {PIE_OPTIONS.map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value}
                          className="text-gray-700 focus:bg-gray-100 focus:text-gray-900 text-xs"
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[320px]">
                  {pieData && pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {pieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            formatCurrency(value),
                            name,
                          ]}
                          contentStyle={{
                            background: "#fff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      暂无数据
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bar Chart - hidden for trading only */}
          {activeLedger.value !== "trading" && (
            <Card className="bg-gradient-card border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-gray-900 text-lg flex items-center gap-2">
                    <BarChartIcon className="h-5 w-5 text-[#b8860b]" />
                    盈亏柱状分析
                  </CardTitle>
                  <Select
                    value={barGroupBy}
                    onValueChange={(v) => setBarGroupBy(v as any)}
                  >
                    <SelectTrigger className="w-[120px] bg-white border-gray-200 text-gray-900 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      {BAR_OPTIONS.map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value}
                          className="text-gray-700 focus:bg-gray-100 focus:text-gray-900 text-xs"
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[360px]">
                  {barData && barData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="key"
                          tick={{ fontSize: 11, fill: "#6b7280" }}
                          angle={barGroupBy === "tradeDate" ? -45 : 0}
                          textAnchor={barGroupBy === "tradeDate" ? "end" : "middle"}
                          height={barGroupBy === "tradeDate" ? 60 : 30}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "#6b7280" }}
                          tickFormatter={(v) => formatNumber(v)}
                        />
                        <Tooltip
                          formatter={(value: number) => [
                            formatCurrency(value),
                            "合计盈亏",
                          ]}
                          contentStyle={{
                            background: "#fff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Bar dataKey="value" name="合计盈亏" radius={[4, 4, 0, 0]}>
                          {barData.map((entry: any, index: number) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.value >= 0 ? "#c41e3a" : "#2e8b57"}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      暂无数据
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Data Table */}
      <Card className="bg-gradient-card border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-gray-900 text-lg flex items-center gap-2">
              <Table2 className="h-5 w-5 text-[#b8860b]" />
              交易明细
              <Badge
                variant="outline"
                className="border-gray-200 text-gray-500"
              >
                {listData?.total ?? 0} 条
              </Badge>
            </CardTitle>

            {/* Position Tabs - 未平仓 = Open, 已平仓 = Close */}
            <div className="flex rounded-lg overflow-hidden border border-gray-200">
              <button
                onClick={() => { setPositionTab("open"); setPage(1); }}
                className={`px-4 py-2 text-sm font-medium transition-all ${
                  positionTab === "open"
                    ? "bg-[#c41e3a] text-white"
                    : "bg-gray-50 text-gray-500 hover:text-gray-700"
                }`}
              >
                未平仓 (Open)
              </button>
              <button
                onClick={() => { setPositionTab("closed"); setPage(1); }}
                className={`px-4 py-2 text-sm font-medium transition-all ${
                  positionTab === "closed"
                    ? "bg-[#2e8b57] text-white"
                    : "bg-gray-50 text-gray-500 hover:text-gray-700"
                }`}
              >
                已平仓 (Close)
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 hover:bg-transparent">
                  <TableHead className="text-gray-500 font-medium text-xs">序号</TableHead>
                  <TableHead className="text-gray-500 font-medium text-xs">交易日期</TableHead>
                  <TableHead className="text-gray-500 font-medium text-xs">到期日</TableHead>
                  <TableHead className="text-gray-500 font-medium text-xs text-center">交易对手</TableHead>
                  <TableHead className="text-gray-500 font-medium text-xs text-center">方向</TableHead>
                  <TableHead className="text-gray-500 font-medium text-xs text-center">类型</TableHead>
                  <TableHead className="text-gray-500 font-medium text-xs text-center">货币对</TableHead>
                  <TableHead className="text-gray-500 font-medium text-xs text-right">名义本金</TableHead>
                  <TableHead className="text-gray-500 font-medium text-xs text-right">开仓价格</TableHead>
                  <TableHead className="text-gray-500 font-medium text-xs text-right">合计盈亏</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listData?.items.map((item: any, idx: number) => (
                  <TableRow
                    key={item.id}
                    className="border-gray-100 hover:bg-gray-50/50 transition-colors"
                  >
                    <TableCell className="text-gray-700 text-sm">
                      {(page - 1) * pageSize + idx + 1}
                    </TableCell>
                    <TableCell className="text-gray-700 text-sm whitespace-nowrap">
                      {item.tradeDate
                        ? new Date(item.tradeDate).toLocaleDateString("zh-CN")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-gray-700 text-sm whitespace-nowrap">
                      {item.deliveryDate
                        ? new Date(item.deliveryDate).toLocaleDateString("zh-CN")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-gray-700 text-sm text-center">
                      {item.counterparty || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`text-sm font-medium ${
                          item.direction === "Buy"
                            ? "text-green-600"
                            : item.direction === "Sell"
                            ? "text-red-600"
                            : "text-gray-400"
                        }`}
                      >
                        {item.direction || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-700 text-sm text-center">
                      {item.productType || "-"}
                      {item.subType ? ` (${item.subType})` : ""}
                    </TableCell>
                    <TableCell className="text-[#b8860b] text-sm font-medium text-center">
                      {item.currencyPair || "-"}
                    </TableCell>
                    <TableCell className="text-right text-[#b8860b] text-sm font-mono">
                      {item.notionalLocal
                        ? Number(item.notionalLocal).toLocaleString("zh-CN")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right text-gray-700 text-sm font-mono">
                      {formatPrice4(item.strikePrice)}
                    </TableCell>
                    <TableCell
                      className={`text-right text-sm font-mono ${
                        item.totalPnlUsd && Number(item.totalPnlUsd) < 0
                          ? "text-red-600"
                          : item.totalPnlUsd && Number(item.totalPnlUsd) > 0
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    >
                      {formatInteger(item.totalPnlUsd)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              显示 {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, listData?.total ?? 0)} 条,
              共 {listData?.total ?? 0} 条
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="border-gray-200 text-gray-500 hover:text-gray-700"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                上一页
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="border-gray-200 text-gray-500 hover:text-gray-700"
              >
                下一页
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      </div>
      <footer className="border-t border-gray-200 bg-white mt-8">
        <div className="max-w-[1600px] mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <img src="./logo-zijin.jpg" alt="紫金投资" className="h-8 w-auto" />
                <span className="font-bold text-gray-900">紫金投资</span>
              </div>
              <p className="text-sm text-gray-500">
                专业外汇交易台账管理服务平台
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="h-4 w-4 text-[#b8860b]" />
                联系我们
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  联系人:曹愻川
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  电话:13564016600
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  工作时间:周一至周五 9:00-18:00
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#b8860b]" />
                版权声明
              </h3>
              <div className="space-y-2 text-sm text-gray-500">
                <p>© 2026 紫金投资 ZiJin Investment. 保留所有权利。</p>
                <p>本系统数据仅供内部管理使用,未经授权不得对外披露。</p>
                <p>外汇交易台账管理系统 v1.0</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              技术支持:OpenClaw Agent | 数据安全由本地存储保障
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
