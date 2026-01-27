import { Table, Column, Model, DataType, ForeignKey, BelongsTo, BelongsToMany } from 'sequelize-typescript';
import Tour from './Tour';
import Wine from './Wine';
import MenuWine from './MenuWine';

@Table({ tableName: 'menus', timestamps: false, underscored: true })
export default class Menu extends Model {
  @ForeignKey(() => Tour)
  @Column({ field: 'tour_id' })
  tourId!: number;

  @BelongsTo(() => Tour)
  tour!: Tour;

  @Column({ type: DataType.STRING, allowNull: false })
  name!: string;

  @Column({ type: DataType.TEXT })
  description!: string;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  price!: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: true, field: 'is_active' })
  isActive!: boolean;

  @BelongsToMany(() => Wine, () => MenuWine)
  wines!: Wine[];
}
