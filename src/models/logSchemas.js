const Joi = require('joi');

const addLogSchema = Joi.object({
  patient_id: Joi.number().required(),
  diagnosis: Joi.string().trim().required(),
  description: Joi.string().trim().required(),
  health_category: Joi.string().trim().required()
});

const deleteLog = Joi.object({
  log_id: Joi.number().required()
});

module.exports = {
  addLogSchema,
  deleteLog
};
