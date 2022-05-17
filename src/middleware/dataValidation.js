const validation = function (schemas, schema) {
  return async function (req, res, next) {
    try {
      req.body = await schemas[schema].validateAsync(req.body);
      return next();
    } catch (err) {
      console.log(err);
      return res.status(400).send({ error: 'Incorrect details sent' });
    }
  };
};

module.exports = validation;
