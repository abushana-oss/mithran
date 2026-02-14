// Enums and types for remarks system
export enum RemarkType {
  DELAY = 'DELAY',
  QUALITY = 'QUALITY',
  SUGGESTION = 'SUGGESTION',
  SAFETY = 'SAFETY',
  PROCESS = 'PROCESS',
  MATERIAL = 'MATERIAL',
  OTHER = 'OTHER',
}

export enum RemarkPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum RemarkStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum RemarkScope {
  LOT = 'LOT',
  PROCESS = 'PROCESS',
  SUBTASK = 'SUBTASK',
  BOM_PART = 'BOM_PART',
}

// UI display helpers
export const REMARK_TYPE_LABELS: Record<RemarkType, string> = {
  [RemarkType.DELAY]: 'Delay',
  [RemarkType.QUALITY]: 'Quality',
  [RemarkType.SUGGESTION]: 'Suggestion',
  [RemarkType.SAFETY]: 'Safety',
  [RemarkType.PROCESS]: 'Process',
  [RemarkType.MATERIAL]: 'Material',
  [RemarkType.OTHER]: 'Other',
};

export const REMARK_PRIORITY_LABELS: Record<RemarkPriority, string> = {
  [RemarkPriority.LOW]: 'Low',
  [RemarkPriority.MEDIUM]: 'Medium',
  [RemarkPriority.HIGH]: 'High',
  [RemarkPriority.CRITICAL]: 'Critical',
};

export const REMARK_STATUS_LABELS: Record<RemarkStatus, string> = {
  [RemarkStatus.OPEN]: 'Open',
  [RemarkStatus.IN_PROGRESS]: 'In Progress',
  [RemarkStatus.RESOLVED]: 'Resolved',
  [RemarkStatus.CLOSED]: 'Closed',
};

export const REMARK_SCOPE_LABELS: Record<RemarkScope, string> = {
  [RemarkScope.LOT]: 'Entire Lot',
  [RemarkScope.PROCESS]: 'Specific Process',
  [RemarkScope.SUBTASK]: 'Specific Subtask',
  [RemarkScope.BOM_PART]: 'Specific BOM Part',
};

// Color schemes for UI
export const REMARK_TYPE_COLORS: Record<RemarkType, string> = {
  [RemarkType.DELAY]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [RemarkType.QUALITY]: 'bg-blue-100 text-blue-800 border-blue-200',
  [RemarkType.SUGGESTION]: 'bg-green-100 text-green-800 border-green-200',
  [RemarkType.SAFETY]: 'bg-red-100 text-red-800 border-red-200',
  [RemarkType.PROCESS]: 'bg-purple-100 text-purple-800 border-purple-200',
  [RemarkType.MATERIAL]: 'bg-orange-100 text-orange-800 border-orange-200',
  [RemarkType.OTHER]: 'bg-gray-100 text-gray-800 border-gray-200',
};

export const REMARK_PRIORITY_COLORS: Record<RemarkPriority, string> = {
  [RemarkPriority.LOW]: 'bg-gray-100 text-gray-800 border-gray-200',
  [RemarkPriority.MEDIUM]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [RemarkPriority.HIGH]: 'bg-orange-100 text-orange-800 border-orange-200',
  [RemarkPriority.CRITICAL]: 'bg-red-100 text-red-800 border-red-200',
};

export const REMARK_STATUS_COLORS: Record<RemarkStatus, string> = {
  [RemarkStatus.OPEN]: 'bg-red-100 text-red-800 border-red-200',
  [RemarkStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800 border-blue-200',
  [RemarkStatus.RESOLVED]: 'bg-green-100 text-green-800 border-green-200',
  [RemarkStatus.CLOSED]: 'bg-gray-100 text-gray-800 border-gray-200',
};

// Form validation helpers
export const REMARK_TYPE_OPTIONS = Object.values(RemarkType).map(type => ({
  value: type,
  label: REMARK_TYPE_LABELS[type],
}));

export const REMARK_PRIORITY_OPTIONS = Object.values(RemarkPriority).map(priority => ({
  value: priority,
  label: REMARK_PRIORITY_LABELS[priority],
}));

export const REMARK_STATUS_OPTIONS = Object.values(RemarkStatus).map(status => ({
  value: status,
  label: REMARK_STATUS_LABELS[status],
}));

export const REMARK_SCOPE_OPTIONS = Object.values(RemarkScope).map(scope => ({
  value: scope,
  label: REMARK_SCOPE_LABELS[scope],
}));

// Utility functions
export function getRemarkTypeColor(type: RemarkType): string {
  return REMARK_TYPE_COLORS[type] || REMARK_TYPE_COLORS[RemarkType.OTHER];
}

export function getRemarkPriorityColor(priority: RemarkPriority): string {
  return REMARK_PRIORITY_COLORS[priority] || REMARK_PRIORITY_COLORS[RemarkPriority.LOW];
}

export function getRemarkStatusColor(status: RemarkStatus): string {
  return REMARK_STATUS_COLORS[status] || REMARK_STATUS_COLORS[RemarkStatus.OPEN];
}

export function formatRemarkType(type: RemarkType): string {
  return REMARK_TYPE_LABELS[type] || type;
}

export function formatRemarkPriority(priority: RemarkPriority): string {
  return REMARK_PRIORITY_LABELS[priority] || priority;
}

export function formatRemarkStatus(status: RemarkStatus): string {
  return REMARK_STATUS_LABELS[status] || status;
}

export function formatRemarkScope(scope: RemarkScope): string {
  return REMARK_SCOPE_LABELS[scope] || scope;
}

// Business logic helpers
export function isRemarkOverdue(remark: { dueDate?: string; status: RemarkStatus }): boolean {
  if (!remark.dueDate || remark.status === RemarkStatus.RESOLVED || remark.status === RemarkStatus.CLOSED) {
    return false;
  }
  
  return new Date(remark.dueDate) < new Date();
}

export function canEditRemark(remark: { createdBy: string; assignedTo?: string }, userId: string): boolean {
  return remark.createdBy === userId || remark.assignedTo === userId;
}

export function canDeleteRemark(remark: { createdBy: string }, userId: string): boolean {
  return remark.createdBy === userId;
}

export function getRemarkAge(remark: { reportedDate: string }): string {
  const reported = new Date(remark.reportedDate);
  const now = new Date();
  const diffMs = now.getTime() - reported.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    return diffHours === 0 ? 'Just now' : `${diffHours}h ago`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }
}

export function formatDuration(hours: number): string {
  if (hours === 0) return '0h';
  if (hours < 24) return `${hours}h`;
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  if (remainingHours === 0) {
    return `${days}d`;
  }
  
  return `${days}d ${remainingHours}h`;
}