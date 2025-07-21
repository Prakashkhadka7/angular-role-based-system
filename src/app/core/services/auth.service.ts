import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map, of } from 'rxjs';
import { Router } from '@angular/router';
import { LoginCredentials, AuthResponse } from '../models/auth.model';
import { User } from '../models/user.model';
import { Permission } from '../models/role.model';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.API_URL;
  private readonly TOKEN_KEY = environment.TOKEN_KEY;
  private readonly USER_KEY = environment.USER_KEY;

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private permissionsSubject = new BehaviorSubject<Permission[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  public permissions$ = this.permissionsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const userStr = localStorage.getItem(this.USER_KEY);
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
        this.loadUserPermissions(user.roleId);
      } catch (error) {
        this.logout();
      }
    }
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    this.loadingSubject.next(true);
    
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, credentials).pipe(
      tap(response => {
        localStorage.setItem(this.TOKEN_KEY, response.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
        
        this.currentUserSubject.next(response.user);
        this.isAuthenticatedSubject.next(true);
        this.permissionsSubject.next(response.permissions || []);
        this.loadingSubject.next(false);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.permissionsSubject.next([]);
    
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private loadUserPermissions(roleId: string): void {
    this.http.get<any>(`${this.API_URL}/roles/${roleId}`).subscribe({
      next: (role) => {
        this.permissionsSubject.next(role.permissions || []);
      },
      error: () => {
        this.permissionsSubject.next([]);
      }
    });
  }

  
  isLoggedIn(): Observable<boolean> {
    return this.isAuthenticated$;
  }
   
  
  hasPermission(permission: string): Observable<boolean> {
    return of(true);
    // return this.permissions$.pipe(
    //   map((permissions) => {
    //     if (!permissions || permissions.length === 0) {
    //       return false;
    //     }
    //     return permissions.some((p: Permission) => p.name === permission);
    //   })
    // );
  }
}
