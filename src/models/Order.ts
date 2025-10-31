import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';
import { TicketEntity } from './Ticket';
import { sequelize } from '../config/database';
import { OrderStatus, OrderWithDetails } from '../types';

@Table({
  tableName: 'orders',
  timestamps: true,
  underscored: true,
})
export class OrderEntity extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    unique: true,
    field: 'order_number',
  })
  orderNumber!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    field: 'customer_name',
  })
  customerName!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    field: 'customer_email',
  })
  customerEmail!: string;

  @Column({
    type: DataType.STRING(50),
    field: 'customer_phone',
  })
  customerPhone?: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    field: 'total_amount',
  })
  totalAmount!: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  status!: OrderStatus;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    field: 'created_at',
  })
  createdAt!: Date;

  @UpdatedAt
  @Column({
    type: DataType.DATE,
    field: 'updated_at',
  })
  updatedAt!: Date;
}

interface OrderData {
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  total_amount: number;
  status: OrderStatus;
}

interface TicketData {
  event_id: number;
  ticket_number: string;
  attendee_name?: string;
  status: string;
}

const OrderModel = {
  // Get all orders
  async findAll(): Promise<OrderEntity[]> {
    return await OrderEntity.findAll({
      order: [['createdAt', 'DESC']],
    });
  },

  // Get order by ID
  async findById(id: number): Promise<OrderEntity | null> {
    return await OrderEntity.findByPk(id);
  },

  // Get order by order number
  async findByOrderNumber(orderNumber: string): Promise<OrderEntity | null> {
    return await OrderEntity.findOne({
      where: { orderNumber },
    });
  },

  // Get orders by customer email
  async findByCustomerEmail(email: string): Promise<OrderEntity[]> {
    return await OrderEntity.findAll({
      where: { customerEmail: email },
      order: [['createdAt', 'DESC']],
    });
  },

  // Get order with tickets and event details
  async findByIdWithDetails(id: number): Promise<OrderWithDetails | null> {
    const result = await sequelize.query(
      `SELECT 
        o.*,
        json_agg(
          json_build_object(
            'id', t.id,
            'ticket_number', t.ticket_number,
            'attendee_name', t.attendee_name,
            'status', t.status,
            'event', json_build_object(
              'id', e.id,
              'name', e.name,
              'event_date', e.event_date,
              'location', e.location,
              'address', e.address
            )
          )
        ) as tickets
      FROM orders o
      LEFT JOIN tickets t ON o.id = t.order_id
      LEFT JOIN events e ON t.event_id = e.id
      WHERE o.id = :orderId
      GROUP BY o.id`,
      {
        replacements: { orderId: id },
        type: 'SELECT',
      }
    );
    return (result[0] as any) || null;
  },

  // Create new order with tickets (transaction)
  async create(orderData: OrderData, ticketsData: TicketData[]): Promise<{ order: OrderEntity; tickets: TicketEntity[] }> {
    return await sequelize.transaction(async (transaction) => {
      // Create order
      const order = await OrderEntity.create({
        orderNumber: orderData.order_number,
        customerName: orderData.customer_name,
        customerEmail: orderData.customer_email,
        customerPhone: orderData.customer_phone,
        totalAmount: orderData.total_amount,
        status: orderData.status,
      } as any, { transaction });

      // Create tickets
      const tickets: TicketEntity[] = [];
      for (const ticketData of ticketsData) {
        const ticket = await TicketEntity.create({
          orderId: order.id,
          eventId: ticketData.event_id,
          ticketNumber: ticketData.ticket_number,
          attendeeName: ticketData.attendee_name,
          status: ticketData.status,
        } as any, { transaction });
        tickets.push(ticket);
      }

      return { order, tickets };
    });
  },

  // Update order status
  async updateStatus(id: number, status: OrderStatus): Promise<OrderEntity | null> {
    const order = await OrderEntity.findByPk(id);
    if (!order) return null;

    await order.update({ status });
    return order;
  },

  // Get expired pending orders
  async findExpiredPending(expirationMinutes: number): Promise<OrderEntity[]> {
    const result = await sequelize.query(
      `SELECT * FROM orders 
       WHERE status = 'pending' 
       AND created_at < NOW() - INTERVAL '${expirationMinutes} minutes'`,
      { type: 'SELECT' }
    );
    return result as any;
  },

  // Cancel order and its tickets (transaction)
  async cancel(id: number): Promise<boolean> {
    return await sequelize.transaction(async (transaction) => {
      // Update order status
      await OrderEntity.update(
        { status: 'cancelled' },
        { where: { id }, transaction }
      );

      // Update all tickets status
      await TicketEntity.update(
        { status: 'cancelled' },
        { where: { orderId: id }, transaction }
      );

      return true;
    });
  },

  // Confirm order and its tickets (transaction)
  async confirm(id: number): Promise<OrderEntity | null> {
    return await sequelize.transaction(async (transaction) => {
      // Update order status
      const [, orders] = await OrderEntity.update(
        { status: 'paid' },
        { where: { id }, returning: true, transaction }
      );

      // Update all tickets status
      await TicketEntity.update(
        { status: 'confirmed' },
        { where: { orderId: id }, transaction }
      );

      return orders[0] || null;
    });
  },
};

export default OrderModel;
