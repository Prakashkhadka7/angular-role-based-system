import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { User, CreateUserRequest, UpdateUserRequest } from '../models/user.model';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_URL = environment.API_URL;
  
  private usersSubject = new BehaviorSubject<User[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  public users$ = this.usersSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadUsers(): Observable<User[]> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.get<User[]>(`${this.API_URL}/users?_expand=role`).pipe(
      tap(users => {
        this.usersSubject.next(users);
        this.loadingSubject.next(false);
      })
    );
  }

  createUser(userData: CreateUserRequest): Observable<User> {
    this.loadingSubject.next(true);
    
    return this.http.post<User>(`${this.API_URL}/users`, {
      ...userData,
      id: this.generateId(),
      isActive: true,
      createdAt: new Date().toISOString()
    }).pipe(
      tap(newUser => {
        const currentUsers = this.usersSubject.value;
        this.usersSubject.next([...currentUsers, newUser]);
        this.loadingSubject.next(false);
      })
    );
  }

  updateUser(id: string, userData: UpdateUserRequest): Observable<User> {
    this.loadingSubject.next(true);
    
    return this.http.put<User>(`${this.API_URL}/users/${id}`, {
      ...userData,
      updatedAt: new Date().toISOString()
    }).pipe(
      tap(updatedUser => {
        const currentUsers = this.usersSubject.value;
        const index = currentUsers.findIndex(u => u.id === id);
        if (index !== -1) {
          currentUsers[index] = updatedUser;
          this.usersSubject.next([...currentUsers]);
        }
        this.loadingSubject.next(false);
      })
    );
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/users/${id}`).pipe(
      tap(() => {
        const currentUsers = this.usersSubject.value;
        this.usersSubject.next(currentUsers.filter(u => u.id !== id));
      })
    );
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/users/${id}?_expand=role`);
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
}