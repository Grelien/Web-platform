// models/index.js - Export all MongoDB models

const User = require('./User.model');
const Schedule = require('./Schedule.model');
const IrrigationHistory = require('./IrrigationHistory.model');

module.exports = {
    User,
    Schedule,
    IrrigationHistory
};
