import { DataTypes } from 'sequelize';
import sequelize from '../../db.js';
const Product = sequelize.define('Product', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
    code: {//code в моем складе = offer_id в озоне
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    productId: {
        type: DataTypes.INTEGER,
        unique: true,
    },
    sku:{
        type: DataTypes.INTEGER,
        unique: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    assortmentId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    type: {
        type: DataTypes.ENUM('bundle', 'product', 'variant'),
        allowNull: false
    },
    updateIt: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    listed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
},{
    tableName: 'products',
    paranoid: true
})
export const ProductComponents = sequelize.define('ProductComponents', {
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    }
}, { timestamps: false });

Product.belongsToMany(Product, {
    as: 'Components',
    through: ProductComponents,
    foreignKey: 'productId',
    otherKey: 'componentId',
});
  

export default Product;