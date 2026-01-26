import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import Tour from './Tour';
import Order from './Order';

@Table({ tableName: 'tour_instances', timestamps: false, underscored: true })
export default class TourInstance extends Model {
  @ForeignKey(() => Tour)
  @Column({ field: 'tour_id', allowNull: false })
  tourId!: number;

  @BelongsTo(() => Tour)
  tour!: Tour;

  @Column({ type: DataType.DATEONLY, allowNull: false, field: 'instance_date' })
  instanceDate!: string;

  @Column({ type: DataType.TIME, allowNull: false, field: 'start_time' })
  startTime!: string;

  @Column({ type: DataType.INTEGER, defaultValue: 0, field: 'current_attendants' })
  currentAttendants!: number;

  @HasMany(() => Order)
  orders!: Order[];
}
