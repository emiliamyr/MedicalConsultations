import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    RouterLink
  ]
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private firebaseService: FirebaseService,
    private snackBar: MatSnackBar,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      this.snackBar.open('Proszę wypełnić wszystkie pola', 'OK', { duration: 3000 });
      return;
    }

    this.loading = true;

    try {
      const user = await this.firebaseService.getUserByEmail(this.loginForm.value.email);
      
      if (!user || user.password !== this.loginForm.value.password) {
        this.snackBar.open('Nieprawidłowy email lub hasło', 'OK', { duration: 3000 });
        this.loading = false;
        return;
      }

      this.authService.setCurrentUser(user);
      this.snackBar.open('Zalogowano pomyślnie', 'OK', { duration: 3000 });
      this.router.navigate(['/calendar']);
    } catch (error) {
      console.error('Błąd podczas logowania:', error);
      this.snackBar.open('Wystąpił błąd podczas logowania', 'OK', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }
} 