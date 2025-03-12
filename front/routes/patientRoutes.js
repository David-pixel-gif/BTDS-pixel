const express = require('express');
const router = express.Router();
const Patient = require('../../flaskApp/models/Patient');

// Register a new patient
router.post('/patients', async (req, res) => {
    try {
        const patient = new Patient(req.body);
        await patient.save();
        res.status(201).json(patient);
    } catch (error) {
        res.status(400).json({ error: 'Error registering patient' });
    }
});

// Get all patients
router.get('/patients', async (req, res) => {
    try {
        const patients = await Patient.find();
        res.status(200).json(patients);
    } catch (error) {
        res.status(500).json({ error: 'Error retrieving patients' });
    }
});

module.exports = router;
