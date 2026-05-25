import { useState } from "react";
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
  TrendingUp,
  DollarSign,
  BarChart3,
  PieChart,
  Activity,
  Filter,
  ChevronLeft,
  ChevronRight,
  Table2,
  Shield,
  Globe,
  Clock,
  Phone,
  User,
} from "lucide-react";

const LEDGERS = [
  { value: "report" as const, label: "报表敞口台账", color: "#c41e3a" },
  { value: "trading" as const, label: "交易敞口台账", color: "#b8860b" },
  { value: "proprietary" as const, label: "自营交易台账", color: "#2e8b57" },
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

const CURRENCY_PAIRS = [
  { pair: "EUR/USD", rate: "1.0847", change: "+0.12%" },
  { pair: "GBP/USD", rate: "1.2735", change: "-0.05%" },
  { pair: "USD/JPY", rate: "156.82", change: "+0.34%" },
  { pair: "USD/CNH", rate: "7.2456", change: "+0.08%" },
  { pair: "AUD/USD", rate: "0.6654", change: "-0.21%" },
];

export default function Home() {
  const [activeLedger, setActiveLedger] = useState<(typeof LEDGERS)[number]>(LEDGERS[0]);
  const [groupBy, setGroupBy] = useState("entity");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const pageSize = 20;

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
    filters: Object.keys(filters).length > 0 ? filters : undefined,
  });

  const { data: filterOptions } = trpc.ledger.filterOptions.useQuery({
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
                  setFilters({});
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

      {/* Forex Market Ticker */}
      <Card className="bg-gradient-card border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-gray-900 text-base flex items-center gap-2">
            <Globe className="h-5 w-5 text-[#b8860b]" />
            外汇市场实时行情
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {CURRENCY_PAIRS.map((item) => (
              <div
                key={item.pair}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.pair}</p>
                  <p className="text-xs text-gray-500">{item.rate}</p>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    item.change.startsWith("+")
                      ? "border-green-200 text-green-600 bg-green-50"
                      : "border-red-200 text-red-600 bg-red-50"
                  }`}
                >
                  {item.change}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
        {/* Group By Stats */}
        <Card className="lg:col-span-2 bg-gradient-card border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-900 text-lg flex items-center gap-2">
                <PieChart className="h-5 w-5 text-[#b8860b]" />
                分类统计分析
              </CardTitle>
              <Select value={groupBy} onValueChange={setGroupBy}>
                <SelectTrigger className="w-[160px] bg-white border-gray-200 text-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  {GROUP_BY_OPTIONS.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      className="text-gray-700 focus:bg-gray-100 focus:text-gray-900"
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
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

        {/* Filter Panel */}
        <Card className="bg-gradient-card border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-gray-900 text-lg flex items-center gap-2">
              <Filter className="h-5 w-5 text-[#b8860b]" />
              筛选条件
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {filterOptions && (
              <>
                {filterOptions.entities.length > 0 && (
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">交易主体</label>
                    <Select
                      value={filters.entity || "all"}
                      onValueChange={(v) =>
                        setFilters((f) => ({ ...f, entity: v === "all" ? "" : v }))
                      }
                    >
                      <SelectTrigger className="bg-white border-gray-200 text-gray-700">
                        <SelectValue placeholder="全部" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
                        <SelectItem value="all" className="text-gray-700">全部</SelectItem>
                        {filterOptions.entities.filter(Boolean).map((e) => (
                          <SelectItem key={e!} value={e!} className="text-gray-700">
                            {e}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {filterOptions.counterparties.length > 0 && (
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">交易对手</label>
                    <Select
                      value={filters.counterparty || "all"}
                      onValueChange={(v) =>
                        setFilters((f) => ({ ...f, counterparty: v === "all" ? "" : v }))
                      }
                    >
                      <SelectTrigger className="bg-white border-gray-200 text-gray-700">
                        <SelectValue placeholder="全部" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
                        <SelectItem value="all" className="text-gray-700">全部</SelectItem>
                        {filterOptions.counterparties.filter(Boolean).map((e) => (
                          <SelectItem key={e!} value={e!} className="text-gray-700">
                            {e}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {filterOptions.productTypes.length > 0 && (
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">衍生品类型</label>
                    <Select
                      value={filters.productType || "all"}
                      onValueChange={(v) =>
                        setFilters((f) => ({ ...f, productType: v === "all" ? "" : v }))
                      }
                    >
                      <SelectTrigger className="bg-white border-gray-200 text-gray-700">
                        <SelectValue placeholder="全部" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
                        <SelectItem value="all" className="text-gray-700">全部</SelectItem>
                        {filterOptions.productTypes.filter(Boolean).map((e) => (
                          <SelectItem key={e!} value={e!} className="text-gray-700">
                            {e}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {filterOptions.currencyPairs.length > 0 && (
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">货币对</label>
                    <Select
                      value={filters.currencyPair || "all"}
                      onValueChange={(v) =>
                        setFilters((f) => ({ ...f, currencyPair: v === "all" ? "" : v }))
                      }
                    >
                      <SelectTrigger className="bg-white border-gray-200 text-gray-700">
                        <SelectValue placeholder="全部" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
                        <SelectItem value="all" className="text-gray-700">全部</SelectItem>
                        {filterOptions.currencyPairs.filter(Boolean).map((e) => (
                          <SelectItem key={e!} value={e!} className="text-gray-700">
                            {e}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {filterOptions.expiryStatuses.length > 0 && (
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">到期状态</label>
                    <Select
                      value={filters.expiryStatus || "all"}
                      onValueChange={(v) =>
                        setFilters((f) => ({ ...f, expiryStatus: v === "all" ? "" : v }))
                      }
                    >
                      <SelectTrigger className="bg-white border-gray-200 text-gray-700">
                        <SelectValue placeholder="全部" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
                        <SelectItem value="all" className="text-gray-700">全部</SelectItem>
                        {filterOptions.expiryStatuses.filter(Boolean).map((e) => (
                          <SelectItem key={e!} value={e!} className="text-gray-700">
                            {e}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {filterOptions.closeStatuses.length > 0 && (
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">平仓状态</label>
                    <Select
                      value={filters.closeStatus || "all"}
                      onValueChange={(v) =>
                        setFilters((f) => ({ ...f, closeStatus: v === "all" ? "" : v }))
                      }
                    >
                      <SelectTrigger className="bg-white border-gray-200 text-gray-700">
                        <SelectValue placeholder="全部" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
                        <SelectItem value="all" className="text-gray-700">全部</SelectItem>
                        {filterOptions.closeStatuses.filter(Boolean).map((e) => (
                          <SelectItem key={e!} value={e!} className="text-gray-700">
                            {e}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilters({});
                setPage(1);
              }}
              className="w-full border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            >
              清除筛选
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card className="bg-gradient-card border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
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
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="border-gray-200 text-gray-500 hover:text-gray-700"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-500">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="border-gray-200 text-gray-500 hover:text-gray-700"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
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
                <img src="/logo-zijin.jpg" alt="紫金投资" className="h-8 w-auto" />
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
