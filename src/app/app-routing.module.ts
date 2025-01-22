import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CalendarComponent } from './components/calendar/calendar.component';
import { AvailabilityComponent } from './components/availability/availability.component';

const routes: Routes = [
  { path: '', redirectTo: '/calendar', pathMatch: 'full' },
  { path: 'calendar', component: CalendarComponent },
  { path: 'calendar/:view', component: CalendarComponent },
  { path: 'availability', component: AvailabilityComponent },
  { 
    path: 'absence', 
    loadComponent: () => import('./components/absence/absence.component').then(m => m.AbsenceComponent)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
