import { STATUS_COLORS, APPROVAL_COLORS, LANE_COLORS, READINESS_COLORS, PRODUCTION_STAGE_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type BadgeType = 'status' | 'approval' | 'lane' | 'readiness' | 'stage';

const COLOR_MAPS: Record<BadgeType, Record<string, string>> = {
  status: STATUS_COLORS,
  approval: APPROVAL_COLORS,
  lane: LANE_COLORS,
  readiness: READINESS_COLORS,
  stage: PRODUCTION_STAGE_COLORS,
};

export function StatusBadge({ value, type = 'status', className }: { value: string | null | undefined; type?: BadgeType; className?: string }) {
  if (!value) return <span className="text-muted-foreground text-xs">—</span>;
  const colorMap = COLOR_MAPS[type] || {};
  const colors = colorMap[value] || 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border whitespace-nowrap", colors, className)}>
      {value}
    </span>
  );
}
