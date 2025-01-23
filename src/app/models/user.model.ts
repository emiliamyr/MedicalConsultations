export interface User {
  id?: string;
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'doctor' | 'patient';
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  createdAt: Date;
} 