

///////*************LEAVING EMPLOYEES HELPERS*******************/////////////


exports.formatDataForChart = (data) => {
    const years = Object.keys(data);
    return chartData = years.map((year) => {
      return {
        theme: "light1", // "light2", "dark1", "dark2"
        animationEnabled: false, // change to true		
        title: {
          text: "Joined Employees Leaving"
        },
        data: [{
       type: "stackedColumn",
          dataPoints: [{
              label: 'Quarter 1',
              y: data[year]['q1']
            },
            {
              label: 'Quarter 2',
              y: data[year]['q2']
            },
            {
              label: 'Quarter 3',
              y: data[year]['q3']
            },
            {
              label: 'Quarter 4',
              y: data[year]['q4']
            },
          ]
        },


        {
          type: "stackedColumn",
             dataPoints: [{
                 label: 'Quarter 1',
                 y: - data[year]['q1']
               },
               {
                 label: 'Quarter 2',
                 y: - data[year]['q2']
               },
               {
                 label: 'Quarter 3',
                 y: - data[year]['q3']
               },
               {
                 label: 'Quarter 4',
                 y: - data[year]['q4']
               },
             ]
           }
      
      
      
      
      
      
        ]

      }
    });
  };


  
  exports.createChart = (chartData) => {
    let chartScript = 'window.onload = function () {';
    for (let i = 0; i < chartData.length; i++) {
      chartScript += `
        const chart${i} = new CanvasJS.Chart("chartContainer", ${JSON.stringify(chartData[i])})
        chart${i}.render();
      `;
    }
    chartScript += '}';
    return chartScript;
  };

  
  exports.getQuarterByMonth = (data, month) => {
    if(month <= 3){
      // 01, 02, 03
      data['q1'] ++;
    }
  
    if(month >= 4 && month <= 6){
      // 04, 05, 06
      data['q2'] ++;
    }
  
    if(month >= 7 && month <= 9){
      // 07, 08, 09
      data['q3'] ++;
    }
  
    if (month >= 10 && month <= 12) {
      // 10, 11, 12
      data['q4'] ++;
    }
  };
  
  