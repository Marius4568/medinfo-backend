const express = require('express');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

const { mySQLconfig, jwtSecret } = require('../../config');

const logSchemas = require('../../models/logSchemas');

const { isLoggedIn } = require('../../middleware/userAuthorization');
const validation = require('../../middleware/dataValidation');

const router = express.Router();

router.post('/add', isLoggedIn, validation(logSchemas, 'addLogSchema'), async (req, res) => {
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

router.delete('/delete', isLoggedIn, validation(logSchemas, 'deleteLog'), async (req, res) => {
  try {
    req.body.doctor = jwt.verify(req.headers.authorization.split(' ')[1], jwtSecret);

    const con = await mysql.createConnection(mySQLconfig);

    const [data] = await con.execute(`
      SELECT * FROM doctor_patient
      WHERE doctor_id = ${mysql.escape(req.body.doctor.id)} AND patient_id = ${mysql.escape(req.body.patient_id)}
  `);

    if (data.length !== 1) {
      await con.end();
      return res.status(400).send({ msg: `This patient is not assigned to you.` });
    }

    const [deletion] = await con.execute(`
      DELETE FROM doctor_patient
      WHERE doctor_id = ${mysql.escape(req.body.doctor.id)} AND patient_id = ${mysql.escape(req.body.patient_id)}
  `);
    await con.end();

    if (!deletion.affectedRows) {
      return res.status(500).send({ msg: `Sorry couldn't delete patient.` });
    }

    return res.send({ msq: 'Patient deleted' });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ msg: 'Server error. Try again later.' });
  }
});

module.exports = router;