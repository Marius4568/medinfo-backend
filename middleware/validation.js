const dataSchemas = require('../models/dataSchemas')

const validation = function (schema) {
  if (!Object.prototype.hasOwnProperty.call(dataSchemas, schema)) {
    console.log('no schema')
  }
  return async function (req, res, next) {
    try {
      req.body = await dataSchemas[schema].validateAsync(req.body)
      return next()
    } catch (err) {
      console.log(err)
      return res.send({ msg: 'Incorrect details sent' })
    }
  }
}

module.exports = validation
