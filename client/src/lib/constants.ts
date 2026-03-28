// ─── Status Colors ───
export const STATUS_COLORS: Record<string, string> = {
  'Idea': 'bg-gray-100 text-gray-700 border-gray-200',
  'Planned': 'bg-amber-50 text-amber-700 border-amber-200',
  'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
  'Ready': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Published': 'bg-green-100 text-green-800 border-green-300',
  'Cancelled': 'bg-red-50 text-red-700 border-red-200',
  'Archived': 'bg-slate-100 text-slate-600 border-slate-200',
};

export const APPROVAL_COLORS: Record<string, string> = {
  'Expert Review': 'bg-red-50 text-red-700 border-red-200',
  'Leader Review': 'bg-orange-50 text-orange-700 border-orange-200',
  'Light Check': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'No Expert Review': 'bg-green-50 text-green-700 border-green-200',
};

export const LANE_COLORS: Record<string, string> = {
  'DG': 'bg-purple-100 text-purple-800 border-purple-200',
  'TC': 'bg-blue-100 text-blue-800 border-blue-200',
  'AC': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'MT': 'bg-amber-100 text-amber-800 border-amber-200',
  'SR': 'bg-pink-100 text-pink-800 border-pink-200',
  'AD': 'bg-rose-100 text-rose-800 border-rose-200',
};

export const LANE_DOT_COLORS: Record<string, string> = {
  'DG': '#8B5CF6',
  'TC': '#3B82F6',
  'AC': '#10B981',
  'MT': '#F59E0B',
  'SR': '#EC4899',
  'AD': '#EF4444',
};

export const READINESS_COLORS: Record<string, string> = {
  'Ready': 'bg-green-100 text-green-800 border-green-200',
  'Adapt': 'bg-blue-100 text-blue-800 border-blue-200',
  'Rewrite': 'bg-orange-100 text-orange-800 border-orange-200',
  'New': 'bg-gray-100 text-gray-800 border-gray-200',
  'Promoted': 'bg-purple-100 text-purple-800 border-purple-200',
};

export const PRODUCTION_STAGE_COLORS: Record<string, string> = {
  'Concept': 'bg-gray-100 text-gray-700',
  'Script': 'bg-blue-100 text-blue-700',
  'Filming': 'bg-amber-100 text-amber-700',
  'Editing': 'bg-purple-100 text-purple-700',
  'Ready': 'bg-emerald-100 text-emerald-700',
  'Published': 'bg-green-100 text-green-800',
};

// ─── Dropdown Options ───
export const STATUSES = ['Idea', 'Planned', 'In Progress', 'Ready', 'Published', 'Archived', 'Cancelled'];
export const FUNNEL_STAGES = ['Awareness', 'Consideration', 'Conversion', 'Service', 'Advocacy', 'Other'];
export const APPROVAL_LEVELS = ['Expert Review', 'Leader Review', 'Light Check', 'No Expert Review', 'Other'];
export const SLOT_TYPES = ['Main', 'Video', 'Other'];
export const PRIORITIES = ['Core', 'Optional'];
export const FORMATS = ['Carousel/Static', 'Poster/Static', 'Video', 'Static', 'Reel', 'Story', 'Infographic', 'Other'];
export const READINESS_STATUSES = ['Ready', 'Adapt', 'Rewrite', 'New', 'Other'];
export const PRODUCTION_STAGES = ['Concept', 'Script', 'Filming', 'Editing', 'Ready', 'Published'];
export const EASE_LABELS = ['Easy', 'Medium', 'Hard', 'Other'];
export const EXECUTION_SPEEDS = ['Fast', 'Moderate', 'Slow'];
export const REUSABILITY_LEVELS = ['High', 'Medium', 'Low'];
export const TOPIC_TYPES = ['Info', 'Academic', 'Micro', 'Engagement', 'Proof', 'Other'];

export const LANE_NAMES: Record<string, string> = {
  'DG': 'Demand Generation',
  'TC': 'Trust & Conversion',
  'AC': 'Academic Core',
  'MT': 'Micro Teaching',
  'SR': 'Service & Retention',
  'AD': 'Advocacy',
};

export const PILLAR_NAMES: Record<string, string> = {
  'AS': 'Ahead Start',
  'BT': 'Band on Time',
  'PF': 'Proof First',
  'LR': 'Learn Right',
  'SS': 'Safe to Shine',
};
