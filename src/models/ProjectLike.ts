import { Model, DataTypes, CreationOptional } from 'sequelize';
import { sequelize } from '../config/database';

export class ProjectLike extends Model {
  declare id: CreationOptional<number>;
  declare projectId: number;
  declare userId: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

ProjectLike.init(
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
  },
  {
    sequelize,
    tableName: 'project_likes',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['project_id', 'user_id'],
        name: 'unique_project_user_like',
      },
    ],
  }
);

export default ProjectLike;
