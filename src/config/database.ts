import { Sequelize } from 'sequelize-typescript';

const sequelize = new Sequelize({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'invina',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  dialect: 'postgres',
  pool: {
    max: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
});

// Test database connection
export const testConnection = async (): Promise<void> => {
  try {
    // Import new models after sequelize is initialized
    const Tour = (await import('../models/Tour')).default;
    const Wine = (await import('../models/Wine')).default;
    const TourWine = (await import('../models/TourWine')).default;
    const TourInstance = (await import('../models/TourInstance')).default;
    const Order = (await import('../models/Order')).default;
    const Payment = (await import('../models/Payment')).default;
    const Holiday = (await import('../models/Holiday')).default;
    
    sequelize.addModels([
      Tour,
      Wine,
      TourWine,
      TourInstance,
      Order,
      Payment,
      Holiday,
    ]);
    
    await sequelize.authenticate();
    console.log('✓ Connected to PostgreSQL database');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(-1);
  }
};

export { sequelize };
