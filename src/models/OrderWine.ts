import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  CreatedAt,
} from 'sequelize-typescript';
import Order from './Order';
import Wine from './Wine';

@Table({
  tableName: 'order_wines',
  underscored: true,
  timestamps: true,
  updatedAt: false,
})
class OrderWine extends Model {
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

  @ForeignKey(() => Wine)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  wine_id!: number;

  @CreatedAt
  created_at!: Date;
}

export default OrderWine;
