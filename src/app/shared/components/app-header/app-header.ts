import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [
    MatIconModule,
    MatToolbarModule,
    MatMenuModule,
    CommonModule
  ],
  templateUrl: './app-header.html',
  styleUrl: './app-header.scss',
})
export class AppHeader {
  @Input() isSidenavOpen: boolean = true;
  @Output() toggleSidenav = new EventEmitter<void>();

  currentUser$: Observable<any>;
  currentUser: any = null;

  constructor(
    private authService: AuthService,
    private authStateService: AuthService,
    private router: Router
  ) {
    this.currentUser$ = this.authStateService.currentUser$;
  }

  ngOnInit() {
    this.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
  }

  onToggleSidenav() {
    this.toggleSidenav.emit();
  }

  logout() {
    this.authService.logout();
  }

  navigateToProfile() {
    this.router.navigate(['/profile']);
  }
}
