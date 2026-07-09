export interface Event {
  id: string;
  name: string;
  description: string;
  code: string;
  category: string;
  price: number;
  capacity: number;
  availableSeats: number;
  date: string;
  time: string;
  location: string;
  status: string;
  organizerId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Customer' | 'Organizer';
  referralCode: string;
  pointsBalance: number;
  createdAt?: string;
}

export interface Transaction {
  id: string;
  eventId: string;
  eventName: string;
  buyerId: string;
  buyerName: string;
  originalPrice: number;
  discountApplied: number;
  finalPrice: number;
  pointsUsed: number;
  couponUsed: boolean;
  purchaseDate: string;
  createdAt?: string;
}

export interface Review {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  rating: number;
  feedback: string;
  createdAt?: string;
}

export interface PointRecord {
  id: string;
  userId: string;
  amount: number;
  source: string;
  expiryDate: string;
  isUsed: boolean;
  createdAt?: string;
}

export interface Coupon {
  id: string;
  userId: string;
  code: string;
  discount: number;
  expiryDate: string;
  isUsed: boolean;
  createdAt?: string;
}

export type EventInput = Omit<Event, 'id' | 'createdAt' | 'updatedAt'>;

export const CATEGORIES = [
  'Music',
  'Technology',
  'Arts & Crafts',
  'Food & Culinary',
  'Workshop',
  'Sports',
  'Other'
];

export const STATUSES = [
  'Active',
  'Draft',
  'Sold Out',
  'Archived'
];

