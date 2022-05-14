const Joi = require('joi').extend(require('@joi/date'));

const addPatientSchema = Joi.object({
  first_name: Joi.string().trim().required(),
  last_name: Joi.string().trim().required(),
  birth_date: Joi.date().format('YYYY-MM-DD').required(),
  gender: Joi.string().trim().required(),
  phone_number: Joi.string().trim().lowercase().required(),
  email: Joi.string().email().trim().lowercase().required(),
  photo: Joi.string(),
  identity_code: Joi.string().trim().required()
});

const addLogSchema = Joi.object({
  doctor_id: Joi.number().required(),
  patient_id: Joi.number().required(),
  diagnosis: Joi.string().trim().required(),
  description: Joi.string().trim().required(),
  health_category: Joi.string().trim().required()
});

module.exports = {
  addPatientSchema,
  addLogSchema
};
