import { Clock } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface ProjectCardProps {
  id: string;
  title: string;
  description: string;
  progress: number;
  imageUrl: string;
  lastUpdate: string;
  yarnColors: string[];
  onClick?: () => void;
}

export function ProjectCard({
  title,
  description,
  progress,
  imageUrl,
  lastUpdate,
  yarnColors,
  onClick,
}: ProjectCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.05)] overflow-hidden hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-shadow cursor-pointer"
    >
      <div className="relative h-48 overflow-hidden">
        <ImageWithFallback
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="text-[#3A3A3A] mb-2">{title}</h3>
        <p className="text-sm text-[#666666] mb-3 line-clamp-2">
          {description}
        </p>
        
        <div className="flex items-center gap-2 mb-3">
          {yarnColors.map((color, index) => (
            <div
              key={index}
              className="w-6 h-6 rounded-full border border-[#E0E0E0]"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-[#666666]">进度</span>
            <span className="text-[#6C8EA4]">{progress}%</span>
          </div>
          <div className="h-2 bg-[#FAF9F6] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#5BB98A] rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center text-xs text-[#999999]">
          <Clock className="w-3 h-3 mr-1" />
          {lastUpdate}
        </div>
      </div>
    </div>
  );
}