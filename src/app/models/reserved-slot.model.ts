import { TimeSlot } from './timeslot.model';

export interface ReservedSlot {
  id?: string;
  date: string;
  slot: TimeSlot;
  patientId: string;
  patientFirstName: string;
  patientLastName: string;
  patientEmail: string;
  patientPhone: string;
  createdAt: Date;
  isPaid?: boolean;
  paymentDate?: string;
} 