import { Model, DataTypes, CreationOptional } from 'sequelize';
import { sequelize } from '../config/database';
import { VerificationStatus } from '../types';

export class Student extends Model {
  declare id: CreationOptional<number>;
  declare userId: number;
  declare schoolEmail: string;
  declare schoolName: string;
  declare admissionNumber: string;
  declare idNumber: CreationOptional<string>;
  declare estimatedGraduationYear: CreationOptional<number>;
  declare verificationStatus: VerificationStatus;
  declare verificationNotes: CreationOptional<string>;
  declare verifiedAt: CreationOptional<Date>;
  declare verifiedBy: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Student.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
    },
    schoolEmail: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'school_email',
    },
    schoolName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'school_name',
    },
    admissionNumber: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'admission_number',
    },
    idNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'id_number',
    },
    estimatedGraduationYear: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'estimated_graduation_year',
    },
    verificationStatus: {
      type: DataTypes.STRING(20),
      defaultValue: 'pending',
      allowNull: false,
      field: 'verification_status',
    },
    verificationNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'verification_notes',
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'verified_at',
    },
    verifiedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'verified_by',
    },
  },
  {
    sequelize,
    tableName: 'students',
    timestamps: true,
    underscored: true,
  }
);

export default Student;