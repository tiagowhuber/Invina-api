import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
  HasMany,
  BelongsToMany,
} from 'sequelize-typescript';
import { TourType } from '../types';
import TourInstance from './TourInstance';
import Wine from './Wine';
import TourWine from './TourWine';

@Table({
  tableName: 'tours',
  underscored: true,
  timestamps: true,
})
class Tour extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description?: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  location!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  address?: string;

  @Column({
    type: DataType.ENUM('option_1', 'option_2', 'option_3'),
    allowNull: false,
  })
  tour_type!: TourType;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  base_price!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 2,
  })
  min_tickets!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  max_capacity!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  duration_minutes!: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  is_active!: boolean;

  @CreatedAt
  created_at!: Date;

  @UpdatedAt
  updated_at!: Date;

  // Associations
  @HasMany(() => TourInstance)
  tour_instances!: TourInstance[];

  @BelongsToMany(() => Wine, () => TourWine)
  wines!: Wine[];
}

export default Tour;
