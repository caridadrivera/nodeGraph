const express = require('express');
const multer = require('multer');
const ejs = require('ejs');
const path = require('path');

const {formatDataForChart, createChart, getQuarterByMonth} = require('./util/helpers.js');

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
  fileFilter: function(req, file, cb){
    checkFileType(file, cb);
  }
}).single('myJson');

// Check File Type
function checkFileType(file, cb){
  // Allowed ext
  const filetypes = /json/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if(mimetype && extname){
    return cb(null,true);
  } else {
    cb('Error: Json Only!');
  }
}

// Init app
const app = express();

// EJS
app.set('view engine', 'ejs');

// Public Folder
app.use(express.static('./public'));

app.get('/', (req, res) => res.render('index'));2

app.post('/upload', (req, res) => {

  // a) Calculates the number of employees joining and leaving each quarter 
  // (or every 3 months) for each year. Start date and end date

  upload(req, res, (err) => {
   
    let employeesLeavingByYear = {};
    let employeesStartingByYear = {};
    let allEmployeesPerYear = {};
  
    const data = require(`./public/uploads/${req.file.filename}`);
    //is it safe to assume that the the employees who are leaving already have a joined so they should
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
        //going through each quarter again because at Q4, the year did not yet exist in the data.
        //pretty sure there is a more effective way of doing this. 

        getQuarterByMonth(employeesLeavingByYear[year], month);
        }
      }
    }

    data.forEach((entry) => {
      if(entry.dates.hasOwnProperty('start_date')){
        const startYear = entry.dates.start_date.split('-')[0]
        const startMonthStr = entry.dates.start_date.split('-')[1];
        const startMonth = parseInt(startMonthStr, 10);
        
       
        if(employeesStartingByYear.hasOwnProperty(startYear)){
          if(startMonth <= 3){
            // 01, 02, 03
            employeesStartingByYear[startYear]['q1'] ++;
          }
           if(startMonth >= 4 && startMonth <= 6){
            // 04, 05, 06
            employeesStartingByYear[startYear]['q2'] ++;
         }

          if(startMonth >= 7 && startMonth <= 9){
          // 07, 08, 09
         employeesStartingByYear[startYear]['q3'] ++;
           }
        
         if (startMonth >= 10 && startMonth <= 12) {
          // 10, 11, 12
          employeesStartingByYear[startYear]['q4'] ++;
           }
        // getQuarterByMonth(employeesStartingByYear[startYear], startMonth);

        } else {
          employeesStartingByYear[startYear] = {
            q1: 0,
            q2: 0,
            q3: 0,
            q4: 0,
          }

          // getQuarterByMonth(employeesStartingByYear[startYear], startMonth);
        }
      } 
    });

    console.log(employeesStartingByYear);



    

    // console.log(employeesStartingByYear)



//     b) Calculates the total number of employees in each quarter for each year.
//        Ignore any employees that are on the board as they are not technically employees.
//employees who havent left? start_date and no end_date

// data.forEach((employee) => {
//   if(employee){
//     const startYr = employee.dates.start_date.split('-')[0]

//     const startMnthStr = employee.dates.start_date.split('-')[1];
//     const startMnth = parseInt(startMnthStr, 10);
    
   
//     if(allEmployeesPerYear.hasOwnProperty(startYr)){
//       if(startMnth <= 3){
//         // 01, 02, 03
//         allEmployeesPerYear[startYr]['q1'] ++;
//       }
//        if(startMnth >= 4 && startMnth <= 6){
//         // 04, 05, 06
//         allEmployeesPerYear[startYr]['q2'] ++;
//      }

//       if(startMnth >= 7 && startMnth <= 9){
//       // 07, 08, 09
//      allEmployeesPerYear[startYr]['q3'] ++;
//        }
    
//      if (startMnth >= 10 && startMnth <= 12) {
//       // 10, 11, 12
//       allEmployeesPerYear[startYr]['q4'] ++;
//        }

//     } else {
//       allEmployeesPerYear[startYr] = {
//         q1: 0,
//         q2: 0,
//         q3: 0,
//         q4: 0,
//       }
//     }
//   } 
// });
// console.log(allEmployeesPerYear)



//     c) Locate all Vice Presidents, CEO/CMO/COO/CTO/CxO titles and their start and end dates.
// 3



    //  console.log("leaving", employeesLeavingByYear);
    //  console.log("Joining:", employeesStartingByYear)


    //  [
    //    2017: {
    //     q1: Number,
    //     q2: Number,
    //     q3: Number;
    //     q4: Number;
    //    },
    //    2018: {
    //      q1: Number;
    //      q2: Number;
    //      q3: Number;
    //      q4: Number;
    //    }
    //  ]

    // {
    //   2017: {
    //     q1: num,
    //     q2: num,
    //     q3: num,
    //     q4: num,
    //   }
    // }


    // calculates employees leaving each q of every year
    // joining each q of every year
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
        const leavingChartScript = createChart(leavingChartData);

        res.render('index', {
          msg: 'File Uploaded!',
          showChart: true,
          leavingChartScript,
          test: `const chart1 = new CanvasJS.Chart("chartContainer", {
            "theme": "light1",
            "animationEnabled": false,
            "title": {
              "text": "2017"
            },
            "data": [{
              "type": "line",
              "dataPoints": [{
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
              }]
            }]
          });
          chart1.render();`
        });
      }
    }
  });
});

const port = 3000;

app.listen(port, () => console.log(`Server started on port ${port}`));