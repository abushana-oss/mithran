// ============================================================================
// Enums
// ============================================================================

export enum WorkflowState {
  DRAFT = 'draft',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

export enum Priority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum UserRole {
  PROCESS_PLANNER = 'process_planner',
  PRODUCTION_MANAGER = 'production_manager',
  SHOP_FLOOR_USER = 'shop_floor_user',
  DESIGN_ENGINEER = 'design_engineer',
}

// ============================================================================
// Process Route Types
// ============================================================================

export interface ProcessRoute {
  id: string;
  bomItemId: string;
  name: string;
  description?: string;
  isTemplate?: boolean;
  templateName?: string;
  processGroup: string;
  processCategory?: string;
  workflowState: WorkflowState;
  workflowUpdatedAt?: string;
  workflowUpdatedBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdByRole: UserRole;
  assignedTo?: string;
  priority: Priority;
  totalSetupTimeMinutes: number;
  totalCycleTimeMinutes: number;
  totalCost: number;
  userId: string;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
  // Optional joined data
  partNumber?: string;
  bomItemName?: string;
  bomName?: string;
  createdByEmail?: string;
  approvedByEmail?: string;
}

export interface ProcessRouteStep {
  id: string;
  processRouteId: string;
  processId: string;
  stepNumber: number;
  operationName: string;
  setupTimeMinutes?: number;
  cycleTimeMinutes?: number;
  laborHours?: number;
  machineHours?: number;
  machineHourRateId?: string;
  laborHourRateId?: string;
  calculatedCost?: number;
  calculatorMappingId?: string;
  extractedValues?: Record<string, any>;
  isCompleted: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Optional joined data
  processName?: string;
  processCategory?: string;
  calculatorName?: string;
}

export interface WorkflowHistoryEntry {
  id: string;
  processRouteId: string;
  fromState?: string;
  toState: string;
  changedBy: string;
  changedByRole?: string;
  comment?: string;
  createdAt: string;
  // Optional joined data
  routeName?: string;
  changedByEmail?: string;
}

export interface UserRoleAssignment {
  id: string;
  userId: string;
  role: UserRole;
  isPrimary: boolean;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessPlanningSession {
  id: string;
  userId: string;
  bomItemId: string;
  processRouteId?: string;
  activeCategory?: string;
  activeRole?: string;
  sessionData?: Record<string, any>;
  lastAccessedAt: string;
  createdAt: string;
}

export interface CostSummary {
  processRouteId: string;
  totalSetupTimeMinutes: number;
  totalCycleTimeMinutes: number;
  totalCost: number;
  totalSteps: number;
  steps: Array<{
    stepNumber: number;
    operationName: string;
    setupTimeMinutes: number;
    cycleTimeMinutes: number;
    calculatedCost: number;
  }>;
  calculatedAt: string;
}

// ============================================================================
// Request/Form Types
// ============================================================================

export interface CreateProcessRouteInput {
  bomItemId: string;
  name: string;
  description?: string;
  processGroup?: string;
  processCategory?: string;
  isTemplate?: boolean;
  templateName?: string;
  createdByRole?: UserRole;
  assignedTo?: string;
  priority?: Priority;
}

export interface UpdateProcessRouteInput {
  name?: string;
  description?: string;
  processGroup?: string;
  processCategory?: string;
  isTemplate?: boolean;
  templateName?: string;
  assignedTo?: string;
  priority?: Priority;
}

export interface CreateProcessRouteStepInput {
  processRouteId: string;
  processId: string;
  stepNumber: number;
  operationName: string;
  setupTimeMinutes?: number;
  cycleTimeMinutes?: number;
  laborHours?: number;
  machineHours?: number;
  machineHourRateId?: string;
  laborHourRateId?: string;
  calculatedCost?: number;
  calculatorMappingId?: string;
  extractedValues?: Record<string, any>;
  notes?: string;
}

export interface UpdateProcessRouteStepInput {
  processId?: string;
  stepNumber?: number;
  operationName?: string;
  setupTimeMinutes?: number;
  cycleTimeMinutes?: number;
  laborHours?: number;
  machineHours?: number;
  machineHourRateId?: string;
  laborHourRateId?: string;
  calculatedCost?: number;
  calculatorMappingId?: string;
  extractedValues?: Record<string, any>;
  notes?: string;
}

export interface WorkflowTransitionInput {
  comment?: string;
  role?: UserRole;
}

export interface SaveSessionInput {
  bomItemId: string;
  processRouteId?: string;
  activeCategory?: string;
  activeRole?: UserRole;
  sessionData?: Record<string, any>;
}

export interface AssignRoleInput {
  role: UserRole;
  isPrimary?: boolean;
  organizationId?: string;
}

export interface UpdateRoleInput {
  isPrimary?: boolean;
}

// ============================================================================
// Query Parameters
// ============================================================================

export interface QueryProcessRoutesParams {
  bomItemId?: string;
  workflowState?: WorkflowState;
  processGroup?: string;
  processCategory?: string;
  isTemplate?: boolean;
  createdByRole?: UserRole;
  priority?: Priority;
  assignedTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// Response Types
// ============================================================================

export interface PaginatedProcessRoutesResponse {
  routes: ProcessRoute[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// Helper Types
// ============================================================================

export type ProcessCategoryTab =
  | 'Machining'
  | 'Sheet Metal'
  | 'Assembly'
  | 'Plastic & Rubber'
  | 'Post Processing'
  | 'Packing & Delivery';

export const PROCESS_CATEGORIES: ProcessCategoryTab[] = [
  'Machining',
  'Sheet Metal',
  'Assembly',
  'Plastic & Rubber',
  'Post Processing',
  'Packing & Delivery',
];

export const WORKFLOW_STATE_LABELS: Record<WorkflowState, string> = {
  [WorkflowState.DRAFT]: 'Draft',
  [WorkflowState.IN_REVIEW]: 'In Review',
  [WorkflowState.APPROVED]: 'Approved',
  [WorkflowState.ACTIVE]: 'Active',
  [WorkflowState.ARCHIVED]: 'Archived',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  [Priority.LOW]: 'Low',
  [Priority.NORMAL]: 'Normal',
  [Priority.HIGH]: 'High',
  [Priority.URGENT]: 'Urgent',
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.PROCESS_PLANNER]: 'Process Planner',
  [UserRole.PRODUCTION_MANAGER]: 'Production Manager',
  [UserRole.SHOP_FLOOR_USER]: 'Shop Floor User',
  [UserRole.DESIGN_ENGINEER]: 'Design Engineer',
};
