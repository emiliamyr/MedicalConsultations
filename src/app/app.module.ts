import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { CalendarComponent } from './components/calendar/calendar.component';
import { AvailabilityComponent } from './components/availability/availability.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { RouterModule } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { MatIconModule } from '@angular/material/icon';


const firebaseConfig = {
  apiKey: "AIzaSyBxxyY91O8_tURhtqtLYzlpiss1dVxC0Rw",
  authDomain: "medicalconsultations-de9d9.firebaseapp.com",
  projectId: "medicalconsultations-de9d9",
  storageBucket: "medicalconsultations-de9d9.firebasestorage.app",
  messagingSenderId: "206623961498",
  appId: "1:206623961498:web:91fe3e254f19ba42c7ca23",
  measurementId: "G-12BMHCS6E7"
};

@NgModule({
  declarations: [
    AppComponent,
    CalendarComponent,
    AvailabilityComponent,

  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatListModule,
    MatButtonModule,
    MatDialogModule,
    MatSelectModule,
    RouterModule,
    CommonModule,
    MatIconModule
  ],
  providers: [
    provideAnimationsAsync(),
    DatePipe,
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore())
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
