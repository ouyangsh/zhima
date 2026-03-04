import { Search, SlidersHorizontal } from "lucide-react";
import { YarnCard } from "./YarnCard";

export function YarnTab() {
  const yarnItems = [
    {
      id: "1",
      color: "#E8B4A0",
      brand: "Drops Nepal",
      colorCode: "3112 珊瑚粉",
      weight: 250,
      ballsCount: 5,
      imageUrl: "https://images.unsplash.com/photo-1652699327155-5f0a71f7d32f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b29sJTIweWFybiUyMGJhbGxzJTIwY29sb3JmdWwlMjBjb2xsZWN0aW9ufGVufDF8fHx8MTc3MDY4NTk2OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      relatedProjects: 1,
    },
    {
      id: "2",
      color: "#6C8EA4",
      brand: "Rowan Alpaca",
      colorCode: "205 静谧蓝",
      weight: 400,
      ballsCount: 8,
      imageUrl: "https://images.unsplash.com/photo-1683257199934-3a9822f37645?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5YXJuJTIwc3Rhc2glMjBjb2xvcmZ1bCUyMHdvb2x8ZW58MXx8fHwxNzcwNjg1OTY5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      relatedProjects: 2,
    },
    {
      id: "3",
      color: "#8B7355",
      brand: "Malabrigo Rios",
      colorCode: "063 自然棕",
      weight: 180,
      ballsCount: 2,
      imageUrl: "https://images.unsplash.com/photo-1767281076188-562b285b9cde?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrbml0dGluZyUyMHlhcm4lMjB3b29sJTIwcHJvamVjdCUyMGNvbG9yZnVsfGVufDF8fHx8MTc3MDY4NTk2N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      relatedProjects: 1,
    },
    {
      id: "4",
      color: "#FFE4E1",
      brand: "Cascade 220",
      colorCode: "8505 浅粉",
      weight: 320,
      ballsCount: 4,
      imageUrl: "https://images.unsplash.com/photo-1652699327155-5f0a71f7d32f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b29sJTIweWFybiUyMGJhbGxzJTIwY29sb3JmdWwlMjBjb2xsZWN0aW9ufGVufDF8fHx8MTc3MDY4NTk2OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      relatedProjects: 0,
    },
    {
      id: "5",
      color: "#5BB98A",
      brand: "Lang Yarns",
      colorCode: "116 森林绿",
      weight: 150,
      ballsCount: 3,
      imageUrl: "https://images.unsplash.com/photo-1683257199934-3a9822f37645?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5YXJuJTIwc3Rhc2glMjBjb2xvcmZ1bCUyMHdvb2x8ZW58MXx8fHwxNzcwNjg1OTY5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      relatedProjects: 0,
    },
    {
      id: "6",
      color: "#F0A500",
      brand: "Noro Silk Garden",
      colorCode: "269 琥珀黄",
      weight: 200,
      ballsCount: 2,
      imageUrl: "https://images.unsplash.com/photo-1767281076188-562b285b9cde?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrbml0dGluZyUyMHlhcm4lMjB3b29sJTIwcHJvamVjdCUyMGNvbG9yZnVsfGVufDF8fHx8MTc3MDY4NTk2N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      relatedProjects: 1,
    },
  ];

  const totalWeight = yarnItems.reduce((sum, item) => sum + item.weight, 0);
  const totalBalls = yarnItems.reduce((sum, item) => sum + item.ballsCount, 0);

  return (
    <div className="bg-[#FAF9F6] p-4">
      {/* 搜索和筛选栏 */}
      <div className="mb-4 flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#999999]" />
          <input
            type="text"
            placeholder="搜索品牌、色号..."
            className="w-full h-10 pl-10 pr-4 rounded-full bg-white border border-[#E0E0E0] text-sm text-[#666666] focus:outline-none focus:border-[#6C8EA4]"
          />
        </div>
        <button className="w-10 h-10 rounded-full bg-white border border-[#E0E0E0] flex items-center justify-center hover:bg-[#F8E5C8] transition-colors">
          <SlidersHorizontal className="w-4 h-4 text-[#666666]" />
        </button>
      </div>

      {/* 库存统计 */}
      <div className="mb-4 bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-4">
        <h3 className="text-[#3A3A3A] mb-3">库存总览</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl text-[#6C8EA4] mb-1">{yarnItems.length}</div>
            <div className="text-xs text-[#999999]">种类</div>
          </div>
          <div className="text-center">
            <div className="text-2xl text-[#6C8EA4] mb-1">{totalBalls}</div>
            <div className="text-xs text-[#999999]">总团数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl text-[#6C8EA4] mb-1">{totalWeight}g</div>
            <div className="text-xs text-[#999999]">总重量</div>
          </div>
        </div>
      </div>

      {/* 毛线网格 */}
      <div className="mb-2">
        <h2 className="text-[#3A3A3A]">毛线库存</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 pb-4">
        {yarnItems.map((yarn) => (
          <YarnCard key={yarn.id} {...yarn} />
        ))}
      </div>
    </div>
  );
}