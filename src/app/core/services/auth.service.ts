import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, tap } from 'rxjs';
import { Router } from '@angular/router';
import { LoginCredentials, AuthResponse } from '../models/auth.model';
import { User } from '../models/user.model';
import { Permission } from '../models/role.model';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = environment.API_URL;
  private readonly TOKEN_KEY = environment.TOKEN_KEY;
  private readonly USER_KEY = environment.USER_KEY;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  /** Reads user from localStorage and emits as observable */
  public get currentUser$(): Observable<User | null> {
    const userStr = localStorage.getItem(this.USER_KEY);
    return of(userStr ? JSON.parse(userStr) : null);
  }

  /** Returns current user synchronously */
  public getCurrentUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  /** Checks if user is logged in */
  public get isAuthenticated$(): Observable<boolean> {
    const token = localStorage.getItem(this.TOKEN_KEY);
    return of(!!token);
  }

  /** Returns the current token */
  public getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /** Emits the user’s permission list as observable */
  public get permissions$(): Observable<Permission[]> {
    const user = this.getCurrentUser();
    return of(user?.permissions || []);
  }

  /** Login and persist token + user */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, credentials).pipe(
      tap((response: AuthResponse) => {
        localStorage.setItem(this.TOKEN_KEY, response.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
      })
    );
  }

  /** Logout: remove user and token from localStorage */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.router.navigate(['/login']);
  }

  /** Get auth state as observable (optional alias) */
  isLoggedIn(): Observable<boolean> {
    return this.isAuthenticated$;
  }

  /** Check if user has specific permission */
  hasPermission(permission: string): Observable<boolean> {
    const user = this.getCurrentUser();
    if (!user?.permissions || !Array.isArray(user.permissions)) {
      return of(false);
    }

    return of(user.permissions.some(p => p.name === permission));
  }
}
