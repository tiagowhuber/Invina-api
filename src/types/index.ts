// Enums
export type TourType = 'option_1' | 'option_2' | 'option_3';
export type OrderStatus = 'pending' | 'paid' | 'cancelled' | 'expired';
export type TicketStatus = 'reserved' | 'confirmed' | 'used' | 'cancelled';
export type WebPayStatus = 'pending' | 'approved' | 'rejected' | 'failed';
export type TourInstanceStatus = 'active' | 'completed' | 'cancelled';

// Database types
export interface Tour {
  id: number;
  name: string;
  description?: string;
  location: string;
  address?: string;
  tour_type: TourType;
  base_price: number;
  min_tickets: number;
  max_capacity: number;
  duration_minutes: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Wine {
  id: number;
  name: string;
  variety?: string;
  vintage?: number;
  description?: string;
  is_active: boolean;
  created_at: Date;
}

export interface TourWine {
  id: number;
  tour_id: number;
  wine_id: number;
  display_order: number;
}

export interface TourInstance {
  id: number;
  tour_id: number;
  instance_date: Date;
  instance_time: string;
  capacity: number;
  tickets_sold: number;
  status: TourInstanceStatus;
  created_at: Date;
  updated_at: Date;
}

export interface Order {
  id: number;
  order_number: string;
  tour_instance_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  ticket_quantity: number;
  total_amount: number;
  status: OrderStatus;
  created_at: Date;
  updated_at: Date;
}

export interface Ticket {
  id: number;
  order_id: number;
  ticket_number: string;
  attendee_name?: string;
  status: TicketStatus;
  created_at: Date;
  updated_at: Date;
}

export interface OrderWine {
  id: number;
  order_id: number;
  wine_id: number;
  created_at: Date;
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

// Extended types with relationships
export interface TourWithWines extends Tour {
  wines: Wine[];
}

export interface TourInstanceWithTour extends TourInstance {
  tour: Tour;
}

export interface TourInstanceAvailability {
  instance_time: string;
  capacity: number;
  tickets_sold: number;
  tickets_available: number;
  instance_id?: number;
}

export interface OrderWithDetails extends Order {
  tour_instance: TourInstanceWithTour;
  tickets: Ticket[];
  wines?: Wine[];
}

export interface TicketWithDetails extends Ticket {
  order: Order;
  tour_instance: TourInstanceWithTour;
}

// Statistics
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

// Request/Response types
export interface CreateBookingRequest {
  tour_id: number;
  instance_date: string; // YYYY-MM-DD
  instance_time: string; // HH:MM
  ticket_quantity: number;
  wine_ids?: number[]; // Required for option_1, forbidden for option_2/option_3
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
}

export interface CreateTourRequest {
  name: string;
  description?: string;
  location: string;
  address?: string;
  tour_type: TourType;
  base_price: number;
  min_tickets: number;
  max_capacity: number;
  duration_minutes: number;
}

export interface UpdateTourRequest {
  name?: string;
  description?: string;
  location?: string;
  address?: string;
  tour_type?: TourType;
  base_price?: number;
  min_tickets?: number;
  max_capacity?: number;
  duration_minutes?: number;
  is_active?: boolean;
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
