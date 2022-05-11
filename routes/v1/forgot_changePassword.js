const express = require('express')
const bcrypt = require('bcrypt')
const mysql = require('mysql2/promise')
const fetch = require('node-fetch')
const { mySQLconfig } = require('../../config')

const router = express.Router()

const validation = require('../../middleware/validation')

router.post(
  '/change_password',
  validation('changePasswordSchema'),
  async (req, res) => {
    try {
      const con = await mysql.createConnection(mySQLconfig)
      const [data] = await con.execute(`
          SELECT * FROM doctor
          WHERE email=${mysql.escape(req.body.email)}
          `)

      const isAuthed = bcrypt.compareSync(
        req.body.oldPassword,
        data[0].password
      )
      if (isAuthed) {
        await con.execute(`
            UPDATE doctor
            SET password = ${mysql.escape(
              bcrypt.hashSync(req.body.newPassword, 10)
            )}
            WHERE email=${mysql.escape(req.body.email)};
            `)
        return res.send({ msg: 'Password changed' })
      }
      return res.send({ msg: 'Incorrect email or password' })
    } catch (err) {
      console.log(err)
      return res.status(500).send({ msg: 'Server error try again later' })
    }
  }
)

router.post(
  '/forgot_password',
  validation('forgotPasswordSchema'),
  async (req, res) => {
    try {
      const con = await mysql.createConnection(mySQLconfig)
      const [info] = await con.execute(`
            SELECT * FROM doctor
            WHERE email=${mysql.escape(req.body.email)}
            `)

      if (info.length === 1) {
        const newPassword = `${Math.floor(Math.random() * 100)}`
        const body = {
          password: 'PetrasGeriausiasDestytojas',
          email: req.body.email,
          message: `Your new password is: ${newPassword}`,
        }

        const response = await fetch(
          'https://dolphin-app-gsx4u.ondigitalocean.app/send',
          {
            method: 'post',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' },
          }
        )
        const data = await response.json()

        console.log(data, body, info)

        con.execute(`
            UPDATE doctor
            SET password = ${mysql.escape(bcrypt.hashSync(newPassword, 10))}
            WHERE email=${mysql.escape(req.body.email)};
`)

        return res.send({ msg: 'Password reset. Email sent.' })
      }
      return res.send({ msg: "User doesn't exist" })
    } catch (err) {
      console.log(err)
      return res.status(500).send({ msg: 'Server error try again later' })
    }
  }
)

module.exports = router
