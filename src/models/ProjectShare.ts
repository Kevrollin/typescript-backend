import { Model, DataTypes, CreationOptional } from 'sequelize';
import { sequelize } from '../config/database';

export class ProjectShare extends Model {
  declare id: CreationOptional<number>;
  declare projectId: number;
  declare userId: number;
  declare platform: string; // e.g., 'facebook', 'twitter', 'linkedin', 'direct'
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

ProjectShare.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'project_id',
      references: {
        model: 'projects',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    platform: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'direct',
    },
  },
  {
    sequelize,
    tableName: 'project_shares',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['project_id'],
      },
      {
        fields: ['user_id'],
      },
    ],
  }
);

export default ProjectShare;

