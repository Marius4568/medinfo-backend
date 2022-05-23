const express = require('express');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

const { mySQLconfig, jwtSecret } = require('../../config');

const patientShemas = require('../../models/patientSchemas');

const { isLoggedIn } = require('../../middleware/userAuthorization');
const validation = require('../../middleware/dataValidation');

const router = express.Router();

router.post('/add', isLoggedIn, validation(patientShemas, 'addPatientSchema'), async (req, res) => {
  try {
    req.body.doctor = jwt.verify(req.headers.authorization.split(' ')[1], jwtSecret);

    const con = await mysql.createConnection(mySQLconfig);
    // Check if the relationship between the doctor and patient already exists if it does not create the relationship

    const [duplicateAccount] = await con.execute(`
SELECT * FROM patient
WHERE email = ${mysql.escape(req.body.email)} OR identity_code = ${mysql.escape(req.body.identity_code)}
`);

    if (duplicateAccount.length !== 0) {
      const [relationship] = await con.execute(`
      SELECT * FROM doctor_patient
      WHERE doctor_id = ${mysql.escape(req.body.doctor.id)} 
      AND patient_id = ${mysql.escape(duplicateAccount[0].id)}
      `);

      if (relationship.length > 0) {
        await con.end();
        return res.status(400).send({ error: 'This patient is already assigned to you.' });
      }

      const [response] = await con.execute(`
      INSERT INTO doctor_patient (doctor_id, patient_id)
      VALUES(${mysql.escape(req.body.doctor.id)}, ${mysql.escape(duplicateAccount[0].id)})
      `);

      await con.end();

      if (!response.affectedRows) {
        return res.status(500).send({ error: 'Server error. Try again later.' });
      }

      return res.send({ msg: 'This patient already exists. We assigned the pattient to you :)' });
    }

    const [data] = await con.execute(`
    INSERT INTO patient (first_name, last_name, birth_date, gender, phone_number, email, photo, identity_code)

    VALUES (${mysql.escape(req.body.first_name)}, ${mysql.escape(req.body.last_name)}, ${mysql.escape(
      req.body.birth_date
    )}, ${mysql.escape(req.body.gender)}, ${mysql.escape(req.body.phone_number)}, ${mysql.escape(
      req.body.email
    )},${mysql.escape(req.body.photo)}, ${mysql.escape(req.body.identity_code)})
    `);

    if (!data.affectedRows) {
      return res.status(500).send({ error: 'Server error. Try again later.' });
    }

    const [insertedPatient] = await con.execute(`
    SELECT id FROM patient
    WHERE email = ${mysql.escape(req.body.email)} OR identity_code = ${mysql.escape(req.body.identity_code)}
    `);

    if (insertedPatient.length === 1) {
      const [addRelationship] = await con.execute(`
    INSERT INTO doctor_patient (doctor_id, patient_id)
    VALUES(${mysql.escape(req.body.doctor.id)}, ${mysql.escape(insertedPatient[0].id)})
    `);
      if (!addRelationship.affectedRows) {
        return res.send({ msg: 'Server error. Try again later.' });
      }
    }

    await con.end();
    return res.send({ msg: 'Patient added' });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ error: 'Server error. Try again later.' });
  }
});

router.get('/get_patients', isLoggedIn, async (req, res) => {
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
    await con.end();
    return res.send({ patients: data });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ error: 'Server error. Try again later.' });
  }
});

router.get('/get_patient', isLoggedIn, async (req, res) => {
  try {
    req.body.patient_id = req.query.patient_id;
    const con = await mysql.createConnection(mySQLconfig);

    const [data] = await con.execute(`
    SELECT first_name, last_name, birth_date, gender,
    email, photo, id
    FROM patient
    WHERE id = ${mysql.escape(req.body.patient_id)} AND archived = ${0}
`);

    if (data.length !== 1) {
      await con.end();
      return res.status(500).send({ error: `Sorry couldn't retrieve such user.` });
    }
    await con.end();
    return res.send({ patient: data });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ error: 'Server error. Try again later.' });
  }
});

router.delete('/delete', isLoggedIn, validation(patientShemas, 'deletePatient'), async (req, res) => {
  try {
    req.body.doctor = jwt.verify(req.headers.authorization.split(' ')[1], jwtSecret);

    const con = await mysql.createConnection(mySQLconfig);

    const [data] = await con.execute(`
    SELECT * FROM doctor_patient
    WHERE doctor_id = ${mysql.escape(req.body.doctor.id)} AND patient_id = ${mysql.escape(req.body.patient_id)}
`);

    if (data.length !== 1) {
      await con.end();
      return res.status(400).send({ error: `This patient is not assigned to you.` });
    }
    // Delete patient logs if there are any
    const [patientLogs] = await con.execute(`
    SELECT * FROM medical_logs
    WHERE doctor_id = ${mysql.escape(req.body.doctor.id)} AND patient_id = ${mysql.escape(req.body.patient_id)}
`);

    if (patientLogs.length > 0) {
      const [deletedLogs] = await con.execute(`
  DELETE FROM medical_Logs
  WHERE doctor_id = ${mysql.escape(req.body.doctor.id)} AND patient_id = ${mysql.escape(req.body.patient_id)}
`);

      if (!deletedLogs.affectedRows) {
        await con.end();
        return res.status(500).send({ error: `Sorry couldn't delete patient.` });
      }
    }

    const [deletedRelationship] = await con.execute(`
    DELETE FROM doctor_patient
    WHERE doctor_id = ${mysql.escape(req.body.doctor.id)} AND patient_id = ${mysql.escape(req.body.patient_id)}
`);
    await con.end();

    if (!deletedRelationship.affectedRows) {
      return res.status(500).send({ error: `Sorry couldn't delete patient.` });
    }

    return res.send({ msq: 'Patient deleted' });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ error: 'Server error. Try again later.' });
  }
});

router.get('/search', isLoggedIn, async (req, res) => {
  try {
    req.body.patient_search = req.query.patient_search;
    // Get the info of the doctor, who is logged in
    req.body.doctor = jwt.verify(req.headers.authorization.split(' ')[1], jwtSecret);

    const con = await mysql.createConnection(mySQLconfig);

    const [data] = await con.execute(`
    SELECT * FROM(SELECT first_name, last_name, birth_date, gender,
      email, photo, patient_id
      FROM patient
     JOIN doctor_patient
      ON doctor_patient.patient_id = patient.id
 WHERE doctor_id = ${mysql.escape(req.body.doctor.id)} AND archived = 0) AS search_result
 WHERE last_name LIKE "${req.body.patient_search}%" OR first_name LIKE "${req.body.patient_search}%"
`);
    console.log(data, req.body.patient_search, req.body.doctor);
    await con.end();
    return res.send({ patients: data });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ error: 'Server error. Try again later.' });
  }
});

module.exports = router;
