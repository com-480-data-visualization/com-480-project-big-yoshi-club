class Map {
    constructor(parent, svg_element_id, data, time_accessor) {
        this.parent = parent;
        //keep only earthquakes with magnitude > 0
        data[1] = data[1].filter(function (d) { if (parseFloat(d.Magnitude) > 6.2) { return d } })

        /* filter more data if needed per year
        let y = 0
        let c = 0
        console.log(data[1].length)
        data[1] = data[1].filter(function(d) {
            if (d.Date > y) {
                 y = d.Date
                 c = 0
            } else if(d.Date == y) {
                c += 1
            }
            if (c < 120){
                return d
            }
        })
        console.log(data[1].length)
        */

        //keep 1 out of 10 meteors

        data[2] = data[2].filter(function (d) {
            let rand = Math.random() <= 0.1 //probability to keep row
            if (rand) {
                return d
            }
        })
        this.data = data

        this.buffer = [[], [], []]
        this.current = [0, 0, 0]

        this.time_accessor = time_accessor

        //projection params
        this.projection_style = d3.geoNaturalEarth1();
        this.PROJECT_SCALE = 180


        //brush
        this.brush = d3.brush().on("end", () => {
            this.selection = d3.event.selection;
            this.get_points(this.selection);
        });


        this.svg = d3.select('#' + svg_element_id);
        const svg_viewbox = this.svg.node().viewBox.animVal;
        this.svg_width = svg_viewbox.width;
        this.svg_height = svg_viewbox.height;
        this.svg.append('rect')
            .attr('fill', 'rgba(0,0,0,0.7)')
            .attr('width', `${this.svg_width}`)
            .attr('height', `${this.svg_height}`)



        const map_promise = d3.json("data/countries.json").then((topojson_raw) => {
            const country_path = topojson.feature(topojson_raw, topojson_raw.objects.countries);
            return country_path.features;
        });

        //when map loaded draw map and for each data compute current points for buffer
        Promise.all([map_promise]).then((results) => {

            this.map_data = results[0];
            this.draw_map()



            this.data.forEach((_, idx) => {

                this.set_current(idx)
                this.update_current(idx)
                this.draw_points(idx)
            });
        })


    }

    get_points(selection) {
        //selection [[x_min, y_min], [x_max, y_max]]    
        const projection = this.projection_style
            .rotate([0, 0])
            .center([0, 0])
            .scale(this.PROJECT_SCALE)
            .translate([this.svg_width / 2, this.svg_height / 2])
            .precision(0.1)

        let min = projection.invert(selection[0])
        let max = projection.invert(selection[1])

        let lat_min = 0
        let lat_max = 0
        let lon_min = 0
        let lon_max = 0
        if (min[0] < max[0]) {
            lon_min = min[0]
            lon_max = max[0]
        } else {
            lon_min = max[0]
            lon_max = min[0]
        }
        if (min[1] < max[1]) {
            lat_min = min[1]
            lat_max = max[1]
        } else {
            lat_min = max[1]
            lat_max = min[1]
        }

        //get all points between min and max
        this.buffer.forEach((_, idx) => {
            var selected = this.buffer[idx].filter(function (d) {

                if (d.Latitude <= lat_max && d.Latitude >= lat_min &&
                    d.Longitude <= lon_max && d.Longitude >= lon_min) {
                    return d
                }
            })

            this.parent.stats[idx].draw_hist(selected)
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
            .scale(this.PROJECT_SCALE)
            .translate([this.svg_width / 2, this.svg_height / 2])
            .precision(0.1)

        const path_generator = d3.geoPath()
            .projection(projection);

        this.map_container = this.svg.append('g');

        this.svg.append("g") // this group with class .brush will be the visual indicator of our brush
            .attr("class", "brush")

            .call(this.brush);

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

        while (this.data[idx][i][this.time_accessor[idx]] >= this.parent.year0 & i < this.data[idx].length - 2) {
            i++
        }
        this.current[idx] = i
    }
    draw_points(i) {
        const r = 3;
        const projection = this.projection_style
            .center([0, 0])
            .scale(this.PROJECT_SCALE)
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
            .style('opacity', 1)
            .attr("transform", (d) => "translate(" + projection([d.Longitude, d.Latitude]) + ")");

    }

    update_points() {
        const r = 3;
        const colors = ['yellow', 'blue', 'green']
        const projection = this.projection_style
            .center([0, 0])
            .scale(this.PROJECT_SCALE)
            .translate([this.svg_width / 2, this.svg_height / 2])
            .precision(0.1)

        this.buffer.forEach((_, idx) => {
            if (this.current[idx] < this.data[idx].length - 2) {

                while (this.data[idx][this.current[idx]][this.time_accessor[idx]] == this.parent.year0 - this.parent.window) {
                    this.buffer[idx].push(this.data[idx][this.current[idx]])
                    this.current[idx] = this.current[idx] + 1
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
                .duration(this.parent.speed * 10)
                .transition()
                .style('opacity', 0)
                .ease(d3.easeLinear)
                .duration(this.parent.speed * this.parent.window * 1.3 - this.parent.speed * 10)
                .on('end', () => {
                    this.buffer[idx].shift()
                })
                .remove()
        })
        if (this.selection != null) {
            this.get_points(this.selection);
        }
    }
    update_projection() {

        this.svg.selectAll('g').remove()

        this.draw_map()

        this.data.forEach((_, idx) => {
            this.set_current(idx)
            this.update_current(idx)
        });


    }

    stop_fade() {
        this.point_container.selectAll('.point')
            .transition()
            .duration(0)
    }





}

class Statistics {
    constructor(parent, svg_element_id, data, y_val, x_val) {
        this.parent = parent;

        this.y_val = y_val
        this.x_val = x_val
        this.data = data
        this.svg = d3.select('#' + svg_element_id);
        const svg_viewbox = this.svg.node().viewBox.animVal;
        this.svg_width = svg_viewbox.width;
        this.svg_height = svg_viewbox.height;
        this.svg.append('rect')
            .attr('fill', 'rgba(0,0,0,0.7)')
            .attr('width', `${this.svg_width}`)
            .attr('height', `${this.svg_height}`)

        this.svg.append('g')
            .attr('x', 10)
            .attr('y', 10);

        

        let group = d3.nest()
            .key(d => d[x_val])
            .rollup((v) => {
                return {
                    mean: d3.mean(v, d => d[y_val])
                }
            })
            .entries(data)

        let keys = group.map(g => g.key)


        let x_value_range = [0, keys.length];


        let pointX_to_svgX = d3.scaleLinear()
            .domain(x_value_range)
            .range([0, this.svg_width]);

        
        let xAxisTranslate = this.svg_height / 2;


        let x_axis = d3.axisBottom()
            .scale(pointX_to_svgX);

        this.svg.append('g')
            .style('font', '14px times')
            
            .attr("transform", "translate(50, " + xAxisTranslate + ")")
            .style('color', d3.color('white'))
            .call(x_axis);
        //this.draw_hist(this.data)
    }

    draw_hist(data) {
        if (data.length > 1) {


            this.svg.selectAll("circle").remove()
            const x_val = this.x_val
            const y_val = this.y_val

            let group = d3.nest()
                .key(d => d[x_val])
                .rollup((v) => {
                    return {
                        mean: d3.mean(v, d => d[y_val])
                    }
                })
                .entries(data)

            let keys = group.map(g => g.key)
            let vals = group.map(g => g.value.mean)


            let x_value_range = [0, keys.length];

            let y_value_range = [d3.min(vals), d3.max(vals)];

            let pointX_to_svgX = d3.scaleLinear()
                .domain(x_value_range)
                .range([0, this.svg_width]);

            let pointY_to_svgY = d3.scaleLinear()
                .domain(y_value_range)
                .range([this.svg_height, 0]);

            
           
            this.svg.selectAll("circle")
                .data(group)
                .enter()
                .append("circle")
                .attr("r", 3) // radius
                .attr("cx", d => pointX_to_svgX(keys.indexOf(d.key))) // position, rescaled
                .attr("cy", d => pointY_to_svgY(d.value.mean))
                .attr('fill', d3.color('white'))

        }
    }



}

