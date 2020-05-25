class Map {
    constructor(parent, svg_element_id, data, time_accessor) {
        this.parent = parent;

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
            .attr('fill', '#404258')
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


    /**
     * 
     * @param {can either be volcanoes, earthquakes or meteors} type 
     * @param {year to be highlighted on the map} year 
     */
    highlight_points(type, year) {
        const colors = ['#F5BCF2','#8FDEB9','#F6C68D']
        let i = 0
        if(type == 'volcanoes'){i = 0}
        else if(type == 'earthquakes'){i = 1}
        else{i=2}
        this.point_container.selectAll('circle')
                            .style('fill', function(d){
                                if(d['date'] == year){
                                    return 'red'
                                }else{
                                    return colors[i]
                                }
                            })
    }
    unhighlight_points(type) {
        const colors = ['#F5BCF2','#8FDEB9','#F6C68D']
        let i = 0
        if(type == 'volcanoes'){i = 0}
        else if(type == 'earthquakes'){i = 1}
        else{i=2}
        this.point_container.selectAll('circle')
                .style('fill', colors[i])
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
            .style("fill" , "#195B51")
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

        const colors = ['#F5BCF2','#8FDEB9','#F6C68D']
        this.point_container.selectAll(".static_point")
            .data(this.buffer[i])
            .enter()
            .append("circle")
            .classed("static_point", true)
            .attr("r", r)
            .attr("cx", -r)
            .attr("cy", -r)
            .style("fill", d3.color(colors[i]))
            .style('opacity', 1)
            .attr("transform", (d) => "translate(" + projection([d.Longitude, d.Latitude]) + ")");

    }

    update_points() {
        const r = 3;
        const colors = ['#F5BCF2','#8FDEB9','#F6C68D']
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
            this.draw_points(idx)
        });


    }

    stop_fade() {
        this.point_container.selectAll('.point')
            .transition()
            .duration(0)
    }





}



