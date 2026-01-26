import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'feriados_irrenunciables', timestamps: false, underscored: true })
export default class Holiday extends Model {
  @Column({ type: DataType.DATEONLY, allowNull: false, unique: true, field: 'holiday_date' })
  holidayDate!: string;

  @Column(DataType.STRING)
  description!: string;
}
