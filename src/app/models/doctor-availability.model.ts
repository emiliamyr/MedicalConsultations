export interface DoctorAvailability {
    type: 'cyclic' | 'one-time'; 
    startDate: string;
    endDate: string;            
    daysOfWeek: number[];       
    date: string;             
    timeRanges: { start: string; end: string }[]; 
  }
  