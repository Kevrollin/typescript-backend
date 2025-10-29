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
  declare verificationReason: CreationOptional<string>;
  declare verifiedAt: CreationOptional<Date>;
  declare verifiedBy: CreationOptional<number>;
  declare twitterUrl: CreationOptional<string>;
  declare linkedinUrl: CreationOptional<string>;
  declare githubUrl: CreationOptional<string>;
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
    verificationReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'verification_reason',
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
    twitterUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'twitter_url',
    },
    linkedinUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'linkedin_url',
    },
    githubUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'github_url',
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