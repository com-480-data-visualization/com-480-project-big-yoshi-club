class Map {
    constructor(parent, svg_element_id, data, time_accessor) {
        this.parent = parent;


        this.data = data
        this.buffer = [[],[],[]]
        this.current = [0,0,0]
        
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
            this.draw_map()

            
            this.data.forEach((_, idx) => {
                this.set_current(idx)
                this.update_current(idx)
            });
            
            

        })


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
            .scale(180)
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

    update_current(idx) {     
        
        while (this.data[idx][this.current[idx]][this.time_accessor[idx]] >= this.parent.year0 - this.parent.window) {  //if before end of window
            if (this.data[idx][this.current[idx]][this.time_accessor[idx]] <= this.parent.year0) {      //if after start of window
                this.buffer[idx].push(this.data[idx][this.current[idx]])
                this.current[idx] = this.current[idx] + 1                                       //add point to buffer
            }
        }

    }

    set_current(idx) {
        let i = 0
        
        while (this.data[idx][i][this.time_accessor[idx]] >= this.parent.year0 & i < this.data[idx].length) {
            i++
        }
        this.current[idx] = i
    }
    draw_points(i) {
        const r = 3;
        const projection = this.projection_style
            .rotate([0, 0])
            .center([0, 0])
            .scale(180)
            .translate([this.svg_width / 2, this.svg_height / 2])
            .precision(0.1)

        const colors = ['yellow', 'blue', 'green']
        this.point_container.selectAll(".point")
            .data(this.buffer[i])
            .enter()
            .append("circle")
            .classed("point", true)
            .attr("r", r)
            .attr("cx", -r)
            .attr("cy", -r)
            .style("fill", d3.color(colors[i]))
            .attr("transform", (d) => "translate(" + projection([d.Longitude, d.Latitude]) + ")");
        
    }

    update_points(){
        const r = 3;
        const colors = ['yellow', 'blue', 'green']
        const projection = this.projection_style
            .rotate([0, 0])
            .center([0, 0])
            .scale(180)
            .translate([this.svg_width / 2, this.svg_height / 2])
            .precision(0.1)
        this.buffer.forEach((_, idx) => {
            if(this.current[idx] < this.data[idx].length){
                while(this.data[idx][this.current[idx]][this.time_accessor[idx]] == this.parent.year0 - this.parent.window){
                    this.buffer[idx].push(this.data[idx][this.current[idx]])
                    this.current[idx] = this.current[idx]+1
                }
            }
           
            this.point_container.selectAll(".point")
            .data(this.buffer[idx])
            .enter()
            .append("circle")
            .classed("point", true)
            .attr("r", r)
            .attr("cx", -r)
            .attr("cy", -r)
            .style("fill", d3.color(colors[idx]))
            .attr("transform", (d) => "translate(" + projection([d.Longitude, d.Latitude]) + ")")
            .transition()
                    .style('opacity', 1)
                    .ease(d3.easeLinear)
                    .duration(this.parent.speed*10)
            .transition()
                    .style('opacity', 0)
                    .ease(d3.easeLinear)
                    .duration(this.parent.speed* this.parent.window*1.3 - this.parent.speed*10)
                    .on('end', () => {
                        this.buffer[idx].shift()
                    })
                    .remove()
        })
    }
    update_projection() {

        this.svg.selectAll('g').remove()

        this.draw_map()

        this.data.forEach((_, idx) => {
            this.set_current(idx)
            this.update_current(idx)
            //this.draw_points(idx)
        });
        
        
    }

    stop_fade(){
        this.point_container.selectAll('.point')
            .transition()
            .duration(0)
    }


}
