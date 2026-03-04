import { Home, Package, Compass, UserCircle } from "lucide-react";

interface BottomNavBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNavBar({ activeTab, onTabChange }: BottomNavBarProps) {
  const navItems = [
    { id: "home", label: "首页", icon: Home },
    { id: "yarn", label: "毛线库", icon: Package },
    { id: "discover", label: "发现", icon: Compass },
    { id: "profile", label: "我的", icon: UserCircle },
  ];

  return (
    <div className="h-20 border-t border-[#E0E0E0] bg-white flex items-center justify-around px-4">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className="flex flex-col items-center gap-1 transition-colors"
          >
            <Icon
              className={`w-6 h-6 ${
                isActive ? "text-[#6C8EA4]" : "text-[#999999]"
              }`}
            />
            <span
              className={`text-xs ${
                isActive ? "text-[#6C8EA4]" : "text-[#999999]"
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
