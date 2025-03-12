const mongoose = require('mongoose');

const patientHistorySchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    diagnosis: String,
    treatment: String,
    notes: String,
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PatientHistory', patientHistorySchema);
