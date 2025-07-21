import { ActionType, Permission, ResourceType } from "./role.model";
import { User } from "./user.model";

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  permissions: Permission[];
}

export interface NavigationItem {
  label: string;
  route: string;
  icon: string;
  permission?: Permission;
  visible?: boolean;
}