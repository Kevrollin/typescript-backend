import { Model, DataTypes, CreationOptional } from 'sequelize';
import { sequelize } from '../config/database';

export class CampaignLike extends Model {
  declare id: CreationOptional<number>;
  declare campaignId: number;
  declare userId: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

CampaignLike.init(
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
      references: {
        model: 'campaigns',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
  },
  {
    sequelize,
    tableName: 'campaign_likes',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['campaign_id', 'user_id'],
        name: 'unique_campaign_user_like',
      },
    ],
  }
);

export default CampaignLike;
