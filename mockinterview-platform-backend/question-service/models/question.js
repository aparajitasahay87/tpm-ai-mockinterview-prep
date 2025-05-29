const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Category = require('./category');

const Question = sequelize.define('Question', {
  question_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Categories',
      key: 'category_id',
    },
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  difficulty_level: {
    type: DataTypes.ENUM('Easy', 'Medium', 'Hard'),
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'Questions',
  timestamps: false,
});

// Define association
Question.belongsTo(Category, { foreignKey: 'category_id' });
Category.hasMany(Question, { foreignKey: 'category_id' });

module.exports = Question;
