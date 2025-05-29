const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // your Sequelize instance

const Category = sequelize.define('Category', {
  category_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  has_diagram: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'Categories',
  timestamps: false, // if you don't have createdAt/updatedAt columns
});

module.exports = Category;
