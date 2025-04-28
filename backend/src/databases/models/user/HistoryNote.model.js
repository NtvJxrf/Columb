import { DataTypes, STRING } from 'sequelize';
import sequelize from '../../db.js';

const HistoryNote = sequelize.define('HistoryNote', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    initData: {
        type: DataTypes.JSONB,
        allowNull: false,

    },
    markup: {
        type: DataTypes.FLOAT,
    },
    comments: {
        type: DataTypes.STRING,
    },
    type: {
        type: DataTypes.ENUM('ballons', 'mattress', 'fbort'),
        allowNull: false
    },
    creatorId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE',
    }
},{
    tableName: 'history_notes',
    defaultScope: {
        attributes: {include: ["createdAt", "updatedAt"]},
    }
})
HistoryNote.associate = (models) => {
    HistoryNote.belongsTo(models.User, {
        foreignKey: 'creatorId',
        as: 'creator'
    });
};

export default HistoryNote;