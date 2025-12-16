export enum InteractionMode {
  VOICE = 'VOICE',
  CHAT = 'CHAT'
}

export interface ReservationSummary {
  guestName: string;
  email: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  roomType: string;
  specialRequests?: string;
  confirmationCode: string;
}

export interface ServiceRequest {
  guestName: string;
  requestType: string;
  details: string;
  roomNumber?: string;
  notes?: string;
  timestamp: string;
}

export interface ManagerMessage {
  guestName: string;
  contactDetails?: string;
  issue: string;
  urgency: 'low' | 'medium' | 'high';
  timestamp: string;
}

export interface DraftBooking {
  bookingId?: string;
  guestName?: string;
  email?: string;
  checkIn?: string;
  checkOut?: string;
  roomType?: string;
  guests?: number;
  specialRequests?: string;
  subtotal?: number;
  tax?: number;
  total?: number;
  status: 'active' | 'confirmed';
}

export type TicketType = 
  | { type: 'RESERVATION', data: ReservationSummary }
  | { type: 'SERVICE', data: ServiceRequest }
  | { type: 'MANAGER', data: ManagerMessage };

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export type ManagerCallStatus = 'idle' | 'calling' | 'busy' | 'sending_msg' | 'completed';