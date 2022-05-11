const Joi = require("joi");

const registerSchema = Joi.object({
  name: Joi.string().trim().required(),
  specialty: Joi.string().trim().required(),
  email: Joi.string().trim().lowercase().required(),
  password: Joi.string().trim().required(),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().required(),
  password: Joi.string().trim().required(),
});

const changePasswordSchema = Joi.object({
  email: Joi.string().trim().lowercase().required(),
  oldPassword: Joi.string().trim().lowercase().required(),
  newPassword: Joi.string().trim().required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().trim().lowercase().required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
};
