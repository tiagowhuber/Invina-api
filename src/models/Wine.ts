import { Table, Column, Model, DataType, BelongsToMany } from 'sequelize-typescript';
import Tour from './Tour';
import TourWine from './TourWine';
import Menu from './Menu';
import MenuWine from './MenuWine';

@Table({ tableName: 'wines', timestamps: false, underscored: true })
export default class Wine extends Model {
  @Column({ type: DataType.STRING, allowNull: false })
  name!: string;

  @Column(DataType.STRING)
  varietal!: string;

  @Column(DataType.INTEGER)
  vintage!: number;

  @Column({ type: DataType.TEXT, field: 'image_url' })
  imageUrl!: string;

  @BelongsToMany(() => Tour, () => TourWine)
  tours!: Tour[];

  @BelongsToMany(() => Menu, () => MenuWine)
  menus!: Menu[];
}
