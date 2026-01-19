import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  BelongsToMany,
} from 'sequelize-typescript';
import Tour from './Tour';
import TourWine from './TourWine';

@Table({
  tableName: 'wines',
  underscored: true,
  timestamps: true,
  updatedAt: false,
})
class Wine extends Model {
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
    type: DataType.STRING(100),
    allowNull: true,
  })
  variety?: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  vintage?: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description?: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  is_active!: boolean;

  @CreatedAt
  created_at!: Date;

  // Associations
  @BelongsToMany(() => Tour, () => TourWine)
  tours!: Tour[];
}

export default Wine;
