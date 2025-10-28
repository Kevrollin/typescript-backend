import { Model, DataTypes, CreationOptional } from 'sequelize';
import { sequelize } from '../config/database';

export class CampaignParticipation extends Model {
  declare id: CreationOptional<number>;
  declare campaignId: number;
  declare userId: number;
  declare motivation: string;
  declare experience: string;
  declare portfolio?: string;
  declare additionalInfo?: string;
  declare status: 'pending' | 'approved' | 'rejected';
  declare submissionStatus: 'not_submitted' | 'submitted' | 'under_review' | 'graded' | 'winner' | 'runner_up' | 'not_selected';
  declare submittedAt: CreationOptional<Date>;
  declare reviewedAt?: Date;
  declare reviewedBy?: number;
  declare reviewNotes?: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Association declarations
  declare participant?: any;
  declare campaign?: any;
  declare reviewer?: any;
}

CampaignParticipation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    campaignId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'campaign_id',
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
    },
    motivation: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    experience: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    portfolio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    additionalInfo: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'additional_info',
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pending',
    },
    submissionStatus: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'not_submitted',
      field: 'submission_status',
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'submitted_at',
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'reviewed_at',
    },
    reviewedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'reviewed_by',
    },
    reviewNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'review_notes',
    },
  },
  {
    sequelize,
    tableName: 'campaign_participations',
    timestamps: true,
    underscored: true,
  }
);
