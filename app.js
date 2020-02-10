const express = require('express');
const multer = require('multer');
const ejs = require('ejs');
const path = require('path');


const {formatData, formatDataForChart, createChart, getQuarterByMonth, createAllEmployeeChart} = require('./util/helpers.js');

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
  // (or every 3 months) for each year. Start date and end date
  upload(req, res, (err) => {
   
    let employeesLeavingByYear = {};
    let employeesStartingByYear = {};
   
    const data = require(`./public/uploads/${req.file.filename}`);
    //calculating employees with end_date as they all have start_date in order to get the joining/leaving
    for (let i = 0; i < data.length - 1; i++) {
      if (data[i].dates.hasOwnProperty('end_date')) {
        const year = data[i].dates.end_date.split('-')[0];
        const monthStr = data[i].dates.end_date.split('-')[1];
        const month = parseInt(monthStr, 10);

        if (employeesLeavingByYear.hasOwnProperty(year)) {
          getQuarterByMonth(employeesLeavingByYear[year], month);
        } else {
          employeesLeavingByYear[year] = {
            q1: 0,
            q2: 0,
            q3: 0,
            q4: 0,//trying to figure out why q4 is not increased
          }
        //BUG :going through each quarter again because at Q4, the year did not yet exist in the data.
        getQuarterByMonth(employeesLeavingByYear[year], month);
        }
      }
    }


    
    //b) all employees chart. filter out people on the board
    //I want to grab all the titles in my entry, put them in an array, filter through the array
    data.forEach((entry) => {
      if(entry.dates.hasOwnProperty('start_date')){
        const startYear = entry.dates.start_date.split('-')[0]
        const startMonthStr = entry.dates.start_date.split('-')[1];
        const startMonth = parseInt(startMonthStr, 10);
        // console.log(typeof entry.title)
       
        if(employeesStartingByYear.hasOwnProperty(startYear)){
         getQuarterByMonth(employeesStartingByYear[startYear], startMonth);
        } else {
          employeesStartingByYear[startYear] = {
            q1: 0,
            q2: 0,
            q3: 0,
            q4: 0,
          }
          getQuarterByMonth(employeesStartingByYear[startYear], startMonth);
        }
      } 
    });

  
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

      
        const leavingChartData = formatDataForChart(employeesLeavingByYear);
        const startingChartData = formatDataForChart(employeesStartingByYear);

         const leavingChartScript = createChart(leavingChartData, startingChartData );
         console.log("here,", leavingChartScript)

        res.render('index', {
          msg: 'File Uploaded!',
          showChart: true,
          leavingChartScript,
          test: `const chart = new CanvasJS.Chart("chartContainer", {
            "theme": "light1",
            "animationEnabled": false,
            "title": {
              "text": "2017"
            },
            "data": [{
              "type": "stackedColumn",
              "data: [{
                "label": "Quarter 1",
                "y": 6
              }, {
                "label": "Quarter 2",
                "y": 0
              }, {
                "label": "Quarter 3",
                "y": 2
              }, {
                "label": "Quarter 4",
                "y": 1
              },
             ]
          }
          

          {
            "type": "stackedColumn",
            "data: [{
              "label": "Quarter 1",
              "y": 12
            }, {
              "label": "Quarter 2",
              "y": 0
            }, {
              "label": "Quarter 3",
              "y": 2
            }, {
              "label": "Quarter 4",
              "y": 1
            },
           ]
        }
          
          
          );
          chart.render();`
        });

        

      }
    }
  });
});

const port = 3000;

app.listen(port, () => console.log(`Server started on port ${port}`));