import { Component, OnInit } from '@angular/core';
import { Availability } from '../../models/availability.model';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TimeSlot } from '../../models/timeslot.model';
import { Absence } from '../../models/absence.model';
import { MatDialog } from '@angular/material/dialog';
import { ReservationComponent } from '../reservation/reservation.component';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css'],
  standalone: false,
  styles: []
})
export class CalendarComponent implements OnInit {
  days: Availability[] = [];
  currentDate: Date = new Date();
  isWeeklyView: boolean = true;
  selectedDate: Date | null = null;
  absences: Absence[] = [];
  

  constructor(
    private route: ActivatedRoute, 
    private router: Router,
    private http: HttpClient,
    private dialog: MatDialog,
    private firebaseService: FirebaseService
  ) {
    const navigation = this.router.getCurrentNavigation();
    const availabilityDays = navigation?.extras?.state?.['availabilityDays'];
    if (availabilityDays) {
      setTimeout(() => {
        this.updateAvailabilityDays(availabilityDays);
      });
    }
  }

  ngOnInit() {
    this.loadAbsences().then(() => {
      this.loadAvailabilityData();
    });

    this.route.params.subscribe((params) => {
      if (params['view'] === 'daily') {
        this.isWeeklyView = false;
        this.selectedDate = new Date(this.currentDate);
      } else {
        this.isWeeklyView = true;
        this.selectedDate = null;
      }
    });

    document.addEventListener('mousemove', (e) => {
      const slot = (e.target as HTMLElement).closest('.slot');
      if (!slot) {
        this.hideSlotDetails();
      }
    });
  }
  
  private async loadAvailabilityData(): Promise<void> {
    try {
      const availabilities = await this.firebaseService.getAvailabilities();
      const reservedSlots = await this.firebaseService.getReservedSlots();

      this.days = [];

      availabilities.forEach((availability: Availability) => {
        const availableHours = [...availability.availableHours];
        
        const slots = availableHours.map(hour => ({
          start: hour,
          end: this.addMinutes(hour, 30),
          isEmpty: true,
          isReserved: false,
          isAvailable: true,
          type: null
        } as TimeSlot));

        const dayReservations = reservedSlots.filter(rs => rs.date === availability.date);
        
        dayReservations.forEach(reservation => {
          const reservedSlot = reservation.slot;
          const existingSlotIndex = slots.findIndex(slot => slot.start === reservedSlot.start);
          
          if (existingSlotIndex !== -1) {
            slots[existingSlotIndex] = {
              ...reservedSlot,
              isAvailable: false,
              isEmpty: false,
              isReserved: true
            };
          } else {
            slots.push({
              ...reservedSlot,
              isAvailable: false,
              isEmpty: false,
              isReserved: true
            });
          }
        });
        
        slots.sort((a, b) => a.start.localeCompare(b.start));

        this.days.push({
          date: availability.date,
          availableHours: availableHours,
          slots: slots
        });
      });

      for (let i = -7; i < 30; i++) {
        const date = new Date(this.currentDate);
        date.setDate(this.currentDate.getDate() + i);
        const formattedDate = date.toISOString().split('T')[0];
        
        if (!this.days.find(day => day.date === formattedDate)) {
          this.days.push({
            date: formattedDate,
            slots: [],
            availableHours: []
          });
        }
      }

      this.days.sort((a, b) => a.date.localeCompare(b.date));

      if (this.absences.length > 0) {
        this.markAbsentDays();
      }

      console.log('Załadowane dni:', this.days);
    } catch (error) {
      console.error('Błąd podczas ładowania danych:', error);
    }
  }

  toggleView(): void {
    if (this.isWeeklyView) {
      this.router.navigate(['/calendar/daily']);
    } else {
      this.router.navigate(['/calendar/weekly']);
    }
  }

  previous(): void {
    if (this.isWeeklyView) {
      this.currentDate.setDate(this.currentDate.getDate() - 7);
    } else {
      this.currentDate.setDate(this.currentDate.getDate() - 1);
    }
    this.currentDate = new Date(this.currentDate);
    this.loadAvailabilityData();
  }
  
  next(): void {
    if (this.isWeeklyView) {
      this.currentDate.setDate(this.currentDate.getDate() + 7);
    } else {
      this.currentDate.setDate(this.currentDate.getDate() + 1);
    }
    this.currentDate = new Date(this.currentDate);
    this.loadAvailabilityData();
  }


  getDisplayedSlots(): Availability[] {
    if (this.isWeeklyView) {
      const startOfWeek = new Date(this.currentDate);
      startOfWeek.setDate(this.currentDate.getDate() - this.currentDate.getDay());
  
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
  
      return this.days.filter(day => {
        const date = new Date(day.date);
        return date >= startOfWeek && date <= endOfWeek;
      });
    } else if (this.selectedDate) {
      const selectedDateString = this.selectedDate.toISOString().split('T')[0];
      return this.days.filter(day => day.date === selectedDateString);
    }
    return [];
  }
  
  
  isPastSlot(slotDate: Date | string, slotTime: string): boolean {
    const [hour, minute] = slotTime.split(':').map(Number);
    const compareDate = slotDate instanceof Date ? slotDate : new Date(slotDate);
    const slotDateTime = new Date(compareDate.setHours(hour, minute));
    return slotDateTime < new Date();
  }
  
  getReservedCount(day: { date: string, slots: TimeSlot[] }): number {
    return day.slots.filter(slot => !slot.isEmpty && slot.isReserved).length;
  }

  selectedSlot: any | null = null;
  tooltipPosition = { top: 0, left: 0 };

  showSlotDetails(event: MouseEvent, slot: TimeSlot): void {
    event.stopPropagation();
    this.selectedSlot = slot;
  
    const target = event.target as HTMLElement;
    const rect = target.getBoundingClientRect();
  
    const tooltipWidth = 200;
    const windowWidth = window.innerWidth;
  
    this.tooltipPosition = {
      top: rect.top + window.scrollY - 10,
      left: 
        rect.left + window.scrollX + rect.width + tooltipWidth > windowWidth
          ? rect.left + window.scrollX - tooltipWidth + 50 
          : rect.left + window.scrollX + rect.width + 10 
    };
  }  

  hideSlotDetails(): void {
    this.selectedSlot = null;
  }

  
  isToday(date: Date | string): boolean {
    const today = new Date();
    const compareDate = date instanceof Date ? date : new Date(date);
    return (
      today.getFullYear() === compareDate.getFullYear() &&
      today.getMonth() === compareDate.getMonth() &&
      today.getDate() === compareDate.getDate()
    );
  }
  isCurrentTime(slotDate: Date | string, startTime: string | null, endTime: string | null): boolean {
    if (!startTime || !endTime) return false;
    
    const now = new Date();
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
  
    const compareDate = slotDate instanceof Date ? slotDate : new Date(slotDate);
    
    if (now.getFullYear() !== compareDate.getFullYear() || 
        now.getMonth() !== compareDate.getMonth() || 
        now.getDate() !== compareDate.getDate()) {
      return false;
    }
  
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
    const startTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = endHour * 60 + endMinute;
  
    return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes;
  }
  

  generateHours(interval: number = 30): string[] {
    const hours = [];
    const startTime = 8;
    const endTime = 20; 
  
    for (let hour = startTime; hour <= endTime; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        hours.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
      }
    }
  
    return hours;
  }
  
  hasSlotAtHour(day: { date: string, slots: TimeSlot[] }, hour: string): boolean {
    const [hourNum, minuteNum] = hour.split(':').map(Number);
    return day.slots.some(slot => {
      const [slotHour, slotMinute] = slot.start.split(':').map(Number);
      return slotHour === hourNum && slotMinute === minuteNum;
    });
  }
  
  addSlot(start: string, end: string, day: string): void {
    const existingDay = this.days.find(d => d.date === day);
  
    if (existingDay) {
      existingDay.slots.push({ 
        start, 
        end, 
        isEmpty: false, 
        isReserved: false,
        isAvailable: true,
        type: null
      });
      existingDay.slots.sort((a, b) => a.start.localeCompare(b.start));
    }
  }
  
  private updateAvailabilityDays(newDays: Availability[]): void {
    const savedAvailabilities = JSON.parse(localStorage.getItem('availabilities') || '[]');
    const updatedDays = [...this.days];

    newDays.forEach(newDay => {
      const existingDayIndex = updatedDays.findIndex(day => day.date === newDay.date);
      const savedDay = savedAvailabilities.find((d: Availability) => d.date === newDay.date) as Availability | undefined;
      
      if (existingDayIndex !== -1) {
        const existingHours = updatedDays[existingDayIndex].availableHours || [];
        const savedHours = savedDay?.availableHours || [];
        const newHours = newDay.slots.map(slot => slot.start);
        updatedDays[existingDayIndex].availableHours = [...new Set([...existingHours, ...savedHours, ...newHours])];
      } else {
        updatedDays.push({
          ...newDay,
          availableHours: [...new Set([...(savedDay?.availableHours || []), ...newDay.slots.map(slot => slot.start)])],
          slots: []
        });
      }
    });

    this.days = updatedDays.sort((a, b) => a.date.localeCompare(b.date));
    
    localStorage.setItem('availabilities', JSON.stringify(
      this.days.filter(day => day.availableHours && day.availableHours.length > 0)
    ));
  }

  getDisplayedWeekRange(): string {
    const monday = new Date(this.currentDate);
    monday.setHours(0, 0, 0, 0);
    
    while (monday.getDay() !== 1) {
      monday.setDate(monday.getDate() - 1);
    }
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const formatDate = (date: Date): string => {
      return date.toLocaleDateString('pl-PL', { 
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };
    
    return `${formatDate(monday)} - ${formatDate(sunday)}`;
  }

  getDisplayedDays(): Availability[] {
    if (!this.isWeeklyView) {
      return this.days.filter(day => {
        const dayDate = new Date(day.date);
        return dayDate.toISOString().split('T')[0] === this.currentDate.toISOString().split('T')[0];
      });
    }

    const monday = new Date(this.currentDate);
    monday.setHours(0, 0, 0, 0);
    
    let dayOfWeek = monday.getDay();
    if (dayOfWeek === 0) dayOfWeek = 7;
    monday.setDate(monday.getDate() - dayOfWeek + 2);

    const weekDays: Availability[] = new Array(7);
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(monday);
      currentDate.setDate(monday.getDate() + i);
      const formattedDate = currentDate.toISOString().split('T')[0];
      
      const existingDay = this.days.find(day => day.date === formattedDate);
      const dayToAdd = existingDay || {
        date: formattedDate,
        slots: [],
        availableHours: []
      };

      const dayPosition = (currentDate.getDay() + 6) % 7;
      weekDays[i] = dayToAdd;
    }

    return weekDays;
  }

  getSlotHeight(slot: TimeSlot): number {
    const [startHour, startMinute] = slot.start.split(':').map(Number);
    const [endHour, endMinute] = slot.end.split(':').map(Number);
    
    const startInMinutes = startHour * 60 + startMinute;
    const endInMinutes = endHour * 60 + endMinute;
    const durationInMinutes = endInMinutes - startInMinutes;
    
    return (durationInMinutes / 30) * 35;
  }

  getSlotPosition(slot: TimeSlot): number {
    const [, minute] = slot.start.split(':').map(Number);
    return (minute / 30) * 35;
  }

  isCurrentHour(hour: string): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const [hourStr, minuteStr] = hour.split(':').map(Number);

    return currentHour === hourStr && 
           Math.floor(currentMinute / 30) === Math.floor(minuteStr / 30);
  }

  isTimeAvailable(date: Date | string, hour: string): boolean {
    const searchDate = new Date(date);
    const availabilityDay = this.days.find(day => {
      const dayDate = new Date(day.date);
      return dayDate.toISOString().split('T')[0] === searchDate.toISOString().split('T')[0];
    });

    if (!availabilityDay?.availableHours) return false;
    return availabilityDay.availableHours.includes(hour);
  }

  async clearAvailability(): Promise<void> {
    try {
      const reservedSlots = await this.firebaseService.getReservedSlots();
      for (const slot of reservedSlots) {
        if (slot.id) {
          await this.firebaseService.deleteSlot(slot.id);
        }
      }

      await this.firebaseService.deleteAllAvailabilities();

      const absences = await this.firebaseService.getAbsences();
      for (const absence of absences) {
        if (absence.id) {
          await this.firebaseService.deleteAbsence(absence.id);
        }
      }
      
      this.days = this.days.map(day => ({
        ...day,
        availableHours: [],
        slots: [],
        isAbsent: false
      }));
      
      this.absences = [];
      
      await this.loadAvailabilityData();
    } catch (error) {
      console.error('Błąd podczas czyszczenia kalendarza:', error);
      alert('Wystąpił błąd podczas czyszczenia kalendarza');
    }
  }

  getSlotWidth(slot: TimeSlot): number {
    const [startHour, startMinute] = slot.start.split(':').map(Number);
    const [endHour, endMinute] = slot.end.split(':').map(Number);
    
    const startInMinutes = startHour * 60 + startMinute;
    const endInMinutes = endHour * 60 + endMinute;
    const durationInMinutes = endInMinutes - startInMinutes;
    
    return (durationInMinutes / 30) * 200;
  }

  getSlotStyle(slot: TimeSlot): { [key: string]: string } {
    const [startHour, startMinute] = slot.start.split(':').map(Number);
    const [endHour, endMinute] = slot.end.split(':').map(Number);
    
    const startInMinutes = startHour * 60 + startMinute;
    const endInMinutes = endHour * 60 + endMinute;
    const durationInHalfHours = (endInMinutes - startInMinutes) / 30;
    
    return {
      '--slot-duration': `${durationInHalfHours}`
    };
  }

  private async loadAbsences(): Promise<void> {
    try {
      this.absences = await this.firebaseService.getAbsences();
      this.markAbsentDays();
    } catch (error) {
      console.error('Błąd podczas ładowania nieobecności:', error);
    }
  }

  private async markAbsentDays(): Promise<void> {
    const updatedDays = await Promise.all(this.days.map(async day => {
      const isAbsent = this.absences.some(absence => {
        const absenceStart = new Date(absence.startDate + 'T00:00:00');
        const absenceEnd = new Date(absence.endDate + 'T23:59:59');
        const currentDate = new Date(day.date + 'T12:00:00');
        return currentDate >= absenceStart && currentDate <= absenceEnd;
      });

      if (isAbsent) {
        const existingAvailability = await this.firebaseService.getAvailabilities();
        const dayAvailability = existingAvailability.find(a => a.date === day.date);
        if (dayAvailability?.id) {
          await this.firebaseService.updateAvailability(dayAvailability.id, {
            availableHours: [],
            slots: []
          });
        }

        const updatedSlots = await Promise.all(day.slots.map(async slot => {
          if (slot.isReserved) {
            const reservations = await this.firebaseService.getReservedSlotsForDate(day.date);
            const reservationToUpdate = reservations.find(r => r.slot.start === slot.start);
            if (reservationToUpdate?.id) {
              await this.firebaseService.updateSlot(reservationToUpdate.id, {
                ...reservationToUpdate,
                slot: {
                  ...reservationToUpdate.slot,
                  isCancelled: true,
                  cancellationReason: 'Nieobecność lekarza'
                }
              });
            }

            return {
              ...slot,
              isCancelled: true,
              isAvailable: false,
              isEmpty: false,
              isReserved: true
            };
          }
          return null;
        }));

        return {
          ...day,
          isAbsent: true,
          availableHours: [],
          slots: updatedSlots.filter(slot => slot !== null)
        };
      }

      return {
        ...day,
        isAbsent: false
      };
    }));

    this.days = updatedDays;
  }

  isAbsentDay(date: string): boolean {
    return this.absences.some(absence => {
      const absenceStart = new Date(absence.startDate + 'T00:00:00');
      const absenceEnd = new Date(absence.endDate + 'T23:59:59');
      const currentDate = new Date(date + 'T12:00:00');
      return currentDate >= absenceStart && currentDate <= absenceEnd;
    });
  }

  onSlotClick(slot: TimeSlot, date: string) {
    console.log('Kliknięto slot:', slot);
    console.log('Data:', date);
    
    if (slot.isCancelled) {
      alert('Wizyta została odwołana z powodu nieobecności lekarza.');
      return;
    }
    
    if (slot.isReserved) {
      if (confirm('Czy chcesz odwołać tę rezerwację?')) {
        this.cancelReservation(date, slot);
      }
      return;
    }

    if (!this.isTimeAvailable(date, slot.start)) {
      alert('Ten termin nie jest dostępny.');
      return;
    }

    if (this.isAbsentDay(date)) {
      alert('Lekarz jest nieobecny w tym dniu.');
      return;
    }

    if (this.isPastSlot(date, slot.start)) {
      alert('Nie można zarezerwować terminu z przeszłości.');
      return;
    }

    const dialogRef = this.dialog.open(ReservationComponent, {
      width: '500px',
      data: { 
        date, 
        slot,
        canBook60Min: this.canBook60MinSlot(date, slot)
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Dialog zamknięty, wynik:', result);
      if (result) {
        if (result.duration === '60' && !this.canBook60MinSlot(date, slot)) {
          alert('Nie można zarezerwować 60-minutowej wizyty - następny slot jest zajęty.');
          return;
        }
        this.updateSlot(date, slot, result);
      }
    });
  }

  private async cancelReservation(date: string, slot: TimeSlot) {
    try {
      const reservations = await this.firebaseService.getReservedSlotsForDate(date);
      
      const reservationToCancel = reservations.find(r => 
        r.slot.start === slot.start && r.date === date
      );

      if (reservationToCancel?.id) {
        await this.firebaseService.deleteSlot(reservationToCancel.id);

        if (slot.end === this.addMinutes(slot.start, 60)) {
          const nextSlotReservation = reservations.find(r => 
            r.slot.start === this.addMinutes(slot.start, 30) && r.date === date
          );
          if (nextSlotReservation?.id) {
            await this.firebaseService.deleteSlot(nextSlotReservation.id);
          }
        }

        const existingAvailability = await this.firebaseService.getAvailabilities();
        const dayAvailability = existingAvailability.find(a => a.date === date);
        
        if (dayAvailability?.id) {
          const updatedAvailableHours = [...dayAvailability.availableHours, slot.start];
          if (slot.end === this.addMinutes(slot.start, 60)) {
            updatedAvailableHours.push(this.addMinutes(slot.start, 30));
          }
          
          await this.firebaseService.updateAvailability(dayAvailability.id, {
            availableHours: [...new Set(updatedAvailableHours)].sort(),
            date: date
          });
        }

        await this.loadAvailabilityData();
        alert('Rezerwacja została odwołana.');
      }
    } catch (error) {
      console.error('Błąd podczas odwoływania rezerwacji:', error);
      alert('Wystąpił błąd podczas odwoływania rezerwacji');
    }
  }

  private canBook60MinSlot(date: string, slot: TimeSlot): boolean {
    const day = this.days.find(d => d.date === date);
    if (!day) return false;

    const nextSlotStart = this.addMinutes(slot.start, 30);
    
    if (!day.availableHours.includes(nextSlotStart)) {
      return false;
    }

    const nextSlot = day.slots.find(s => s.start === nextSlotStart);

    if (nextSlot && nextSlot.isReserved) {
      return false;
    }

    return true;
  }

  private async updateSlot(date: string, slot: TimeSlot, reservationData: any) {
    try {
      const day = this.days.find(d => d.date === date);
      if (!day) return;

      const availableHours = [...day.availableHours];

      await this.firebaseService.saveReservedSlot(date, {
        ...slot,
        isEmpty: false,
        isReserved: true,
        isAvailable: false,
        type: reservationData.type,
        details: {
          patientName: reservationData.patientName,
          patientGender: reservationData.patientGender,
          patientAge: reservationData.patientAge,
          notes: reservationData.doctorNotes
        }
      });

      if (reservationData.duration === '60') {
        const nextSlot = {
          ...slot,
          start: this.addMinutes(slot.start, 30),
          end: this.addMinutes(slot.start, 60),
          isEmpty: false,
          isReserved: true,
          isAvailable: false,
          type: reservationData.type,
          details: {
            patientName: reservationData.patientName,
            patientGender: reservationData.patientGender,
            patientAge: reservationData.patientAge,
            notes: reservationData.doctorNotes
          }
        };
        await this.firebaseService.saveReservedSlot(date, nextSlot);
      }

      const existingAvailability = await this.firebaseService.getAvailabilities();
      const dayAvailability = existingAvailability.find(a => a.date === date);
      
      if (dayAvailability?.id) {
        await this.firebaseService.updateAvailability(dayAvailability.id, {
          availableHours: availableHours,
          date: date
        });
      }

      await this.loadAvailabilityData();
    } catch (error) {
      console.error('Błąd podczas aktualizacji slotu:', error);
    }
  }

  public addMinutes(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins);
    date.setMinutes(date.getMinutes() + minutes);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  navigateToAvailability(): void {
    this.router.navigate(['/availability']);
  }

  navigateToAbsence(): void {
    this.router.navigate(['/absence']);
  }

}
