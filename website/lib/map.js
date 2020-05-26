class Map {
    constructor(parent, svg_element_id, data, time_accessor) {
        this.parent = parent;

        this.data = data
        this.classes = ['volcano', 'earthquake', 'meteor']
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
        /*
        this.svg.append('rect')
            .attr('fill', 'white')
            .attr('width', `${this.svg_width}`)
            .attr('height', `${this.svg_height}`)
        */


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
        this.year_selected = year
        this.type_id = undefined
        if (type == 'volcanoes') { this.type_id = 0 }
        else if (type == 'earthquakes') { this.type_id = 1 }
        else { this.type_id = 2 }
        this.update_points()
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
        
        this.map_container.append('path')
            .attr('fill', '#195B51')
            .attr('d', path_generator({type: "Sphere"}));

        
        this.svg.append("g") // this group with class .brush will be the visual indicator of our brush
            .attr("class", "brush")

            .call(this.brush);

        this.map_container.selectAll(".country")
            .data(this.map_data)
            .enter()
            .append("path")
            .classed("country", true)
            .attr("d", path_generator)
            .style("fill", "#195B51")
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

        while (this.data[idx][i][this.time_accessor[idx]] >= this.parent.year0 & i < this.data[idx].length) {
            i++
        }
        this.current[idx] = i
    }


    show_point_dat(point, d) {
        
        //let pos = point.lon.animVal.value
        
        const classReference = this
        
        console.log(point.getAttribute("lon"))
        let lon = point.getAttribute("lon")
        let lat = point.getAttribute('lat')
        const info_box_height = 40
        const info_box_width = 80
        let info_rect = classReference.point_container.append('g')
            .attr('class', 'info_box')

            .style('opacity', 1)
        info_rect.append('rect')
            .attr('width', info_box_width)
            .attr('height', info_box_height)
            .attr('rx', 10)
            
            .attr("transform", "translate(" + classReference.projection_style([lon, lat]) + ")")

        let text = info_rect.append('text')
            .attr('x', '5px')
            .attr('dy', 0)
            .attr('y', '10')
            .attr("font-size", "0.8em")
            .attr("transform", "translate(" + classReference.projection_style([lon, lat]) + ")")
        //paragraphs
        text.append('tspan')
            .text(`Year: ${2018 - d.date}`)
            .attr('dy', `${info_box_height / 5}`)
            .attr('x', `${info_box_width / 2}`)
        if (d.Magnitude) {
            text.append('tspan')
                .text(`:D`)
                .attr('dy', `${info_box_height / 2}`)
                .attr('x', `${info_box_width / 2}`)
        } else if (d.recclass) {
            text.append('tspan')
                .text(`-.-`)
                .attr('dy', `${info_box_height / 2}`)
                .attr('x', `${info_box_width / 2}`)
        } else {
            text.append('tspan')
                .text(`:(`)
                .attr('dy', `${info_box_height / 2}`)
                .attr('x', `${info_box_width / 2}`)
        }
        

    }

    draw_points(i) {

        const classReference = this
        const r = 3;
        const projection = this.projection_style
            .center([0, 0])
            .scale(this.PROJECT_SCALE)
            .translate([this.svg_width / 2, this.svg_height / 2])
            .precision(0.1)

        const colors = ['green', 'yellow', 'red']
        this.point_container.selectAll(".static_point" + this.classes[i])
            .data(this.buffer[i])
            .enter()
            .append("circle")
            .classed("static_point" + this.classes[i], true)
            .attr('lon', d => d.Longitude)
            .attr('lat', d => d.Latitude)
            .attr("r", d => {
                if (d['date'] == classReference.year_selected) {
                    if (i == classReference.type_id) { return 10 }
                    else { return 3 }
                }
                else { return 3 }
            })
            .attr('stroke', 'blue')
            .attr("stroke-width", d => {
                if (d['date'] == classReference.year_selected) {
                    if (i == classReference.type_id) { return 3 }
                    else { return 0 }
                }
                else { return 0 }
            })
            .attr("cx", -r)
            .attr("cy", -r)
            .style("fill", d3.color(colors[i]))
            .style('opacity', 1)
            .attr("transform", (d) => "translate(" + projection([d.Longitude, d.Latitude]) + ")")
            .on('mouseover', function (d) {
                classReference.show_point_dat(this, d)

            })
            .on('mouseout', function (d) { classReference.point_container.selectAll('g.info_box').remove() });
    }

    update_points() {
        const r = 3;
        const colors = ['green', 'yellow', 'red']
        const classReference = this
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
                .attr('lon', d => d.Longitude)
                .attr('lat', d => d.Latitude)
                .attr("r", d => {
                    if (d['date'] == classReference.year_selected) {
                        if (idx == classReference.type_id) { return 10 }
                        else { return 3 }
                    }
                    else { return 3 }
                })
                .attr('stroke', 'blue')
                .attr("stroke-width", d => {
                    if (d['date'] == classReference.year_selected) {
                        if (idx == classReference.type_id) { return 3 }
                        else { return 0 }
                    }
                    else { return 0 }
                })
                .attr("cx", -r)
                .attr("cy", -r)
                .style("fill", d3.color(colors[idx]))
                .attr("transform", (d) => "translate(" + projection([d.Longitude, d.Latitude]) + ")")
                .on('mouseover', function (d) {
                    classReference.show_point_dat(this, d)

                })
                .on('mouseout', function (d) { classReference.point_container.selectAll('g.info_box').remove() })
                .transition()
                .style('opacity', 1)
                .ease(d3.easeLinear)
                .duration(this.parent.speed * 10)
                .transition()
                .style('opacity', 0)
                .ease(d3.easeLinear)
                .duration(this.parent.speed * this.parent.window * 1.3 + this.parent.speed * 3)
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



