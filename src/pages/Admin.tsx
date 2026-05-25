import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useDropzone } from "react-dropzone";
import {
  Shield,
  Upload,
  FileSpreadsheet,
  Trash2,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Database,
  TrendingUp,
  Users,
} from "lucide-react";

export default function Admin() {
  const navigate = useNavigate();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [uploadResult, setUploadResult] = useState<{
    batchId: string;
    reportCount: number;
    tradingCount: number;
    proprietaryCount: number;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const importMutation = trpc.upload.importExcel.useMutation({
    onSuccess: (data) => {
      setUploadResult(data);
      setIsUploading(false);
    },
    onError: (err) => {
      setUploadError(err.message);
      setIsUploading(false);
    },
  });

  const clearMutation = trpc.upload.clearData.useMutation({
    onSuccess: () => {
      window.location.reload();
    },
  });

  const [recordCounts, setRecordCounts] = useState({ report: 0, trading: 0, proprietary: 0 });

  useEffect(() => {
    async function loadCounts() {
      const { getAll } = await import("@/lib/db");
      const [report, trading, proprietary] = await Promise.all([
        getAll("report"),
        getAll("trading"),
        getAll("proprietary"),
      ]);
      setRecordCounts({
        report: report.length,
        trading: trading.length,
        proprietary: proprietary.length,
      });
    }
    loadCounts();
  }, [uploadResult]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
        setUploadError("请上传Excel文件 (.xlsx 或 .xls)");
        return;
      }

      setIsUploading(true);
      setUploadError("");
      setUploadResult(null);

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        importMutation.mutate({ fileBase64: base64, filename: file.name });
      };
      reader.readAsDataURL(file);
    },
    [importMutation]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-forex flex items-center justify-center">
        <div className="text-[#8b7355]">加载中...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-forex flex items-center justify-center p-4">
        <Card className="bg-gradient-card border-[#2a2a2a] max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 text-[#c41e3a] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[#f0d78c] mb-2">权限不足</h2>
            <p className="text-sm text-[#8b7355] mb-6">
              您没有管理员权限，无法访问此页面。
            </p>
            <Button
              onClick={() => navigate("/")}
              className="bg-[#c41e3a] hover:bg-[#a01830] text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回首页
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-forex p-6">
      <div className="max-w-[1200px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#f0d78c] flex items-center gap-2">
              <Shield className="h-6 w-6 text-[#c41e3a]" />
              管理后台
            </h2>
            <p className="text-sm text-[#8b7355] mt-1">
              数据上传、用户管理与系统维护
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/")}
            className="border-[#2a2a2a] text-[#8b7355] hover:text-[#f0d78c]"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回首页
          </Button>
        </div>

        {/* Upload Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* File Upload */}
          <Card className="bg-gradient-card border-[#2a2a2a]">
            <CardHeader>
              <CardTitle className="text-[#f0d78c] flex items-center gap-2">
                <Upload className="h-5 w-5 text-[#d4a843]" />
                上传Excel数据
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragActive
                    ? "border-[#d4a843] bg-[#d4a843]/5"
                    : "border-[#2a2a2a] hover:border-[#d4a843]/50 hover:bg-[#1a1a1a]"
                } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
              >
                <input {...getInputProps()} />
                <FileSpreadsheet className="h-10 w-10 text-[#d4a843] mx-auto mb-3" />
                {isDragActive ? (
                  <p className="text-[#d4a843] font-medium">释放文件以上传</p>
                ) : (
                  <>
                    <p className="text-[#d4d4d4] font-medium mb-1">
                      拖拽文件到此处，或点击选择
                    </p>
                    <p className="text-xs text-[#8b7355]">
                      支持 .xlsx / .xls 格式
                    </p>
                  </>
                )}
              </div>

              {isUploading && (
                <div className="text-center text-sm text-[#d4a843]">
                  正在处理文件，请稍候...
                </div>
              )}

              {uploadError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-400">{uploadError}</p>
                </div>
              )}

              {uploadResult && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <p className="text-sm text-green-400">
                      上传成功! Batch ID: {uploadResult.batchId}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
                      <p className="text-xs text-[#8b7355]">报表敞口</p>
                      <p className="text-lg font-bold text-[#c41e3a]">
                        {uploadResult.reportCount}
                      </p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
                      <p className="text-xs text-[#8b7355]">交易敞口</p>
                      <p className="text-lg font-bold text-[#d4a843]">
                        {uploadResult.tradingCount}
                      </p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
                      <p className="text-xs text-[#8b7355]">自营交易</p>
                      <p className="text-lg font-bold text-green-400">
                        {uploadResult.proprietaryCount}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-xs text-[#555] space-y-1">
                <p>上传要求：</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>文件格式需与原模板一致</li>
                  <li>需包含工作表：报表敞口台账、交易敞口台账、自营交易台账</li>
                  <li>数据将追加到现有数据库中</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card className="bg-gradient-card border-[#2a2a2a]">
            <CardHeader>
              <CardTitle className="text-[#f0d78c] flex items-center gap-2">
                <Database className="h-5 w-5 text-[#d4a843]" />
                数据管理
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[#c41e3a]" />
                    <span className="text-sm text-[#d4d4d4]">清除所有数据</span>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        清除
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-[#f0d78c] flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-red-400" />
                          确认清除所有数据
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-[#8b7355]">
                          此操作将删除所有台账数据，且无法撤销。请确保已备份重要数据。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-[#1a1a1a] border-[#2a2a2a] text-[#d4d4d4] hover:bg-[#2a2a2a]">
                          取消
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => clearMutation.mutate()}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          确认清除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <p className="text-xs text-[#555]">
                  删除所有三个台账表中的数据，用于重新初始化。
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#d4a843]" />
                    <span className="text-sm text-[#d4d4d4]">用户管理</span>
                  </div>
                  <Badge variant="outline" className="border-[#2a2a2a] text-[#8b7355]">
                    开发中
                  </Badge>
                </div>
                <p className="text-xs text-[#555]">
                  查看和管理系统用户，分配权限角色。
                </p>
              </div>

              <div className="mt-4 p-4 rounded-lg bg-[#c41e3a]/5 border border-[#c41e3a]/20">
                <h4 className="text-sm font-medium text-[#c41e3a] mb-2">本地数据状态</h4>
                <div className="space-y-2 text-xs text-[#8b7355]">
                  <div className="flex justify-between">
                    <span>报表敞口记录</span>
                    <span className="text-green-400">{recordCounts.report} 条</span>
                  </div>
                  <div className="flex justify-between">
                    <span>交易敞口记录</span>
                    <span className="text-green-400">{recordCounts.trading} 条</span>
                  </div>
                  <div className="flex justify-between">
                    <span>自营交易记录</span>
                    <span className="text-green-400">{recordCounts.proprietary} 条</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
