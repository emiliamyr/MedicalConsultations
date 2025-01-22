import { Component, EventEmitter, Output } from '@angular/core';
import { DoctorAvailability } from '../../models/doctor-availability.model';
import { Router } from '@angular/router';
import { range } from 'rxjs';
import { Availability } from '../../models/availability.model';
import { TimeSlot } from '../../models/timeslot.model';

@Component({
  selector: 'app-availability',
  templateUrl: './availability.component.html',
  styleUrls: ['./availability.component.css'],
  standalone: false
})
export class AvailabilityComponent {
  @Output() saveAvailabilityEvent = new EventEmitter<Availability[]>();

  availability: DoctorAvailability = {
    type: 'cyclic',
    startDate: '',
    endDate: '',
    daysOfWeek: [],
    timeRanges: [{ start: '08:00', end: '12:30' }],
  };

  weekDays = [
    { label: 'Poniedziałek', value: 1, checked: false },
    { label: 'Wtorek', value: 2, checked: false },
    { label: 'Środa', value: 3, checked: false },
    { label: 'Czwartek', value: 4, checked: false },
    { label: 'Piątek', value: 5, checked: false },
    { label: 'Sobota', value: 6, checked: false },
    { label: 'Niedziela', value: 0, checked: false },
  ];

  constructor(private router: Router) {}

  addTimeRange(): void {
    this.availability.timeRanges.push({ start: '', end: '' });
  }

  removeTimeRange(index: number): void {
    this.availability.timeRanges.splice(index, 1);
  }

  saveAvailability(): void {
    if (!this.validateAvailability()) {
      return;
    }

    const availabilityDays = this.generateAvailabilityDays();
    
    // Debugowanie - sprawdź wygenerowane dni
    console.log('Wygenerowane dni:', availabilityDays);
    
    // Pobierz istniejące sloty
    const existingSlots = JSON.parse(localStorage.getItem('reserved-slots') || '[]');
    console.log('Istniejące sloty:', existingSlots);
    
    // Połącz nowe sloty z istniejącymi, unikając duplikatów dat
    const updatedSlots = existingSlots.filter((slot: Availability) => 
      !availabilityDays.some(newSlot => newSlot.date === slot.date)
    );
    updatedSlots.push(...availabilityDays);
    
    console.log('Zaktualizowane sloty:', updatedSlots);
    
    // Zapisz zaktualizowane sloty
    localStorage.setItem('reserved-slots', JSON.stringify(updatedSlots));
    
    // Emituj event i nawiguj
    this.saveAvailabilityEvent.emit(availabilityDays);
    this.router.navigate(['/calendar'], {
      state: { availabilityDays }
    }).then(() => {
      window.location.reload(); // Dodaj odświeżenie strony
    });
  }

  private validateTimeFormat(time: string): boolean {
    const [, minutes] = time.split(':').map(Number);
    return minutes === 0 || minutes === 30;
  }

  private validateAvailability(): boolean {
    if (this.availability.type === 'cyclic') {
      if (
        !this.availability.startDate || 
        !this.availability.endDate || 
        !this.availability.daysOfWeek?.length
      ) {
        alert('Uzupełnij wszystkie pola dla dostępności cyklicznej.');
        return false;
      }
    } else if (this.availability.type === 'one-time') {
      if (!this.availability.date) {
        alert('Uzupełnij datę dla dostępności jednorazowej.');
        return false;
      }
    }

    // Sprawdź konflikty z absencjami
    const absences = JSON.parse(localStorage.getItem('absences') || '[]');
    const hasConflict = absences.some((absence: any) => {
      if (this.availability.type === 'cyclic') {
        return (
          this.availability.startDate! <= absence.endDate &&
          this.availability.endDate! >= absence.startDate
        );
      } else {
        return (
          this.availability.date! >= absence.startDate &&
          this.availability.date! <= absence.endDate
        );
      }
    });

    if (hasConflict) {
      alert('Nie można dodać dostępności w dniach, w których jest zaplanowana nieobecność.');
      return false;
    }

    if (!this.availability.timeRanges || !this.availability.timeRanges.length) {
      alert('Dodaj przynajmniej jeden przedział czasowy.');
      return false;
    }

    // Sprawdzamy format czasu dla każdego przedziału
    for (const range of this.availability.timeRanges) {
      if (!this.validateTimeFormat(range.start) || !this.validateTimeFormat(range.end)) {
        alert('Godziny muszą być ustawione co 30 minut (np. 8:00, 8:30, 9:00).');
        return false;
      }
    }

    return true;
  }

  private generateAvailabilityDays(): Availability[] {
    const availabilityDays: Availability[] = [];

    if (this.availability.type === 'cyclic') {
      const startDate = new Date(this.availability.startDate! + 'T12:00:00');
      const endDate = new Date(this.availability.endDate! + 'T12:00:00');
      const daysOfWeek = this.availability.daysOfWeek!;

      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        if (daysOfWeek.includes(currentDate.getDay())) {
          const formattedDate = currentDate.toISOString().split('T')[0];
          this.addAvailabilityDay(availabilityDays, formattedDate);
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (this.availability.type === 'one-time') {
      const date = new Date(this.availability.date! + 'T12:00:00');
      const formattedDate = date.toISOString().split('T')[0];
      this.addAvailabilityDay(availabilityDays, formattedDate);
    }

    return availabilityDays;
  }

  private addAvailabilityDay(availabilityDays: Availability[], date: string): void {
    const timeSlots = this.availability.timeRanges.flatMap(range => {
      const slots = [];
      let currentTime = range.start;
      
      while (currentTime < range.end) {
        const endTime = this.addMinutes(currentTime, 30);
        slots.push({
          start: currentTime,
          end: endTime,
          isEmpty: true,
          isReserved: false,
          isAvailable: true,
          type: null
        });
        currentTime = endTime;
      }
      
      return slots;
    });

    availabilityDays.push({
      date: date,
      slots: timeSlots,
      availableHours: timeSlots.map(slot => slot.start)
    });
  }

  private addMinutes(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins);
    date.setMinutes(date.getMinutes() + minutes);
    
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  navigateBack(): void {
    this.router.navigate(['/calendar']);
  }

  toggleDay(day: { value: number, checked: boolean }): void {
    day.checked = !day.checked;
    this.availability.daysOfWeek = this.weekDays
      .filter(d => d.checked)
      .map(d => d.value);
  }
}

