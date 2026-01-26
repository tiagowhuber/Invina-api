import { Table, Column, Model, DataType, BelongsToMany, HasMany } from 'sequelize-typescript';
import Wine from './Wine';
import TourWine from './TourWine';
import TourInstance from './TourInstance';

@Table({ tableName: 'tours', timestamps: false, underscored: true })
export default class Tour extends Model {
  @Column({ type: DataType.TEXT, allowNull: false })
  description!: string;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'duration_minutes' })
  durationMinutes!: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 1, field: 'min_attendants' })
  minAttendants!: number;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'max_attendants' })
  maxAttendants!: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, field: 'base_price' })
  basePrice!: number;

  @Column({ type: DataType.ENUM('Standard', 'Special'), allowNull: false, field: 'tour_type' })
  tourType!: 'Standard' | 'Special';

  @Column({ type: DataType.TIME, allowNull: false, field: 'earliest_hour' })
  earliestHour!: string;

  @Column({ type: DataType.TIME, allowNull: false, field: 'latest_hour' })
  latestHour!: string;

  @Column({ type: DataType.INTEGER, defaultValue: 60, field: 'buffer_minutes' })
  bufferMinutes!: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: true, field: 'is_active' })
  isActive!: boolean;

  @BelongsToMany(() => Wine, () => TourWine)
  wines!: Wine[];

  @HasMany(() => TourInstance)
  instances!: TourInstance[];
}
