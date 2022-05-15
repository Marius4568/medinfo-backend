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

const deletePatient = Joi.object({
  patient_id: Joi.number().required()
});

module.exports = {
  addPatientSchema,
  deletePatient
};
