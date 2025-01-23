import { Component } from '@angular/core';
import { FirebaseService } from '../../services/firebase.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
  standalone: true,
  imports: [MatButtonModule]
})
export class AdminComponent {
  constructor(
    private firebaseService: FirebaseService,
    private snackBar: MatSnackBar
  ) {}

  async clearAllUsers() {
    if (confirm('Czy na pewno chcesz usunąć wszystkich użytkowników? Ta operacja jest nieodwracalna.')) {
      try {
        await this.firebaseService.deleteAllUsers();
        this.snackBar.open('Wszyscy użytkownicy zostali usunięci', 'OK', { duration: 3000 });
      } catch (error) {
        console.error('Błąd podczas usuwania użytkowników:', error);
        this.snackBar.open('Wystąpił błąd podczas usuwania użytkowników', 'OK', { duration: 3000 });
      }
    }
  }
} 