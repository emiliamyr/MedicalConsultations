import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc, DocumentReference } from '@angular/fire/firestore';
import { Availability } from '../models/availability.model';
import { TimeSlot } from '../models/timeslot.model';
import { Observable, from, map } from 'rxjs';
import { Absence } from '../models/absence.model';
import { ReservedSlot } from '../models/reserved-slot.model';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  constructor(private firestore: Firestore) {}

  async saveAvailability(availability: Availability) {
    const availabilityCollection = collection(this.firestore, 'availability');
    return addDoc(availabilityCollection, availability);
  }

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

  async saveReservedSlot(date: string, slot: TimeSlot, user: User) {
    const reservedSlotsCollection = collection(this.firestore, 'reserved-slots');
    const reservedSlot = {
      date,
      slot,
      patientId: user.id,
      patientFirstName: user.firstName,
      patientLastName: user.lastName,
      patientEmail: user.email,
      patientPhone: user.phoneNumber,
      createdAt: new Date()
    };
    return addDoc(reservedSlotsCollection, reservedSlot);
  }

  async getReservedSlots(): Promise<ReservedSlot[]> {
    const reservedSlotsCollection = collection(this.firestore, 'reserved-slots');
    const querySnapshot = await getDocs(reservedSlotsCollection);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReservedSlot));
  }

  async getReservedSlotsForDate(date: string): Promise<ReservedSlot[]> {
    const reservedSlotsCollection = collection(this.firestore, 'reserved-slots');
    const q = query(reservedSlotsCollection, where('date', '==', date));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReservedSlot));
  }

  async getReservedSlotsForUser(userId: string | undefined): Promise<ReservedSlot[]> {
    if (!userId) return [];
    
    const reservedSlotsCollection = collection(this.firestore, 'reserved-slots');
    const q = query(reservedSlotsCollection, where('patientId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReservedSlot));
  }

  async updateSlot(slotId: string, updatedData: any) {
    const slotRef = doc(this.firestore, 'reserved-slots', slotId);
    return updateDoc(slotRef, updatedData);
  }

  async deleteSlot(slotId: string) {
    const slotRef = doc(this.firestore, 'reserved-slots', slotId);
    return deleteDoc(slotRef);
  }

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

  async createUser(userData: Partial<User>): Promise<void> {
    try {
      console.log('Próba utworzenia użytkownika:', userData);
      const usersRef = collection(this.firestore, 'user');
      
      const existingUser = await this.getUserByEmail(userData.email || '');
      if (existingUser) {
        console.log('Użytkownik już istnieje:', existingUser);
        throw new Error('Użytkownik o tym adresie email już istnieje');
      }

      const userToSave = {
        ...userData,
        createdAt: new Date()
      };

      const docRef = await addDoc(usersRef, userToSave);
      console.log('Utworzono użytkownika z ID:', docRef.id, 'Dane:', userToSave);
      return;
      
    } catch (error) {
      console.error('Błąd podczas tworzenia użytkownika:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const usersRef = collection(this.firestore, 'user');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as User;
  }

  async updateUser(userId: string, data: Partial<User>): Promise<void> {
    const userRef = doc(this.firestore, 'user', userId);
    return updateDoc(userRef, data);
  }

  async deleteUser(userId: string): Promise<void> {
    const userRef = doc(this.firestore, 'user', userId);
    return deleteDoc(userRef);
  }

  async getAllUsers(): Promise<User[]> {
    const usersCollection = collection(this.firestore, 'user');
    const querySnapshot = await getDocs(usersCollection);
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as User));
  }


  async deleteAllUsers(): Promise<void> {
    try {
      const users = await this.getAllUsers();
      const deletePromises = users.map(user => {
        if (user.id) {
          return this.deleteUser(user.id);
        }
        return Promise.resolve();
      });
      
      await Promise.all(deletePromises);
      console.log('Wszyscy użytkownicy zostali usunięci');
    } catch (error) {
      console.error('Błąd podczas usuwania użytkowników:', error);
      throw error;
    }
  }
} 