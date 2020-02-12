const express = require('express');
const multer = require('multer');
const ejs = require('ejs');
const path = require('path');


const {formatData, formatLeavingChart, formatDataForChart, createChart, getQuarterByMonth, createAllEmployeeChart} = require('./util/helpers.js');

// Set The Storage Engine
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: function(req, file, cb){
    cb(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Init Upload
const upload = multer({
  storage: storage,
  limits:{fileSize: 1000000},
}).single('myJson');


// Init app
const app = express();


app.set('view engine', 'ejs');

app.use('/styling', express.static('styling'))

app.get('/', (req, res) => res.render('index'));

app.post('/upload', (req, res) => {
  // a) Calculates the number of employees joining and leaving each quarter 
  // (or every 3 months) for the year. The Year Where people left was only 2017
  upload(req, res, (err) => {
   
    //declaring global variable in order to have access to it in the other iteration.
    let EMPLOYEES_LEAVING = {};
    let employeesStarting = {};
   
    const data = require(`./public/uploads/${req.file.filename}`);
    //calculating employees with end_date as they all have start_date in order to get the joining/leaving
    for (let i = 0; i < data.length - 1; i++) {
      if (data[i].dates.hasOwnProperty('end_date')) {
        const year = data[i].dates.end_date.split('-')[0];
        const monthStr = data[i].dates.end_date.split('-')[1];
        const month = parseInt(monthStr, 10);

        if (EMPLOYEES_LEAVING.hasOwnProperty(year)) {
          getQuarterByMonth(EMPLOYEES_LEAVING[year], month);
        } else {
          EMPLOYEES_LEAVING[year] = {
            q1: 0,
            q2: 0,
            q3: 0,
            q4: 0,//trying to figure out why q4 is not increased
          }
        //BUG :going through each quarter again because at Q4, the year did not yet exist in the data.
        getQuarterByMonth(EMPLOYEES_LEAVING[year], month);
        }
      }
    }

    

    data.forEach((entry) => {
      if(entry.dates.hasOwnProperty('start_date')){
        const startYear = entry.dates.start_date.split('-')[0]
        const startMonthStr = entry.dates.start_date.split('-')[1];
        const startMonth = parseInt(startMonthStr, 10);
  
      if(employeesStarting.hasOwnProperty(startYear)){
         getQuarterByMonth(employeesStarting[startYear], startMonth);
        } else if(EMPLOYEES_LEAVING.hasOwnProperty(startYear)){
          employeesStarting[startYear] = {
            q1: 0,
            q2: 0,
            q3: 0,
            q4: 0,
          }
          getQuarterByMonth(employeesStarting[startYear], startMonth);
        }
      }
      
    });

     console.log(employeesStarting)
     console.log(EMPLOYEES_LEAVING)
  
    if(err){
      res.render('index', {
        msg: err,
      });
    } else {
      if(req.file == undefined){
        res.render('index', {
          msg: 'Error: No File Selected!',
       
        });
      } else {

      
        const leavingAndJoiningChartData = formatDataForChart(employeesStarting, EMPLOYEES_LEAVING);
        // const startingChartData = formatDataForChart(employeesStarting);

        const leavingChartScript = createChart(leavingAndJoiningChartData);
        // const joiningChartScript = createChart(startingChartData);
         
        
          console.log("there", leavingChartScript)

        res.render('index', {
          msg: 'File Uploaded!',
          showChart: true,
          leavingChartScript,
         
          
        });


        

      }
    }
  });
});

const port = 3000;

app.listen(port, () => console.log(`Server started on port ${port}`));