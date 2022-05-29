const express = require('express');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
const { mySQLconfig, jwtSecret, mailServer, mailServerPassword, baseLink } = require('../../config');

const authShemas = require('../../models/authSchemas');

const { isLoggedIn } = require('../../middleware/userAuthorization');
const validation = require('../../middleware/validation');

const router = express.Router();

// User Authentication///////////////////////////
router.post('/register', validation(authShemas, 'registerSchema'), async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hashSync(req.body.password, 10);

    const con = await mysql.createConnection(mySQLconfig);

    const [email] = await con.execute(`
    SELECT email FROM doctor
    WHERE email = ${mysql.escape(req.body.email)}
    `);

    if (email.length >= 1) {
      await con.end();
      return res.status(400).send({ error: 'User already exists.' });
    }

    const [data] = await con.execute(`
    INSERT INTO doctor (name, password, email)
    VALUES (${mysql.escape(req.body.name)}, ${mysql.escape(hashedPassword)}, ${mysql.escape(req.body.email)})
    `);
    await con.end();

    if (!data.insertId) {
      return res.status(500).send({ error: 'Something wrong with the server. Please try again later' });
    }

    return res.send({ msg: 'User created' });
  } catch (err) {
    console.log(err.message);
    return res.status(500).send({ error: 'Server error. Please try again' });
  }
});

router.post('/login', validation(authShemas, 'loginSchema'), async (req, res) => {
  try {
    const con = await mysql.createConnection(mySQLconfig);

    const [data] = await con.execute(`
    SELECT id, password FROM doctor
    WHERE email = ${mysql.escape(req.body.email)}
    LIMIT 1`);

    await con.end();

    if (data.length !== 1) {
      return res.status(400).send({ error: 'incorrect email or password' });
    }

    const isAuthed = await bcrypt.compareSync(req.body.password, data[0].password);

    if (isAuthed) {
      const token = jwt.sign({ id: data[0].id, email: data[0].email }, jwtSecret);
      return res.send({ msg: 'Successfully logged in', token });
    }

    return res.send({ error: 'incorrect email or password' });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ error: 'Something went wrong' });
  }
});

// Change password/Reset password///////////////////////////
router.post('/change_password', isLoggedIn, validation(authShemas, 'changePasswordSchema'), async (req, res) => {
  try {
    const con = await mysql.createConnection(mySQLconfig);
    const [data] = await con.execute(`
          SELECT id, email, password FROM doctor
          WHERE id=${mysql.escape(req.user.id)}
          LIMIT 1
          `);
    const isAuthed = bcrypt.compareSync(req.body.oldPassword, data[0].password);

    if (isAuthed) {
      const [dbRes] = await con.execute(`
            UPDATE doctor
            SET password = ${mysql.escape(bcrypt.hashSync(req.body.newPassword, 10))}
            WHERE id=${mysql.escape(req.user.id)};
            `);
      if (!dbRes.affectedRows) {
        await con.end();
        return res.status(500).send({ error: 'Something went wrong try again later' });
      }

      await con.end();
      return res.send({ msg: 'Password changed.' });
    }

    await con.end();

    return res.status(400).send({ error: 'Incorrect old password' });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ error: 'Server error try again later' });
  }
});

router.post('/reset_password', validation(authShemas, 'resetPasswordSchema'), async (req, res) => {
  try {
    const con = await mysql.createConnection(mySQLconfig);

    const [data1] = await con.execute(`
    SELECT id FROM doctor
    WHERE email = ${mysql.escape(req.body.email)}
    LIMIT 1
    `);

    if (data1.length !== 1) {
      await con.end();
      return res.send({ msg: 'If user exists, you will shortly receive a password reset email' });
    }

    const randomCode = Math.random()
      .toString(36)
      .replace(/[^a-z]+/g, '');

    const [data2] = await con.execute(`
   INSERT INTO password_reset (email, temporary_code)
    VALUES (${mysql.escape(req.body.email)}, ${mysql.escape(randomCode)})
    `);

    await con.end();

    if (!data2.insertId) {
      return res.status(500).send({ error: 'Something is wrong with the server. Please try again.' });
    }

    const response = await fetch(mailServer, {
      method: 'POST',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify({
        password: mailServerPassword,
        email: req.body.email,
        message: `If you requested a password change, please visit this link to procedd: ${baseLink}/user/new_password?email=${encodeURI(
          req.body.email
        )}&token=${randomCode}


        Otherwise please ignore this message.`
      })
    });

    const json = await response.json();

    if (!json.info) {
      return res.status(500).send({ error: 'Something is wrong with the server. Please try again.' });
    }

    return res.send({ msg: 'If user exists, you will shortly receive a password reset email' });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ error: 'Server error try again later' });
  }
});

router.post('/new_password', validation(authShemas, 'makeNewPasswordSchema'), async (req, res) => {
  try {
    const con = await mysql.createConnection(mySQLconfig);
    const [data] = await con.execute(`
  SELECT * FROM password_reset
  WHERE email=${mysql.escape(req.body.email)}
  ORDER BY created_at DESC
  LIMIT 1
  `);

    if (data.length !== 1) {
      await con.end();
      return res.status(500).send({ error: 'Server error try again later' });
    }

    // 180 because for some reason database returns timestamp -3h
    if ((new Date().getTime() - new Date(data[0].created_at).getTime()) / 60000 - 180 > 15) {
      await con.end();
      return res.status(400).send({ error: 'Link no longer valid' });
    }

    const hashedPassword = bcrypt.hashSync(req.body.password, 10);

    const [response] = await con.execute(`
    UPDATE doctor
    SET password = ${mysql.escape(hashedPassword)}
    WHERE email = ${mysql.escape(req.body.email)}

    `);

    if (!response.affectedRows) {
      await con.end();
      return res.status(500).send({ error: 'Server error try again later1' });
    }

    await con.execute(`
    DELETE FROM password_reset
    WHERE email = ${mysql.escape(req.body.email)}
  `);

    await con.end();
    return res.send({ msg: 'Password changed' });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ error: 'Server error try again later2' });
  }
});

module.exports = router;
