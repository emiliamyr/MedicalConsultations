import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Absence } from '../../models/absence.model';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';

interface ReservedSlot {
  start: string;
  end: string;
  isCancelled: boolean;
  isReserved: boolean;
  isEmpty: boolean;
  type: string | null;
  cancellationReason?: string;
}

interface DaySlots {
  date: string;
  slots: ReservedSlot[];
}

@Component({
  selector: 'app-absence',
  templateUrl: './absence.component.html',
  styleUrls: ['./absence.component.css'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatListModule,
    MatButtonModule,
    CommonModule,
    DatePipe
  ]
})
export class AbsenceComponent implements OnInit {
  absenceForm: FormGroup;
  absences: Absence[] = [];

  constructor(private fb: FormBuilder, private router: Router, private http: HttpClient) {
    this.absenceForm = this.fb.group({
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      reason: ['']
    });
  }

  ngOnInit() {
    // Wczytaj zapisane absencje
    const savedAbsences = localStorage.getItem('absences');
    if (savedAbsences) {
      this.absences = JSON.parse(savedAbsences);
    }
  }

  addAbsence() {
    if (this.absenceForm.valid) {
      const formValues = this.absenceForm.value;
      
      // Ustaw godzinę na 12:00 aby uniknąć problemów ze strefami czasowymi
      const startDate = new Date(formValues.startDate);
      startDate.setHours(12, 0, 0, 0);
      
      const endDate = new Date(formValues.endDate);
      endDate.setHours(12, 0, 0, 0);
      
      const newAbsence = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        reason: formValues.reason
      };
      
      // Sprawdź konflikty z istniejącymi rezerwacjami
      this.checkConflicts(newAbsence);
      
      this.absenceForm.reset();
    }
  }

  private checkConflicts(absence: Absence) {
    // Pobierz zarezerwowane sloty z pliku JSON
    this.http.get<any[]>('assets/reserved-slots.json').subscribe(originalSlots => {
      // Połącz sloty z pliku JSON z tymi z localStorage
      const reservedSlots = JSON.parse(localStorage.getItem('reserved-slots') || JSON.stringify(originalSlots));
      
      const updatedReservedSlots = reservedSlots.map((day: DaySlots) => {
        // Konwertuj daty do porównania
        const dayDate = new Date(day.date).toISOString().split('T')[0];
        const startDate = absence.startDate;
        const endDate = absence.endDate;

        if (dayDate >= startDate && dayDate <= endDate) {
          // Jeśli dzień jest w zakresie absencji, oznacz wszystkie sloty jako odwołane
          return {
            ...day,
            slots: day.slots.map(slot => ({
              ...slot,
              isCancelled: true,
              cancellationReason: 'Nieobecność lekarza'
            }))
          };
        }
        return day;
      });

      // Zapisz zaktualizowane sloty
      localStorage.setItem('reserved-slots', JSON.stringify(updatedReservedSlots));
      
      // Zapisz absencję
      this.absences.push(absence);
      localStorage.setItem('absences', JSON.stringify(this.absences));
      
      // Odśwież widok kalendarza
      this.router.navigate(['/calendar']).then(() => {
        window.location.reload();
      });
    });
  }

  navigateBack(): void {
    this.router.navigate(['/calendar']);
  }
} 