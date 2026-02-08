/**
 * Manufacturing Workflow Module Progression
 * Defines the complete workflow from BOM to Delivery
 */

export interface WorkflowModule {
  id: string;
  name: string;
  description: string;
  route: string;
  icon: string;
  status: 'completed' | 'current' | 'pending' | 'locked';
  estimatedTime?: string;
  dependencies?: string[];
}

export const WORKFLOW_MODULES: WorkflowModule[] = [
  {
    id: 'bom',
    name: 'BOM Analysis',
    description: 'Bill of Materials creation and analysis',
    route: '/projects/[id]/bom',
    icon: 'Package',
    status: 'current',
    estimatedTime: '2-3 hours',
  },
  {
    id: 'process',
    name: 'Process Planning',
    description: 'Manufacturing process design and planning',
    route: '/projects/[id]/process-planning?tab=process',
    icon: 'Cog',
    status: 'current',
    estimatedTime: '3-4 hours',
    dependencies: ['bom'],
  },
  {
    id: 'costing',
    name: 'Cost Analysis',
    description: 'Comprehensive cost calculation and analysis',
    route: '/projects/[id]/process-planning?tab=costing',
    icon: 'DollarSign',
    status: 'current',
    estimatedTime: '1-2 hours',
    dependencies: ['process'],
  },
  {
    id: 'supplier-evaluation',
    name: 'Supplier Evaluation',
    description: 'Evaluate and assess potential suppliers',
    route: '/projects/[id]/supplier-evaluation',
    icon: 'Search',
    status: 'pending',
    estimatedTime: '2-3 days',
    dependencies: ['costing'],
  },
  {
    id: 'rfq',
    name: 'RFQ Management',
    description: 'Request for Quotation process and management',
    route: '/projects/[id]/rfq',
    icon: 'FileText',
    status: 'pending',
    estimatedTime: '3-5 days',
    dependencies: ['supplier-evaluation'],
  },
  {
    id: 'supplier-nomination',
    name: 'Supplier Nomination',
    description: 'Select and nominate approved suppliers',
    route: '/projects/[id]/supplier-nomination',
    icon: 'UserCheck',
    status: 'pending',
    estimatedTime: '1-2 days',
    dependencies: ['rfq'],
  },
  {
    id: 'production-planning',
    name: 'Production Planning',
    description: 'Schedule and plan production activities',
    route: '/projects/[id]/production-planning',
    icon: 'Calendar',
    status: 'pending',
    estimatedTime: '2-3 days',
    dependencies: ['supplier-nomination'],
  },
  {
    id: 'quality-control',
    name: 'Quality Control',
    description: 'Quality assurance and control processes',
    route: '/projects/[id]/quality-control',
    icon: 'Shield',
    status: 'pending',
    estimatedTime: '1-2 days',
    dependencies: ['production-planning'],
  },
  {
    id: 'delivery',
    name: 'Delivery & Logistics',
    description: 'Final delivery and logistics coordination',
    route: '/projects/[id]/delivery',
    icon: 'Truck',
    status: 'pending',
    estimatedTime: '1-2 days',
    dependencies: ['quality-control'],
  },
];

export const getNextModule = (currentModuleId: string): WorkflowModule | null => {
  const currentIndex = WORKFLOW_MODULES.findIndex(module => module.id === currentModuleId);
  if (currentIndex >= 0 && currentIndex < WORKFLOW_MODULES.length - 1) {
    return WORKFLOW_MODULES[currentIndex + 1];
  }
  return null;
};

export const getPreviousModule = (currentModuleId: string): WorkflowModule | null => {
  const currentIndex = WORKFLOW_MODULES.findIndex(module => module.id === currentModuleId);
  if (currentIndex > 0) {
    return WORKFLOW_MODULES[currentIndex - 1];
  }
  return null;
};

export const getModuleProgress = (currentModuleId: string): number => {
  const currentIndex = WORKFLOW_MODULES.findIndex(module => module.id === currentModuleId);
  return currentIndex >= 0 ? ((currentIndex + 1) / WORKFLOW_MODULES.length) * 100 : 0;
};

export const getCompletedModules = (currentModuleId: string): WorkflowModule[] => {
  const currentIndex = WORKFLOW_MODULES.findIndex(module => module.id === currentModuleId);
  return WORKFLOW_MODULES.slice(0, currentIndex);
};

export const getRemainingModules = (currentModuleId: string): WorkflowModule[] => {
  const currentIndex = WORKFLOW_MODULES.findIndex(module => module.id === currentModuleId);
  return WORKFLOW_MODULES.slice(currentIndex + 1);
};