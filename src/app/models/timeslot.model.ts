export interface TimeSlot {
  start: string;
  end: string;
  isEmpty: boolean;
  isReserved: boolean;
  isAvailable: boolean;
  isCancelled?: boolean;
  type: string | null;
  cancellationReason?: string;
  details?: {
    patientName?: string;
    patientGender?: string;
    patientAge?: number;
    notes?: string;
  };
}