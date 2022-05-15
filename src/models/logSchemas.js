const Joi = require('joi');

const addLogSchema = Joi.object({
  patient_id: Joi.number().required(),
  diagnosis: Joi.string().trim().required(),
  description: Joi.string().trim().required(),
  health_category: Joi.string().trim().required()
});

module.exports = {
  addLogSchema
};
