import * as d3 from 'd3';
import { voronoiTreemap } from 'd3-voronoi-treemap';

export function renderVoronoiTreemap(data, containerId, colorScheme = 'tableau10', showValues = false, labelScale = 1.0, borderColor = '#ffffff', borderWidth = 1, showLegend = true) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear previous
    container.innerHTML = '';

    const width = container.clientWidth;
    const height = container.clientHeight;

    // ... rest of the setup
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) / 2 - 10;
    const nPoints = 100;

    // If showing legend, adjust visualization area or add legend overlay
    // For now, let's keep the circle and add legend on the right or bottom if there's space.
    // Actually, let's just overlay it or put it in a corner.

    const clipPolygon = d3.range(nPoints).map(i => {
        const theta = (i / nPoints) * 2 * Math.PI;
        return [
            cx + radius * Math.cos(theta),
            cy + radius * Math.sin(theta)
        ];
    });

    // Process data: transform flat array to hierarchy
    let rootData;
    const hasGroups = data.some(d => d.group);

    if (hasGroups) {
        // Group by 'group' field
        const grouped = d3.group(data, d => d.group);
        rootData = {
            name: "root",
            children: Array.from(grouped, ([key, values]) => ({
                name: key,
                children: values
            }))
        };
    } else {
        // Flat conversion
        rootData = {
            name: "root",
            children: data
        };
    }

    const hierarchy = d3.hierarchy(rootData)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value);

    // Calculate total value for percentage
    const totalValue = hierarchy.value;

    // Voronoi Treemap computation
    const _voronoiTreemap = voronoiTreemap()
        .clip(clipPolygon);

    _voronoiTreemap(hierarchy);

    const allNodes = hierarchy.descendants();
    const leaves = allNodes.filter(d => d.height === 0);
    const groups = allNodes.filter(d => d.depth === 1 && d.height > 0);

    const svg = d3.select("#" + containerId)
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Create color scale once
    const colorScale = getColorScale(colorScheme);

    // Draw leaf cells
    const cellGroups = svg.selectAll("g.cell")
        .data(leaves)
        .enter()
        .append("g")
        .attr("class", "cell");

    cellGroups.append("path")
        .attr("d", d => "M" + d.polygon.join("L") + "Z")
        .attr("class", "voronoi-cell")
        .style("fill", (d) => {
            const key = (hasGroups && d.parent && d.parent.depth > 0) ? d.parent.data.name : d.data.name;
            return colorScale(key);
        })
        .style("stroke", borderColor)
        .style("stroke-width", (borderWidth * 0.5) + "px");

    // Draw group boundaries
    if (hasGroups) {
        svg.selectAll("path.group")
            .data(groups)
            .enter()
            .append("path")
            .attr("d", d => "M" + d.polygon.join("L") + "Z")
            .style("fill", "none")
            .style("stroke", borderColor)
            .style("stroke-width", (borderWidth * 3) + "px")
            .style("pointer-events", "none");
    }

    // Labels
    const labels = cellGroups.append("text")
        .attr("x", d => d3.polygonCentroid(d.polygon)[0])
        .attr("y", d => d3.polygonCentroid(d.polygon)[1])
        .attr("class", "voronoi-label")
        .style("pointer-events", "none")
        .style("text-anchor", "middle")
        .style("font-size", d => {
            const area = Math.abs(d3.polygonArea(d.polygon));
            const size = Math.sqrt(area) * 0.12;
            return (size * labelScale) + "px";
        });

    // Name
    labels.append("tspan")
        .attr("x", d => d3.polygonCentroid(d.polygon)[0])
        .attr("dy", showValues ? "-0.6em" : "0.3em")
        .text(d => d.data.name);

    // Value and Percentage
    if (showValues) {
        labels.append("tspan")
            .attr("x", d => d3.polygonCentroid(d.polygon)[0])
            .attr("dy", "1.2em")
            .style("font-size", "0.8em")
            .style("opacity", 0.8)
            .text(d => {
                const percent = (d.value / totalValue * 100).toFixed(1);
                return `${d.value} (${percent}%)`;
            });
    }

    // Tooltip
    cellGroups.append("title")
        .text(d => {
            const group = hasGroups && d.parent ? `(${d.parent.data.name}) ` : "";
            return `${d.data.name} ${group}: ${d.value} (${(d.value / totalValue * 100).toFixed(2)}%)`;
        });

    // Legend
    if (showLegend && (hasGroups || leaves.length > 0)) {
        const legendData = hasGroups ?
            groups.map(g => g.data.name) :
            leaves.map(l => l.data.name);

        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(20, 20)`);

        const legendItems = legend.selectAll(".legend-item")
            .data(legendData)
            .enter()
            .append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(0, ${i * 25})`); // Increased spacing

        legendItems.append("rect")
            .attr("width", 18) // Increased from 15
            .attr("height", 18) // Increased from 15
            .attr("rx", 4)
            .style("fill", d => colorScale(d));

        legendItems.append("text")
            .attr("x", 25)
            .attr("y", 14)
            .style("font-size", "14px") // Increased from 12px
            .style("fill", borderColor === '#ffffff' ? '#ffffff' : '#333')
            .style("font-weight", "500")
            .text(d => d);

        // Ensure white text if dark background, etc. 
        // Better: use CSS for legend text.
    }
}


function getColorScale(scheme) {
    const tableau20 = [
        '#4e79a7', '#a0cbe8', '#f28e2c', '#ffbe7d', '#59a14f', '#8cd17d', '#b6992d', '#f1ce63', '#499894', '#86bcb6',
        '#e15759', '#ff9d9a', '#79706e', '#bab0ac', '#d37295', '#fabfd2', '#b07aa1', '#d4a5c9', '#9c755f', '#d7b5a2'
    ];

    const category20 = [
        '#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78', '#2ca02c', '#98df8a', '#d62728', '#ff9896', '#9467bd', '#c5b0d5',
        '#8c564b', '#c49c94', '#e377c2', '#f7b6d2', '#7f7f7f', '#c7c7c7', '#bcbd22', '#dbdb8d', '#17becf', '#9edae5'
    ];

    switch (scheme) {
        case 'category10':
            return d3.scaleOrdinal(category20);
        case 'pastel1':
            return d3.scaleOrdinal(d3.schemePastel1);
        case 'dark':
            const darkColors = ['#1f2937', '#374151', '#4b5563', '#6b7280', '#111827', '#030712', '#1f2937', '#4b5563', '#312e81', '#1e1b4b', '#1e3a8a', '#172554', '#14532d', '#052e16', '#713f12', '#451a03', '#7f1d1d', '#450a0a', '#701a75', '#4a044e'];
            return d3.scaleOrdinal(darkColors);
        case 'cool':
            return d3.scaleOrdinal(d3.quantize(d3.interpolateCool, 20));
        case 'warm':
            return d3.scaleOrdinal(d3.quantize(d3.interpolateWarm, 20));
        case 'tableau10':
        default:
            return d3.scaleOrdinal(tableau20);
    }
}
