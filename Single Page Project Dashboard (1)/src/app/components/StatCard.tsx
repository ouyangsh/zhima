interface StatCardProps {
  label: string;
  count: number;
  color: string;
}

export function StatCard({ label, count, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-4 flex flex-col items-center justify-center min-h-[100px]">
      <div className="text-3xl mb-2" style={{ color }}>
        {count}
      </div>
      <div className="text-sm text-[#666666]">{label}</div>
    </div>
  );
}
