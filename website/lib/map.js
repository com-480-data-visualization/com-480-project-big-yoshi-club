class Map {
    constructor(parent, svg_element_id, data, time_accessor) {
        this.parent = parent;
        this.data = _.clone(data)
        //keep only earthquakes with magnitude > 0
        this.data[1] = this.data[1].filter(function (d) { if (parseFloat(d.Magnitude) > 5.9) { return d } })

        //filter more data if needed per year
        let y = 0
        let c = 0
        this.data[1] = this.data[1].filter(function(d) {
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
        

        //keep 1 out of 10 meteors
        
        this.data[2] = this.data[2].filter(function (d) {
            let rand = Math.random() <= 0.1 //probability to keep row
            if (rand) {
                return d
            }
        })
        
        
        console.log(this.data[0].length, this.data[1].length, this.data[2].length)
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

        while (this.current[idx] < this.data[idx].length) {

            if ((this.data[idx][this.current[idx]][this.time_accessor[idx]] >= this.parent.year0 - this.parent.window) &&
                (this.data[idx][this.current[idx]][this.time_accessor[idx]] <= this.parent.year0)) {

                
                this.buffer[idx].push(this.data[idx][this.current[idx]])
                this.current[idx] = this.current[idx] + 1 //add point to buffer
            } else {
                break
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
            while (this.current[idx] < this.data[idx].length) {

                if ((this.data[idx][this.current[idx]][this.time_accessor[idx]] >= this.parent.year0 - this.parent.window) &&
                    (this.data[idx][this.current[idx]][this.time_accessor[idx]] <= this.parent.year0)) {
                
                    this.buffer[idx].push(this.data[idx][this.current[idx]])
                    this.current[idx] = this.current[idx] + 1
                } else {
                    break
                }
            }
            var l = this.buffer[idx].length
            this.buffer[idx] = this.buffer[idx].filter(function (d) {
                let rand = Math.random() <= 120/ l //probability to keep row
                if (rand) {
                    return d
                }
            })
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


        let group = d3.nest()
            .key(d => d[x_val])
            .rollup((v) => {

                return {
                    count: v.length
                }

            })
            .entries(data)

        this.keys = group.map(g => g.key)
        let vals = group.map(g => g.value.count)

        this.x_value_range = [0, this.keys.length];
        let y_value_range = [0, d3.max(vals)];


        this.pointX_to_svgX = d3.scaleLinear()
            .domain(this.x_value_range)
            .range([50, this.svg_width - 20]);

        let pointY_to_svgY = d3.scaleLinear()
            .domain(y_value_range)
            .range([this.svg_height-20, 10]);


        let xAxisTranslate = this.svg_height - 20;


        let x_axis = d3.axisBottom()
            .scale(this.pointX_to_svgX);
        
        let y_axis = d3.axisLeft()
            .scale(pointY_to_svgY);

        this.svg.append('g')
            .attr("class", "x axis")
            .style('font', '14px times')

            .attr("transform", "translate(0, " + xAxisTranslate + ")")
            .style('color', d3.color('white'))
            .call(x_axis);
 

        this.svg.append("g")
            .attr('class', 'y_axis')
            .style('color', d3.color('white'))
            .style('font', '14px times')
            .attr("transform", "translate(50, 0)")
            .call(y_axis);
    }

    draw_hist(data) {
        if (data.length > 0) {


            this.svg.selectAll("rect.statis").remove()
            this.svg.selectAll('g.y_axis').remove()
            const x_val = this.x_val

            let group = d3.nest()
                .key(d => d[x_val])
                .rollup((v) => {
                    return {
                        count: v.length
                    }
                })
                .entries(data)

            let vals = group.map(g => g.value.count)
            
            


            let y_value_range = [0, d3.max(vals)];
            let pointY_to_svgY = d3.scaleLinear()
                .domain(y_value_range)
                .range([this.svg_height-20, 10]);        
            

            var y_axis = d3.axisLeft()
                .scale(pointY_to_svgY);

            this.svg.append("g")
                .attr('class', 'y_axis')
                .style('color', d3.color('white'))
                .style('font', '14px times')
                .attr("transform", "translate(50, 0)")
                .call(y_axis);

            this.svg.selectAll("rect")
                .data(group)
                .enter()
                .append("rect")
                .attr('class', 'statis')
                .attr('fill', d3.color('white'))
                .attr('width', 3)
                .attr('height', d => pointY_to_svgY(d.value.count))
                .attr('transform', d => 'translate(' + this.pointX_to_svgX(this.keys.indexOf(d.key)) + ','+  (this.svg_height - 20) + ') scale(1, -1)' ) 
                
            /* if want to go back
            this.svg.selectAll("circle")
                .data(group)
                .enter()
                .append("circle")
                .attr("r", 3) // radius
                .attr("cx", d => this.pointX_to_svgX(this.keys.indexOf(d.key))) // position, rescaled
                .attr("cy", d => pointY_to_svgY(d.value.count))
                .attr('fill', d3.color('white'))
            */
        } else {
            this.svg.selectAll("rect.statis").remove()
        }
    }



}

