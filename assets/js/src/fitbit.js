$( document ).ready(function(){
  function initializeMap() {
    $.get("https://dl.dropboxusercontent.com/u/7208218/current_location.txt", function(data) {
      var location = data.split(" : ");
      var myLatLng = {lat: Number(location[0]), lng: Number(location[1])};
      var mapProp = {
         center: myLatLng,
         zoom: 14,
         mapTypeId: google.maps.MapTypeId.ROADMAP,
         disableDefaultUI: true
     };
     var map = new google.maps.Map(document.getElementById("googleMap"), mapProp);
     var marker = new google.maps.Marker({
        position: myLatLng,
        optimized:false,
        map: map
      });
      marker.setIcon('https://dl.dropboxusercontent.com/u/7208218/blink.gif')
      var styles = [
        {
          stylers: [
            { hue: "#00ffe6" },
            { saturation: -20 }
          ]
        },{
          featureType: "road",
          elementType: "geometry",
          stylers: [
            { lightness: 100 },
          ]
        },{
          featureType: "road",
          elementType: "labels",
          stylers: [
            { visibility: "off" }
          ]
        }
      ];

      map.setOptions({styles: styles});
    });
  };

  function initializePusher() {
    pusher = new Pusher('2c15f6b3aebfd03811ee');
    channel = pusher.subscribe('fitbit');
    channel.bind('update-event', function(data) {
      redrawBars(fitData);
    });
  }

  google.maps.event.addDomListener(window, 'load', initializeMap);

  var fitData, series, dataKeys, minVal = 0, maxVal = 1, radius, radiusLength;
  var pusher, channel;
  var w = 400, h = 400, axis = 5, ruleColor = '#CCC';
  var mapRadius = 75;
  var vizPadding = {
      top: 75,
      right: 75,
      bottom: 75,
      left: 75
  };
  var viz, vizBody, maxs, keys;

  var initialize = function(){
    drawBars(series);
    drawSummaryStats(fitData);
    initializePusher();
    window.setInterval(function(){
      updateAge();
    }, 100);
  };

  var loadData = function(){
      buildBase();
      setScales();
      drawProfilePic();
      keys = ["Steps", "Floors", "Calories", "Distance", "Active"];
      dataKeys = [];
      series = [];

      $.get('http://ben-yu.com/fitbit/stats/', function(data){
        fitData = data;
        for (var key in data['goals']) {
          dataKeys.unshift(key)
          series.push(data['goals'][key]);
        }
        initialize();
      });
  };

  var buildBase = function(){
      viz = d3.select("#radial")
              .append('svg:svg')
              .attr('width', w)
              .attr('height', h);

      var defs = viz.append('svg:defs');

      defs.append("svg:pattern")
          .attr("id", "my_avatar")
          .attr("x", 30)
          .attr("y", 10)
          .attr("width", 100)
          .attr("height", 100)
          .attr("patternUnits", "userSpaceOnUse")
          .append("svg:image")
          .attr("xlink:href", 'http://ben-yu.com/content/images/2014/Apr/039cef1.jpg')
          .attr("width", 100)
          .attr("height", 100)
          .attr("x", 0)
          .attr("y", 0);

      viz.append("svg:rect")
              .attr('x', 0)
              .attr('y', 0)
              .attr('height', 0)
              .attr('width', 0)
              .attr('height', 0);

      vizBody = viz.append("svg:g")
          .attr('id', 'body');
  };

  var setScales = function() {
    var heightCircleConstraint,
        widthCircleConstraint,
        circleConstraint,
        centerXPos,
        centerYPos;

    //need a circle so find constraining dimension
    heightCircleConstraint = h - vizPadding.top - vizPadding.bottom;
    widthCircleConstraint = w - vizPadding.left - vizPadding.right;
    circleConstraint = d3.min([heightCircleConstraint, widthCircleConstraint]);

    radius = d3.scale.linear().domain([0, maxVal])
        .range([0, (circleConstraint / 2)]);

    radiusLength = radius(maxVal);

    //attach everything to the group that is centered around middle
    centerXPos = widthCircleConstraint / 2 + vizPadding.left;
    centerYPos = heightCircleConstraint / 2 + vizPadding.top;

    vizBody.attr("transform", "translate(" + centerXPos + ", " + centerYPos + ")");
  };

  var drawProfilePic = function() {
      vizBody.append("circle")
           .attr("class", "logo")
           .attr("cx", -25)
           .attr("cy", -140)
           .attr("r", 50)
           .style("stroke", "black")     // displays small black dot
           .style("stroke-width", 0.25)
           .style("fill", "url('#my_avatar')");
  }

  function displayText(data) {
    if (data.type) {
      return data.type + ": " + data.amount + data.units;
    }
    return data.amount + data.units
  }

  var drawCircleSummary = function(data) {
    vizBody.append("circle")
           .attr("class", "summary-stat")
           .attr("cx", data.x)
           .attr("cy", data.y)
           .attr("r", 30)
           .style("stroke", "black")
           .style("stroke-width", 0.25)
           .style("fill", "#14bfff");

    vizBody.append("text")
            .attr("dx", data.x - 15)
            .attr("dy", data.y)
            .style("font-size", data.fontSize)
            .text(function(d){return displayText(data)})
            .style('fill', 'white')
  }

  var drawCircularText = function(data){
    var arc = d3.svg.arc()
      .innerRadius(function(d,i){return data.radius;})
      .outerRadius(function(d,i){return data.radius + 1;})
      .startAngle(0)
      .endAngle(2*Math.PI);

    var thing = vizBody.append("g")
      .attr("id","thing")
      .style("fill","white")
      .attr("class", "label");

    var arcs = vizBody.append("path")
      .attr("fill","none")
      .attr("id", function(d,i){return "s" + data.type;})
      .attr("d", arc);

    thing.append("text")
      .style("font-size", data.fontSize)
      .style("text-anchor","middle")
      .append("textPath")
      .attr("id", data.id)
      .attr("xlink:href", function(d,i){return "#s" + data.type;})
      .attr("startOffset", function(d,i){return data.offset;})
      .text(function(d){return displayText(data)})
  }

  var drawSummaryStats = function(data){
      drawCircleSummary({
        'x': 80,
        'y': -150,
        'fontSize': 18,
        'type': 'Sleep',
        'amount': data['sleep'],
        'units': 'hrs'
      });

      drawCircleSummary({
        'x': 100,
        'y': -75,
        'fontSize': 14,
        'type': 'Distance',
        'amount': data['totalDistance'],
        'units': 'km'
      });

      drawCircularText({
        'id': 'age-text',
        'radius': 125,
        'fontSize': 18,
        'type': 'Age',
        'amount': myAge(),
        'units': '',
        'offset': '15%'
      });

      drawCircularText({
        'id': 'heart-rate-text',
        'radius': 150,
        'fontSize': 12,
        'type': '',
        'amount': data['heartRate'],
        'units': 'bpm',
        'offset': '5%'
      });
  }

  var redrawBars = function(data) {
      function arc2Tween(d, indx) {
        var interp = d3.interpolate(this._current, d);
        this._current = d;

        return function(t) {
          var tmp = interp(t);
          return bar(tmp, indx);
        }
      };

      var bar = d3.svg.arc()
          .innerRadius( mapRadius )
          .outerRadius( function(d,i) { return mapRadius + radius( data[i] ); })
          .startAngle( function(d,i){ return Math.PI/16 * i + Math.PI/2})
          .endAngle( function(d,i){ return Math.PI/16 * i + (9 * Math.PI/16)});

      var arcs = vizBody.selectAll(".piePath").data(data).attr("d", bar);

      vizBody.selectAll(".pieText")
        .data(data)
          .text(function(d, i) { return keys[i] + ": " + fitData['activities'][dataKeys[i]]; })
      arcs.transition().duration(1000).attrTween("d", arc2Tween);
  }

  var myAge = function(){
    return ((Date.now() - 668725200000) / 1000 / 60 / 60 / 24 / 365).toFixed(8);
  }

  var updateAge = function(){
    data = [myAge()]
    vizBody.selectAll('#age-text')
          .data(data)
          .transition()
          .duration(100)
          .text(function(d){return "Age: " + d});
  };

  var drawBars = function(data) {
      var groups, bar;

      pie = d3.layout.pie().value(function(d) { return d; }).sort(null);
      d = [];
      for (i = 0; i < data.length; i++) {
        d.push(1);
      }

      groups = vizBody.selectAll('.series')
          .data([d]);
      groups.enter().append("svg:g")
          .attr('class', 'series')
          .style('fill', "#14bfff")

      groups.exit().remove();

      bar = d3.svg.arc()
          .innerRadius( mapRadius )
          .outerRadius( function(d,i) { return mapRadius + radius( data[i] ); })
          .startAngle( function(d,i){ return Math.PI/16 * i + Math.PI/2})
          .endAngle( function(d,i){ return Math.PI/16 * i + (9 * Math.PI/16)});

      arcs = groups.selectAll(".series g.arc")
          .data(pie)
          .enter()
          .append("g")
          .attr("class", "pieBar");

      arcs.append("path")
          .attr("class", "piePath")
          .attr("fill", "#14bfff")
          .attr("d", bar)
          .style("opacity", 0.4);

      // Add node names to the arcs, translated to the arc centroid and rotated.
      arcs.append("svg:text")
          .attr("class", "pieText")
          .attr("dy", "5px")
          .attr("text-anchor", "middle")
          .attr("transform", function(d, i) { //set text's origin to the centroid
            //we have to make sure to set these before calling arc.centroid
            d.innerRadius = mapRadius + 50; // Set Inner Coordinate
            d.outerRadius = mapRadius + radius( data[i] ) + 50; // Set Outer Coordinate
            d.startAngle = Math.PI/16 * i;
            d.endAngle = Math.PI/16 * i + Math.PI/16
            return "translate(" + centroid(d) + ")rotate(" + angle(d, 0, 90) + ")";
          })
          .style("fill", "white")
          .style("font", "normal 12px Arial")
          .text(function(d, i) { return keys[i] + ": " + fitData['activities'][dataKeys[i]]; });

      function centroid(d){
        var r = (d.innerRadius + d.outerRadius)/2;
        var a = (d.startAngle + d.endAngle)/2;
        return [Math.cos(a)*r, Math.sin(a)*r];
      }

      // Computes the angle of an arc, converting from radians to degrees.
      function angle(d, offset, threshold) {
            var a = (d.startAngle + d.endAngle) * 90 / Math.PI + offset;
            return a > threshold ? a - 180 : a;
      }
  }

  loadData();
});