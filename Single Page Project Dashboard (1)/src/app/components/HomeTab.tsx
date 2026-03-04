import { Plus } from "lucide-react";
import { StatCard } from "./StatCard";
import { ProjectCard } from "./ProjectCard";

interface HomeTabProps {
  onNewProject: () => void;
  onProjectClick: (project: any) => void;
}

export function HomeTab({ onNewProject, onProjectClick }: HomeTabProps) {
  const stats = [
    { label: "进行中", count: 3, color: "#6C8EA4" },
    { label: "已完成", count: 5, color: "#5BB98A" },
    { label: "计划中", count: 2, color: "#F0A500" },
  ];

  const projects = [
    {
      id: "1",
      title: "温暖围巾",
      description: "使用羊驼毛混纺线，适合秋冬季节的柔软围巾",
      progress: 75,
      imageUrl: "https://images.unsplash.com/photo-1601987775552-435bbcbfb465?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrbml0dGluZyUyMHNjYXJmJTIwaGFuZG1hZGUlMjBwcm9qZWN0fGVufDF8fHx8MTc3MDY4NTk2OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      lastUpdate: "2小时前",
      yarnColors: ["#8B7355", "#D4A574"],
      totalRows: 200,
      currentRow: 150,
    },
    {
      id: "2",
      title: "婴儿毯子",
      description: "柔软的全棉线，适合婴儿使用的安全材质",
      progress: 45,
      imageUrl: "https://images.unsplash.com/photo-1641644785726-26ec66bfce73?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcm9jaGV0JTIwYmxhbmtldCUyMGZpbmlzaGVkJTIwcHJvamVjdHxlbnwxfHx8fDE3NzA2ODU5Njh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      lastUpdate: "昨天",
      yarnColors: ["#B4D7E8", "#FFE4E1", "#FFFACD"],
      totalRows: 180,
      currentRow: 81,
    },
    {
      id: "3",
      title: "复古开衫",
      description: "经典的阿兰花纹设计，使用纯羊毛线",
      progress: 20,
      imageUrl: "https://images.unsplash.com/photo-1702046508143-eb68172100df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrbml0dGluZyUyMG5lZWRsZXMlMjB5YXJuJTIwY2xvc2UlMjB1cHxlbnwxfHx8fDE3NzA2ODU5Njd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      lastUpdate: "3天前",
      yarnColors: ["#8B4513", "#D2691E"],
      totalRows: 250,
      currentRow: 50,
    },
  ];

  return (
    <div className="bg-[#FAF9F6] p-4">
      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            label={stat.label}
            count={stat.count}
            color={stat.color}
          />
        ))}
      </div>

      {/* 项目列表 */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[#3A3A3A]">我的项目</h2>
        <button className="text-sm text-[#6C8EA4]">查看全部</button>
      </div>

      <div className="space-y-4 pb-4">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            {...project}
            onClick={() => {
              onProjectClick(project);
            }}
          />
        ))}
      </div>

      {/* 浮动添加按钮 */}
      <button
        onClick={onNewProject}
        className="fixed right-6 bottom-24 w-14 h-14 rounded-full bg-[#6C8EA4] flex items-center justify-center shadow-lg hover:bg-[#5A7A91] transition-colors"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>
    </div>
  );
}