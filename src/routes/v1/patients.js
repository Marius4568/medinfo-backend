const express = require('express');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
const { mySQLconfig, jwtSecret, mailServer, mailServerPassword } = require('../../config');

const patientShemas = require('../../models/patientSchemas');

const { isLoggedIn } = require('../../middleware/userAuthorization');
const validation = require('../../middleware/dataValidation');

const router = express.Router();

router.post('/add_patient', isLoggedIn, validation(patientShemas, 'addPatientSchema'), async (req, res) => {
  try {
    const con = await mysql.createConnection(mySQLconfig);

    const [relationshiop] = await con.execute(`
    SELECT * FROM doctor_patient
    WHERE doctor_id = ${mysql.escape(req.body.doctor.id)} 
    AND patient_id = ${mysql.escape(req.body.patient_id)}
    `);

    const [duplicateAccounts] = await con.execute(`
SELECT * FROM patient
WHERE email = ${mysql.escape(req.body.email)} OR identity_code = ${mysql.escape(req.body.identity_code)}
`);

    if (duplicateAccounts.length !== 0) {
      await con.end();
      return res.status(400).send({ msg: 'Patient already exists' });
    }

    const [data] = await con.execute(`
    INSERT INTO patient (first_name, last_name, birth_date, gender, phone_number, email, photo, identity_code)

    VALUES (${mysql.escape(req.body.first_name)}, ${mysql.escape(req.body.last_name)}, ${mysql.escape(
      req.body.birth_date
    )}, ${mysql.escape(req.body.gender)}, ${mysql.escape(req.body.phone_number)}, ${mysql.escape(
      req.body.email
    )},${mysql.escape(req.body.photo)}, ${mysql.escape(req.body.identity_code)})
    `);
    await con.end();

    if (!data.affectedRows) {
      return res.status(500).send({ msg: 'Server error. Try again later.' });
    }

    return res.send({ msg: 'Patient added' });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ msg: 'Server error. Try again later.' });
  }
});

router.post('/add_log', isLoggedIn, validation(patientShemas, 'addLogSchema'), async (req, res) => {
  try {
    // Get the info of the doctor, who is logged in
    req.body.doctor = jwt.verify(req.headers.authorization.split(' ')[1], jwtSecret);

    const con = await mysql.createConnection(mySQLconfig);

    // Handling the case if there's no such user in the DB
    const [patientId] = await con.execute(`
      SELECT id FROM patient
      WHERE id = ${mysql.escape(req.body.patient_id)}
      `);

    if (patientId.length !== 1) {
      await con.end();
      return res.status(400).send({ msg: 'No such patient in the system' });
    }

    // Insert the log into the DB
    const [data] = await con.execute(`
      INSERT INTO medical_logs (doctor_id, patient_id, diagnosis, description, health_category)
  
      VALUES (${mysql.escape(req.body.doctor.id)}, ${mysql.escape(req.body.patient_id)}, ${mysql.escape(
      req.body.diagnosis
    )}, ${mysql.escape(req.body.description)}, ${mysql.escape(req.body.health_category)})
      `);

    if (!data.affectedRows) {
      return res.status(500).send({ msg: 'Server error. Try again later.' });
    }

    // If we don't have this patient-doctor relationship add it to the DB
    const [relationshiop] = await con.execute(`
    SELECT * FROM doctor_patient
    WHERE doctor_id = ${mysql.escape(req.body.doctor.id)} 
    AND patient_id = ${mysql.escape(req.body.patient_id)}
    `);

    if (relationshiop.length === 0) {
      const [data1] = await con.execute(`
        INSERT INTO doctor_patient (doctor_id, patient_id)
  
        VALUES (${mysql.escape(req.body.doctor.id)}, ${mysql.escape(req.body.patient_id)})
        `);

      if (!data1.affectedRows) {
        await con.end();
        return res.status(500).send({ msg: 'Server error. Something went wrong' });
      }
    }

    await con.end();
    return res.send({ msg: 'Log added' });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ msg: 'Server error. Try again later.' });
  }
});

router.get('/get_patients', async (req, res) => {
  try {
    // Get the info of the doctor, who is logged in
    req.body.doctor = jwt.verify(req.headers.authorization.split(' ')[1], jwtSecret);

    const con = await mysql.createConnection(mySQLconfig);

    const [data] = await con.execute(`
    SELECT first_name, last_name, birth_date, gender,
     email, photo, patient_id
     FROM patient
    JOIN doctor_patient
     ON doctor_patient.patient_id = patient.id
WHERE doctor_id = ${mysql.escape(req.body.doctor.id)} AND archived = ${0}
`);
    res.send({ patients: data });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ msg: 'Server error. Try again later.' });
  }
});

router.get('/get_patient', async (req, res) => {
  try {
    req.body.patient_id = req.query.patient_id;
    const con = await mysql.createConnection(mySQLconfig);

    const [data] = await con.execute(`
    SELECT first_name, last_name, birth_date, gender,
    email, photo
    FROM patient
    WHERE id = ${mysql.escape(req.body.patient_id)} AND archived = ${0}
`);

    if (data.length !== 1) {
      await con.end();
      return res.status(500).send({ msg: `Sorry couldn't retrieve such user.` });
    }
    await con.end();
    return res.send({ patients: data });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ msg: 'Server error. Try again later.' });
  }
});

router.delete

module.exports = router;
