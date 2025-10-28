import { Model, DataTypes, CreationOptional } from 'sequelize';
import { sequelize } from '../config/database';
import { DonationStatus, PaymentMethod } from '../types';

export class Donation extends Model {
  declare id: CreationOptional<number>;
  declare amount: number;
  declare donorId: number;
  declare projectId: number;
  declare status: DonationStatus;
  declare paymentMethod: PaymentMethod;
  declare transactionId: CreationOptional<string>;
  declare message: CreationOptional<string>;
  declare anonymous: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Donation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    donorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'donor_id',
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'project_id',
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'PENDING',
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'payment_method',
    },
    transactionId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'transaction_id',
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    anonymous: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'donations',
    timestamps: true,
    underscored: true,
  }
);

export default Donation;