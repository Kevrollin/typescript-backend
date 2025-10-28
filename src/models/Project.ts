import { Model, DataTypes, CreationOptional } from 'sequelize';
import { sequelize } from '../config/database';
import { ProjectStatus, ProjectCategory } from '../types';

export class Project extends Model {
  declare id: CreationOptional<number>;
  declare title: string;
  declare description: string;
  declare targetAmount: number;
  declare currentAmount: CreationOptional<number>;
  declare status: ProjectStatus;
  declare category: ProjectCategory;
  declare creatorId: number;
  declare featuredImage: CreationOptional<string>;
  declare images: CreationOptional<string[]>;
  declare deadline: CreationOptional<Date>;
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
    targetAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      field: 'target_amount',
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
    featuredImage: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'featured_image',
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: true,
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