const express = require('express')
const bcrypt = require('bcrypt')
const mysql = require('mysql2/promise')
const jwt = require('jsonwebtoken')
const { mySQLconfig, jwtSecret } = require('../../config')

const router = express.Router()

const validation = require('../../middleware/validation')

router.post('/register', validation('registerSchema'), async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hashSync(req.body.password, 10)
    // console.log(mySQLConfig, jwtSecret);
    const con = await mysql.createConnection(mySQLconfig)

    const [email] = await con.execute(`
    SELECT * FROM doctor
     WHERE email = ${mysql.escape(req.body.email)}
    `)
    if (email.length >= 1) {
      con.end()
      return res.status(400).send({ msg: 'User already exists' })
    }

    con.execute(`
INSERT INTO doctor (name, specialty, password, email)
VALUES (${mysql.escape(req.body.name)}, ${mysql.escape(
      req.body.specialty
    )}, ${mysql.escape(hashedPassword)}, ${mysql.escape(req.body.email)})
`)

    con.end()
    return res.send({ msg: 'User created' })
  } catch (err) {
    console.log(err.message)
    return res.status(400).send({ msg: 'error' })
  }
})

router.post('/login', validation('loginSchema'), async (req, res) => {
  try {
    const con = await mysql.createConnection(mySQLconfig)

    const [data] = await con.execute(`
SELECT * FROM doctor
 WHERE email = ${mysql.escape(req.body.email)}
`)

    if (data.length < 1) {
      return res.status(400).send({ msg: 'incorrect email or password' })
    }

    const isAuthed = await bcrypt.compareSync(
      req.body.password,
      data[0].password
    )

    if (isAuthed) {
      const token = jwt.sign(
        { userId: data[0].id, email: data[0].email },
        jwtSecret
      )
      return res.send({ msg: 'Successfully logged in', token })
    }

    return res.send({ msg: 'incorrect email or password' })
  } catch (err) {
    console.log(err)
    return res.status(500).send({ msg: 'Something went wrong' })
  }
})

module.exports = router
