export interface TimeSlot {
  start: string;
  end: string;
  isEmpty: boolean;
  isReserved: boolean;
  isAvailable: boolean;
  type: string | null;
  isCancelled?: boolean;
  cancellationReason?: string;
  details?: {
    patientName?: string;
    patientGender?: string;
    patientAge?: number;
    notes?: string;
  };
}