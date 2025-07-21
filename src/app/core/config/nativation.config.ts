export interface NavigationItem {
  label: string;
  icon: string;
  route: string;
  requiredPermission?: string;
  children?: NavigationItem[];
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    label: 'Dashboard',
    icon: 'dashboard',
    route: '/dashboard'
  },
  {
    label: 'User Management',
    icon: 'people',
    route: '/users',
    requiredPermission: 'VIEW_USERS'
  },
  {
    label: 'Role Management',
    icon: 'security',
    route: '/roles',
    requiredPermission: 'VIEW_ROLES'
  }
];