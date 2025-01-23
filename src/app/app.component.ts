import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from './models/user.model';
import { FirebaseService } from './services/firebase.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'MedicalConsultations';
  isLoggedIn$: Observable<boolean>;
  currentUser$: Observable<User | null>;

  constructor(
    private authService: AuthService,
    private firebaseService: FirebaseService
  ) {
    this.isLoggedIn$ = this.authService.currentUser$.pipe(
      map(user => !!user)
    );
    this.currentUser$ = this.authService.currentUser$;
    
  }

  logout() {
    this.authService.logout();
  }
}
