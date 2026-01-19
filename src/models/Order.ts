import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
  ForeignKey,
  BelongsTo,
  HasMany,
  BelongsToMany,
} from 'sequelize-typescript';
import { OrderStatus } from '../types';
import TourInstance from './TourInstance';
import Ticket from './Ticket';
import Wine from './Wine';
import OrderWine from './OrderWine';

@Table({
  tableName: 'orders',
  underscored: true,
  timestamps: true,
})
class Order extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    unique: true,
  })
  order_number!: string;

  @ForeignKey(() => TourInstance)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  tour_instance_id!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  customer_name!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  customer_email!: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  customer_phone?: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  ticket_quantity!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  total_amount!: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    defaultValue: 'pending',
  })
  status!: OrderStatus;

  @CreatedAt
  created_at!: Date;

  @UpdatedAt
  updated_at!: Date;

  // Associations
  @BelongsTo(() => TourInstance)
  tour_instance!: TourInstance;

  @HasMany(() => Ticket)
  tickets!: Ticket[];

  @BelongsToMany(() => Wine, () => OrderWine)
  wines!: Wine[];
}

export default Order;
