import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const user = this.authService.getCurrentUser();
    const allowedRoles = route.data['roles'] as string[];

    if (!user || !allowedRoles.includes(user.role)) {
      this.snackBar.open('Brak dostępu do tej sekcji', 'OK', { duration: 3000 });
      this.router.navigate(['/calendar']);
      return false;
    }

    return true;
  }
} 