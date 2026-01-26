// Mock data for MatatuConnect

export interface Route {
  id: string;
  name: string;
  from: string;
  to: string;
  fare: number;
  vehicles: string[];
}

export interface FeedbackEntry {
  id: string;
  vehicleNumber: string;
  route: string;
  type: 'complaint' | 'compliment';
  message: string;
  timestamp: Date;
  status: 'pending' | 'reviewed' | 'resolved';
}

export interface PaymentEntry {
  id: string;
  transactionId: string;
  vehicleNumber: string;
  route: string;
  amount: number;
  timestamp: Date;
  status: 'completed' | 'pending' | 'failed';
}

export const routes: Route[] = [
  {
    id: '1',
    name: 'Route 23',
    from: 'CBD Nairobi',
    to: 'Westlands',
    fare: 50,
    vehicles: ['KCA 123X', 'KCB 456Y', 'KCC 789Z'],
  },
  {
    id: '2',
    name: 'Route 46',
    from: 'CBD Nairobi',
    to: 'Eastleigh',
    fare: 40,
    vehicles: ['KCD 111A', 'KCE 222B', 'KCF 333C'],
  },
  {
    id: '3',
    name: 'Route 58',
    from: 'CBD Nairobi',
    to: 'South B',
    fare: 60,
    vehicles: ['KCG 444D', 'KCH 555E', 'KCI 666F'],
  },
  {
    id: '4',
    name: 'Route 111',
    from: 'CBD Nairobi',
    to: 'Ngong Road',
    fare: 70,
    vehicles: ['KCJ 777G', 'KCK 888H', 'KCL 999I'],
  },
  {
    id: '5',
    name: 'Route 145',
    from: 'CBD Nairobi',
    to: 'Kasarani',
    fare: 80,
    vehicles: ['KCM 101J', 'KCN 202K', 'KCO 303L'],
  },
];

export const mockFeedback: FeedbackEntry[] = [
  {
    id: '1',
    vehicleNumber: 'KCA 123X',
    route: 'Route 23',
    type: 'compliment',
    message: 'Driver was very professional and helpful with luggage.',
    timestamp: new Date('2024-01-15T09:30:00'),
    status: 'reviewed',
  },
  {
    id: '2',
    vehicleNumber: 'KCB 456Y',
    route: 'Route 23',
    type: 'complaint',
    message: 'Matatu was overcrowded and driver was speeding.',
    timestamp: new Date('2024-01-15T11:45:00'),
    status: 'pending',
  },
  {
    id: '3',
    vehicleNumber: 'KCD 111A',
    route: 'Route 46',
    type: 'compliment',
    message: 'Clean vehicle and fair pricing.',
    timestamp: new Date('2024-01-14T14:20:00'),
    status: 'resolved',
  },
  {
    id: '4',
    vehicleNumber: 'KCG 444D',
    route: 'Route 58',
    type: 'complaint',
    message: 'Loud music was disturbing passengers.',
    timestamp: new Date('2024-01-14T16:00:00'),
    status: 'pending',
  },
  {
    id: '5',
    vehicleNumber: 'KCJ 777G',
    route: 'Route 111',
    type: 'compliment',
    message: 'Best matatu experience! Very punctual.',
    timestamp: new Date('2024-01-13T08:15:00'),
    status: 'reviewed',
  },
];

export const mockPayments: PaymentEntry[] = [
  {
    id: '1',
    transactionId: 'TXN001234567',
    vehicleNumber: 'KCA 123X',
    route: 'Route 23',
    amount: 50,
    timestamp: new Date('2024-01-15T09:25:00'),
    status: 'completed',
  },
  {
    id: '2',
    transactionId: 'TXN001234568',
    vehicleNumber: 'KCB 456Y',
    route: 'Route 23',
    amount: 50,
    timestamp: new Date('2024-01-15T11:40:00'),
    status: 'completed',
  },
  {
    id: '3',
    transactionId: 'TXN001234569',
    vehicleNumber: 'KCD 111A',
    route: 'Route 46',
    amount: 40,
    timestamp: new Date('2024-01-14T14:15:00'),
    status: 'completed',
  },
  {
    id: '4',
    transactionId: 'TXN001234570',
    vehicleNumber: 'KCG 444D',
    route: 'Route 58',
    amount: 60,
    timestamp: new Date('2024-01-14T15:55:00'),
    status: 'pending',
  },
  {
    id: '5',
    transactionId: 'TXN001234571',
    vehicleNumber: 'KCJ 777G',
    route: 'Route 111',
    amount: 70,
    timestamp: new Date('2024-01-13T08:10:00'),
    status: 'completed',
  },
];

// Vehicle number validation regex
export const vehicleNumberRegex = /^[A-Z]{3}\s\d{3}[A-Z]?$/i;

export const validateVehicleNumber = (value: string): boolean => {
  return vehicleNumberRegex.test(value.trim());
};

// Generate transaction ID
export const generateTransactionId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'TXN';
  for (let i = 0; i < 9; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};
