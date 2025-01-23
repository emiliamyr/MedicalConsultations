import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Absence } from '../../models/absence.model';
import { FirebaseService } from '../../services/firebase.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-absence',
  templateUrl: './absence.component.html',
  styleUrls: ['./absence.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatButtonModule,
    MatListModule
  ]
})
export class AbsenceComponent implements OnInit {
  absenceForm: FormGroup;
  absences: Absence[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private firebaseService: FirebaseService
  ) {
    this.absenceForm = this.fb.group({
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      reason: ['']
    });
  }

  ngOnInit() {
    this.loadAbsences();
  }

  private async loadAbsences() {
    this.absences = await this.firebaseService.getAbsences();
  }

  async onSubmit(): Promise<void> {
    if (this.absenceForm.valid) {
      try {
        const formValue = this.absenceForm.value;
        const absence: Absence = {
          startDate: this.formatDate(formValue.startDate),
          endDate: this.formatDate(formValue.endDate),
          reason: formValue.reason
        };

        await this.firebaseService.saveAbsence(absence);
        await this.router.navigate(['/calendar']);
        location.reload();
      } catch (error) {
        console.error('Błąd podczas zapisywania nieobecności:', error);
        alert('Wystąpił błąd podczas zapisywania nieobecności');
      }
    }
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    d.setHours(12, 0, 0, 0); 
    return d.toISOString().split('T')[0];
  }

  navigateBack(): void {
    this.router.navigate(['/calendar']);
  }
} 