import { useState } from "react";
import { TopNavBar } from "./components/TopNavBar";
import { BottomNavBar } from "./components/BottomNavBar";
import { HomeTab } from "./components/HomeTab";
import { YarnTab } from "./components/YarnTab";
import { DiscoverTab } from "./components/DiscoverTab";
import { ProfileTab } from "./components/ProfileTab";
import { NewProjectDialog } from "./components/NewProjectDialog";
import { ProjectDetailPage } from "./components/ProjectDetailPage";

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const getPageTitle = () => {
    switch (activeTab) {
      case "home":
        return "我的项目";
      case "yarn":
        return "我的毛线库";
      case "discover":
        return "发现";
      case "profile":
        return "个人中心";
      default:
        return "我的项目";
    }
  };

  const handleNewProject = () => {
    setIsNewProjectDialogOpen(true);
  };

  const handleCreateProject = (project: {
    title: string;
    description: string;
    category: string;
  }) => {
    console.log("New project:", project);
    // 这里可以添加创建项目的逻辑
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F0F0F0] p-6">
      {/* APP容器 - 模拟真实设备界面 */}
      <div className="w-full max-w-[390px] h-[844px] bg-[#FAF9F6] rounded-xl border border-[#E0E0E0] shadow-[0_8px_24px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col">
        {/* 如果显示详情页，则渲染完整的详情页 */}
        {selectedProject ? (
          <ProjectDetailPage
            project={selectedProject}
            onBack={() => setSelectedProject(null)}
          />
        ) : (
          <>
            {/* 顶部导航栏 */}
            <TopNavBar title={getPageTitle()} onAddClick={handleNewProject} />

            {/* 中央内容区 */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === "home" && (
                <HomeTab
                  onNewProject={handleNewProject}
                  onProjectClick={setSelectedProject}
                />
              )}
              {activeTab === "yarn" && <YarnTab />}
              {activeTab === "discover" && <DiscoverTab />}
              {activeTab === "profile" && <ProfileTab />}
            </div>

            {/* 底部导航栏 */}
            <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} />
          </>
        )}
      </div>

      {/* 新建项目弹窗 */}
      <NewProjectDialog
        isOpen={isNewProjectDialogOpen}
        onClose={() => setIsNewProjectDialogOpen(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  );
}