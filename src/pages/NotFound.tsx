import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-forex flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-[#c41e3a] to-[#8b1538] flex items-center justify-center mx-auto shadow-lg">
          <TrendingUp className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-6xl font-bold text-[#f0d78c]">404</h1>
          <p className="text-lg text-[#8b7355] mt-2">页面未找到</p>
        </div>
        <p className="text-sm text-[#555] max-w-sm">
          您访问的页面不存在或已被移除。
        </p>
        <Link to="/">
          <Button className="bg-[#c41e3a] hover:bg-[#a01830] text-white gap-2">
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </Button>
        </Link>
      </div>
    </div>
  );
}
