import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import Tour from './Tour';

@Table({ tableName: 'tour_images', timestamps: false, underscored: true })
export default class TourImage extends Model {
  @ForeignKey(() => Tour)
  @Column({ field: 'tour_id' })
  tourId!: number;

  @Column({ type: DataType.TEXT, allowNull: false, field: 'image_url' })
  imageUrl!: string;

  @Column({ type: DataType.INTEGER, defaultValue: 0, field: 'display_order' })
  displayOrder!: number;

  @BelongsTo(() => Tour)
  tour!: Tour;
}
