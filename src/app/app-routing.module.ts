import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CalendarComponent } from './components/calendar/calendar.component';
import { AvailabilityComponent } from './components/availability/availability.component';
import { ReservationsListComponent } from './components/reservations-list/reservations-list.component';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

const routes: Routes = [
  { 
    path: '', 
    redirectTo: '/calendar', 
    pathMatch: 'full' 
  },
  { 
    path: 'calendar', 
    component: CalendarComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'calendar/:view', 
    component: CalendarComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'availability', 
    component: AvailabilityComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['doctor'] }
  },
  { 
    path: 'absence', 
    loadComponent: () => import('./components/absence/absence.component')
      .then(m => m.AbsenceComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['doctor'] }
  },
  {
    path: 'reservations',
    component: ReservationsListComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['patient'] }
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register.component')
      .then(m => m.RegisterComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component')
      .then(m => m.LoginComponent)
  },
  { 
    path: '**', 
    redirectTo: '/calendar' 
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
