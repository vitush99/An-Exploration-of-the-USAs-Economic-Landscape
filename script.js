// Dimensions and margins
const margin = { top: 20, right: 20, bottom: 50, left: 50 };
const width = 960 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Create SVG container
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Scales
const xScale = d3.scaleLinear().range([0, width]);
const yScale = d3.scaleLinear().range([height, 0]);
const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

// Axes
const xAxis = d3.axisBottom(xScale).ticks(10);
const yAxis = d3.axisLeft(yScale);

// Tooltip
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// Load data
d3.csv("Fully_Combined_State-Level_Data.csv").then(data => {
    // Parse data
    data.forEach(d => {
        d.year = +d.year;
        d.value = +d.value;
    });

    // Extract unique variables, percentiles, and states
    const variables = [...new Set(data.map(d => d.variable))];
    const percentiles = [...new Set(data.map(d => d.percentile))];
    const states = [...new Set(data.map(d => d.country))];

    // Populate metric dropdown
    const variableSelect = d3.select("#variable-select");
    variables.forEach(variable => {
        variableSelect.append("option").attr("value", variable).text(variable);
    });

    // Populate percentile dropdown
    const percentileSelect = d3.select("#percentile-select");
    percentiles.forEach(percentile => {
        percentileSelect.append("option").attr("value", percentile).text(percentile);
    });

    // Populate state dropdown
    const stateSelect = d3.select("#state-select");
    states.forEach(state => {
        stateSelect.append("option").attr("value", state).text(state);
    });

    // Set up chart
    const updateChart = () => {
        const selectedVariable = variableSelect.property("value");
        const selectedPercentile = percentileSelect.property("value");
        const selectedStates = Array.from(stateSelect.node().selectedOptions).map(option => option.value);

        // Filter data
        const filteredData = data.filter(
            d =>
                d.variable === selectedVariable &&
                d.percentile === selectedPercentile &&
                selectedStates.includes(d.country)
        );

        if (filteredData.length === 0) {
            svg.selectAll("*").remove(); // Clear chart
            return;
        }

        // Update scales
        xScale.domain(d3.extent(filteredData, d => d.year));
        yScale.domain([0, d3.max(filteredData, d => d.value)]);

        // Draw axes
        svg.selectAll(".x-axis").remove();
        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(xAxis);

        svg.selectAll(".y-axis").remove();
        svg.append("g")
            .attr("class", "y-axis")
            .call(yAxis);

        // Draw lines
        const line = d3.line()
            .x(d => xScale(d.year))
            .y(d => yScale(d.value));

        const groupedData = d3.group(filteredData, d => d.country);

        svg.selectAll(".line").remove();
        svg.selectAll(".line")
            .data(groupedData)
            .enter()
            .append("path")
            .attr("class", "line")
            .attr("d", ([state, values]) => line(values))
            .style("stroke", ([state]) => colorScale(state))
            .style("fill", "none")
            .on("mouseover", ([state]) => {
                tooltip.transition().duration(200).style("opacity", 1);
                tooltip.html(state).style("left", `${d3.event.pageX}px`).style("top", `${d3.event.pageY - 28}px`);
            })
            .on("mouseout", () => {
                tooltip.transition().duration(200).style("opacity", 0);
            });
    };

    variableSelect.on("change", updateChart);
    percentileSelect.on("change", updateChart);
    stateSelect.on("change", updateChart);

    // Initial chart update
    updateChart();
});
