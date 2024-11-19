const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const router = express.Router();

const csvFilePath = path.join(__dirname, '../../public/india_hospitals_lung_diseases.csv');

// Route to handle hospital search
router.post('/hospitals', (req, res) => {
    const { city, state } = req.body;

    let hospitals = [];

    // Read the CSV file
    fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row) => {
            hospitals.push(row); // Assuming CSV has `name`, `address`, `city`, and `state` columns
        })
        .on('end', () => {
            let filteredHospitals = [];

            // Search hospitals by city
            if (city) {
                filteredHospitals = hospitals.filter(hospital => hospital.city.toLowerCase() === city.toLowerCase());
            }

            // If no city results, search by state
            if (filteredHospitals.length === 0 && state) {
                filteredHospitals = hospitals.filter(hospital => hospital.state.toLowerCase() === state.toLowerCase());
            }

            // If no state results, return all hospitals
            if (filteredHospitals.length === 0) {
                filteredHospitals = hospitals;
            }

            res.json({ hospitals: filteredHospitals });
        });
});

module.exports = router;