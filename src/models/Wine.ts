import { Table, Column, Model, DataType, BelongsToMany } from 'sequelize-typescript';
import Tour from './Tour';
import TourWine from './TourWine';

@Table({ tableName: 'wines', timestamps: false, underscored: true })
export default class Wine extends Model {
  @Column({ type: DataType.STRING, allowNull: false })
  name!: string;

  @Column(DataType.STRING)
  varietal!: string;

  @Column(DataType.INTEGER)
  vintage!: number;

  @BelongsToMany(() => Tour, () => TourWine)
  tours!: Tour[];
}
