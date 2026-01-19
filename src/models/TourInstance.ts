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
} from 'sequelize-typescript';
import { TourInstanceStatus } from '../types';
import Tour from './Tour';
import Order from './Order';

@Table({
  tableName: 'tour_instances',
  underscored: true,
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['tour_id', 'instance_date'],
      where: { status: 'active' },
      name: 'unique_option3_daily_instance',
    },
  ],
})
class TourInstance extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @ForeignKey(() => Tour)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  tour_id!: number;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  instance_date!: Date;

  @Column({
    type: DataType.TIME,
    allowNull: false,
  })
  instance_time!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  capacity!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  tickets_sold!: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    defaultValue: 'active',
  })
  status!: TourInstanceStatus;

  @CreatedAt
  created_at!: Date;

  @UpdatedAt
  updated_at!: Date;

  // Associations
  @BelongsTo(() => Tour)
  tour!: Tour;

  @HasMany(() => Order)
  orders!: Order[];
}

export default TourInstance;
