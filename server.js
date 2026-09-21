const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors()); // 🔥 This completely stops the browser connection errors!
app.use(express.json());

const PORT = process.env.PORT || 8000;

// --- Load the api.json Blueprint ---
const apiSpec = JSON.parse(fs.readFileSync(path.join(__dirname, 'api.json'), 'utf8'));
console.log(`Loaded specification for: ${apiSpec.info.title}`);

// --- Simulated Database Tables ---
let patientsTable = [
    {
        patient_id: "usr_9x2k7b5",
        access_code: "B7X9RH",
        first_name: "Chidi",
        last_name: "Okonkwo",
        date_of_birth: "1992-05-14",
        phone_number: "+2348012345678"
    }
];

let appointmentsTable = [
    {
        patient_id: "usr_9x2k7b5",
        appointment_date: "2026-09-21", // Active for today
        appointment_time: "14:30",
        doctor_name: "Dr. Amina Bello",
        room_number: "Consultation Room 4",
        status: "Scheduled"
    }
];

// --- ENDPOINT 1: Register Patient ---
app.post('/api/v1/patients/register', (req, requireResponse) => {
    const { first_name, last_name, date_of_birth, phone_number } = req.body;
    
    // Generate random 6-character access code
    const access_code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const patient_id = "usr_" + Math.random().toString(36).substring(2, 9);

    const newPatient = { patient_id, access_code, first_name, last_name, date_of_birth, phone_number };
    patientsTable.push(newPatient);

    requireResponse.status(201).json({
        patient_id: newPatient.patient_id,
        access_code: newPatient.access_code,
        message: "Registration successful. Provide the access code to the patient."
    });
});

// --- ENDPOINT 2: Schedule Appointment ---
app.post('/api/v1/appointments/create', (req, requireResponse) => {
    const { patient_id, appointment_date, appointment_time, doctor_name, room_number } = req.body;
    appointmentsTable.push({ patient_id, appointment_date, appointment_time, doctor_name, room_number, status: "Scheduled" });
    requireResponse.status(201).json({ message: "Appointment created successfully." });
});

// --- ENDPOINT 3: Secure Check-In ---
app.post('/api/v1/checkin', (req, requireResponse) => {
    const { access_code, date_of_birth } = req.body;

    // Secure Verification: Look up patient details matching code and DOB
    const patient = patientsTable.find(p => p.access_code === access_code && p.date_of_birth === date_of_birth);

    if (!patient) {
        return requireResponse.status(401).json({ detail: "Invalid Access Code or Date of Birth configuration." });
    }

    // Get today's dynamic date string (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];
    
    // Find today's appointment for this specific patient
    const appointment = appointmentsTable.find(a => a.patient_id === patient.patient_id && a.appointment_date === today);

    if (!appointment) {
        return requireResponse.status(404).json({ detail: "No active, scheduled appointments found for today's date." });
    }

    // Change booking status on the spot
    appointment.status = "Checked-In";

    // Return the specific success fields defined in your api.json
    requireResponse.status(200).json({
        message: "Check-in successful! Please proceed.",
        patient_name: `${patient.first_name} ${patient.last_name}`,
        appointment_details: {
            time: appointment.appointment_time,
            doctor: appointment.doctor_name,
            location: appointment.room_number,
            current_status: appointment.status
        }
    });
});

// Start the live server engine link
app.listen(PORT, () => {
    console.log(`🚀 Hospital API Server running at http://localhost:${PORT}`);
    console.log(`👉 Check-in endpoint link ready: http://localhost:${PORT}/api/v1/checkin`);
});
