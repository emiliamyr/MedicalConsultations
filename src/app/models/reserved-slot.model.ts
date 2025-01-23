import { TimeSlot } from './timeslot.model';

export interface ReservedSlot {
  id?: string;
  date: string;
  slot: TimeSlot;
  createdAt: Date;
  isPaid?: boolean;
  paymentDate?: string;
} 