import { Plus, User } from "lucide-react";

interface TopNavBarProps {
  title: string;
  onAddClick: () => void;
}

export function TopNavBar({ title, onAddClick }: TopNavBarProps) {
  return (
    <div className="h-14 flex items-center justify-between px-4 border-b border-[#E0E0E0] bg-white">
      <h1 className="text-[#3A3A3A]">{title}</h1>
      <div className="flex items-center gap-3">
        <button
          onClick={onAddClick}
          className="w-9 h-9 rounded-full bg-[#6C8EA4] flex items-center justify-center hover:bg-[#5A7A91] transition-colors"
        >
          <Plus className="w-5 h-5 text-white" />
        </button>
        <button className="w-9 h-9 rounded-full bg-[#F8E5C8] flex items-center justify-center hover:bg-[#F0DAB8] transition-colors">
          <User className="w-5 h-5 text-[#3A3A3A]" />
        </button>
      </div>
    </div>
  );
}
