import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CalendarComponent } from './components/calendar/calendar.component';
import { AvailabilityComponent } from './components/availability/availability.component';
import { ReservationsListComponent } from './components/reservations-list/reservations-list.component';

const routes: Routes = [
  { path: '', redirectTo: '/calendar', pathMatch: 'full' },
  { path: 'calendar', component: CalendarComponent },
  { path: 'calendar/:view', component: CalendarComponent },
  { path: 'availability', component: AvailabilityComponent },
  { 
    path: 'absence', 
    loadComponent: () => import('./components/absence/absence.component').then(m => m.AbsenceComponent)
  },
  {
    path: 'reservations',
    component: ReservationsListComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
