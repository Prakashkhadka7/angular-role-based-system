import { Permission, Role } from "./role.model";

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  roleId: string;
  role?: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  permissions?: Permission[]
}

export interface CreateUserRequest {
  username: string;
  password: string;
  fullName: string;
  email: string;
  roleId: string;
}

export interface UpdateUserRequest {
  fullName: string;
  email: string;
  roleId: string;
  isActive: boolean;
}