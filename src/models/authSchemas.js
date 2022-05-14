const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().trim().required(),
  email: Joi.string().email().trim().lowercase().required(),
  password: Joi.string().required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required(),
  password: Joi.string().required()
});

const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().lowercase().required(),
  newPassword: Joi.string().required()
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required()
});

const makeNewPasswordSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required(),
  token: Joi.string().required(),
  password: Joi.string().required()
});

module.exports = {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  resetPasswordSchema,
  makeNewPasswordSchema
};
