import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  Shield,
  ArrowLeft,
  Database,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  KeyRound,
} from "lucide-react";

const ADMIN_PASSWORD = "zijin@2021";

export default function Admin() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    batchId: string;
    reportCount: number;
    tradingCount: number;
    proprietaryCount: number;
  } | null>(null);
  const [error, setError] = useState("");

  // Use tRPC mutation for file import
  const importMutation = trpc.ledger.import.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setUploading(false);
    },
    onError: (err) => {
      setError(err.message);
      setUploading(false);
    },
  });

  // Verify password
  const handleAuth = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("密码错误，请重试");
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError("");
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    // Read file as array buffer and send via tRPC
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    );

    importMutation.mutate({ fileBase64: base64, filename: file.name });
  };

  // Password gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-forex flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white border-gray-200 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-[#c41e3a]/10 flex items-center justify-center">
                <Lock className="h-6 w-6 text-[#c41e3a]" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-900">后台维护</CardTitle>
                <p className="text-sm text-gray-500">请输入密码继续</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {authError && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">{authError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-[#b8860b]" />
                管理密码
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAuth()}
                placeholder="请输入密码"
                className="bg-white border-gray-200 text-gray-900 focus-visible:ring-[#c41e3a]"
              />
            </div>
            <Button
              onClick={handleAuth}
              className="w-full bg-[#c41e3a] hover:bg-[#a01830] text-white gap-2"
            >
              <Shield className="h-4 w-4" />
              验证并进入
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="w-full text-gray-500 hover:text-gray-700 hover:bg-gray-50 gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              返回首页
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authenticated admin panel
  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-6 w-6 text-[#c41e3a]" />
            后台维护
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            上传 Excel 文件更新台账数据（最新上传将覆盖原有数据）
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate("/")}
          className="border-gray-200 text-gray-500 hover:text-gray-700 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          返回首页
        </Button>
      </div>

      {/* Upload Card */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
            <Upload className="h-5 w-5 text-[#b8860b]" />
            数据上传
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Input */}
          <div className="space-y-2">
            <Label className="text-gray-700">选择 Excel 文件</Label>
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="bg-white border-gray-200 text-gray-900 file:bg-[#c41e3a]/10 file:text-[#c41e3a] file:border-0"
              />
              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="bg-[#c41e3a] hover:bg-[#a01830] text-white gap-2 whitespace-nowrap"
              >
                {uploading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    上传中...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    上传覆盖
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              支持 .xlsx / .xls 格式，需包含工作表：Hedge-BS、Hedge-Trade、Trading
            </p>
          </div>

          {/* Error */}
          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {/* Success */}
          {result && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 space-y-1">
                <p>✅ 数据上传成功，已覆盖原有数据</p>
                <p className="text-sm">批次号：{result.batchId}</p>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="bg-white rounded-lg p-3 text-center border border-green-100">
                    <p className="text-xs text-gray-500">结汇套保</p>
                    <p className="text-lg font-bold text-[#c41e3a]">{result.reportCount} 条</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border border-green-100">
                    <p className="text-xs text-gray-500">购汇套保</p>
                    <p className="text-lg font-bold text-[#b8860b]">{result.tradingCount} 条</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border border-green-100">
                    <p className="text-xs text-gray-500">自营交易</p>
                    <p className="text-lg font-bold text-green-600">{result.proprietaryCount} 条</p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Warning Card */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">数据覆盖说明</p>
              <p className="text-xs text-yellow-700 mt-1">
                上传新文件将自动清空并替换所有现有数据。请确保 Excel 文件包含完整的历史数据。
                数据永久保存在浏览器本地 IndexedDB 中，仅在当前设备有效。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-8">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <p>© 2026 紫金投资 · 后台维护系统</p>
            <p>技术支持：OpenClaw Agent</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
