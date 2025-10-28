import { Model, DataTypes, CreationOptional } from 'sequelize';
import { sequelize } from '../config/database';

export class CampaignSubmission extends Model {
  declare id: CreationOptional<number>;
  declare campaignId: number;
  declare userId: number;
  declare participationId: number;
  
  // Project details
  declare projectTitle: string;
  declare projectDescription: string;
  declare projectScreenshots: string[]; // Array of image URLs
  declare projectLinks: {
    demoUrl?: string;
    githubUrl?: string;
    filesUrl?: string;
  };
  declare pitchDeckUrl?: string; // PDF file URL
  
  // Submission status
  declare status: 'submitted' | 'under_review' | 'graded' | 'winner' | 'runner_up' | 'not_selected';
  declare submissionDate: CreationOptional<Date>;
  
  // Grading fields
  declare score?: number; // Overall score out of 100
  declare grade?: string; // A+, A, B+, B, C+, C, D, F
  declare feedback?: string;
  declare gradedBy?: number;
  declare gradedAt?: Date;
  
  // Award information
  declare position?: number; // 1st, 2nd, 3rd place
  declare prizeAmount?: number;
  declare prizeDistributed: boolean;
  declare prizeDistributedAt?: Date;
  
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

CampaignSubmission.init(
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
    participationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'participation_id',
    },
    projectTitle: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'project_title',
    },
    projectDescription: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'project_description',
    },
    projectScreenshots: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
      defaultValue: [],
      field: 'project_screenshots',
    },
    projectLinks: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      field: 'project_links',
    },
    pitchDeckUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'pitch_deck_url',
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'submitted',
    },
    submissionDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'submission_date',
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    grade: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    gradedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'graded_by',
    },
    gradedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'graded_at',
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    prizeAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      field: 'prize_amount',
    },
    prizeDistributed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'prize_distributed',
    },
    prizeDistributedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'prize_distributed_at',
    },
  },
  {
    sequelize,
    tableName: 'campaign_submissions',
    timestamps: true,
    underscored: true,
  }
);

export default CampaignSubmission;
