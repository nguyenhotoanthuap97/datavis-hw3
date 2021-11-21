var gWidth = window.screen.width;
var gHeight = window.screen.height;

var margin = {top: gHeight/30, right: gWidth/10, bottom: gHeight/20, left: gWidth/7},
    width = gWidth - margin.left - margin.right - gWidth/10,
    height = gHeight - margin.top - margin.bottom - gHeight/5;

var svg = d3.select("#onair_datavis")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

d3.csv("https://raw.githubusercontent.com/nguyenhotoanthuap97/datavis-hw3/master/top_100.csv", data => {
    return {
      person: data.person,
      year_month : d3.timeParse("%Y-%m")(data.year_month),
      screen_time_seconds : data.screen_time_seconds
    }
  }, parsedData => {

    var stat = d3.nest()
      .key(d => { return d.person; })
      .entries(parsedData);
    var x = d3.scaleTime()
      .domain(d3.extent(parsedData, d => { 
        return d.year_month; }))
      .range([ 0, width ]);
    var xAxis = d3.axisBottom(x)
      .tickFormat( d3.timeFormat("%Y-%m"));
    svg.append("text")
      .attr("class", "x label")
      .attr("text-anchor", "end")
      .attr("x", width)
      .attr("y", height + 40)
      .style("font-size", "20px")
      .style('fill', 'black')
      .text("Time →");
    svg.append("g")
      .attr("class", "x axis")
      .style("font-size", "14px")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

    // Add Y axis
    var y = d3.scaleLinear()
      .domain([0, d3.max(parsedData, d => { return +d.screen_time_seconds; })])
      .range([ height, 0 ]);
    svg.append("g")
      .style("font-size", "14px")
      .call(d3.axisLeft(y));

    svg.append("text")
      .attr("class", "y label")
      .attr("text-anchor", "end")
      .attr("x", -40)
      .attr("y", 20)
      .style("font-size", "20px")
      .style('fill', 'black')
      .text("Screen time (second) ↑");

    // Color palette
    var res = stat.map(d => { return d.key })
    var color = d3.scaleOrdinal()
      .domain(res)
      .range(d3.schemeSet3)

    // lines
    var lines = svg.selectAll(".line")
      .data(stat)
      .enter()
      .append("path")
        .attr("fill", "none")
        .attr("stroke", d => { return color(d.key) })
        .attr("stroke-width", 1.5)
        .attr("d", d => {
          return d3.line()
            .x(d => { return x(d.year_month) })
            .y(d => { return y(d.screen_time_seconds) })
            (d.values)
        });

    // legends
    var legends = svg.selectAll(".line")
        .data(stat)
        .enter()
        .append("text")
        .datum(d => { return {value: d.values[d.values.length - 1]}; })
        .attr("transform", d => { return "translate(" + x(d.value.year_month) + "," + y(d.value.screen_time_seconds) + ")"; })
        .attr("stroke", d => { return color(d.value.person) })
        .attr("x", 5)
        .attr("dy", ".25em")
        .text(d => { return (d.value.person); });

    svg.call( d3.brush()
          .extent( [ [0,0], [width, height] ] )
          .on("start brush end", brushed)
        )

    xScale = d3.scaleTime()
      .domain(d3.extent(parsedData, d => { 
        return d.year_month; }))
      .range([0, width]);

    yScale = d3.scaleLinear()
      .domain([0, d3.max(parsedData, d => { return +d.screen_time_seconds; })])
      .range([height, 0]);

    function brushed() {
      var selection = d3.brushSelection(this);
      if (selection) {
        const [[xMin, yMin], [xMax, yMax]] = selection; // Unpack the bounding box of the selection
        if (xMin === xMax && yMin === yMax) {
          // The selection box is empty
          lines.style("opacity", 1);
          legends.style("opacity", 1);
        } else {
          var filtered = lines.style("opacity", 0.2) // Start by setting all opacity to 0.2
            .filter(function (d) {
              var internalPoints = d.values.filter(
                v => (xMin <= xScale(v.year_month)) && (xScale(v.year_month) <= xMax));
              function findIntersection(x) {
                // Find the lower & upper bound points.
                var lower = d.values.filter(v => x >= xScale(v.year_month))
                  .reduce((a, b) => a.year_month >= b.year_month ? a : b)
                var upper = d.values.filter(v => x <= xScale(v.year_month))
                  .reduce((a, b) => a.year_month >= b.year_month ? b : a)
                
                var lowerX = xScale(lower.year_month)
                var lowerY = yScale(lower.screen_time_seconds)
                var upperX = xScale(upper.year_month)
                var upperY = yScale(upper.screen_time_seconds)
                
                // Find the parameters of the line.
                var a = (upperY - lowerY) / (upperX - lowerX)
                var b = upperY - a * upperX
                
                // Find the y-coord of the line at this x-coord.
                return a * x + b
              }
              
              var xMinYInt = findIntersection(xMin)
              var xMaxYInt = findIntersection(xMax)
              
              var internalTime = internalPoints.map(v => yScale(v.screen_time_seconds));
              internalTime.push(xMinYInt)
              internalTime.push(xMaxYInt)
              
              var dyMin = Math.min(...internalTime);
              var dyMax = Math.max(...internalTime);
              return dyMin >= yMin && dyMax <= yMax
            })
            .style("opacity", 1);
          var mappedKeys = filtered._groups[0].map(entry => {
            return entry.__data__.key;
          });
          legends.style("opacity", 0.2)
                .filter(legend => mappedKeys.includes(legend.value.person))
                .style("opacity", 1);
        }
      } else {
        // Nothing has been selected yet
        lines.style("opacity", 1);
        legends.style("opacity", 1);
      }
    }
})