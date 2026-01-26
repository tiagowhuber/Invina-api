import { Table, Column, Model, ForeignKey } from 'sequelize-typescript';
import Tour from './Tour';
import Wine from './Wine';

@Table({ tableName: 'tour_wines', timestamps: false, underscored: true })
export default class TourWine extends Model {
  @ForeignKey(() => Tour)
  @Column({ field: 'tour_id' })
  tourId!: number;

  @ForeignKey(() => Wine)
  @Column({ field: 'wine_id' })
  wineId!: number;
}
