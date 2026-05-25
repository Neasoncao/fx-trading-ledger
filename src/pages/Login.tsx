import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import {
  TrendingUp,
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState("login");
  const [showPassword, setShowPassword] = useState(false);

  // Login form
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Register form
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regAdminCode, setRegAdminCode] = useState("");
  const [regError, setRegError] = useState("");

  const loginMutation = trpc.localAuth.login.useMutation({
    onSuccess: (data) => {
      localStorage.setItem("local_auth_token", data.token);
      window.location.href = window.location.pathname + "#/";
    },
    onError: (err) => {
      setLoginError(err.message);
    },
  });

  const registerMutation = trpc.localAuth.register.useMutation({
    onSuccess: (data) => {
      localStorage.setItem("local_auth_token", data.token);
      window.location.href = window.location.pathname + "#/";
    },
    onError: (err) => {
      setRegError(err.message);
    },
  });

  if (isAuthenticated) {
    navigate("/");
    return null;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    if (!loginUsername || !loginPassword) {
      setLoginError("请填写用户名和密码");
      return;
    }
    loginMutation.mutate({ username: loginUsername, password: loginPassword });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    if (!regUsername || !regPassword) {
      setRegError("请填写用户名和密码");
      return;
    }
    if (regPassword.length < 6) {
      setRegError("密码至少6位");
      return;
    }
    registerMutation.mutate({
      username: regUsername,
      password: regPassword,
      name: regName || undefined,
      adminCode: regAdminCode || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-forex flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="mb-4 text-[#8b7355] hover:text-[#f0d78c]"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          返回首页
        </Button>

        <Card className="bg-gradient-card border-[#2a2a2a] shadow-gold-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto h-14 w-14 rounded-xl bg-gradient-to-br from-[#c41e3a] to-[#8b1538] flex items-center justify-center mb-3 shadow-lg">
              <TrendingUp className="h-7 w-7 text-white" />
            </div>
            <CardTitle className="text-xl font-bold text-[#f0d78c]">
              外汇交易台账管理系统
            </CardTitle>
            <p className="text-xs text-[#8b7355] mt-1">FX Trading Ledger System</p>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Local Auth Tabs */}
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="w-full bg-[#1a1a1a] border border-[#2a2a2a]">
                <TabsTrigger
                  value="login"
                  className="flex-1 data-[state=active]:bg-[#c41e3a] data-[state=active]:text-white text-[#8b7355]"
                >
                  <LogIn className="h-3.5 w-3.5 mr-1" />
                  登录
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="flex-1 data-[state=active]:bg-[#c41e3a] data-[state=active]:text-white text-[#8b7355]"
                >
                  <UserPlus className="h-3.5 w-3.5 mr-1" />
                  注册
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-4">
                <form onSubmit={handleLogin} className="space-y-3">
                  <div>
                    <Input
                      placeholder="用户名"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      className="bg-[#1a1a1a] border-[#2a2a2a] text-[#d4d4d4] placeholder:text-[#555] focus:border-[#d4a843]"
                    />
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="密码"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="bg-[#1a1a1a] border-[#2a2a2a] text-[#d4d4d4] placeholder:text-[#555] focus:border-[#d4a843] pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#8b7355]"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {loginError && (
                    <p className="text-xs text-red-400">{loginError}</p>
                  )}
                  <Button
                    type="submit"
                    disabled={loginMutation.isPending}
                    className="w-full bg-[#c41e3a] hover:bg-[#a01830] text-white"
                  >
                    {loginMutation.isPending ? "登录中..." : "登录"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="mt-4">
                <form onSubmit={handleRegister} className="space-y-3">
                  <div>
                    <Input
                      placeholder="用户名 (至少3位)"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      className="bg-[#1a1a1a] border-[#2a2a2a] text-[#d4d4d4] placeholder:text-[#555] focus:border-[#d4a843]"
                    />
                  </div>
                  <div>
                    <Input
                      placeholder="显示名称 (可选)"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="bg-[#1a1a1a] border-[#2a2a2a] text-[#d4d4d4] placeholder:text-[#555] focus:border-[#d4a843]"
                    />
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="密码 (至少6位)"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="bg-[#1a1a1a] border-[#2a2a2a] text-[#d4d4d4] placeholder:text-[#555] focus:border-[#d4a843] pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#8b7355]"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <div>
                    <Input
                      placeholder="管理员邀请码 (可选，首个用户自动成为管理员)"
                      value={regAdminCode}
                      onChange={(e) => setRegAdminCode(e.target.value)}
                      className="bg-[#1a1a1a] border-[#2a2a2a] text-[#d4d4d4] placeholder:text-[#555] focus:border-[#d4a843]"
                    />
                  </div>
                  {regError && (
                    <p className="text-xs text-red-400">{regError}</p>
                  )}
                  <Button
                    type="submit"
                    disabled={registerMutation.isPending}
                    className="w-full bg-[#c41e3a] hover:bg-[#a01830] text-white"
                  >
                    {registerMutation.isPending ? "注册中..." : "注册"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-[#555] mt-4">
          浏览数据无需登录，更新数据需要管理员权限
        </p>
      </div>
    </div>
  );
}
