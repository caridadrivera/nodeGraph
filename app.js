const express = require('express');
const multer = require('multer');
const ejs = require('ejs');
const path = require('path');


const {formatAllDataForBoard, formatAllBoardData, createAllBoardChart, formatAllData, formatAllDataForChart, formatLeavingChart, formatDataForChart, createChart, getQuarterByMonth, createAllEmployeeChart} = require('./util/helpers.js');

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



  upload(req, res, (err) => {

    let EMPLOYEES_LEAVING = {};
    let employeesStarting = {};
    let allEmployees = {};
    let boardMembers = {};
    let allTitles = [];
    let names = [];
   
    const data = require(`./public/uploads/${req.file.filename}`);
   
   
  // a) Calculates the number of employees joining and leaving each quarter 
  // (or every 3 months) for the year. The Year Where people left was only 2017
   
    for (let i = 0; i < data.length - 1; i++) {
      if (data[i].dates.hasOwnProperty('end_date')) {
        const endYear = data[i].dates.end_date.split('-')[0];
        const endMonthStr = data[i].dates.end_date.split('-')[1];
        const endMonth = parseInt(endMonthStr, 10);

        if (EMPLOYEES_LEAVING.hasOwnProperty(endYear)) {
          getQuarterByMonth(EMPLOYEES_LEAVING[endYear], endMonth);
        } else {
          EMPLOYEES_LEAVING[endYear] = {
            q1: 0,
            q2: 0,
            q3: 0,
            q4: 0,//trying to figure out why q4 is not increased
          }
        //BUG :going through each quarter again because at Q4, the endYear did not yet exist in the data.
        getQuarterByMonth(EMPLOYEES_LEAVING[endYear], endMonth);
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



    // b) Calculates the total number of employees in each quarter for each year.
    // Ignore any employees that are on the board as they are not technically employees.
    data.forEach((entry) => {
      
      if(entry.dates.hasOwnProperty('start_date')){
        const year = entry.dates.start_date.split('-')[0]
        const monthStr = entry.dates.start_date.split('-')[1];
        const month = parseInt(monthStr, 10);  
        const title = entry.title;
      
  
      if(allEmployees.hasOwnProperty(year)){
        if(title[0] !== 'V' && title !== 'CFO' && !title.includes('Director') && !title.includes('Board') && !title.includes('CTO')){
          getQuarterByMonth(allEmployees[year], month);
          
        }
            
        } else {
          
          allEmployees[year] = {
            q1: 0,
            q2: 0,
            q3: 0,
            q4: 0,
          }
          getQuarterByMonth(allEmployees[year], month);
        }
      }
     
      
    });


    //c) Locate all Vice Presidents, CEO/CMO/COO/CTO/CxO titles and their start (and end dates(but there are no vp's with end dates)).
    //made executive decision to create bar chart instead of line chart due to data displaying weirdly on the chart. 
    data.forEach((entry) => {
      if(entry.dates.hasOwnProperty('start_date')){
       const year = entry.dates.start_date.split('-')[0]
       const monthStr = entry.dates.start_date.split('-')[1];
       const month = parseInt(monthStr, 10);  
       const titles = entry.title;
       const profile = entry.profile
       
    
       if(titles === 'CFO' || titles.startsWith('V') || titles.startsWith("CTO")) { 
      
        allTitles.push(`${titles} `);
        names.push(`${profile.firstName} `)
        boardMembers[year] = {
          q1: 0,
          q2: 0,
          q3: 0,
          q4: 0,
        }
          getQuarterByMonth(boardMembers[year], month);   
        }
      
   
        }
      
     
    });
    // console.log(allTitles, names)

  
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
        const allBoardMembersData = formatAllDataForBoard(boardMembers);
        const allBoardData = formatAllBoardData(allBoardMembersData);
        const allBoardMembersChart = createAllBoardChart(allBoardData);

        const leavingAndJoiningChartData = formatDataForChart(employeesStarting, EMPLOYEES_LEAVING);
        const leavingChartScript = createChart(leavingAndJoiningChartData);
     
        const allChartData = formatAllDataForChart(allEmployees);
        const formatedData = formatAllData(allChartData)
        const allDataChart= createAllEmployeeChart(formatedData);

      //  console.log("datahereee:", boardMembers)
        
       

        res.render('index', {
          msg: 'File Uploaded!',
          showChart: true,
          leavingChartScript,
          showOtherChart: true,
          allDataChart,
          allBoardMembersChart,
          allTitles,
          names,
          
        });


        

      }
    }
  });
});

const port = 3000;

app.listen(port, () => console.log(`Server started on port ${port}`));