const res = require("express/lib/response");
const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config");

module.exports = {
  isLoggedIn: (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      req.user = jwt.verify(token, jwtSecret);
      console.log(req.user);
      return next();
    } catch (err) {
      console.log(err);
      return res.status(400).send({ msg: "User is not logged in." });
    }
  },
};
