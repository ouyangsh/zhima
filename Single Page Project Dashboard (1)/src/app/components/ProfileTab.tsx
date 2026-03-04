import {
  User,
  Settings,
  Bell,
  Heart,
  Star,
  HelpCircle,
  FileText,
  Shield,
  LogOut,
  ChevronRight,
} from "lucide-react";

export function ProfileTab() {
  const stats = [
    { label: "完成作品", count: 5, color: "#5BB98A" },
    { label: "进行项目", count: 3, color: "#6C8EA4" },
    { label: "毛线库存", count: 15, color: "#F0A500" },
  ];

  const settingsItems = [
    {
      icon: Bell,
      title: "通知设置",
      description: "管理推送通知偏好",
      color: "#6C8EA4",
    },
    {
      icon: Heart,
      title: "我的收藏",
      description: "查看收藏的图解和教程",
      color: "#FF8C82",
    },
    {
      icon: Star,
      title: "我的点赞",
      description: "浏览点赞的作品",
      color: "#F0A500",
    },
    {
      icon: Settings,
      title: "账户设置",
      description: "个人信息与偏好设置",
      color: "#6C8EA4",
    },
  ];

  const helpItems = [
    {
      icon: HelpCircle,
      title: "帮助中心",
      description: "常见问题与使用指南",
    },
    {
      icon: FileText,
      title: "使用条款",
      description: "服务条款与隐私政策",
    },
    {
      icon: Shield,
      title: "隐私安全",
      description: "数据安全与隐私保护",
    },
  ];

  return (
    <div className="bg-[#FAF9F6] p-4">
      {/* 用户信息卡片 */}
      <div className="bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#F8E5C8] to-[#6C8EA4] flex items-center justify-center flex-shrink-0">
            <User className="w-10 h-10 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-[#3A3A3A] mb-1">编织爱好者</h2>
            <p className="text-sm text-[#999999]">ID: knitter_2024</p>
          </div>
          <button className="px-4 h-9 rounded-full border border-[#6C8EA4] text-[#6C8EA4] text-sm hover:bg-[#F8E5C8]/20 transition-colors">
            编辑
          </button>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#E0E0E0]">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl mb-1" style={{ color: stat.color }}>
                {stat.count}
              </div>
              <div className="text-xs text-[#999999]">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 个人偏好 */}
      <div className="mb-6">
        <h3 className="text-[#3A3A3A] mb-3">个人偏好</h3>
        <div className="space-y-3">
          {settingsItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                className="w-full bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-4 flex items-center gap-4 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-shadow text-left"
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${item.color}20` }}
                >
                  <Icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <div className="flex-1">
                  <h4 className="text-[#3A3A3A] text-sm mb-1">{item.title}</h4>
                  <p className="text-xs text-[#999999]">{item.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-[#999999] flex-shrink-0" />
              </button>
            );
          })}
        </div>
      </div>

      {/* 帮助与支持 */}
      <div className="mb-6">
        <h3 className="text-[#3A3A3A] mb-3">帮助与支持</h3>
        <div className="bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.05)] overflow-hidden">
          {helpItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                className={`w-full p-4 flex items-center gap-4 hover:bg-[#FAF9F6] transition-colors text-left ${
                  index !== helpItems.length - 1 ? "border-b border-[#E0E0E0]" : ""
                }`}
              >
                <Icon className="w-5 h-5 text-[#6C8EA4] flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-[#3A3A3A] text-sm mb-1">{item.title}</h4>
                  <p className="text-xs text-[#999999]">{item.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-[#999999] flex-shrink-0" />
              </button>
            );
          })}
        </div>
      </div>

      {/* 关于应用 */}
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-[#666666]">当前版本</span>
            <span className="text-sm text-[#999999]">v1.0.0</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#666666]">检查更新</span>
            <button className="text-sm text-[#6C8EA4]">立即检查</button>
          </div>
        </div>
      </div>

      {/* 退出登录 */}
      <div className="pb-4">
        <button className="w-full h-11 rounded-full bg-white border border-[#E0E0E0] text-[#C45C5C] flex items-center justify-center gap-2 hover:bg-[#FFF5F5] transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <LogOut className="w-5 h-5" />
          退出登录
        </button>
      </div>
    </div>
  );
}