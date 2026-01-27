import { Table, Column, Model, ForeignKey } from 'sequelize-typescript';
import Menu from './Menu';
import Wine from './Wine';

@Table({ tableName: 'menu_wines', timestamps: false, underscored: true })
export default class MenuWine extends Model {
  @ForeignKey(() => Menu)
  @Column({ field: 'menu_id' })
  menuId!: number;

  @ForeignKey(() => Wine)
  @Column({ field: 'wine_id' })
  wineId!: number;
}
