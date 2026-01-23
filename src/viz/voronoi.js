import * as d3 from 'd3';
import { voronoiTreemap } from 'd3-voronoi-treemap';

export function renderVoronoiTreemap(data, containerId, colorScheme = 'tableau10') {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear previous
    container.innerHTML = '';

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Circular Clipping
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) / 2 - 10; // 10px padding
    const nPoints = 100;
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

    // Voronoi Treemap computation
    const _voronoiTreemap = voronoiTreemap()
        .clip(clipPolygon);

    _voronoiTreemap(hierarchy);

    const allNodes = hierarchy.descendants();
    // We primarily want to draw the leaf nodes (the actual items)
    // But we might want to draw group boundaries too.
    const leaves = allNodes.filter(d => d.height === 0);
    const groups = allNodes.filter(d => d.depth === 1 && d.height > 0);

    const svg = d3.select("#" + containerId)
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Draw leaf cells
    const cellGroups = svg.selectAll("g.cell")
        .data(leaves)
        .enter()
        .append("g")
        .attr("class", "cell");

    // Create color scale once
    const colorScale = getColorScale(colorScheme);

    cellGroups.append("path")
        .attr("d", d => "M" + d.polygon.join("L") + "Z")
        .attr("class", "voronoi-cell")
        .style("fill", (d) => {
            const key = (hasGroups && d.parent && d.parent.depth > 0) ? d.parent.data.name : d.data.name;
            return colorScale(key);
        })
        .style("stroke", "#fff")
        .style("stroke-width", "0.5px");

    // Draw group boundaries (optional, thicker stroke)
    if (hasGroups) {
        svg.selectAll("path.group")
            .data(groups)
            .enter()
            .append("path")
            .attr("d", d => "M" + d.polygon.join("L") + "Z")
            .style("fill", "none")
            .style("stroke", "#333")
            .style("stroke-width", "1.5px")
            .style("pointer-events", "none");
    }

    // Labels
    cellGroups.append("text")
        .attr("x", d => d3.polygonCentroid(d.polygon)[0])
        .attr("y", d => d3.polygonCentroid(d.polygon)[1])
        .attr("class", "voronoi-label")
        .text(d => d.data.name)
        .style("pointer-events", "none")
        .style("text-anchor", "middle")
        .style("font-size", d => Math.min(12, Math.sqrt(d.polygonSite.weight) * 2) + "px") // simple scaling
        .style("fill", (d) => {
            // Adapt text color to background if it's very dark
            if (colorScheme === 'dark') return '#fff';
            return '#333';
        });

    // Tooltip
    cellGroups.append("title")
        .text(d => {
            const group = hasGroups && d.parent ? `(${d.parent.data.name}) ` : "";
            return `${d.data.name} ${group}: ${d.value}`;
        });
}

function getColorScale(scheme) {
    switch (scheme) {
        case 'category10':
            return d3.scaleOrdinal(d3.schemeCategory10);
        case 'pastel1':
            return d3.scaleOrdinal(d3.schemePastel1);
        case 'dark':
            const darkColors = ['#1f2937', '#374151', '#4b5563', '#6b7280', '#111827'];
            return d3.scaleOrdinal(darkColors);
        case 'cool':
            return d3.scaleOrdinal(d3.quantize(d3.interpolateCool, 10));
        case 'warm':
            return d3.scaleOrdinal(d3.quantize(d3.interpolateWarm, 10));
        case 'tableau10':
        default:
            return d3.scaleOrdinal(d3.schemeTableau10);
    }
}
