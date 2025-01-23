import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    RouterLink
  ]
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private firebaseService: FirebaseService,
    private snackBar: MatSnackBar
  ) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      role: ['patient', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phoneNumber: ['', [Validators.pattern('^[0-9]{9}$')]]
    }, { validator: this.passwordMatchValidator });
  }

  private passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  async onSubmit() {
    if (this.registerForm.invalid) {
      this.snackBar.open('Proszę wypełnić wszystkie pola', 'OK', { duration: 3000 });
      return;
    }

    this.loading = true;
    console.log('Dane formularza:', this.registerForm.value);

    try {
      const { confirmPassword, ...userData } = this.registerForm.value;
      
      const newUser: Partial<User> = {
        ...userData,
        role: userData.role || 'patient',
        createdAt: new Date()
      };

      console.log('Próba utworzenia użytkownika:', newUser);
      await this.firebaseService.createUser(newUser);
      
      this.snackBar.open('Rejestracja zakończona pomyślnie', 'OK', { duration: 3000 });
      this.router.navigate(['/login']);
    } catch (error: any) {
      console.error('Błąd podczas rejestracji:', error);
      this.snackBar.open(error.message || 'Wystąpił błąd podczas rejestracji', 'OK', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }
} 