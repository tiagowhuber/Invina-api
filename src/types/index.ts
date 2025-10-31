// Database types
export interface Event {
  id: number;
  name: string;
  description?: string;
  event_date: Date;
  location: string;
  address?: string;
  capacity: number;
  price: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface EventWithAvailability extends Event {
  tickets_sold: number;
  tickets_available: number;
}

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  total_amount: number;
  status: OrderStatus;
  created_at: Date;
  updated_at: Date;
}

export interface OrderWithDetails extends Order {
  tickets: TicketWithEvent[];
}

export interface Ticket {
  id: number;
  order_id: number;
  event_id: number;
  ticket_number: string;
  attendee_name?: string;
  status: TicketStatus;
  created_at: Date;
  updated_at: Date;
}

export interface TicketWithEvent extends Ticket {
  event_name: string;
  event_date: Date;
  location: string;
}

export interface TicketWithDetails extends Ticket {
  order_number: string;
  customer_name: string;
  customer_email: string;
  order_status: OrderStatus;
  event_name: string;
  event_date: Date;
  location: string;
  address?: string;
}

export interface WebPayTransaction {
  id: number;
  order_id: number;
  token: string;
  buy_order?: string;
  amount: number;
  status: WebPayStatus;
  response_code?: string;
  authorization_code?: string;
  transaction_date?: Date;
  raw_response?: any;
  created_at: Date;
  updated_at: Date;
}

export interface TicketStatistics {
  total_tickets: number;
  reserved: number;
  confirmed: number;
  used: number;
  cancelled: number;
}

export interface TransactionStatistics {
  total_transactions: number;
  approved: number;
  rejected: number;
  pending: number;
  failed: number;
  total_approved_amount: number;
}

// Status types
export type OrderStatus = 'pending' | 'paid' | 'cancelled' | 'expired';
export type TicketStatus = 'reserved' | 'confirmed' | 'used' | 'cancelled';
export type WebPayStatus = 'pending' | 'approved' | 'rejected' | 'failed';

// Request/Response types
export interface CreateEventRequest {
  name: string;
  description?: string;
  event_date: string | Date;
  location: string;
  address?: string;
  capacity: number;
  price: number;
}

export interface UpdateEventRequest {
  name?: string;
  description?: string;
  event_date?: string | Date;
  location?: string;
  address?: string;
  capacity?: number;
  price?: number;
  is_active?: boolean;
}

export interface CreateOrderRequest {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  tickets: TicketRequest[];
}

export interface TicketRequest {
  event_id: number;
  attendee_name?: string;
}

export interface InitiatePaymentRequest {
  order_id: number;
}

export interface ConfirmPaymentRequest {
  token: string;
}

export interface UpdateAttendeeRequest {
  attendee_name: string;
}

// API Response type
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
  error?: string;
}
