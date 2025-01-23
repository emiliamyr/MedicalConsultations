import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../../services/firebase.service';
import { TimeSlot } from '../../models/timeslot.model';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatNativeDateModule } from '@angular/material/core';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReservedSlot } from '../../models/reserved-slot.model';

@Component({
  selector: 'app-reservations-list',
  templateUrl: './reservations-list.component.html',
  styleUrls: ['./reservations-list.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatNativeDateModule
  ]
})
export class ReservationsListComponent implements OnInit {
  reservations: ReservedSlot[] = [];
  loading = false;

  constructor(
    private firebaseService: FirebaseService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  async ngOnInit() {
    await this.loadReservations();
  }

  private async loadReservations() {
    try {
      this.loading = true;
      const currentUser = this.authService.getCurrentUser();
      
      if (!currentUser) {
        this.snackBar.open('Musisz być zalogowany', 'OK', { duration: 3000 });
        return;
      }

      this.reservations = await this.firebaseService.getReservedSlotsForUser(currentUser.id);
      this.reservations.sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Błąd podczas ładowania rezerwacji:', error);
      this.snackBar.open('Wystąpił błąd podczas ładowania rezerwacji', 'OK', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  async processPayment(reservation: any) {
    try {
      const isPaymentSuccessful = await this.simulatePayment();
      
      if (isPaymentSuccessful) {
        await this.firebaseService.updateSlot(reservation.id, {
          ...reservation,
          isPaid: true,
          paymentDate: new Date().toISOString()
        });
        
        await this.loadReservations();
        alert('Płatność została zrealizowana pomyślnie!');
      }
    } catch (error) {
      console.error('Błąd podczas przetwarzania płatności:', error);
      alert('Wystąpił błąd podczas przetwarzania płatności');
    }
  }

  private simulatePayment(): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const isSuccessful = Math.random() < 0.9;
        resolve(isSuccessful);
      }, 1500); 
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('pl-PL');
  }

  public addMinutes(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins);
    date.setMinutes(date.getMinutes() + minutes);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
} 