import { useState, useMemo } from "react";
import { trpc } from "@/providers/trpc";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const LEDGERS = [
  { value: "report" as const, label: "报表敞口台账", color: "#c41e3a" },
  { value: "trading" as const, label: "交易敞口台账", color: "#b8860b" },
  { value: "proprietary" as const, label: "自营交易台账", color: "#2e8b57" },
];

const COLORS = ["#c41e3a", "#b8860b", "#2e8b57", "#1e90ff", "#ff6b35", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b", "#6366f1"];

export default function Home() {
  const [activeLedger, setActiveLedger] = useState<(typeof LEDGERS)[number]>(LEDGERS[0]);
  const [page, setPage] = useState(1);
  const [positionTab, setPositionTab] = useState<"closed" | "open">("open");
  const pageSize = 20;

  // Boss says: close = 未平仓, open = 已平仓
  // So for the "已平仓" tab we show open status, for "未平仓" we show close status
  const closeStatusFilter = positionTab === "closed" ? "Close" : "Open";

  const { data: summary } = trpc.ledger.summary.useQuery({
    ledger: activeLedger.value,
  });

  const { data: listData } = trpc.ledger.list.useQuery({
    ledger: activeLedger.value,
    page,
    pageSize,
    filters: { closeStatus: closeStatusFilter },
  });

  const { data: chartData } = trpc.ledger.chartStats.useQuery({
    ledger: activeLedger.value,
  });

  const totalPages = listData ? Math.ceil(listData.total / pageSize) : 0;

  const formatNumber = (n: number) => {
    if (n === 0) return "-";
    if (Math.abs(n) >= 1e8) return (n / 1e8).toFixed(2) + "亿";
    if (Math.abs(n) >= 1e4) return (n / 1e4).toFixed(2) + "万";
    return n.toLocaleString("zh-CN", { maximumFractionDigits: 2 });
  };

  const formatCurrency = (n: number) => {
    if (n === 0) return "-";
    const prefix = n >= 0 ? "+" : "";
    return prefix + formatNumber(n);
  };

  // Prepare pie chart data - only show top 8 + others
  const currencyPieData = useMemo(() => {
    if (!chartData?.byCurrencyPair?.length) return [];
    const data = [...chartData.byCurrencyPair];
    const top8 = data.slice(0, 8);
    const others = data.slice(8);
    if (others.length > 0) {
      const othersValue = others.reduce((sum, d) => sum + d.value, 0);
      top8.push({ name: "其他", value: Number(othersValue.toFixed(2)) });
    }
    return top8;
  }, [chartData]);

  const counterpartyPieData = useMemo(() => {
    if (!chartData?.byCounterparty?.length) return [];
    const data = [...chartData.byCounterparty];
    const top8 = data.slice(0, 8);
    const others = data.slice(8);
    if (others.length > 0) {
      const othersValue = others.reduce((sum, d) => sum + d.value, 0);
      top8.push({ name: "其他", value: Number(othersValue.toFixed(2)) });
    }
    return top8;
  }, [chartData]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">外汇交易台账统计</h2>
          <p className="text-sm text-gray-500 mt-1">
            实时查看名义本金、盈亏情况与分类统计分析
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Admin entry button */}
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
          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            {LEDGERS.map((ledger) => (
              <button
                key={ledger.value}
                onClick={() => {
                  setActiveLedger(ledger);
                  setPage(1);
                  setPositionTab("open");
                }}
                className={`px-4 py-2 text-sm font-medium transition-all ${
                  activeLedger.value === ledger.value
                    ? "text-white"
                    : "text-gray-500 hover:text-gray-700 bg-gray-50"
                }`}
                style={
                  activeLedger.value === ledger.value
                    ? { backgroundColor: ledger.color }
                    : {}
                }
              >
                {ledger.label}
              </button>
            ))}
          </div>
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

      {/* Pie Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-card border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-gray-900 text-lg flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-[#b8860b]" />
              按货币对盈亏分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
              {currencyPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={currencyPieData}
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
                      {currencyPieData.map((_, index) => (
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

        <Card className="bg-gradient-card border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-gray-900 text-lg flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-[#b8860b]" />
              按交易对手盈亏分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
              {counterpartyPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={counterpartyPieData}
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
                      {counterpartyPieData.map((_, index) => (
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

      {/* Position Tabs + Data Table */}
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

            {/* Position Tabs - Boss says: close = 未平仓, open = 已平仓 */}
            <div className="flex rounded-lg overflow-hidden border border-gray-200">
              <button
                onClick={() => { setPositionTab("open"); setPage(1); }}
                className={`px-4 py-2 text-sm font-medium transition-all ${
                  positionTab === "open"
                    ? "bg-[#2e8b57] text-white"
                    : "bg-gray-50 text-gray-500 hover:text-gray-700"
                }`}
              >
                已平仓 (Open)
              </button>
              <button
                onClick={() => { setPositionTab("closed"); setPage(1); }}
                className={`px-4 py-2 text-sm font-medium transition-all ${
                  positionTab === "closed"
                    ? "bg-[#c41e3a] text-white"
                    : "bg-gray-50 text-gray-500 hover:text-gray-700"
                }`}
              >
                未平仓 (Close)
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 hover:bg-transparent">
                  <TableHead className="text-gray-500 font-medium">序号</TableHead>
                  <TableHead className="text-gray-500 font-medium">交易日期</TableHead>
                  <TableHead className="text-gray-500 font-medium">交易主体</TableHead>
                  <TableHead className="text-gray-500 font-medium">交易对手</TableHead>
                  <TableHead className="text-gray-500 font-medium">状态</TableHead>
                  <TableHead className="text-gray-500 font-medium">方向</TableHead>
                  <TableHead className="text-gray-500 font-medium">类型</TableHead>
                  <TableHead className="text-gray-500 font-medium">货币对</TableHead>
                  <TableHead className="text-gray-500 font-medium text-right">名义本金</TableHead>
                  <TableHead className="text-gray-500 font-medium text-right">开仓价格</TableHead>
                  <TableHead className="text-gray-500 font-medium text-right">权利金</TableHead>
                  <TableHead className="text-gray-500 font-medium text-right">未到期盈亏</TableHead>
                  <TableHead className="text-gray-500 font-medium text-right">已实现盈亏</TableHead>
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
                    <TableCell className="text-gray-900 text-sm font-medium">
                      {item.entity || "-"}
                    </TableCell>
                    <TableCell className="text-gray-700 text-sm">
                      {item.counterparty || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {item.expiryStatus && (
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              item.expiryStatus === "Active"
                                ? "border-green-200 text-green-600 bg-green-50"
                                : item.expiryStatus === "Expired"
                                ? "border-gray-200 text-gray-400"
                                : "border-yellow-200 text-yellow-600 bg-yellow-50"
                            }`}
                          >
                            {item.expiryStatus}
                          </Badge>
                        )}
                        {item.closeStatus && (
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              item.closeStatus === "Open"
                                ? "border-[#c41e3a]/20 text-[#c41e3a]"
                                : "border-gray-200 text-gray-400"
                            }`}
                          >
                            {item.closeStatus}
                          </Badge>
                        )}
                      </div>
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
                      {item.strikePrice || "-"}
                    </TableCell>
                    <TableCell
                      className={`text-right text-sm font-mono ${
                        item.premium && Number(item.premium) < 0
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {item.premium
                        ? Number(item.premium).toLocaleString("zh-CN")
                        : "-"}
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
                      {item.unrealizedPnlUsd
                        ? Number(item.unrealizedPnlUsd).toLocaleString("zh-CN", {
                            maximumFractionDigits: 2,
                          })
                        : item.unrealizedPnlCny
                        ? Number(item.unrealizedPnlCny).toLocaleString("zh-CN", {
                            maximumFractionDigits: 2,
                          })
                        : "-"}
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
                      {item.realizedPnlUsd
                        ? Number(item.realizedPnlUsd).toLocaleString("zh-CN", {
                            maximumFractionDigits: 2,
                          })
                        : item.realizedPnlCny
                        ? Number(item.realizedPnlCny).toLocaleString("zh-CN", {
                            maximumFractionDigits: 2,
                          })
                        : item.totalPnlUsd
                        ? Number(item.totalPnlUsd).toLocaleString("zh-CN", {
                            maximumFractionDigits: 2,
                          })
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
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <img src="./logo-zijin.jpg" alt="紫金投资" className="h-8 w-auto" />
                <span className="font-bold text-gray-900">紫金投资</span>
              </div>
              <p className="text-sm text-gray-500">
                专业外汇交易台账管理服务平台
              </p>
            </div>

            {/* Contact */}
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

            {/* Copyright */}
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
