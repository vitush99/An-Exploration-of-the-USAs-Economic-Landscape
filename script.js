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

    // Extract unique variables and states
    const variables = [...new Set(data.map(d => d.variable))];
    const states = [...new Set(data.map(d => d.country))];

    // Populate metric dropdown
    const variableSelect = d3.select("#variable-select");
    variables.forEach(variable => {
        variableSelect.append("option").attr("value", variable).text(variable);
    });

    // Populate state dropdown
    const stateSelect = d3.select("#state-select");
    states.forEach(state => {
        stateSelect.append("option").attr("value", state).text(state);
    });

    // Dynamically update percentile dropdown
    const percentileSelect = d3.select("#percentile-select");

    const updatePercentiles = () => {
        const selectedVariable = variableSelect.property("value");

        // Get unique percentiles for the selected variable
        const relevantPercentiles = [...new Set(data
            .filter(d => d.variable === selectedVariable)
            .map(d => d.percentile))];

        // Clear and repopulate the percentile dropdown
        percentileSelect.selectAll("option").remove();
        relevantPercentiles.forEach(percentile => {
            percentileSelect.append("option").attr("value", percentile).text(percentile);
        });
    };

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

    variableSelect.on("change", () => {
        updatePercentiles(); // Update percentiles when the variable changes
        updateChart(); // Update chart
    });

    percentileSelect.on("change", updateChart);
    stateSelect.on("change", updateChart);

    // Initial setup
    updatePercentiles(); // Populate initial percentiles
    updateChart(); // Draw initial chart
}); 

// HOUSEHOLD SECTION


const margin2 = { top: 20, right: 30, bottom: 30, left: 60 };
const width2 = 400 - margin2.left - margin2.right;
const height2 = 300 - margin2.top - margin2.bottom;

const svg1 = d3.select("#chart1")
    .append("svg")
    .attr("width", width2 + margin2.left + margin2.right)
    .attr("height", height2 + margin2.top + margin2.bottom)
    .append("g")
    .attr("transform", `translate(${margin2.left},${margin2.top})`);

const svg2 = d3.select("#chart2")
    .append("svg")
    .attr("width", width2 + margin2.left + margin2.right)
    .attr("height", height2 + margin2.top + margin2.bottom)
    .append("g")
    .attr("transform", `translate(${margin2.left},${margin2.top})`);

d3.csv("household_income.csv").then(data => {
    data.forEach(d => {
        d["Year"] = +d["Year"];
        d["Median Income(dollars)"] = +d["Median Income(dollars)"].replace(",", "");
    });

    const updateCharts = () => {
        const selectedYear = document.querySelector('input[name="house-year"]:checked').value;
        const plotAll = document.querySelector("#plot-all").checked;
        const option1 = document.querySelector("#option-1-select").value;
        const option2 = document.querySelector("#option-2-select").value;

        const filteredData = data.filter(d => d.Year == selectedYear);

        svg1.selectAll("*").remove();
        svg2.selectAll("*").remove();

        if (plotAll) {
            createBarChart(filteredData, svg1, "All Categories", true);
        } else {
            const option1Data = filteredData.filter(d => d["Household Type"] === option1);
            const option2Data = filteredData.filter(d => d["Household Type"] === option2);

            createBarChart(option1Data, svg1, option1);
            createBarChart(option2Data, svg2, option2);
        }
    };

    const createBarChart = (data, svg, title, includeLegend = false) => {
        const x = d3.scaleBand()
            .domain(data.map(d => d["Household Type"]))
            .range([0, width2])
            .padding(0.1);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d["Median Income(dollars)"])])
            .nice()
            .range([height2, 0]);

        svg.append("g")
            .call(d3.axisLeft(y));

        // Add y-axis label
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height2 / 2)
            .attr("y", -margin2.left + 15)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text("Median Income (Dollars)");


        // For x-axis label
        // svg.append("g")
        //     .attr("transform", `translate(0,${height2})`)
        //     .call(d3.axisBottom(x));

        svg.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", d => x(d["Household Type"]))
        .attr("y", d => y(d["Median Income(dollars)"]))
        .attr("width", x.bandwidth())
        .attr("height", d => height2 - y(d["Median Income(dollars)"]))
        .attr("fill", (d, i) => d3.schemeCategory10[i % 10])
        // .on("mouseover", (event, d) => {
        //     tooltip.transition().duration(200).style("opacity", 1);
        //     tooltip.html(`<strong>${d["Household Type"]}</strong><br>Median Income: $${d["Median Income(dollars)"]}`)
        //         .style("left", `${event.pageX + 10}px`)
        //         .style("top", `${event.pageY - 28}px`);
        // })
        // .on("mouseout", () => {
        //     tooltip.transition().duration(200).style("opacity", 0);
        // });

        .on("mouseover", (event, d) => {
            // Show the tooltip
            tooltip.transition().duration(200).style("opacity", 1);
        
            // Set tooltip content and position it near the mouse pointer
            tooltip
                .html(`<strong>${d["Household Type"] || d["Age Group"]}</strong><br>Median Income: $${d["Median Income(dollars)"]}`)
                .style("left", `${event.pageX + 10}px`) // Position 10px to the right of the mouse
                .style("top", `${event.pageY - 20}px`); // Position 20px above the mouse
        })
        .on("mouseout", () => {
            // Hide the tooltip
            tooltip.transition().duration(200).style("opacity", 0);
        });

        svg.append("text")
            .attr("x", width2 / 2)
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .text(title);
    };

    document.querySelectorAll('input[name="house-year"]').forEach(input => input.addEventListener("change", updateCharts));
    document.querySelector("#option-1-select").addEventListener("change", updateCharts);
    document.querySelector("#option-2-select").addEventListener("change", updateCharts);
    document.querySelector("#plot-all").addEventListener("change", updateCharts);

    updateCharts();
});


// AGE SECTION
// Section 3: Age Income Comparison
const margin3 = { top: 20, right: 30, bottom: 30, left: 60 };
const width3 = 400 - margin3.left - margin3.right;
const height3 = 300 - margin3.top - margin3.bottom;

const svg3_1 = d3.select("#age-chart1")
    .append("svg")
    .attr("width", width3 + margin3.left + margin3.right)
    .attr("height", height3 + margin3.top + margin3.bottom)
    .append("g")
    .attr("transform", `translate(${margin3.left},${margin3.top})`);

const svg3_2 = d3.select("#age-chart2")
    .append("svg")
    .attr("width", width3 + margin3.left + margin3.right)
    .attr("height", height3 + margin3.top + margin3.bottom)
    .append("g")
    .attr("transform", `translate(${margin3.left},${margin3.top})`);

d3.csv("age_income.csv").then(data => {
    data.forEach(d => {
        d["Year"] = +d["Year"];
        d["Median Income(dollars)"] = +d["Median Income(dollars)"].replace(",", "");
    });

    const updateAgeCharts = () => {
        const selectedYear = document.querySelector('input[name="year"]:checked').value;
        const plotAll = document.querySelector("#age-plot-all").checked;
        const option1 = document.querySelector("#age-option-1-select").value;
        const option2 = document.querySelector("#age-option-2-select").value;

        const filteredData = data.filter(d => d.Year == selectedYear);

        svg3_1.selectAll("*").remove();
        svg3_2.selectAll("*").remove();

        if (plotAll) {
            createBarChart(filteredData, svg3_1, "All Age Categories", true);
        } else {
            const option1Data = filteredData.filter(d => d["Age Group"] === option1);
            const option2Data = filteredData.filter(d => d["Age Group"] === option2);

            createBarChart(option1Data, svg3_1, option1);
            createBarChart(option2Data, svg3_2, option2);
        }
    };

    const createBarChart = (data, svg, title, includeLegend = false) => {
        const x = d3.scaleBand()
            .domain(data.map(d => d["Age Group"]))
            .range([0, width3])
            .padding(0.1);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d["Median Income(dollars)"])])
            .nice()
            .range([height3, 0]);

        svg.append("g")
            .call(d3.axisLeft(y));

        // Add y-axis label
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height3 / 2)
            .attr("y", -margin3.left + 15)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text("Median Income(dollars)");

        svg.append("g")
            .attr("transform", `translate(0,${height3})`)
            .call(d3.axisBottom(x));

        svg.selectAll(".bar")
            .data(data)
            .enter()
            .append("rect")
            .attr("x", d => x(d["Age Group"]))
            .attr("y", d => y(d["Median Income(dollars)"]))
            .attr("width", x.bandwidth())
            .attr("height", d => height3 - y(d["Median Income(dollars)"]))
            .attr("fill", (d, i) => d3.schemeCategory10[i % 10])
            // .on("mouseover", (event, d) => {
            //     d3.select(".tooltip")
            //         .transition()
            //         .duration(200)
            //         .style("opacity", 1)
            //         .html(`<strong>${d["Age Group"]}</strong><br>Median Income: $${d["Median Income(dollars)"]}`)
            //         .style("left", `${event.pageX + 10}px`)
            //         .style("top", `${event.pageY - 28}px`);
            // })
            // .on("mouseout", () => {
            //     d3.select(".tooltip").transition().duration(200).style("opacity", 0);
            // });
            .on("mouseover", (event, d) => {
                // Show the tooltip
                tooltip.transition().duration(200).style("opacity", 1);
            
                // Set tooltip content and position it near the mouse pointer
                tooltip
                    .html(`<strong>${d["Household Type"] || d["Age Group"]}</strong><br>Median Income: $${d["Median Income(dollars)"]}`)
                    .style("left", `${event.pageX + 10}px`) // Position 10px to the right of the mouse
                    .style("top", `${event.pageY - 20}px`); // Position 20px above the mouse
            })
            .on("mouseout", () => {
                // Hide the tooltip
                tooltip.transition().duration(200).style("opacity", 0);
            });

        svg.append("text")
            .attr("x", width3 / 2)
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .text(title);
    };

    document.querySelectorAll('input[name="year"]').forEach(input => input.addEventListener("change", updateAgeCharts));
    document.querySelector("#age-option-1-select").addEventListener("change", updateAgeCharts);
    document.querySelector("#age-option-2-select").addEventListener("change", updateAgeCharts);
    document.querySelector("#age-plot-all").addEventListener("change", updateAgeCharts);

    updateAgeCharts();
});

// Section 5: Employment Map Visualization
mapboxgl.accessToken = 'pk.eyJ1IjoicHJhdmVlbm1hbmltYXJhbiIsImEiOiJjbTN1dGNhaDkwbnAwMmlvOXZpdWtwYno2In0.nW1IXuXViZmZKD9EZh1HRA'; // Replace with your Mapbox token

const map = new mapboxgl.Map({
    container: 'chart5', // Div ID from index.html
    style: 'mapbox://styles/mapbox/light-v10', // Map style
    center: [-96, 37.8], // Center of the U.S.
    zoom: 3
});

// Load GeoJSON and unemployment data
Promise.all([
    fetch('us-states.json').then(res => res.json()), // GeoJSON file
    d3.csv('unemployment.csv') // CSV file
]).then(([geojson, csvData]) => {
    const unemploymentRates = new Map(
        csvData.map(d => [
            d.State,
            {
                rate2024: +d["October 2024 Unemployment Rate"],
                rate2023: +d["October 2023 Unemployment Rate"]
            }
        ])
    );

    geojson.features.forEach(feature => {
        const stateName = feature.properties.name;
        const data = unemploymentRates.get(stateName) || {};
        feature.properties.unemployment2024 = data.rate2024 || 0;
        feature.properties.unemployment2023 = data.rate2023 || 0;
    });

    map.on('load', () => {
        map.addSource('states', {
            type: 'geojson',
            data: geojson
        });

        map.addLayer({
            id: 'state-fills',
            type: 'fill',
            source: 'states',
            paint: {
                'fill-color': [
                    'interpolate',
                    ['linear'],
                    ['get', 'unemployment2024'],
                    2, '#fee5d9',
                    3, '#fcae91',
                    4, '#fb6a4a',
                    5, '#de2d26',
                    6, '#a50f15'
                ],
                'fill-opacity': 0.75
            }
        });

        map.addLayer({
            id: 'state-borders',
            type: 'line',
            source: 'states',
            paint: {
                'line-color': '#ffffff',
                'line-width': 1
            }
        });

        const popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false
        });

        map.on('mousemove', 'state-fills', e => {
            const state = e.features[0].properties.name;
            const rate2024 = e.features[0].properties.unemployment2024;
            const rate2023 = e.features[0].properties.unemployment2023;
            popup.setLngLat(e.lngLat)
                .setHTML(
                    `<strong>${state}</strong><br>
                    2024 Unemployment Rate: ${rate2024.toFixed(1)}%<br>
                    2023 Unemployment Rate: ${rate2023.toFixed(1)}%`
                )
                .addTo(map);
        });

        map.on('mouseleave', 'state-fills', () => {
            popup.remove();
        });

        // Add a legend
        const legend = document.getElementById('legend');
        const colors = ['#fee5d9', '#fcae91', '#fb6a4a', '#de2d26', '#a50f15'];
        const labels = ['2.0 - 3.2%', '3.3 - 3.9%', '4.0 - 4.6%', '4.7 - 5.2%', '5.3% and above'];

        labels.forEach((label, i) => {
            const legendItem = document.createElement('div');
            legendItem.style.display = 'flex';
            legendItem.style.alignItems = 'center';
            legendItem.style.marginBottom = '5px';

            const colorBox = document.createElement('span');
            colorBox.style.width = '20px';
            colorBox.style.height = '20px';
            colorBox.style.backgroundColor = colors[i];
            colorBox.style.marginRight = '10px';

            const text = document.createElement('span');
            text.textContent = label;

            legendItem.appendChild(colorBox);
            legendItem.appendChild(text);
            legend.appendChild(legendItem);
        });
    });
}).catch(error => console.error('Error loading data:', error));


//Section 6 Employed Data

// Section 6: Employment Map Visualization
mapboxgl.accessToken = 'pk.eyJ1IjoicHJhdmVlbm1hbmltYXJhbiIsImEiOiJjbTN1dGNhaDkwbnAwMmlvOXZpdWtwYno2In0.nW1IXuXViZmZKD9EZh1HRA';

const employmentMap = new mapboxgl.Map({
    container: 'employment-map', // Div ID for Section 6
    style: 'mapbox://styles/mapbox/light-v10', // Map style
    center: [-96, 37.8], // Center of the U.S.
    zoom: 3
});


// Load GeoJSON and employment data
Promise.all([
    fetch('us-states.json').then(res => res.json()), // GeoJSON file
    d3.csv('employment.csv') // CSV file
]).then(([geojson, csvData]) => {
    const employmentData = new Map(
        csvData.map(d => [
            d.State,
            {
                totalEmployment: +d["Total employment"],
                netChange: +d["12-month net change in employment"],
                percentChange: +d["12-month percent change in employment"]
            }
        ])
    );

    geojson.features.forEach(feature => {
        const stateName = feature.properties.name;
        const data = employmentData.get(stateName) || {};
        feature.properties.totalEmployment = data.totalEmployment || 0;
        feature.properties.netChange = data.netChange || 0;
        feature.properties.percentChange = data.percentChange || 0;
    });

    employmentMap.on('load', () => {
        employmentMap.addSource('employment-states', {
            type: 'geojson',
            data: geojson
        });

        employmentMap.addLayer({
            id: 'employment-fills',
            type: 'fill',
            source: 'employment-states',
            paint: {
                'fill-color': [
                    'interpolate',
                    ['linear'],
                    ['get', 'totalEmployment'],
                    0, '#e0f7e4',
                    2000000, '#a8e6a1',
                    5000000, '#70d461',
                    10000000, '#40b22e',
                    20000000, '#148f00'
                ],
                'fill-opacity': 0.75
            }
        });

        employmentMap.addLayer({
            id: 'employment-borders',
            type: 'line',
            source: 'employment-states',
            paint: {
                'line-color': '#ffffff',
                'line-width': 1
            }
        });

        const popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false
        });

        employmentMap.on('mousemove', 'employment-fills', e => {
            const state = e.features[0].properties.name;
            const totalEmployment = e.features[0].properties.totalEmployment.toLocaleString();
            const netChange = e.features[0].properties.netChange.toLocaleString();
            const percentChange = e.features[0].properties.percentChange.toFixed(1);
            popup.setLngLat(e.lngLat)
                .setHTML(
                    `<strong>${state}</strong><br>
                    2024 Total Employment: ${totalEmployment}<br>
                    Net Change Over Last 12 Months: ${netChange}<br>
                    Percent Change Over Last 12 Months: ${percentChange}%`
                )
                .addTo(employmentMap);
        });

        employmentMap.on('mouseleave', 'employment-fills', () => {
            popup.remove();
        });

        // Add a legend
        const legend = document.getElementById('legend-employment');
        const colors = ['#e0f7e4', '#a8e6a1', '#70d461', '#40b22e', '#148f00'];
        const labels = ['0 - 2M', '2M - 5M', '5M - 10M', '10M - 20M', '20M and above'];

        labels.forEach((label, i) => {
            const legendItem = document.createElement('div');
            legendItem.style.display = 'flex';
            legendItem.style.alignItems = 'center';
            legendItem.style.marginBottom = '5px';

            const colorBox = document.createElement('span');
            colorBox.style.width = '20px';
            colorBox.style.height = '20px';
            colorBox.style.backgroundColor = colors[i];
            colorBox.style.marginRight = '10px';

            const text = document.createElement('span');
            text.textContent = label;

            legendItem.appendChild(colorBox);
            legendItem.appendChild(text);
            legend.appendChild(legendItem);
        });
    });
}).catch(error => console.error('Error loading data:', error));


// Section 8: GDP Visualization with Animation
const margin4 = { top: 50, right: 100, bottom: 50, left: 100 };
const width4 = 1200 - margin4.left - margin4.right;
const height4 = 600 - margin4.top - margin4.bottom;

// Create SVG container
const svgGDP = d3.select("#gdp-chart")
    .append("svg")
    .attr("width", width4 + margin4.left + margin4.right)
    .attr("height", height4 + margin4.top + margin4.bottom)
    .append("g")
    .attr("transform", `translate(${margin4.left},${margin4.top})`);

// Add chart title
svgGDP.append("text")
    .attr("x", width4 / 2)
    .attr("y", -margin4.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("GSP from 2000-2023");

// Load and process the GDP data
d3.csv("state_year_gsp.csv").then(data => {
    data.forEach(d => {
        d.Year = +d.Year;
        d.GSP = +d.GSP;
    });

    // Nest data by state
    const states = Array.from(new Set(data.map(d => d.State)));
    const nestedData = d3.group(data, d => d.State);

    // Set scales
    const x = d3.scaleLinear()
        .domain([2000, 2023]) // Adjust to your data range
        .range([0, width4]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.GSP)])
        .range([height4, 0]);

    // Add axes
    svgGDP.append("g")
        .attr("transform", `translate(0,${height4})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")))
        .append("text")
        .attr("x", width4 / 2)
        .attr("y", 40)
        .attr("fill", "black")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .text("Year");

    svgGDP.append("g")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height4 / 2)
        .attr("y", -50)
        .attr("fill", "black")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .text("Dollars");

    // Add state lines
    const line = d3.line()
        .x(d => x(d.Year))
        .y(d => y(d.GSP));

    const paths = svgGDP.selectAll(".state-line")
        .data(states)
        .enter()
        .append("path")
        .attr("class", "state-line")
        .attr("fill", "none")
        .attr("stroke", (_, i) => d3.schemeCategory10[i % 10])
        .attr("stroke-width", 1.5)
        .attr("d", state =>
            line(nestedData.get(state))
        );

    // Animation logic
    let playing = false;

    const playButton = d3.select("#play-button");
    playButton.on("click", () => {
        playing = !playing;
        playButton.text(playing ? "Pause" : "Play");

        if (playing) {
            animate();
        } else {
            d3.timeout(() => {}, 0); // Stop animation
        }
    });

    const animate = () => {
        let year = x.domain()[0];
        const interval = setInterval(() => {
            if (year > x.domain()[1] || !playing) {
                clearInterval(interval);
                return;
            }

            svgGDP.selectAll(".state-line")
                .attr("d", state =>
                    line(nestedData.get(state).filter(d => d.Year <= year))
                );

            year++;
        }, 500); // Animation speed
    };
});