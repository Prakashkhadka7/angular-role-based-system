import { Component } from '@angular/core';
import { User } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterModule } from '@angular/router';
import { AppHeader } from '../../../shared/components/app-header/app-header';

@Component({
  selector: 'app-main-layout',
  imports: [MatSidenavModule,RouterModule, AppHeader],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayout {
  isSidenavOpen = true;
  currentUser: User | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    console.log('Current user:');
    // this.currentUser = this.authService.getCurrentUser();
  }

  toggleSidenav(): void {
    this.isSidenavOpen = !this.isSidenavOpen;
  }
}