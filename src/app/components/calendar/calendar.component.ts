import { Component, OnInit } from '@angular/core';
import { Availability } from '../../models/availability.model';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TimeSlot } from '../../models/timeslot.model';
import { Absence } from '../../models/absence.model';
import { MatDialog } from '@angular/material/dialog';
import { ReservationComponent } from '../reservation/reservation.component';
import { DatePipe } from '@angular/common';
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
    private dialog: MatDialog
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
    this.loadAvailabilityData();
    this.loadAbsences();
    
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
  
  private loadAvailabilityData(): void {
    const savedAvailabilities = JSON.parse(localStorage.getItem('availabilities') || '[]');
    const reservedSlots = JSON.parse(localStorage.getItem('reserved-slots') || '[]');

    console.log('Załadowane dostępności:', savedAvailabilities);
    console.log('Załadowane zarezerwowane sloty:', reservedSlots);

    this.days = [];

    savedAvailabilities.forEach((availability: Availability) => {
      const slots = availability.availableHours.map(hour => ({
        start: hour,
        end: this.addMinutes(hour, 30),
        isEmpty: true,
        isReserved: false,
        isAvailable: true,
        type: null
      } as TimeSlot));

      // Dodaj zarezerwowane sloty do dni
      const reservedDay = reservedSlots.find((day: any) => day.date === availability.date);
      if (reservedDay) {
        reservedDay.slots.forEach((reservedSlot: TimeSlot) => {
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
      }

      this.days.push({
        date: availability.date,
        availableHours: availability.availableHours,
        slots: slots
      });
    });

    // Dodaj brakujące dni
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

    // Sortuj dni po dacie
    this.days.sort((a, b) => a.date.localeCompare(b.date));

    // Oznacz dni nieobecności
    if (this.absences.length > 0) {
      this.markAbsentDays();
    }

    console.log('Załadowane dni:', this.days);
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
    } else if (this.selectedDate) {
      this.selectedDate.setDate(this.selectedDate.getDate() - 1);
    }
  }
  
  next(): void {
    if (this.isWeeklyView) {
      this.currentDate.setDate(this.currentDate.getDate() + 7);
    } else if (this.selectedDate) {
      this.selectedDate.setDate(this.selectedDate.getDate() + 1);
    }
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
    // Pobieramy zapisane dostępności
    const savedAvailabilities = JSON.parse(localStorage.getItem('availabilities') || '[]');
    const updatedDays = [...this.days];

    newDays.forEach(newDay => {
      const existingDayIndex = updatedDays.findIndex(day => day.date === newDay.date);
      const savedDay = savedAvailabilities.find((d: Availability) => d.date === newDay.date) as Availability | undefined;
      
      if (existingDayIndex !== -1) {
        // Łączymy nowe godziny z zapisanymi i istniejącymi
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
    
    // Zapisujemy zaktualizowane dostępności
    localStorage.setItem('availabilities', JSON.stringify(
      this.days.filter(day => day.availableHours && day.availableHours.length > 0)
    ));
  }

  getDisplayedWeekRange(): string {
    const startOfWeek = new Date(this.currentDate);
    startOfWeek.setDate(this.currentDate.getDate() - this.currentDate.getDay() + 1);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const formatDate = (date: Date): string => {
      return date.toLocaleDateString('pl-PL', { 
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };
    
    return `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;
  }

  getDisplayedDays(): { date: string, slots: TimeSlot[], availableHours?: string[], isAbsent?: boolean }[] {
    console.log('Wyświetlane dni:', this.days);
    if (!this.isWeeklyView && this.selectedDate) {
      const dateString = this.selectedDate.toISOString().split('T')[0];
      const existingDay = this.days.find(d => d.date === dateString) || {
        date: dateString,
        slots: [],
        availableHours: [],
        isAbsent: this.isAbsentDay(dateString)
      };
      return [existingDay];
    }

    const days = [];
    const startOfWeek = new Date(this.currentDate);
    startOfWeek.setDate(this.currentDate.getDate() - this.currentDate.getDay() + 1);

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);
      const dateString = currentDate.toISOString().split('T')[0];
      
      const existingDay = this.days.find(d => d.date === dateString);

      days.push({
        date: dateString,
        slots: existingDay?.slots || [],
        availableHours: existingDay?.availableHours || [],
        isAbsent: existingDay?.isAbsent || this.isAbsentDay(dateString)
      });
    }

    return days;
  }

  getSlotHeight(slot: TimeSlot): number {
    const [startHour, startMinute] = slot.start.split(':').map(Number);
    const [endHour, endMinute] = slot.end.split(':').map(Number);
    
    const startInMinutes = startHour * 60 + startMinute;
    const endInMinutes = endHour * 60 + endMinute;
    const durationInMinutes = endInMinutes - startInMinutes;
    
    // Zmniejszamy wysokość - jeden 30-minutowy slot będzie miał 35px zamiast 40px
    return (durationInMinutes / 30) * 35;
  }

  getSlotPosition(slot: TimeSlot): number {
    const [, minute] = slot.start.split(':').map(Number);
    // Każde 30 minut to 35px, więc 1 minuta to 35/30 px
    return (minute / 30) * 35;
  }

  isCurrentHour(hour: string): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const [hourStr, minuteStr] = hour.split(':').map(Number);

    // Sprawdzamy czy jesteśmy w tej samej godzinie i tym samym 30-minutowym przedziale
    return currentHour === hourStr && 
           Math.floor(currentMinute / 30) === Math.floor(minuteStr / 30);
  }

  isTimeAvailable(date: Date | string, hour: string): boolean {
    const searchDate = new Date(date);
    const availabilityDay = this.days.find(day => {
      const dayDate = new Date(day.date);
      return dayDate.toISOString().split('T')[0] === searchDate.toISOString().split('T')[0];
    });

    // console.log('Sprawdzam dostępność:', {
    //   date,
    //   hour,
    //   availabilityDay,
    //   isAvailable: availabilityDay?.availableHours?.includes(hour)
    // });

    if (!availabilityDay?.availableHours) return false;
    return availabilityDay.availableHours.includes(hour);
  }

  clearAvailability(): void {
    localStorage.removeItem('availabilities');
    localStorage.removeItem('absences');
    localStorage.removeItem('reserved-slots');
    this.days = this.days.map(day => ({
      ...day,
      availableHours: [],
      isAbsent: false,
      slots: []
    }));
  }

  getSlotWidth(slot: TimeSlot): number {
    const [startHour, startMinute] = slot.start.split(':').map(Number);
    const [endHour, endMinute] = slot.end.split(':').map(Number);
    
    const startInMinutes = startHour * 60 + startMinute;
    const endInMinutes = endHour * 60 + endMinute;
    const durationInMinutes = endInMinutes - startInMinutes;
    
    // Każde 30 minut to jedna komórka (200px)
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

  private loadAbsences() {
    const savedAbsences = localStorage.getItem('absences');
    if (savedAbsences) {
      this.absences = JSON.parse(savedAbsences);
      this.markAbsentDays();
    }
  }

  private markAbsentDays() {
    this.days.forEach(day => {
      const dayDate = new Date(day.date);
      const isAbsent = this.absences.some(absence => {
        const startDate = new Date(absence.startDate);
        const endDate = new Date(absence.endDate);
        return dayDate >= startDate && dayDate <= endDate;
      });

      if (isAbsent) {
        day.isAbsent = true;
        // Usuń dostępne sloty w dniu nieobecności
        day.availableHours = [];
        day.slots = day.slots.filter(slot => slot.isReserved); // Zachowaj tylko zarezerwowane sloty
      }
    });

    // Zapisz zaktualizowane dostępności
    localStorage.setItem('availabilities', JSON.stringify(
      this.days.filter(day => day.availableHours && day.availableHours.length > 0)
    ));
  }

  isAbsentDay(date: Date | string): boolean {
    const searchDate = new Date(date);
    return this.days.find(day => 
      new Date(day.date).toISOString().split('T')[0] === searchDate.toISOString().split('T')[0]
    )?.isAbsent || false;
  }

  onSlotClick(slot: TimeSlot, date: string) {
    console.log('Kliknięto slot:', slot);
    console.log('Data:', date);
    
    if (slot.isReserved) {
      alert('Ten termin jest już zarezerwowany.');
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
      data: { date, slot },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Dialog zamknięty, wynik:', result);
      if (result) {
        this.updateSlot(date, slot, result);
      }
    });
  }

  private updateSlot(date: string, slot: TimeSlot, reservationData: any) {
    console.log('Aktualizuję slot:', slot);
    
    // Aktualizuj w localStorage
    const reservedSlots = JSON.parse(localStorage.getItem('reserved-slots') || '[]');
    const dayIndex = reservedSlots.findIndex((day: any) => day.date === date);

    const updatedSlot = {
      ...slot,
      isEmpty: false,
      isReserved: true,
      isAvailable: false,  // Dodaj to pole
      type: reservationData.type,
      details: {
        patientName: reservationData.patientName,
        patientGender: reservationData.patientGender,
        patientAge: reservationData.patientAge,
        notes: reservationData.doctorNotes
      }
    };

    if (dayIndex === -1) {
      reservedSlots.push({
        date,
        slots: [updatedSlot]
      });
    } else {
      const slotIndex = reservedSlots[dayIndex].slots.findIndex(
        (s: TimeSlot) => s.start === slot.start && s.end === slot.end
      );
      if (slotIndex !== -1) {
        reservedSlots[dayIndex].slots[slotIndex] = updatedSlot;
      } else {
        reservedSlots[dayIndex].slots.push(updatedSlot);
      }
    }

    // Zapisz zaktualizowane sloty
    localStorage.setItem('reserved-slots', JSON.stringify(reservedSlots));

    // Aktualizuj lokalny stan
    const localDayIndex = this.days.findIndex(d => d.date === date);
    if (localDayIndex !== -1) {
      const localSlotIndex = this.days[localDayIndex].slots.findIndex(
        s => s.start === slot.start && s.end === slot.end
      );
      if (localSlotIndex !== -1) {
        this.days[localDayIndex].slots[localSlotIndex] = updatedSlot;
      } else {
        this.days[localDayIndex].slots.push(updatedSlot);
      }
    }

    // Odśwież dane
    this.loadAvailabilityData();
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
