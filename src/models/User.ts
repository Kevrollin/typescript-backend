import {
  Model,
  DataTypes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import bcrypt from 'bcryptjs';
import { sequelize } from '../config/database';
import { UserRole, UserStatus } from '../types';

export class User extends Model<
  InferAttributes<User>,
  InferCreationAttributes<User>
> {
  declare id: CreationOptional<number>;
  declare username: string;
  declare email: string;
  declare passwordHash: string;
  declare fullName: CreationOptional<string>;
  declare phone: CreationOptional<string>;
  declare profilePicture: CreationOptional<string>;
  declare role: UserRole;
  declare status: UserStatus;
  declare emailVerified: CreationOptional<boolean>;
  declare emailVerificationToken: CreationOptional<string>;
  declare passwordResetToken: CreationOptional<string>;
  declare passwordResetExpires: CreationOptional<Date>;
  declare lastLogin: CreationOptional<Date>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Instance methods
  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
  }

  async hashPassword(password: string): Promise<string> {
    const config = await import('../config');
    return bcrypt.hash(password, config.default.security.bcryptRounds);
  }

  override toJSON(): any {
    const values = { ...this.get() };
    delete (values as any).passwordHash;
    return values;
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: false,
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash',
    },
    fullName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'full_name',
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    profilePicture: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'profile_picture',
    },
    role: {
      type: DataTypes.STRING(20),
      defaultValue: 'BASE_USER',
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'ACTIVE',
      allowNull: false,
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'email_verified',
    },
    emailVerificationToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'email_verification_token',
    },
    passwordResetToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'password_reset_token',
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'password_reset_expires',
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    underscored: true,
  }
);

export default User;
