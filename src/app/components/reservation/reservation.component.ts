import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

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
    CommonModule
  ]
})
export class ReservationComponent {
  reservationForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ReservationComponent>
  ) {
    this.reservationForm = this.fb.group({
      duration: ['', Validators.required],
      type: ['', Validators.required],
      patientName: ['', Validators.required],
      patientGender: ['', Validators.required],
      patientAge: ['', [Validators.required, Validators.min(0), Validators.max(150)]],
      doctorNotes: ['']
    });
  }

  onSubmit() {
    if (this.reservationForm.valid) {
      this.dialogRef.close(this.reservationForm.value);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
} 