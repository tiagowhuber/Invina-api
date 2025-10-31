import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt, Default } from 'sequelize-typescript';
import { sequelize } from '../config/database';
import { EventWithAvailability } from '../types';

@Table({
  tableName: 'events',
  timestamps: true,
  underscored: true,
})
export class EventEntity extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  name!: string;

  @Column(DataType.TEXT)
  description?: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'event_date',
  })
  eventDate!: Date;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  location!: string;

  @Column(DataType.TEXT)
  address?: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  capacity!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  price!: number;

  @Default(true)
  @Column({
    type: DataType.BOOLEAN,
    field: 'is_active',
  })
  isActive!: boolean;

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
}

const EventModel = {
  // Get all active events
  async findAll(): Promise<EventEntity[]> {
    return await EventEntity.findAll({
      where: { isActive: true },
      order: [['eventDate', 'ASC']],
    });
  },

  // Get event by ID
  async findById(id: number): Promise<EventEntity | null> {
    return await EventEntity.findByPk(id);
  },

  // Get event with availability
  async findByIdWithAvailability(id: number): Promise<EventWithAvailability | null> {
    const result = await sequelize.query(
      `SELECT 
        e.*,
        COUNT(t.id) FILTER (WHERE t.status IN ('reserved', 'confirmed')) as tickets_sold,
        e.capacity - COUNT(t.id) FILTER (WHERE t.status IN ('reserved', 'confirmed')) as tickets_available
      FROM events e
      LEFT JOIN tickets t ON e.id = t.event_id
      WHERE e.id = :eventId AND e.is_active = true
      GROUP BY e.id`,
      {
        replacements: { eventId: id },
        type: 'SELECT',
      }
    );
    return (result[0] as any) || null;
  },

  // Get events with availability
  async findAllWithAvailability(): Promise<EventWithAvailability[]> {
    const result = await sequelize.query(
      `SELECT 
        e.*,
        COALESCE(COUNT(t.id) FILTER (WHERE t.status IN ('reserved', 'confirmed')), 0)::int as tickets_sold,
        (e.capacity - COALESCE(COUNT(t.id) FILTER (WHERE t.status IN ('reserved', 'confirmed')), 0))::int as tickets_available
      FROM events e
      LEFT JOIN tickets t ON e.id = t.event_id
      WHERE e.is_active = true
      GROUP BY e.id
      ORDER BY e.event_date ASC`,
      { type: 'SELECT' }
    );
    return result as any;
  },

  // Create new event
  async create(eventData: Partial<EventEntity>): Promise<EventEntity> {
    return await EventEntity.create({
      name: eventData.name,
      description: eventData.description,
      eventDate: eventData.eventDate,
      location: eventData.location,
      address: eventData.address,
      capacity: eventData.capacity,
      price: eventData.price,
    } as any);
  },

  // Update event
  async update(id: number, eventData: Partial<EventEntity>): Promise<EventEntity | null> {
    const event = await EventEntity.findByPk(id);
    if (!event) return null;

    await event.update({
      ...(eventData.name && { name: eventData.name }),
      ...(eventData.description !== undefined && { description: eventData.description }),
      ...(eventData.eventDate && { eventDate: eventData.eventDate }),
      ...(eventData.location && { location: eventData.location }),
      ...(eventData.address !== undefined && { address: eventData.address }),
      ...(eventData.capacity && { capacity: eventData.capacity }),
      ...(eventData.price && { price: eventData.price }),
      ...(eventData.isActive !== undefined && { isActive: eventData.isActive }),
    });

    return event;
  },

  // Soft delete (deactivate) event
  async deactivate(id: number): Promise<EventEntity | null> {
    const event = await EventEntity.findByPk(id);
    if (!event) return null;

    await event.update({ isActive: false });
    return event;
  },

  // Check if event has enough capacity
  async checkCapacity(eventId: number, requestedTickets: number): Promise<boolean> {
    const result = await sequelize.query(
      `SELECT 
        e.capacity - COUNT(t.id) FILTER (WHERE t.status IN ('reserved', 'confirmed')) as available
      FROM events e
      LEFT JOIN tickets t ON e.id = t.event_id
      WHERE e.id = :eventId AND e.is_active = true
      GROUP BY e.id, e.capacity`,
      {
        replacements: { eventId },
        type: 'SELECT',
      }
    );

    if (!result[0]) return false;
    return (result[0] as any).available >= requestedTickets;
  },
};

export default EventModel;
