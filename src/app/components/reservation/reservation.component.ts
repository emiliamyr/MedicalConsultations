import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-reservation',
  templateUrl: './reservation.component.html',
  styleUrls: ['./reservation.component.css'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    CommonModule,
    MatDialogModule
  ]
})
export class ReservationComponent implements OnInit {
  reservationForm: FormGroup;
  canBook60Min: boolean;
  patientData: any;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ReservationComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private authService: AuthService
  ) {
    this.canBook60Min = data.canBook60Min;
    const currentUser = this.authService.getCurrentUser();
    
    this.reservationForm = this.fb.group({
      type: ['', Validators.required],
      duration: ['30', Validators.required],
      doctorNotes: ['']
    });

    // Automatycznie ustawiamy dane z konta użytkownika
    if (currentUser) {
      this.patientData = {
        patientName: `${currentUser.firstName} ${currentUser.lastName}`,
        patientEmail: currentUser.email,
        patientPhone: currentUser.phoneNumber || ''
      };
    }
  }

  ngOnInit(): void {
    // Możesz zostawić pustą implementację, jeśli nie potrzebujesz inicjalizacji
  }

  onSubmit(): void {
    if (this.reservationForm.valid) {
      this.dialogRef.close({
        ...this.reservationForm.value,
        ...this.patientData
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
} 