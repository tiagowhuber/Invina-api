import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { TicketStatus } from '../types';
import Order from './Order';

@Table({
  tableName: 'tickets',
  underscored: true,
  timestamps: true,
})
class Ticket extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @ForeignKey(() => Order)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  order_id!: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    unique: true,
  })
  ticket_number!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  attendee_name?: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    defaultValue: 'reserved',
  })
  status!: TicketStatus;

  @CreatedAt
  created_at!: Date;

  @UpdatedAt
  updated_at!: Date;

  // Associations
  @BelongsTo(() => Order)
  order!: Order;
}

export default Ticket;
