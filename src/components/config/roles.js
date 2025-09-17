// Role hierarchy and configuration
export const ROLE_HIERARCHY = [
  { key: 'admin', label: 'Admin', path: '/admin' },
  { key: 'manager', label: 'Manager', path: '/manager' },
  { key: 'supervisor', label: 'Supervisor', path: '/supervisor' },
  { key: 'store_manager', label: 'Store Manager', path: '/store_manager' },
  { key: 'operator', label: 'Operator', path: '/operator' }
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
    description: 'Oversee operations, reports, and team management',
    primaryColor: '#7c3aed', // violet-600
    secondaryColor: '#c4b5fd', // violet-300
    icon: 'briefcase',
    permissions: ['manage_teams', 'view_reports', 'approve_requests']
  },
  supervisor: {
    title: 'Supervisor Panel',
    subtitle: 'Team Supervision',
    description: 'Monitor team performance and daily operations',
    primaryColor: '#059669', // emerald-600
    secondaryColor: '#6ee7b7', // emerald-300
    icon: 'users',
    permissions: ['supervise_team', 'view_metrics', 'assign_tasks']
  },
  store_manager: {
    title: 'Store Manager',
    subtitle: 'Store Operations',
    description: 'Manage store inventory, staff, and customer service',
    primaryColor: '#ea580c', // orange-600
    secondaryColor: '#fdba74', // orange-300
    icon: 'building-storefront',
    permissions: ['manage_inventory', 'schedule_staff', 'handle_customers']
  },
  operator: {
    title: 'Operator Console',
    subtitle: 'Daily Operations',
    description: 'Execute daily tasks and operational procedures',
    primaryColor: '#2563eb', // blue-600
    secondaryColor: '#93c5fd', // blue-300
    icon: 'cog',
    permissions: ['execute_tasks', 'view_schedules', 'update_status']
  }
};

// Helper functions
export const getRoleConfig = (roleKey) => {
  return ROLE_CONFIG[roleKey] || ROLE_CONFIG.operator;
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
