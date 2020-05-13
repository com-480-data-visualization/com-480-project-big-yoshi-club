class Map {
    constructor(parent, svg_element_id, data, time_accessor) {
        this.parent = parent;


        this.data = data
        this.buffer = []
        this.current = 0
        this.time_accessor = time_accessor


        this.projection_style = d3.geoNaturalEarth1();
        this.svg = d3.select('#' + svg_element_id);
        const svg_viewbox = this.svg.node().viewBox.animVal;
        this.svg_width = svg_viewbox.width;
        this.svg_height = svg_viewbox.height;
        this.svg.append('rect')
            .attr('fill', 'rgb(140,30,30)')
            .attr('width', `${this.svg_width}`)
            .attr('height', `${this.svg_height}`)



        const map_promise = d3.json("data/countries.json").then((topojson_raw) => {
            const country_path = topojson.feature(topojson_raw, topojson_raw.objects.countries);
            return country_path.features;
        });


        Promise.all([map_promise]).then((results) => {

            this.map_data = results[0];


            this.set_current()
            this.draw_map()
            this.update_current()
            this.draw_points()

        })



        /*

        let volcanoes = data[0]
        let earthquakes = data[1]
        let meteors = data[2]
        this.map_container = this.svg.append('g');
        this.map_container.selectAll(".country")
            .data(this.map_data)
            .enter()
            .append("path")
            .classed("country", true)
            .attr("d", path_generator)
            .style("fill", (d) => this.silly_color(d.properties.name))




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
        */
    }

    silly_color(name) {
        if (name[0] == "A") {
            return d3.color("rgb(255, 0,0)")
        } else {
            return d3.color("rgb(205, 0,10)")
        }
    }

    draw_map() {

        const projection = this.projection_style
            .rotate([0, 0])
            .center([0, 0])
            .scale(200)
            .translate([this.svg_width / 2, this.svg_height / 2])
            .precision(0.1)

        const path_generator = d3.geoPath()
            .projection(projection);

        this.map_container = this.svg.append('g');
        this.map_container.selectAll(".country")
            .data(this.map_data)
            .enter()
            .append("path")
            .classed("country", true)
            .attr("d", path_generator)
            .style("fill", (d) => this.silly_color(d.properties.name))
        this.point_container = this.svg.append("g");
    }

    update_current() {
        while (this.data[this.current][this.time_accessor] >= this.parent.year0 - this.parent.window) {  //if before end of window
            if (this.data[this.current][this.time_accessor] <= this.parent.year0) {      //if after start of window
                this.buffer.push(this.data[this.current])
                this.current = this.current + 1                                       //add point to buffer
            }
        }
    }

    set_current() {
        let i = 0
        while (this.data[i][this.time_accessor] >= this.parent.year0 & i < this.data.length) {
            i++
        }
        this.current = i
    }
    draw_points() {
        const r = 3;
        const projection = this.projection_style
            .rotate([0, 0])
            .center([0, 0])
            .scale(200)
            .translate([this.svg_width / 2, this.svg_height / 2])
            .precision(0.1)

        console.log("BUUUUUUUFFFEFRRRR", this.buffer)
        //this.buffer.forEach(dat => {
        
        this.point_container.selectAll(".point")
            .data(this.buffer)
            .enter()
            .append("circle")
            .classed("point", true)
            .attr("r", r)
            .attr("cx", -r)
            .attr("cy", -r)
            .style("fill", d3.color("yellow"))
            .attr("transform", (d) => "translate(" + projection([d.Longitude, d.Latitude]) + ")");
        //})
    }
    update_projection() {

        this.svg.selectAll('g').remove()

        this.draw_map()
        this.draw_points()
        /*
        let volcanoes = this.parent.data[0]
        let earthquakes = this.parent.data[1]
        let meteors = this.parent.data[2]

        this.draw_map()

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
            */
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