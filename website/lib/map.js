class Map {
    constructor(svg_element_id, data, projection_style) {
        this.svg = d3.select('#' + svg_element_id);
        const svg_viewbox = this.svg.node().viewBox.animVal;
        this.svg_width = svg_viewbox.width;
        this.svg_height = svg_viewbox.height;
        this.svg.append('rect')
            .attr('fill', 'rgb(140,30,30)')
            .attr('width', `${this.svg_width}`)
            .attr('height', `${this.svg_height}`)

        function silly_color(name) {
            if (name[0] == "A") {
                return d3.color("rgb(255, 0,0)")
            } else {
                return d3.color("rgb(205, 0,10)")
            }
        }
        const projection = projection_style
            .rotate([0, 0])
            .center([0, 0])
            .scale(200)
            .translate([this.svg_width / 2, this.svg_height / 2])
            .precision(0.1)

        const path_generator = d3.geoPath()
            .projection(projection);

        const map_promise = d3.json("data/countries.json").then((topojson_raw) => {
            const country_path = topojson.feature(topojson_raw, topojson_raw.objects.countries);
            return country_path.features;
        });

        Promise.all([map_promise]).then((results) => {

            let map_data = results[0];
            let volcanoes = data[0]
            let earthquakes = data[1]
            let meteors = data[2]
            

            this.map_container = this.svg.append('g');
            this.map_container.selectAll(".country")
                .data(map_data)
                .enter()
                .append("path")
                .classed("country", true)
                .attr("d", path_generator)
                .style("fill", (d) => silly_color(d.properties.name))




            const r = 3;
            this.volcano_container = this.svg.append("g");
            this.volcano_container.selectAll(".point")
                .data(volcanoes)
                .enter()
                .append("circle")
                .classed("point", true)
                .attr("r", r)
                .attr("cx", -r)
                .attr("cy", -r)
                .style("fill", d3.color("blue"))
                .attr("transform", (d) => "translate(" + projection([d.Longitude, d.Latitude]) + ")");

            this.earthquake_container = this.svg.append("g");
            this.earthquake_container.selectAll(".point")
                .data(earthquakes)
                .enter()
                .append("circle")
                .classed("point", true)
                .attr("r", r)
                .attr("cx", -r)
                .attr("cy", -r)
                .attr("transform", (d) => "translate(" + projection([d.Longitude, d.Latitude]) + ")");

            this.meteor_container = this.svg.append("g");
            this.meteor_container.selectAll(".point")
                .data(meteors)
                .enter()
                .append("circle")
                .classed("point", true)
                .attr("r", r)
                .attr("cx", -r)
                .attr("cy", -r)
                .attr("transform", (d) => "translate(" + projection([d.Longitude, d.Latitude]) + ")");
        });
    }


}
/*
function whenDocumentLoaded(action) {
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", action);
	} else {
		// `DOMContentLoaded` already fired
		action();
	}
}
whenDocumentLoaded(() => {
	plot_object = new Map('map');
	// plot object is global, you can inspect it in the dev-console
});
*/