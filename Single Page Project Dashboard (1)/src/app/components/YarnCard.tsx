import { ImageWithFallback } from "./figma/ImageWithFallback";

interface YarnCardProps {
  id: string;
  color: string;
  brand: string;
  colorCode: string;
  weight: number;
  ballsCount: number;
  imageUrl: string;
  relatedProjects?: number;
}

export function YarnCard({
  color,
  brand,
  colorCode,
  weight,
  ballsCount,
  imageUrl,
  relatedProjects,
}: YarnCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.05)] overflow-hidden hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-shadow">
      <div className="relative h-32 overflow-hidden">
        <ImageWithFallback
          src={imageUrl}
          alt={`${brand} ${colorCode}`}
          className="w-full h-full object-cover"
        />
        <div
          className="absolute top-2 left-2 w-8 h-8 rounded-full border-2 border-white shadow-sm"
          style={{ backgroundColor: color }}
        />
      </div>
      <div className="p-3">
        <h4 className="text-[#3A3A3A] text-sm mb-1">{brand}</h4>
        <p className="text-xs text-[#666666] mb-2">{colorCode}</p>
        <div className="flex items-center justify-between text-xs text-[#666666] mb-1">
          <span>剩余: {weight}g</span>
          <span>{ballsCount} 团</span>
        </div>
        {relatedProjects !== undefined && relatedProjects > 0 && (
          <div className="text-xs text-[#6C8EA4] mt-2">
            关联 {relatedProjects} 个项目
          </div>
        )}
      </div>
    </div>
  );
}
