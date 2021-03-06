require('dotenv').config();

module.exports = {
  baseLink: process.env.BASE_LINK,
  serverPort: process.env.PORT || process.env.SERVER_PORT,
  jwtSecret: process.env.JWT_SECRET,
  mailServer: process.env.MAIL_SERVER,
  mailServerPassword: process.env.MAIL_SERVER_PASSWORD,
  mySQLconfig: {
    database: process.env.MYSQL_DB,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    port: process.env.MYSQL_PORT,
    host: process.env.MYSQL_HOST
  }
};
