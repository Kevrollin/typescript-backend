import { Model, DataTypes, CreationOptional } from 'sequelize';
import { sequelize } from '../config/database';
import { CampaignStatus } from '../types';

export class Campaign extends Model {
  declare id: CreationOptional<number>;
  declare title: string;
  declare description: string;
  declare tags: string[];
  declare campaignType: 'custom' | 'mini';
  declare createdBy: number;
  declare startDate: Date;
  declare endDate: Date;
  declare heroImageUrl: string;
  declare fundingTrail: boolean;
  declare status: CampaignStatus;
  declare likesCount: number;
  
  // Association declarations
  declare participations?: any[];
  declare creator?: any;
  declare likes?: any[];
  
  // Custom Campaign Fields
  declare rewardPool?: number;
  declare prizeFirstPosition?: {
    prize: string;
    gifts: string;
  };
  declare prizeSecondPosition?: {
    prize: string;
    gifts: string;
  };
  declare prizeThirdPosition?: {
    prize: string;
    gifts: string;
  };
  
  // Mini Campaign Fields
  declare prizePool?: number;
  declare prizesBreakdown?: {
    first: string;
    second: string;
    third: string;
  };
  
  // Registration and Submission-related fields
  declare registrationStartDate?: Date;
  declare registrationEndDate?: Date;
  declare submissionStartDate?: Date;
  declare submissionEndDate?: Date;
  declare resultsAnnouncementDate?: Date;
  declare awardDistributionDate?: Date;
  
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Campaign.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
      defaultValue: [],
    },
    campaignType: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'campaign_type',
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'created_by',
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'start_date',
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'end_date',
    },
    heroImageUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'hero_image_url',
    },
    fundingTrail: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'funding_trail',
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: CampaignStatus.DRAFT,
      allowNull: false,
    },
    likesCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'likes_count',
    },
    // Custom Campaign Fields
    rewardPool: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      field: 'reward_pool',
    },
    prizeFirstPosition: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'prize_first_position',
    },
    prizeSecondPosition: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'prize_second_position',
    },
    prizeThirdPosition: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'prize_third_position',
    },
    // Mini Campaign Fields
    prizePool: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      field: 'prize_pool',
    },
    prizesBreakdown: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'prizes_breakdown',
    },
    // Registration and Submission-related fields
    registrationStartDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'registration_start_date',
    },
    registrationEndDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'registration_end_date',
    },
    submissionStartDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'submission_start_date',
    },
    submissionEndDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'submission_end_date',
    },
    resultsAnnouncementDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'results_announcement_date',
    },
    awardDistributionDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'award_distribution_date',
    },
  },
  {
    sequelize,
    tableName: 'campaigns',
    timestamps: true,
    underscored: true,
  }
);

export default Campaign;
