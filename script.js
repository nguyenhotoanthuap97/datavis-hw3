var margin = {top: 10, right: 30, bottom: 30, left: 60},
    width = 1080 - margin.left - margin.right,
    height = 1080 - margin.top - margin.bottom;

var svg = d3.select("#onair_datavis")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

$(document).ready(function () {
  $.ajax({
    type: "GET",
    url: "top_100.csv",
    dataType: "text",
    success: function (data) {
      processData(data);
    },
  });
});

function processData(allText) {
  var allTextLines = allText.split(/\r\n|\n/);
  var headers = allTextLines[0].split(",");
  var lines = [];

  for (var i = 1; i < allTextLines.length; i++) {
    var data = allTextLines[i].split(",");
    if (data.length == headers.length) {
      var tarr = [];
      for (var j = 0; j < headers.length; j++) {
        tarr.push(headers[j] + ":" + data[j]);
      }
      lines.push(tarr);
    }
  }
  console.log(lines);
}

d3.csv("top_100.csv", d => {

    console.log(d)
    parsedData = {
      person: d.person,
      year_month : d3.timeParse("%Y-%m")(d.year_month),
      screen_time_seconds : d.screen_time_seconds
    }

    console.log(parsedData)
    var stat = d3.nest()
      .key(d => { return d.person; })
      .entries(parsedData);

    var x = d3.scaleTime()
      .domain(d3.extent(parsedData, d => { return d.year_month; }))
      .range([ 0, width ]);
    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

    // Add Y axis
    var y = d3.scaleLinear()
      .domain([0, d3.max(parsedData, d => { return +d.screen_time_seconds; })])
      .range([ height, 0 ]);
    svg.append("g")
      .call(d3.axisLeft(y));

    // Color palette
    var res = sumstat.map(d => { return d.person })
    var color = d3.scaleOrdinal()
      .domain(res)
      .range(['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00','#ffff33','#a65628','#f781bf','#999999'])

    // Add the line
    svg.selectAll(".line")
      .data(stat)
      .enter()
      .append("path")
        .attr("fill", "none")
        .attr("stroke", d => { return color(d.name) })
        .attr("stroke-width", 1.5)
        .attr("d", d => {
          return d3.line()
            .x(d => { return x(d.year_month) })
            .y(d => { return y(d.screen_time_seconds) })
        })

})