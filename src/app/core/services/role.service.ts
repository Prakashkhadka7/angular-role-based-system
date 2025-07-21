import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { Role, CreateRoleRequest } from '../models/role.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  private readonly API_URL = environment.API_URL;

  private rolesSubject = new BehaviorSubject<Role[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public roles$ = this.rolesSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadRoles(): Observable<Role[]> {
    this.loadingSubject.next(true);

    return this.http.get<Role[]>(`${this.API_URL}/roles`).pipe(
      tap((roles) => {
        this.rolesSubject.next(roles);
        this.loadingSubject.next(false);
      })
    );
  }

  createRole(roleData: CreateRoleRequest): Observable<Role> {
    this.loadingSubject.next(true);

    return this.http
      .post<Role>(`${this.API_URL}/roles`, {
        ...roleData,
        id: this.generateId(),
        isSystemRole: false,
        createdAt: new Date().toISOString(),
      })
      .pipe(
        tap((newRole) => {
          const currentRoles = this.rolesSubject.value;
          this.rolesSubject.next([...currentRoles, newRole]);
          this.loadingSubject.next(false);
        })
      );
  }

  updateRole(id: string, roleData: Partial<Role>): Observable<Role> {
    this.loadingSubject.next(true);

    return this.http
      .patch<Role>(`${this.API_URL}/roles/${id}`, {
        ...roleData,
        updatedAt: new Date().toISOString(),
      })
      .pipe(
        tap((updatedRole) => {
          const currentRoles = this.rolesSubject.value;
          const index = currentRoles.findIndex((r) => r.id === id);
          if (index !== -1) {
            currentRoles[index] = updatedRole;
            this.rolesSubject.next([...currentRoles]);
          }
          this.loadingSubject.next(false);
        })
      );
  }

  deleteRole(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/roles/${id}`).pipe(
      tap(() => {
        const currentRoles = this.rolesSubject.value;
        this.rolesSubject.next(currentRoles.filter((r) => r.id !== id));
      })
    );
  }

  checkRoleInUse(roleId: string): Observable<boolean> {
    return this.http.get<any[]>(`${this.API_URL}/users?roleId=${roleId}`).pipe(
      // Map the array to a boolean indicating if any users exist with the role
      tap(),
      map((users) => users.length > 0)
    );
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
}
