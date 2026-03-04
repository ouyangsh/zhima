import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Palette, Globe, Settings, HelpCircle } from "lucide-react";

export function DiscoverTab() {
  const finishedWorks = [
    {
      id: "1",
      imageUrl: "https://images.unsplash.com/photo-1641644785726-26ec66bfce73?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcm9jaGV0JTIwYmxhbmtldCUyMGZpbmlzaGVkJTIwcHJvamVjdHxlbnwxfHx8fDE3NzA2ODU5Njh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      title: "彩虹毯子",
    },
    {
      id: "2",
      imageUrl: "https://images.unsplash.com/photo-1601987775552-435bbcbfb465?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrbml0dGluZyUyMHNjYXJmJTIwaGFuZG1hZGUlMjBwcm9qZWN0fGVufDF8fHx8MTc3MDY4NTk2OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      title: "秋冬围巾",
    },
    {
      id: "3",
      imageUrl: "https://images.unsplash.com/photo-1702046508143-eb68172100df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrbml0dGluZyUyMG5lZWRsZXMlMjB5YXJuJTIwY2xvc2UlMjB1cHxlbnwxfHx8fDE3NzA2ODU5Njd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      title: "经典毛衣",
    },
    {
      id: "4",
      imageUrl: "https://images.unsplash.com/photo-1767281076188-562b285b9cde?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrbml0dGluZyUyMHlhcm4lMjB3b29sJTIwcHJvamVjdCUyMGNvbG9yZnVsfGVufDF8fHx8MTc3MDY4NTk2N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      title: "毛线球",
    },
  ];

  const tools = [
    {
      icon: Palette,
      title: "图解绘制工具",
      description: "创建和编辑针织图解",
      color: "#6C8EA4",
    },
    {
      icon: Globe,
      title: "术语翻译",
      description: "中英日术语对照",
      color: "#5BB98A",
    },
    {
      icon: Settings,
      title: "设置",
      description: "个性化设置与偏好",
      color: "#F0A500",
    },
    {
      icon: HelpCircle,
      title: "帮助中心",
      description: "使用指南与常见问题",
      color: "#FF8C82",
    },
  ];

  return (
    <div className="bg-[#FAF9F6] p-4">
      {/* 个人作品墙 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[#3A3A3A]">作品展示墙</h2>
          <button className="text-sm text-[#6C8EA4]">查看全部</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {finishedWorks.map((work) => (
            <div
              key={work.id}
              className="relative aspect-square rounded-lg overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-shadow"
            >
              <ImageWithFallback
                src={work.imageUrl}
                alt={work.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                <p className="text-white text-sm">{work.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 动态消息 */}
      <div className="mb-6">
        <h2 className="text-[#3A3A3A] mb-4">最近动态</h2>
        <div className="bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-4">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#F8E5C8] flex items-center justify-center flex-shrink-0">
                <span className="text-sm text-[#3A3A3A]">L</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-[#666666]">
                  <span className="text-[#3A3A3A]">Lisa</span> 赞了你的作品
                  <span className="text-[#3A3A3A]">「彩虹毯子」</span>
                </p>
                <p className="text-xs text-[#999999] mt-1">2小时前</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#6C8EA4] flex items-center justify-center flex-shrink-0">
                <span className="text-sm text-white">M</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-[#666666]">
                  <span className="text-[#3A3A3A]">Mary</span> 评论了你的作品
                </p>
                <p className="text-xs text-[#999999] mt-1">昨天</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 工具与设置 */}
      <div className="mb-4">
        <h2 className="text-[#3A3A3A] mb-4">工具与设置</h2>
        <div className="space-y-3 pb-4">
          {tools.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <button
                key={index}
                className="w-full bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-4 flex items-center gap-4 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-shadow text-left"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${tool.color}20` }}
                >
                  <Icon className="w-6 h-6" style={{ color: tool.color }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-[#3A3A3A] text-sm mb-1">{tool.title}</h3>
                  <p className="text-xs text-[#999999]">{tool.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}