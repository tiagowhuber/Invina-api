import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany, Default } from 'sequelize-typescript';
import TourInstance from './TourInstance';
import Payment from './Payment';

@Table({ tableName: 'orders', timestamps: true, underscored: true, updatedAt: false })
export default class Order extends Model {
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID, unique: true, field: 'order_number' })
  orderNumber!: string;

  @ForeignKey(() => TourInstance)
  @Column({ field: 'tour_instance_id' })
  tourInstanceId!: number;

  @BelongsTo(() => TourInstance)
  tourInstance!: TourInstance;

  @Column({ type: DataType.STRING, allowNull: false, field: 'customer_name' })
  customerName!: string;

  @Column({ type: DataType.STRING, allowNull: false, field: 'customer_email' })
  customerEmail!: string;

  @Column({ type: DataType.STRING, field: 'customer_phone' })
  customerPhone!: string;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'attendees_count' })
  attendeesCount!: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, field: 'total_amount' })
  totalAmount!: number;

  @Column({ 
    type: DataType.ENUM('Pending', 'Confirmed', 'Cancelled', 'Refunded'), 
    defaultValue: 'Pending' 
  })
  status!: 'Pending' | 'Confirmed' | 'Cancelled' | 'Refunded';

  @HasMany(() => Payment)
  payments!: Payment[];
}
