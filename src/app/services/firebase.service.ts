import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc } from '@angular/fire/firestore';
import { Availability } from '../models/availability.model';
import { TimeSlot } from '../models/timeslot.model';
import { Observable, from, map } from 'rxjs';
import { Absence } from '../models/absence.model';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  constructor(private firestore: Firestore) {}

  // Zapisz dostępność
  async saveAvailability(availability: Availability) {
    const availabilityCollection = collection(this.firestore, 'availability');
    return addDoc(availabilityCollection, availability);
  }

  // Pobierz dostępności
  async getAvailabilities(): Promise<Availability[]> {
    const availabilityCollection = collection(this.firestore, 'availability');
    const querySnapshot = await getDocs(availabilityCollection);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        date: data['date'],
        slots: data['slots'] || [],
        availableHours: data['availableHours'] || []
      } as Availability;
    });
  }

  // Zapisz zarezerwowany slot
  async saveReservedSlot(date: string, slot: TimeSlot) {
    const reservedSlotsCollection = collection(this.firestore, 'reserved-slots');
    const reservedSlot = {
      date,
      slot,
      createdAt: new Date()
    };
    return addDoc(reservedSlotsCollection, reservedSlot);
  }

  // Pobierz zarezerwowane sloty
  async getReservedSlots(): Promise<any[]> {
    const reservedSlotsCollection = collection(this.firestore, 'reserved-slots');
    const querySnapshot = await getDocs(reservedSlotsCollection);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // Pobierz zarezerwowane sloty dla konkretnej daty
  async getReservedSlotsForDate(date: string): Promise<any[]> {
    const reservedSlotsCollection = collection(this.firestore, 'reserved-slots');
    const q = query(reservedSlotsCollection, where('date', '==', date));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // Aktualizuj slot
  async updateSlot(slotId: string, updatedData: any) {
    const slotRef = doc(this.firestore, 'reserved-slots', slotId);
    return updateDoc(slotRef, updatedData);
  }

  // Usuń slot
  async deleteSlot(slotId: string) {
    const slotRef = doc(this.firestore, 'reserved-slots', slotId);
    return deleteDoc(slotRef);
  }

  // Dodaj te metody do FirebaseService
  async saveAvailabilities(availabilities: Availability[]) {
    const batch: Promise<any>[] = [];
    for (const availability of availabilities) {
      const { id, ...availabilityWithoutId } = availability;
      batch.push(
        addDoc(collection(this.firestore, 'availability'), availabilityWithoutId)
      );
    }
    return Promise.all(batch);
  }

  async deleteAllAvailabilities() {
    const availabilityCollection = collection(this.firestore, 'availability');
    const querySnapshot = await getDocs(availabilityCollection);
    const batch: Promise<void>[] = [];
    querySnapshot.docs.forEach((doc) => {
      batch.push(deleteDoc(doc.ref));
    });
    return Promise.all(batch);
  }

  async updateAvailability(id: string, data: Partial<Availability>) {
    const docRef = doc(this.firestore, 'availability', id);
    return updateDoc(docRef, data);
  }

  // Dodaj te metody do FirebaseService
  async saveAbsence(absence: Absence) {
    const absenceCollection = collection(this.firestore, 'absence');
    return addDoc(absenceCollection, absence);
  }

  async getAbsences(): Promise<Absence[]> {
    const absenceCollection = collection(this.firestore, 'absence');
    const querySnapshot = await getDocs(absenceCollection);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        startDate: data['startDate'],
        endDate: data['endDate'],
        reason: data['reason']
      } as Absence;
    });
  }

  async deleteAbsence(id: string) {
    const absenceRef = doc(this.firestore, 'absence', id);
    return deleteDoc(absenceRef);
  }
} 