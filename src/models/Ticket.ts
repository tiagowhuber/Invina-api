import { Table, Column, Model, DataType, BelongsTo, ForeignKey, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';
import { OrderEntity } from './Order';
import { EventEntity } from './Event';
import { sequelize } from '../config/database';
import { TicketStatus, TicketWithDetails, TicketWithEvent, TicketStatistics } from '../types';

@Table({
  tableName: 'tickets',
  timestamps: true,
  underscored: true,
})
export class TicketEntity extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @ForeignKey(() => OrderEntity)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'order_id',
  })
  orderId!: number;

  @ForeignKey(() => EventEntity)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'event_id',
  })
  eventId!: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    unique: true,
    field: 'ticket_number',
  })
  ticketNumber!: string;

  @Column({
    type: DataType.STRING(255),
    field: 'attendee_name',
  })
  attendeeName?: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  status!: TicketStatus;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    field: 'created_at',
  })
  createdAt!: Date;

  @UpdatedAt
  @Column({
    type: DataType.DATE,
    field: 'updated_at',
  })
  updatedAt!: Date;

  @BelongsTo(() => OrderEntity)
  order?: OrderEntity;

  @BelongsTo(() => EventEntity)
  event?: EventEntity;
}

const TicketModel = {
  // Get all tickets
  async findAll(): Promise<TicketEntity[]> {
    return await TicketEntity.findAll({
      order: [['createdAt', 'DESC']],
    });
  },

  // Get ticket by ID
  async findById(id: number): Promise<TicketEntity | null> {
    return await TicketEntity.findByPk(id);
  },

  // Get ticket by ticket number
  async findByTicketNumber(ticketNumber: string): Promise<TicketWithDetails | null> {
    const result = await sequelize.query(
      `SELECT 
        t.*,
        o.order_number,
        o.customer_name,
        o.customer_email,
        o.status as order_status,
        e.name as event_name,
        e.event_date,
        e.location,
        e.address
      FROM tickets t
      JOIN orders o ON t.order_id = o.id
      JOIN events e ON t.event_id = e.id
      WHERE t.ticket_number = :ticketNumber`,
      {
        replacements: { ticketNumber },
        type: 'SELECT',
      }
    );
    return (result[0] as any) || null;
  },

  // Get tickets by order ID
  async findByOrderId(orderId: number): Promise<TicketWithEvent[]> {
    const result = await sequelize.query(
      `SELECT 
        t.*,
        e.name as event_name,
        e.event_date,
        e.location
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      WHERE t.order_id = :orderId`,
      {
        replacements: { orderId },
        type: 'SELECT',
      }
    );
    return result as any;
  },

  // Get tickets by event ID
  async findByEventId(eventId: number): Promise<TicketEntity[]> {
    const result = await sequelize.query(
      `SELECT 
        t.*,
        o.customer_name,
        o.customer_email
      FROM tickets t
      JOIN orders o ON t.order_id = o.id
      WHERE t.event_id = :eventId
      ORDER BY t.created_at DESC`,
      {
        replacements: { eventId },
        type: 'SELECT',
      }
    );
    return result as any;
  },

  // Update ticket status
  async updateStatus(id: number, status: TicketStatus): Promise<TicketEntity | null> {
    const ticket = await TicketEntity.findByPk(id);
    if (!ticket) return null;

    await ticket.update({ status });
    return ticket;
  },

  // Mark ticket as used
  async markAsUsed(ticketNumber: string): Promise<TicketEntity | null> {
    const ticket = await TicketEntity.findOne({
      where: { ticketNumber },
    });
    if (!ticket) return null;

    await ticket.update({ status: 'used' });
    return ticket;
  },

  // Update attendee name
  async updateAttendeeName(id: number, attendeeName: string): Promise<TicketEntity | null> {
    const ticket = await TicketEntity.findByPk(id);
    if (!ticket) return null;

    await ticket.update({ attendeeName });
    return ticket;
  },

  // Get ticket statistics by event
  async getEventStatistics(eventId: number): Promise<TicketStatistics> {
    const result = await sequelize.query(
      `SELECT 
        COUNT(*) as total_tickets,
        COUNT(*) FILTER (WHERE status = 'reserved') as reserved,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
        COUNT(*) FILTER (WHERE status = 'used') as used,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled
      FROM tickets
      WHERE event_id = :eventId`,
      {
        replacements: { eventId },
        type: 'SELECT',
      }
    );
    return (result[0] as any);
  },
};

export default TicketModel;
