import { DataTypes } from 'sequelize';
import sequelize from '../../db.js';
const Tasks = sequelize.define('Task', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
    skladId: {//id заказа покупателя в моем складе
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    yougileId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
    },
},{
    tableName: 'tasks',
    paranoid: true
})
  

export default Tasks;