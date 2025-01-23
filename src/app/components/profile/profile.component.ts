import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Profil użytkownika</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <p>Imię: {{ (authService.currentUser$ | async)?.firstName }}</p>
        <p>Nazwisko: {{ (authService.currentUser$ | async)?.lastName }}</p>
        <p>Email: {{ (authService.currentUser$ | async)?.email }}</p>
      </mat-card-content>
    </mat-card>
  `,
  standalone: true,
  imports: [CommonModule, MatCardModule]
})
export class ProfileComponent {
  constructor(public authService: AuthService) {}
} 