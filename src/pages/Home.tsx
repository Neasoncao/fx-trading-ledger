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
  const [activeLedger, setActiveLedger] = useState<(typeof LEDGERS)[number]>(LEDGERS[0]);
  const [page, setPage] = useState(1);
  const [positionTab, setPositionTab] = useState<"closed" | "open">("open");
  const [groupBy, setGroupBy] = useState("entity");
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

  const { data: stats } = trpc.ledger.statistics.useQuery({
    ledger: activeLedger.value,
    groupBy: groupBy as any,
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

  const totalPages = listData ? Math.ceil(listData.total / pageSize) : 0;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: activeLedger.color }}
          />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{activeLedger.label}</h2>
            <p className="text-sm text-gray-500 mt-1">
              实时查看名义本金、盈亏情况与分类统计分析
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/admin">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-[#c41e3a]/30 text-[#c41e3a] hover:bg-[#c41e3a]/10"
            >
              <Shield className="h-4 w-4" />
              后台维护
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-card border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">交易笔数</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {summary?.totalCount?.toLocaleString() ?? "-"}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-[#c41e3a]/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-[#c41e3a]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">名义本金合计</p>
                <p className="text-2xl font-bold text-[#b8860b] mt-1">
                  {formatNumber(summary?.totalNotional ?? 0)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-[#b8860b]/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-[#b8860b]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">未实现盈亏</p>
                <p className={`text-2xl font-bold mt-1 ${
                  (summary?.totalUnrealizedPnl ?? 0) >= 0 ? "text-green-600" : "text-red-600"
                }`}>
                  {formatCurrency(summary?.totalUnrealizedPnl ?? 0)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">已实现盈亏</p>
                <p className={`text-2xl font-bold mt-1 ${
                  (summary?.totalRealizedPnl ?? 0) >= 0 ? "text-green-600" : "text-red-600"
                }`}>
                  {formatCurrency(summary?.totalRealizedPnl ?? 0)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Group By Stats List */}
        <Card className="lg:col-span-1 bg-gradient-card border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-900 text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#b8860b]" />
                分类统计分析
              </CardTitle>
              <Select value={groupBy} onValueChange={setGroupBy}>
                <SelectTrigger className="w-[140px] bg-white border-gray-200 text-gray-900 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  {GROUP_BY_OPTIONS.map((opt) => (
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
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2">
              {stats?.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 border border-gray-100 hover:border-[#b8860b]/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {item.groupValue}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] border-gray-200 text-gray-500"
                      >
                        {item.count}笔
                      </Badge>
                    </div>
                    <div className="mt-1 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (item.totalNotional / (summary?.maxNotional || 1)) * 100)}%`,
                          backgroundColor: activeLedger.color,
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-500">名义本金</p>
                    <p className="text-sm font-semibold text-[#b8860b]">
                      {formatNumber(item.totalNotional)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 w-24">
                    <p className="text-xs text-gray-500">
                      {activeLedger.value === "proprietary" ? "合计盈亏" : "已实现盈亏"}
                    </p>
                    <p
                      className={`text-sm font-semibold ${
                        (activeLedger.value === "proprietary"
                          ? item.totalPnl
                          : item.totalRealizedPnl) >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {formatCurrency(
                        activeLedger.value === "proprietary"
                          ? item.totalPnl
                          : item.totalRealizedPnl
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart */}
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
      </div>

      {/* Bar Chart - Profit/Loss by Dimension */}
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
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      name === "profit" ? "盈利" : "亏损",
                    ]}
                    contentStyle={{
                      background: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend 
                    formatter={(value: string) => value === "profit" ? "盈利" : "亏损"}
                  />
                  <Bar dataKey="profit" fill="#10b981" name="profit" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="loss" fill="#ef4444" name="loss" radius={[4, 4, 0, 0]} />
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
                  <TableHead className="text-gray-500 font-medium text-xs">交易对手</TableHead>
                  <TableHead className="text-gray-500 font-medium text-xs">方向</TableHead>
                  <TableHead className="text-gray-500 font-medium text-xs">类型</TableHead>
                  <TableHead className="text-gray-500 font-medium text-xs">货币对</TableHead>
                  <TableHead className="text-gray-500 font-medium text-xs text-right">名义本金</TableHead>
                  <TableHead className="text-gray-500 font-medium text-xs text-right">开仓价格</TableHead>
                  <TableHead className="text-gray-500 font-medium text-xs text-right">权利金</TableHead>
                  <TableHead className="text-gray-500 font-medium text-xs text-right">未到期盈亏</TableHead>
                  <TableHead className="text-gray-500 font-medium text-xs text-right">已实现盈亏</TableHead>
                  <TableHead className="text-gray-500 font-medium text-xs text-right">到期日</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listData?.items.map((item: any, idx: number) => (
                  <TableRow
                    key={item.id}
                    className="border-gray-100 hover:bg-gray-50/50 transition-colors"
                  >
                    <TableCell className="text-gray-700 text-sm">
                      {item.seqNo || idx + 1}
                    </TableCell>
                    <TableCell className="text-gray-700 text-sm whitespace-nowrap">
                      {item.tradeDate
                        ? new Date(item.tradeDate).toLocaleDateString("zh-CN")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-gray-700 text-sm">
                      {item.counterparty || "-"}
                    </TableCell>
                    <TableCell>
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
                    <TableCell className="text-gray-700 text-sm">
                      {item.productType || "-"}
                      {item.subType ? ` (${item.subType})` : ""}
                    </TableCell>
                    <TableCell className="text-[#b8860b] text-sm font-medium">
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
                        item.premium && Number(item.premium) < 0
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {formatInteger(item.premium)}
                    </TableCell>
                    <TableCell
                      className={`text-right text-sm font-mono ${
                        item.unrealizedPnlUsd && Number(item.unrealizedPnlUsd) < 0
                          ? "text-red-600"
                          : item.unrealizedPnlUsd && Number(item.unrealizedPnlUsd) > 0
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    >
                      {formatInteger(item.unrealizedPnlUsd ?? item.unrealizedPnlCny)}
                    </TableCell>
                    <TableCell
                      className={`text-right text-sm font-mono ${
                        item.realizedPnlUsd && Number(item.realizedPnlUsd) < 0
                          ? "text-red-600"
                          : item.realizedPnlUsd && Number(item.realizedPnlUsd) > 0
                          ? "text-green-600"
                          : item.totalPnlUsd && Number(item.totalPnlUsd) < 0
                          ? "text-red-600"
                          : item.totalPnlUsd && Number(item.totalPnlUsd) > 0
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    >
                      {formatInteger(item.realizedPnlUsd ?? item.realizedPnlCny ?? item.totalPnlUsd)}
                    </TableCell>
                    <TableCell className="text-gray-700 text-sm whitespace-nowrap text-right">
                      {item.deliveryDate
                        ? new Date(item.deliveryDate).toLocaleDateString("zh-CN")
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              显示 {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, listData?.total ?? 0)} 条，
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
                  联系人：曹愻川
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  电话：13564016600
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  工作时间：周一至周五 9:00-18:00
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
                <p>本系统数据仅供内部管理使用，未经授权不得对外披露。</p>
                <p>外汇交易台账管理系统 v1.0</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              技术支持：OpenClaw Agent | 数据安全由本地存储保障
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
