window.onload = function () {

$.get("/ajax_analyze", {min_date:fromdate, max_date:enddate, id:id},function(results){

	        var result = JSON.parse(results);

            var line_value = result.value;
            var line_date = result.date;

            var y_axis = result.y;
            var x_axis = result.label;

            var sign = result.sign;

            am4core.ready(function()
            {
                // Themes begin
                am4core.useTheme(am4themes_animated);
                // Themes end

                var chart = am4core.create("line_chart", am4charts.XYChart);

                var data = [];
                var value = 50

                for(let i = 0; i < line_date.length; i++){
                    data.push({date:line_date[i], value: line_value[i], lineColor :"#67b7dc", expenses: 28.2});
                }

                chart.data = data;
                // Create axes
                var dateAxis = chart.xAxes.push(new am4charts.DateAxis());

                dateAxis.renderer.minGridDistance = 60;

                var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());

                // Create series
                var series = chart.series.push(new am4charts.LineSeries());
                series.dataFields.valueY = "value";
                series.dataFields.dateX = "date";
                series.fillOpacity = 0.5;
                series.strokeWidth = 3;
                series.propertyFields.stroke = "lineColor";
                series.propertyFields.fill = "lineColor";
                series.tooltipText = "{value}".concat(sign)
                series.tooltip.pointerOrientation = "vertical";

                var bullet = series.bullets.push(new am4charts.CircleBullet());
                bullet.circle.radius = 6;
                bullet.circle.fill = am4core.color("#fff");
                bullet.circle.strokeWidth = 3;

                chart.cursor = new am4charts.XYCursor();
                chart.cursor.snapToSeries = series;
                chart.cursor.xAxis = dateAxis;

                //chart.scrollbarY = new am4core.Scrollbar();
                chart.scrollbarX = new am4core.Scrollbar();

                // pie_chart
                var dataPoints = [];
                var colorValues = ['#8e5530', '#6f9b12', '#f96302', '#58baeb', '#ff5722']; //#67b7dc
                var chart = new CanvasJS.Chart("pie_chart", {
                    animationEnabled: true,
                    title: {
                        // text: "Analyze Original Data"
                    },
                    data: [{
                        type: "pie",
                        startAngle: 240,
                        yValueFormatString: "##0.00",
                        toolTipContent: "{y}" + sign,
                        indexLabel: "{label} {y}" + sign,
                        // indexLabelPlacement: "inside",
                        dataPoints: dataPoints,
                    }]
                });

                for(var i = 0; i < y_axis.length / 5; i ++) {
                    dataPoints.push({y: y_axis[5 * i], label: x_axis[5 * i], color:colorValues[i]});
                    dataPoints.push({y: y_axis[5 * i + 1], label: x_axis[5 * i + 1], color:colorValues[i]});
                    dataPoints.push({y: y_axis[5 * i + 2], label: x_axis[5 * i + 2], color:colorValues[i]});
                    dataPoints.push({y: y_axis[5 * i + 3], label: x_axis[5 * i + 3], color:colorValues[i]});
                    dataPoints.push({y: y_axis[5 * i + 4], label: x_axis[5 * i + 4], color:colorValues[i]});
                }

                chart.render();
            }); // end am4core.ready()
        })


}
