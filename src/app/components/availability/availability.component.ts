import { Component, EventEmitter, Output } from '@angular/core';
import { DoctorAvailability } from '../../models/doctor-availability.model';
import { Router } from '@angular/router';
import { range } from 'rxjs';
import { Availability } from '../../models/availability.model';
import { TimeSlot } from '../../models/timeslot.model';
import { FirebaseService } from '../../services/firebase.service';

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
    date: '',
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

  constructor(private router: Router, private firebaseService: FirebaseService) {}

  addTimeRange(): void {
    this.availability.timeRanges.push({ start: '', end: '' });
  }

  removeTimeRange(index: number): void {
    this.availability.timeRanges.splice(index, 1);
  }

  async saveAvailability(): Promise<void> {
    if (!this.validateAvailability()) {
      return;
    }

    try {
      // Pobierz istniejące dostępności
      const existingAvailabilities = await this.firebaseService.getAvailabilities();
      const newAvailabilityDays = this.generateAvailabilityDays();
      
      // Dla każdego nowego dnia
      for (const newDay of newAvailabilityDays) {
        // Sprawdź czy już istnieje dostępność na ten dzień
        const existingDay = existingAvailabilities.find(day => day.date === newDay.date);
        
        if (existingDay) {
          // Jeśli istnieje, dodaj nowe godziny do istniejących
          const combinedHours = [...new Set([...existingDay.availableHours, ...newDay.availableHours])];
          const combinedSlots = [...existingDay.slots, ...newDay.slots]
            .sort((a, b) => a.start.localeCompare(b.start));

          // Aktualizuj istniejący dokument
          if (existingDay.id) {
            await this.firebaseService.updateAvailability(existingDay.id, {
              availableHours: combinedHours,
              slots: combinedSlots
            });
          }
        } else {
          // Jeśli nie istnieje, dodaj nowy dzień
          await this.firebaseService.saveAvailability({
            date: newDay.date,
            slots: newDay.slots,
            availableHours: newDay.availableHours
          });
        }
      }

      await this.router.navigate(['/calendar']);
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error('Błąd podczas zapisywania dostępności:', error);
      alert('Wystąpił błąd podczas zapisywania dostępności');
    }
  }

  private validateTimeFormat(time: string): boolean {
    const [, minutes] = time.split(':').map(Number);
    return minutes === 0 || minutes === 30;
  }

  private validateAvailability(): boolean {
    if (this.availability.type === 'cyclic') {
      if (!this.availability.startDate || !this.availability.endDate || this.availability.daysOfWeek.length === 0) {
        alert('Wypełnij wszystkie wymagane pola dla dostępności cyklicznej');
        return false;
      }
    } else {
      if (!this.availability.date) {
        alert('Wybierz datę dla dostępności jednorazowej');
        return false;
      }
    }

    if (this.availability.timeRanges.length === 0) {
      alert('Dodaj przynajmniej jeden zakres godzin');
      return false;
    }

    return true;
  }

  private generateAvailabilityDays(): Availability[] {
    const availabilityDays: Availability[] = [];

    if (this.availability.type === 'cyclic') {
      const startDate = new Date(this.availability.startDate + 'T12:00:00');
      const endDate = new Date(this.availability.endDate + 'T12:00:00');
      const daysOfWeek = this.availability.daysOfWeek;

      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        if (daysOfWeek.includes(currentDate.getDay())) {
          const formattedDate = currentDate.toISOString().split('T')[0];
          this.addAvailabilityDay(availabilityDays, formattedDate);
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else {
      const date = new Date(this.availability.date + 'T12:00:00');
      const formattedDate = date.toISOString().split('T')[0];
      this.addAvailabilityDay(availabilityDays, formattedDate);
    }

    return availabilityDays;
  }

  private addAvailabilityDay(availabilityDays: Availability[], date: string): void {
    const timeSlots = this.availability.timeRanges.flatMap(range => {
      const slots = [];
      let currentTime = range.start;
      
      while (currentTime <= range.end) {
        const endTime = this.addMinutes(currentTime, 30);
        if (endTime <= range.end) {
          slots.push({
            start: currentTime,
            end: endTime,
            isEmpty: true,
            isReserved: false,
            isAvailable: true,
            type: null
          });
        }
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

  private generateCyclicAvailabilities(): Availability[] {
    const availabilities: Availability[] = [];
    const availabilityDays = this.generateAvailabilityDays();
    availabilityDays.forEach(day => {
      const availability: Availability = {
        date: day.date,
        slots: day.slots,
        availableHours: day.availableHours
      };
      availabilities.push(availability);
    });
    return availabilities;
  }

  private generateAvailableHours(): string[] {
    return this.availability.timeRanges.flatMap(range => {
      const hours = [];
      let currentTime = range.start;
      while (currentTime <= range.end) {
        hours.push(currentTime);
        currentTime = this.addMinutes(currentTime, 30);
      }
      return hours;
    });
  }

  private generateTimeSlots(): TimeSlot[] {
    return this.availability.timeRanges.flatMap(range => {
      const slots = [];
      let currentTime = range.start;
      while (currentTime <= range.end) {
        const endTime = this.addMinutes(currentTime, 30);
        if (endTime <= range.end) {
          slots.push({
            start: currentTime,
            end: endTime,
            isEmpty: true,
            isReserved: false,
            isAvailable: true,
            type: null
          });
        }
        currentTime = endTime;
      }
      return slots;
    });
  }
}

