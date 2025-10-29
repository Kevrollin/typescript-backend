import { Model, DataTypes, CreationOptional } from 'sequelize';
import { sequelize } from '../config/database';
import { ProjectStatus, ProjectCategory } from '../types';

export class Project extends Model {
  declare id: CreationOptional<number>;
  declare title: string;
  declare description: string;
  declare goalAmount: number;
  declare currentAmount: CreationOptional<number>;
  declare status: ProjectStatus;
  declare category: ProjectCategory;
  declare creatorId: number;
  declare imageUrl: CreationOptional<string>;
  declare bannerImage: CreationOptional<string>;
  declare screenshots: CreationOptional<string[]>;
  declare repoUrl: CreationOptional<string>;
  declare demoUrl: CreationOptional<string>;
  declare websiteUrl: CreationOptional<string>;
  declare deadline: CreationOptional<Date>;
  declare likesCount: CreationOptional<number>;
  declare sharesCount: CreationOptional<number>;
  declare viewsCount: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Project.init(
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
    goalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      field: 'goal_amount',
    },
    currentAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: 'current_amount',
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'DRAFT',
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    creatorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'creator_id',
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'image_url',
    },
    bannerImage: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'banner_image',
    },
    screenshots: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    repoUrl: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      field: 'repo_url',
    },
    demoUrl: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      field: 'demo_url',
    },
    websiteUrl: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      field: 'website_url',
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    likesCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      field: 'likes_count',
    },
    sharesCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      field: 'shares_count',
    },
    viewsCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      field: 'views_count',
    },
  },
  {
    sequelize,
    tableName: 'projects',
    timestamps: true,
    underscored: true,
  }
);

export default Project;