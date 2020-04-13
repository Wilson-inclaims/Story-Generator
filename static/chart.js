$(document).ready(function () {
    var id = $(this).attr('target');
    var fromdate = $("#min_time").val();
    var enddate = $("#max_time").val();
    var map_data = [];
    $.get("/ajax_analyze", {min_date:fromdate, max_date:enddate, id:'position'},function(results) {
        results = JSON.parse(results);

        get_map('map',results.position);
    });


     $("#show_graph").click(function (e) {
        e.preventDefault();
        $("#temperature-tub").trigger("click");
    });

})

$('li.nav-item a').click(function() {
    var id = $(this).attr('target');
    var fromdate = $("#min_time").val();
    var enddate = $("#max_time").val();
    var field = $(this).attr("target");
    $.get("/ajax_analyze", {min_date:fromdate, max_date:enddate, id:id},function(results) {
        var msg = {
         "temperature" : [
             "It is recommended that people should stay hydrated and avoid outdoor activities for longer time.",
             "Moderate temperature and good for outdoor activities."
         ],
         "humidity" : [
             "It is recommended that people should stay hydrated and avoid outdoor activities for longer time.",
             "Moderate weather for outdoor activities."
         ],
         "pm1" : [
             "Higher values show more concentration in the air",
             "Lower values show more concentration in the air."
         ],
         "pm2" : [
             "Higher values show more concentration in the air",
             "Lower values show more concentration in the air."
         ],
         "pm3" : [
             "Higher values show more concentration in the air",
             "Lower values show more concentration in the air."
         ]
     };
        var results = JSON.parse(results);

        var num = parseInt(results.status);
        $(".alert").html(msg[id][num]);
        $(".alert").show();

        var temperature_date = results.temperature_date;
        var pi_data = results.pi_data;
        var sign = results.sign;
        var line_data = [];
        var value = 50;
        for(let i = 0; i < temperature_date.length; i++){
          let date = new Date(temperature_date[i].year,temperature_date[i].month,temperature_date[i].day);
          date.setHours(temperature_date[i].time,0,0,0);
          value -= Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 10);
          line_data.push({date:date, value: temperature_date[i].value});
        }

        get_line_chart('line_chart_'+field,line_data,sign,field);
        get_pi_chart('pie_chart_'+field,pi_data,sign);
    });

});

    function get_line_chart(area,value,sign,field) {
        am4core.ready(function() {

        // Themes begin
        am4core.useTheme(am4themes_animated);
        // Themes end

        var chart = am4core.create(area, am4charts.XYChart);


        chart.data = value;

        // Create axes
        var dateAxis = chart.xAxes.push(new am4charts.DateAxis());
        dateAxis.renderer.minGridDistance = 90;

        var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
        valueAxis.title.text = field+" ( "+sign+" )";
        // Create series
        var series = chart.series.push(new am4charts.LineSeries());
        series.dataFields.valueY = "value";
        series.dataFields.dateX = "date";
        series.tooltipText = "{value} "+sign;

        series.tooltip.pointerOrientation = "vertical";

        chart.cursor = new am4charts.XYCursor();
        chart.cursor.snapToSeries = series;
        chart.cursor.xAxis = dateAxis;

        //chart.scrollbarY = new am4core.Scrollbar();
        chart.scrollbarX = new am4core.Scrollbar();

        }); // end am4core.ready()
    }

    function get_pi_chart(area,value,sign) {
        am4core.ready(function() {

        // Themes begin
        am4core.useTheme(am4themes_animated);
        // Themes end

        var container = am4core.create(area, am4core.Container);
        container.width = am4core.percent(100);
        container.height = am4core.percent(100);
        container.layout = "horizontal";


        var chart = container.createChild(am4charts.PieChart);

        // Add data
        chart.data = value;

        // Add and configure Series
        var pieSeries = chart.series.push(new am4charts.PieSeries());
        pieSeries.dataFields.value = "litres";
        pieSeries.dataFields.category = "country";
        pieSeries.slices.template.states.getKey("active").properties.shiftRadius = 0;
        pieSeries.labels.template.text = "{category}";

        pieSeries.slices.template.events.on("hit", function(event) {
          selectSlice(event.target.dataItem);
        })

        var chart2 = container.createChild(am4charts.PieChart);
        chart2.width = am4core.percent(30);
        chart2.radius = am4core.percent(80);

        // Add and configure Series
        var pieSeries2 = chart2.series.push(new am4charts.PieSeries());
        pieSeries2.dataFields.value = "value";
        pieSeries2.dataFields.category = "name";
        pieSeries2.slices.template.states.getKey("active").properties.shiftRadius = 0;
        //pieSeries2.labels.template.radius = am4core.percent(50);
        //pieSeries2.labels.template.inside = true;
        //pieSeries2.labels.template.fill = am4core.color("#ffffff");
        pieSeries2.labels.template.disabled = true;
        pieSeries2.ticks.template.disabled = true;
        pieSeries2.alignLabels = false;
        pieSeries2.events.on("positionchanged", updateLines);

        var interfaceColors = new am4core.InterfaceColorSet();

        var line1 = container.createChild(am4core.Line);
        line1.strokeDasharray = "2,2";
        line1.strokeOpacity = 0.5;
        line1.stroke = interfaceColors.getFor("alternativeBackground");
        line1.isMeasured = false;

        var line2 = container.createChild(am4core.Line);
        line2.strokeDasharray = "2,2";
        line2.strokeOpacity = 0.5;
        line2.stroke = interfaceColors.getFor("alternativeBackground");
        line2.isMeasured = false;

        var selectedSlice;

        function selectSlice(dataItem) {

          selectedSlice = dataItem.slice;

          var fill = selectedSlice.fill;

          var count = dataItem.dataContext.subData.length;
          pieSeries2.colors.list = [];
          for (var i = 0; i < count; i++) {
            pieSeries2.colors.list.push(fill.brighten(i * 2 / count));
          }

          chart2.data = dataItem.dataContext.subData;
          pieSeries2.appear();

          var middleAngle = selectedSlice.middleAngle;
          var firstAngle = pieSeries.slices.getIndex(0).startAngle;
          var animation = pieSeries.animate([{ property: "startAngle", to: firstAngle - middleAngle }, { property: "endAngle", to: firstAngle - middleAngle + 360 }], 600, am4core.ease.sinOut);
          animation.events.on("animationprogress", updateLines);

          selectedSlice.events.on("transformed", updateLines);

        //  var animation = chart2.animate({property:"dx", from:-container.pixelWidth / 2, to:0}, 2000, am4core.ease.elasticOut)
        //  animation.events.on("animationprogress", updateLines)
        }


        function updateLines() {
          if (selectedSlice) {
            var p11 = { x: selectedSlice.radius * am4core.math.cos(selectedSlice.startAngle), y: selectedSlice.radius * am4core.math.sin(selectedSlice.startAngle) };
            var p12 = { x: selectedSlice.radius * am4core.math.cos(selectedSlice.startAngle + selectedSlice.arc), y: selectedSlice.radius * am4core.math.sin(selectedSlice.startAngle + selectedSlice.arc) };

            p11 = am4core.utils.spritePointToSvg(p11, selectedSlice);
            p12 = am4core.utils.spritePointToSvg(p12, selectedSlice);

            var p21 = { x: 0, y: -pieSeries2.pixelRadius };
            var p22 = { x: 0, y: pieSeries2.pixelRadius };

            p21 = am4core.utils.spritePointToSvg(p21, pieSeries2);
            p22 = am4core.utils.spritePointToSvg(p22, pieSeries2);

            line1.x1 = p11.x;
            line1.x2 = p21.x;
            line1.y1 = p11.y;
            line1.y2 = p21.y;

            line2.x1 = p12.x;
            line2.x2 = p22.x;
            line2.y1 = p12.y;
            line2.y2 = p22.y;
          }
        }

        chart.events.on("datavalidated", function() {
          setTimeout(function() {
            selectSlice(pieSeries.dataItems.getIndex(0));
          }, 1000);
        });


        }); // end am4core.ready()
    }

    function get_map(area,value) {
       var map = L.map(area).setView([51.505, -0.09], 13);


        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '<br> Latitude : 51.505 <br> Logitude : -0.09'
        }).addTo(map);
        for (i=0; i<value.length; i++){
            L.marker([51.5, -0.09]).addTo(map)
                .bindPopup('Latitude : '+value[i].latitude+' <br> Logitude : ' + value[i].longitude)
                .openPopup();
        }

    }