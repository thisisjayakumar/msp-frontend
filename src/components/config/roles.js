// Role hierarchy and configuration
export const ROLE_HIERARCHY = [
  { key: 'admin', label: 'Admin', path: '/admin' },
  { key: 'manager', label: 'Manager', path: '/manager' },
  { key: 'production_head', label: 'Production Head', path: '/production-head' },
  { key: 'supervisor', label: 'Supervisor', path: '/supervisor' },
  { key: 'rm_store', label: 'RM Store', path: '/rm-store' },
  { key: 'fg_store', label: 'FG Store', path: '/fg-store' }
];

// Role-specific configurations
export const ROLE_CONFIG = {
  admin: {
    title: 'Admin Portal',
    subtitle: 'System Administration Access',
    description: 'Manage system settings, users, and global configurations',
    primaryColor: '#dc2626', // red-600
    secondaryColor: '#fca5a5', // red-300
    icon: 'shield-check',
    permissions: ['all']
  },
  manager: {
    title: 'Manager Dashboard',
    subtitle: 'Management Operations',
    description: 'Oversee MO Management, Stock, Allocation, Reports, and Part Master',
    primaryColor: '#7c3aed', // violet-600
    secondaryColor: '#c4b5fd', // violet-300
    icon: 'briefcase',
    permissions: ['manage_orders', 'view_reports', 'stock_allocation', 'part_master']
  },
  production_head: {
    title: 'Production Head Dashboard',
    subtitle: 'Production Management',
    description: 'Full production oversight with all manager operations plus quality control',
    primaryColor: '#f59e0b', // amber-600
    secondaryColor: '#fcd34d', // amber-300
    icon: 'cog-6-tooth',
    permissions: ['manage_orders', 'view_reports', 'stock_allocation', 'part_master', 'quality_control', 'process_management']
  },
  supervisor: {
    title: 'Supervisor Panel',
    subtitle: 'Process Supervision',
    description: 'Monitor process-specific tasks and team operations',
    primaryColor: '#059669', // emerald-600
    secondaryColor: '#6ee7b7', // emerald-300
    icon: 'users',
    permissions: ['supervise_processes', 'view_batches', 'quality_checks', 'machine_allocation']
  },
  rm_store: {
    title: 'RM Store Dashboard',
    subtitle: 'Raw Material Management',
    description: 'Manage processes, inventory, raw materials, and RM stock',
    primaryColor: '#0891b2', // cyan-600
    secondaryColor: '#67e8f9', // cyan-300
    icon: 'cube',
    permissions: ['process_management', 'manage_inventory', 'rawmaterials_crud', 'rmstock_management', 'stock_transactions']
  },
  fg_store: {
    title: 'FG Store & Dispatch Dashboard',
    subtitle: 'Finished Goods Management',
    description: 'Manage finished goods inventory, dispatch operations, and stock levels',
    primaryColor: '#ea580c', // orange-600
    secondaryColor: '#fdba74', // orange-300
    icon: 'building-storefront',
    permissions: ['dispatch_management', 'stock_levels', 'mo_dispatch', 'transactions_log', 'stock_alerts', 'packaging']
  }
};

// Helper functions
export const getRoleConfig = (roleKey) => {
  const config = ROLE_CONFIG[roleKey];
  const hierarchyInfo = ROLE_HIERARCHY.find(role => role.key === roleKey);
  
  if (!config) return null;
  
  return {
    ...config,
    path: hierarchyInfo?.path,
    key: roleKey,
    label: hierarchyInfo?.label
  };
};

export const getRoleByPath = (path) => {
  return ROLE_HIERARCHY.find(role => role.path === path);
};

export const getAllRolePaths = () => {
  return ROLE_HIERARCHY.map(role => role.path);
};

export const isValidRole = (roleKey) => {
  return ROLE_HIERARCHY.some(role => role.key === roleKey);
};

export default {
  ROLE_HIERARCHY,
  ROLE_CONFIG,
  getRoleConfig,
  getRoleByPath,
  getAllRolePaths,
  isValidRole
};
