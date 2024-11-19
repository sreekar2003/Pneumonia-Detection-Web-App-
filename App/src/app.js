const express = require('express');
const multer = require('multer');
const path = require('path');
const request = require('postman-request');
const hbs = require('hbs');
const fs = require('fs');
const csv = require('csv-parser');
const ReportCreator = require('../src/pdfCreator');
const email = require('../src/email');

const viewpath = path.join(__dirname, '../templets/views');
const partialspath = path.join(__dirname, '../templets/partials');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '../public')));
app.set('view engine', 'hbs');
app.set('views', viewpath);
hbs.registerPartials(partialspath);

// Register a Handlebars helper to handle keys with spaces
hbs.registerHelper('getProp', function(obj, key) {
  return obj[key];
});

// Multer storage configuration for uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, '../public/uploads/');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const img_name = `${req.body.first_name}_${req.body.last_name}_${file.originalname}`;
    cb(null, img_name);
  }
});

const upload = multer({ storage: storage });
const PORT = process.env.PORT || 3000;

// CSV file path
const csvFilePath = path.join(__dirname, '../public/india_hospitals_lung_diseases.csv');

// Routes
app.get('', function (req, res) {
  res.render('index');
});

app.get('/help', function (req, res) {
  res.render('help');
});

app.get('/about', function (req, res) {
  res.render('about');
});

app.get('/precaution', function (req, res) {
  res.render('precaution');
});

app.get('/doctorhelp', function (req, res) {
  res.render('doctorhelp');
});

// Hospital Search Route
app.post('/search-hospitals', (req, res) => {
  const { city, state } = req.body;
  let hospitals = [];

  // Read CSV file
  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('data', (row) => {
      hospitals.push(row);
    })
    .on('end', () => {
      let filteredHospitals = hospitals;

      // Filter by city if provided
      if (city) {
        filteredHospitals = filteredHospitals.filter(hospital => hospital.City && hospital.City.toLowerCase() === city.toLowerCase());
      }

      // If no results by city, filter by state
      if (filteredHospitals.length === 0 && state) {
        filteredHospitals = hospitals.filter(hospital => hospital.State && hospital.State.toLowerCase() === state.toLowerCase());
      }

      // If no results found by city or state, return all hospitals
      if (filteredHospitals.length === 0) {
        filteredHospitals = hospitals; // Return all hospitals if no match
      }

      console.log('Filtered Hospitals:', filteredHospitals);  // Debugging: print filtered hospitals

      // Render hospitals list on the frontend
      res.render('doctorhelp', { hospitals: filteredHospitals });
    })
    .on('error', (err) => {
      console.error('Error reading CSV file:', err);
      res.render('doctorhelp', { error: 'Unable to process the request at the moment.' });
    });
});

// File upload handling for prediction
app.post('/home', upload.single('image'), function (req, res) {
  console.log(req.body, '\n');
  console.log(req.file);

  const uploadsDir = path.join(__dirname, '../public/uploads/');
  const uploadedFilePath = path.join(uploadsDir, req.file.filename);
  
  // Check if file was successfully uploaded
  if (fs.existsSync(uploadedFilePath)) {
    console.log('File uploaded successfully:', uploadedFilePath);
  } else {
    console.log('File upload failed:', uploadedFilePath);
    return res.render('index', { error: 'File upload failed. Please try again.' });
  }

  // Call FastAPI for prediction
  const myURL = `http://127.0.0.1:8000/predict?name=${req.file.filename}`;
  request(myURL, (err, response, body) => {
    if (err) {
      console.error('Error making prediction request:', err);
      return res.render('index', { error: 'Prediction failed. Please try again later.' });
    }

    console.log('\nBody (Prediction from FastAPI):', body);

    try {
      const parsedBody = JSON.parse(body);
      const prediction = parsedBody.prediction;
      const stage = parsedBody.stage;

      // Create PDF report
      ReportCreator.generateReport(req.body, prediction, stage);

      const pdfName = `${req.body.first_name}_${req.body.last_name}_X-Ray.pdf`;
      const imgName = `${req.body.first_name}_${req.body.last_name}_${req.file.originalname}`;

      // Send email if report requested
      if (req.body.report === "yes") {
        setTimeout(() => {
          email.sendEmail(pdfName, req.body.email);
        }, 2000);
      }

      // Render results
      res.render('new', {
        pdfName: pdfName,
        prediction: prediction,
        imgName: imgName,
        stage: stage
      });
    } catch (parseError) {
      console.error('Error parsing FastAPI response:', parseError);
      return res.render('index', { error: 'Error processing prediction. Please try again.' });
    }
  });
});

// Start the server
app.listen(PORT, function () {
  console.log(`Listening on Port ${PORT}`);
});