import { DataTypes } from 'sequelize';
import sequelize from '../../db.js';
import bcrypt from 'bcrypt';
const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: DataTypes.ENUM('admin', 'user'),
        defaultValue: 'user',
    },
    creator: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
},{
    tableName: 'users',
    paranoid: true,
});

User.beforeCreate((user) => {
    const salt = bcrypt.genSaltSync(10)
    user.password = bcrypt.hashSync(user.password, salt);
})
console.log(bcrypt.hashSync('128334TEMA', bcrypt.genSaltSync(10)))
User.prototype.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password)
}

User.associate = (models) => {
    User.hasMany(models.HistoryNote, {
        foreignKey: 'creatorId',
        as: 'notes'
    });
};

export default User;