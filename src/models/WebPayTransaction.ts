import { Table, Column, Model, DataType, BelongsTo, ForeignKey, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';
import Order from './Order';
import { sequelize } from '../config/database';
import { WebPayStatus, TransactionStatistics } from '../types';

@Table({
  tableName: 'webpay_transactions',
  timestamps: true,
  underscored: true,
})
export class WebPayTransactionEntity extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @ForeignKey(() => Order)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'order_id',
  })
  orderId!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    unique: true,
  })
  token!: string;

  @Column({
    type: DataType.STRING(255),
    field: 'buy_order',
  })
  buyOrder?: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  amount!: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  status!: WebPayStatus;

  @Column({
    type: DataType.STRING(10),
    field: 'response_code',
  })
  responseCode?: string;

  @Column({
    type: DataType.STRING(50),
    field: 'authorization_code',
  })
  authorizationCode?: string;

  @Column({
    type: DataType.DATE,
    field: 'transaction_date',
  })
  transactionDate?: Date;

  @Column({
    type: DataType.JSONB,
    field: 'raw_response',
  })
  rawResponse?: any;

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

  @BelongsTo(() => Order)
  order?: Order;
}

interface TransactionData {
  order_id: number;
  token: string;
  buy_order?: string;
  amount: number;
  status: WebPayStatus;
}

interface ResponseData {
  status: WebPayStatus;
  response_code?: string;
  authorization_code?: string;
  transaction_date?: Date;
  raw_response?: any;
}

const WebPayTransactionModel = {
  // Create new transaction
  async create(transactionData: TransactionData): Promise<WebPayTransactionEntity> {
    return await WebPayTransactionEntity.create({
      orderId: transactionData.order_id,
      token: transactionData.token,
      buyOrder: transactionData.buy_order,
      amount: transactionData.amount,
      status: transactionData.status,
    } as any);
  },

  // Get transaction by ID
  async findById(id: number): Promise<WebPayTransactionEntity | null> {
    return await WebPayTransactionEntity.findByPk(id);
  },

  // Get transaction by token
  async findByToken(token: string): Promise<WebPayTransactionEntity | null> {
    return await WebPayTransactionEntity.findOne({
      where: { token },
    });
  },

  // Get transaction by order ID
  async findByOrderId(orderId: number): Promise<WebPayTransactionEntity[]> {
    return await WebPayTransactionEntity.findAll({
      where: { orderId },
      order: [['createdAt', 'DESC']],
    });
  },

  // Update transaction with WebPay response
  async updateWithResponse(token: string, responseData: ResponseData): Promise<WebPayTransactionEntity | null> {
    const transaction = await WebPayTransactionEntity.findOne({
      where: { token },
    });
    
    if (!transaction) return null;

    await transaction.update({
      status: responseData.status,
      responseCode: responseData.response_code,
      authorizationCode: responseData.authorization_code,
      transactionDate: responseData.transaction_date,
      rawResponse: responseData.raw_response,
    });

    return transaction;
  },

  // Get all transactions
  async findAll(): Promise<any[]> {
    const result = await sequelize.query(
      `SELECT 
        wt.*,
        o.order_number,
        o.customer_name,
        o.customer_email,
        o.total_amount as order_total
      FROM webpay_transactions wt
      JOIN orders o ON wt.order_id = o.id
      ORDER BY wt.created_at DESC`,
      { type: 'SELECT' }
    );
    return result as any;
  },

  // Get transaction statistics
  async getStatistics(): Promise<TransactionStatistics> {
    const result = await sequelize.query(
      `SELECT 
        COUNT(*) as total_transactions,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        SUM(amount) FILTER (WHERE status = 'approved') as total_approved_amount
      FROM webpay_transactions`,
      { type: 'SELECT' }
    );
    return (result[0] as any);
  },
};

export default WebPayTransactionModel;
