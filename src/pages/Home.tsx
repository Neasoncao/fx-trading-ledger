import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
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
} from "lucide-react";

const LEDGERS = [
  { value: "report" as const, label: "报表敞口台账", color: "#c41e3a" },
  { value: "trading" as const, label: "交易敞口台账", color: "#d4a843" },
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

export default function Home() {
  const { } = useAuth();
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
          <h2 className="text-2xl font-bold text-[#f0d78c]">外汇交易台账统计</h2>
          <p className="text-sm text-[#8b7355] mt-1">
            实时查看名义本金、盈亏情况与分类统计分析
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border border-[#2a2a2a]">
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
                    : "text-[#8b7355] hover:text-[#b8a88a] bg-[#111]"
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
        <Card className="bg-gradient-card border-[#2a2a2a] shadow-gold">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#8b7355] uppercase tracking-wider">交易笔数</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {summary?.totalCount?.toLocaleString() ?? "-"}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-[#c41e3a]/20 flex items-center justify-center">
                <Activity className="h-5 w-5 text-[#c41e3a]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-[#2a2a2a] shadow-gold">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#8b7355] uppercase tracking-wider">名义本金合计</p>
                <p className="text-2xl font-bold text-[#f0d78c] mt-1">
                  {formatNumber(summary?.totalNotional ?? 0)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-[#d4a843]/20 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-[#d4a843]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-[#2a2a2a] shadow-gold">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#8b7355] uppercase tracking-wider">未实现盈亏</p>
                <p className={`text-2xl font-bold mt-1 ${
                  (summary?.totalUnrealizedPnl ?? 0) >= 0 ? "text-green-400" : "text-red-400"
                }`}>
                  {formatCurrency(summary?.totalUnrealizedPnl ?? 0)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-[#2a2a2a] shadow-gold">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#8b7355] uppercase tracking-wider">已实现盈亏</p>
                <p className={`text-2xl font-bold mt-1 ${
                  (summary?.totalRealizedPnl ?? 0) >= 0 ? "text-green-400" : "text-red-400"
                }`}>
                  {formatCurrency(summary?.totalRealizedPnl ?? 0)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Group By Stats */}
        <Card className="lg:col-span-2 bg-gradient-card border-[#2a2a2a]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[#f0d78c] text-lg flex items-center gap-2">
                <PieChart className="h-5 w-5 text-[#d4a843]" />
                分类统计分析
              </CardTitle>
              <Select value={groupBy} onValueChange={setGroupBy}>
                <SelectTrigger className="w-[160px] bg-[#1a1a1a] border-[#2a2a2a] text-[#f0d78c]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                  {GROUP_BY_OPTIONS.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      className="text-[#d4d4d4] focus:bg-[#2a2a2a] focus:text-[#f0d78c]"
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
                  className="flex items-center gap-4 p-3 rounded-lg bg-[#111] border border-[#1a1a1a] hover:border-[#d4a843]/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">
                        {item.groupValue}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] border-[#2a2a2a] text-[#8b7355]"
                      >
                        {item.count}笔
                      </Badge>
                    </div>
                    <div className="mt-1 h-1.5 w-full bg-[#1a1a1a] rounded-full overflow-hidden">
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
                    <p className="text-xs text-[#8b7355]">名义本金</p>
                    <p className="text-sm font-semibold text-[#f0d78c]">
                      {formatNumber(item.totalNotional)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 w-24">
                    <p className="text-xs text-[#8b7355]">
                      {activeLedger.value === "proprietary" ? "合计盈亏" : "已实现盈亏"}
                    </p>
                    <p
                      className={`text-sm font-semibold ${
                        (activeLedger.value === "proprietary"
                          ? item.totalPnl
                          : item.totalRealizedPnl) >= 0
                          ? "text-green-400"
                          : "text-red-400"
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
        <Card className="bg-gradient-card border-[#2a2a2a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-[#f0d78c] text-lg flex items-center gap-2">
              <Filter className="h-5 w-5 text-[#d4a843]" />
              筛选条件
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {filterOptions && (
              <>
                {filterOptions.entities.length > 0 && (
                  <div>
                    <label className="text-xs text-[#8b7355] mb-1.5 block">交易主体</label>
                    <Select
                      value={filters.entity || "all"}
                      onValueChange={(v) =>
                        setFilters((f) => ({ ...f, entity: v === "all" ? "" : v }))
                      }
                    >
                      <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-[#d4d4d4]">
                        <SelectValue placeholder="全部" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                        <SelectItem value="all" className="text-[#d4d4d4]">全部</SelectItem>
                        {filterOptions.entities.filter(Boolean).map((e) => (
                          <SelectItem key={e!} value={e!} className="text-[#d4d4d4]">
                            {e}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {filterOptions.counterparties.length > 0 && (
                  <div>
                    <label className="text-xs text-[#8b7355] mb-1.5 block">交易对手</label>
                    <Select
                      value={filters.counterparty || "all"}
                      onValueChange={(v) =>
                        setFilters((f) => ({ ...f, counterparty: v === "all" ? "" : v }))
                      }
                    >
                      <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-[#d4d4d4]">
                        <SelectValue placeholder="全部" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                        <SelectItem value="all" className="text-[#d4d4d4]">全部</SelectItem>
                        {filterOptions.counterparties.filter(Boolean).map((e) => (
                          <SelectItem key={e!} value={e!} className="text-[#d4d4d4]">
                            {e}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {filterOptions.productTypes.length > 0 && (
                  <div>
                    <label className="text-xs text-[#8b7355] mb-1.5 block">衍生品类型</label>
                    <Select
                      value={filters.productType || "all"}
                      onValueChange={(v) =>
                        setFilters((f) => ({ ...f, productType: v === "all" ? "" : v }))
                      }
                    >
                      <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-[#d4d4d4]">
                        <SelectValue placeholder="全部" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                        <SelectItem value="all" className="text-[#d4d4d4]">全部</SelectItem>
                        {filterOptions.productTypes.filter(Boolean).map((e) => (
                          <SelectItem key={e!} value={e!} className="text-[#d4d4d4]">
                            {e}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {filterOptions.currencyPairs.length > 0 && (
                  <div>
                    <label className="text-xs text-[#8b7355] mb-1.5 block">货币对</label>
                    <Select
                      value={filters.currencyPair || "all"}
                      onValueChange={(v) =>
                        setFilters((f) => ({ ...f, currencyPair: v === "all" ? "" : v }))
                      }
                    >
                      <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-[#d4d4d4]">
                        <SelectValue placeholder="全部" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                        <SelectItem value="all" className="text-[#d4d4d4]">全部</SelectItem>
                        {filterOptions.currencyPairs.filter(Boolean).map((e) => (
                          <SelectItem key={e!} value={e!} className="text-[#d4d4d4]">
                            {e}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {filterOptions.expiryStatuses.length > 0 && (
                  <div>
                    <label className="text-xs text-[#8b7355] mb-1.5 block">到期状态</label>
                    <Select
                      value={filters.expiryStatus || "all"}
                      onValueChange={(v) =>
                        setFilters((f) => ({ ...f, expiryStatus: v === "all" ? "" : v }))
                      }
                    >
                      <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-[#d4d4d4]">
                        <SelectValue placeholder="全部" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                        <SelectItem value="all" className="text-[#d4d4d4]">全部</SelectItem>
                        {filterOptions.expiryStatuses.filter(Boolean).map((e) => (
                          <SelectItem key={e!} value={e!} className="text-[#d4d4d4]">
                            {e}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {filterOptions.closeStatuses.length > 0 && (
                  <div>
                    <label className="text-xs text-[#8b7355] mb-1.5 block">平仓状态</label>
                    <Select
                      value={filters.closeStatus || "all"}
                      onValueChange={(v) =>
                        setFilters((f) => ({ ...f, closeStatus: v === "all" ? "" : v }))
                      }
                    >
                      <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-[#d4d4d4]">
                        <SelectValue placeholder="全部" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                        <SelectItem value="all" className="text-[#d4d4d4]">全部</SelectItem>
                        {filterOptions.closeStatuses.filter(Boolean).map((e) => (
                          <SelectItem key={e!} value={e!} className="text-[#d4d4d4]">
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
              className="w-full border-[#2a2a2a] text-[#8b7355] hover:text-[#f0d78c] hover:bg-[#1a1a1a]"
            >
              清除筛选
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card className="bg-gradient-card border-[#2a2a2a]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[#f0d78c] text-lg flex items-center gap-2">
              <Table2 className="h-5 w-5 text-[#d4a843]" />
              交易明细
              <Badge
                variant="outline"
                className="border-[#2a2a2a] text-[#8b7355]"
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
                className="border-[#2a2a2a] text-[#8b7355] hover:text-[#f0d78c]"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-[#8b7355]">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="border-[#2a2a2a] text-[#8b7355] hover:text-[#f0d78c]"
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
                <TableRow className="border-[#2a2a2a] hover:bg-transparent">
                  <TableHead className="text-[#8b7355] font-medium">序号</TableHead>
                  <TableHead className="text-[#8b7355] font-medium">交易日期</TableHead>
                  <TableHead className="text-[#8b7355] font-medium">交易主体</TableHead>
                  <TableHead className="text-[#8b7355] font-medium">交易对手</TableHead>
                  <TableHead className="text-[#8b7355] font-medium">状态</TableHead>
                  <TableHead className="text-[#8b7355] font-medium">方向</TableHead>
                  <TableHead className="text-[#8b7355] font-medium">类型</TableHead>
                  <TableHead className="text-[#8b7355] font-medium">货币对</TableHead>
                  <TableHead className="text-[#8b7355] font-medium text-right">名义本金</TableHead>
                  <TableHead className="text-[#8b7355] font-medium text-right">开仓价格</TableHead>
                  <TableHead className="text-[#8b7355] font-medium text-right">权利金</TableHead>
                  <TableHead className="text-[#8b7355] font-medium text-right">未到期盈亏</TableHead>
                  <TableHead className="text-[#8b7355] font-medium text-right">已实现盈亏</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listData?.items.map((item: any, idx: number) => (
                  <TableRow
                    key={item.id}
                    className="border-[#1a1a1a] hover:bg-[#1a1a1a]/50 transition-colors"
                  >
                    <TableCell className="text-[#d4d4d4] text-sm">
                      {item.seqNo || idx + 1}
                    </TableCell>
                    <TableCell className="text-[#d4d4d4] text-sm whitespace-nowrap">
                      {item.tradeDate
                        ? new Date(item.tradeDate).toLocaleDateString("zh-CN")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-[#f0d78c] text-sm font-medium">
                      {item.entity || "-"}
                    </TableCell>
                    <TableCell className="text-[#d4d4d4] text-sm">
                      {item.counterparty || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {item.expiryStatus && (
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              item.expiryStatus === "Active"
                                ? "border-green-500/30 text-green-400"
                                : item.expiryStatus === "Expired"
                                ? "border-[#2a2a2a] text-[#666]"
                                : "border-yellow-500/30 text-yellow-400"
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
                                ? "border-[#c41e3a]/30 text-[#c41e3a]"
                                : "border-[#2a2a2a] text-[#666]"
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
                            ? "text-green-400"
                            : item.direction === "Sell"
                            ? "text-red-400"
                            : "text-[#666]"
                        }`}
                      >
                        {item.direction || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="text-[#d4d4d4] text-sm">
                      {item.productType || "-"}
                      {item.subType ? ` (${item.subType})` : ""}
                    </TableCell>
                    <TableCell className="text-[#d4a843] text-sm font-medium">
                      {item.currencyPair || "-"}
                    </TableCell>
                    <TableCell className="text-right text-[#f0d78c] text-sm font-mono">
                      {item.notionalLocal
                        ? Number(item.notionalLocal).toLocaleString("zh-CN")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right text-[#d4d4d4] text-sm font-mono">
                      {item.strikePrice || "-"}
                    </TableCell>
                    <TableCell
                      className={`text-right text-sm font-mono ${
                        item.premium && Number(item.premium) < 0
                          ? "text-red-400"
                          : "text-green-400"
                      }`}
                    >
                      {item.premium
                        ? Number(item.premium).toLocaleString("zh-CN")
                        : "-"}
                    </TableCell>
                    <TableCell
                      className={`text-right text-sm font-mono ${
                        item.unrealizedPnlUsd && Number(item.unrealizedPnlUsd) < 0
                          ? "text-red-400"
                          : item.unrealizedPnlUsd && Number(item.unrealizedPnlUsd) > 0
                          ? "text-green-400"
                          : "text-[#666]"
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
                          ? "text-red-400"
                          : item.realizedPnlUsd && Number(item.realizedPnlUsd) > 0
                          ? "text-green-400"
                          : item.totalPnlUsd && Number(item.totalPnlUsd) < 0
                          ? "text-red-400"
                          : item.totalPnlUsd && Number(item.totalPnlUsd) > 0
                          ? "text-green-400"
                          : "text-[#666]"
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#1a1a1a]">
            <p className="text-xs text-[#8b7355]">
              显示 {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, listData?.total ?? 0)} 条，
              共 {listData?.total ?? 0} 条
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="border-[#2a2a2a] text-[#8b7355] hover:text-[#f0d78c]"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                上一页
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="border-[#2a2a2a] text-[#8b7355] hover:text-[#f0d78c]"
              >
                下一页
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <footer className="text-center py-6 border-t border-[#1a1a1a]">
        <p className="text-xs text-[#555]">
          外汇交易台账管理系统 | 数据仅供参考
        </p>
      </footer>
    </div>
  );
}
