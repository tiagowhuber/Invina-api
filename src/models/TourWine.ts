import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
} from 'sequelize-typescript';
import Tour from './Tour';
import Wine from './Wine';

@Table({
  tableName: 'tour_wines',
  underscored: true,
  timestamps: false,
})
class TourWine extends Model {
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

  @ForeignKey(() => Wine)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  wine_id!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  display_order!: number;
}

export default TourWine;
