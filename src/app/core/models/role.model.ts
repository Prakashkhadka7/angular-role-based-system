export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystemRole: boolean;
  createdAt: string;
  updatedAt?: string;
  priority?: number
}

export interface CreateRoleRequest {
  name: string;
  description: string;
  permissions: Permission[];
}
export interface Permission {
  id: number;
  name: string;
  description: string;
  category: string;
  resource: ResourceType;
  action: ActionType;
  createdAt?: string;
  updatedAt?: string;
}

export enum ResourceType {
  USERS = 'users',
  ROLES = 'roles',
  DASHBOARD = 'dashboard'
}

export enum ActionType {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete'
}