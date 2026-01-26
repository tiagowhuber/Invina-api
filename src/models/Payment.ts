import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import Order from './Order';

@Table({ tableName: 'payments', timestamps: true, underscored: true, updatedAt: false })
export default class Payment extends Model {
  @ForeignKey(() => Order)
  @Column({ field: 'order_id' })
  orderId!: number;

  @BelongsTo(() => Order)
  order!: Order;

  @Column({ type: DataType.STRING, allowNull: false })
  provider!: string;

  @Column({ type: DataType.STRING, field: 'transaction_id' })
  transactionId!: string;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  amount!: number;

  @Column({ 
    type: DataType.ENUM('Pending', 'Completed', 'Failed', 'Refunded'), 
    allowNull: false 
  })
  status!: 'Pending' | 'Completed' | 'Failed' | 'Refunded';

  @Column(DataType.JSONB)
  responsePayload!: any;
}
