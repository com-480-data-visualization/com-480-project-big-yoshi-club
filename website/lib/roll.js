/**
 * Represent a timelapse of datapoints per year.
 */
class Roll{
    /**
     * 
     * @param {Yoshi} parent the parent classs managing time
     * @param {array} data the data relative to the specific roll
     * @param {String} svg the id of the svg that we draw on
     * @param {String} type the type of the data, either 'volcanoes', 'earthquakes' or 'meteors'
     * @param {String} y_attribute the name of the attribute displayed on the roll
     * @param {array} means the data displayed on the roll. The mean each year of the y_attribute for the data type.
     * @param {String} unit the type of unit of the y_attribute
     */
    constructor(parent, data, svg, type, y_attribute, means, unit){
        this.means = means
        this.parent = parent
        this.svg = d3.select('#' + svg)
        this.type = type
        this.data = data
        this.y_attribute = y_attribute
        this.unit = unit
        const svg_viewbox = this.svg.node().viewBox.animVal;
        //width & height of the containing svg
        this.WIDTH = svg_viewbox.width
        this.HEIGHT = svg_viewbox.height
        //buffer & index of current data
        this.buffer = []
        this.current = 0
        //--------- class constant definitions ----------
        //labels & axis height
        this.label_height = 40
        this.AXIS_HEIGHT = this.HEIGHT * 0.87
        //left axis position
        this.X0 = 65
        this.TICKS = 5
        //point radius
        this.RADIUS = 5
        //size of the infobox
        this.info_box_height = 80
        this.info_box_width = 120

        this.rgb = 'steelblue'

        if(this.type == 'volcanoes'){
            this.rgb = '#1243b5'
        }else if(this.type == 'meteors'){
            this.rgb = '#d92100'
        }else{
            this.rgb = '#ff24d7'
        }
        //scalings
        //right x padding
        this.W = this.WIDTH - this.X0

        //width of the whole roll
        this.g_width = Math.ceil(this.WIDTH * this.parent.oldest / this.parent.window)

        this.setup()
    }

    /**
     * the setup function is called when need to draw or redraw the roll. For example when the year or the data changes.
     */
    setup(){
        let min = d3.min(this.data, d => parseInt(d[this.y_attribute]))
        let max = d3.max(this.data, d => parseInt(d[this.y_attribute])) //we here assume the max is highe than 0
        let padding = (max - min) * 0.05
        this.y = d3.scaleLinear()
                .domain([min - padding, max + padding])
                .range([this.AXIS_HEIGHT, this.label_height])
        
        this.y_mirrored = d3.scaleLinear()
                .domain([min - padding, max + padding])
                .range([this.label_height, this.AXIS_HEIGHT])
        //x scaling
        this.x = d3.scaleLinear()
                    .domain([this.parent.year0, this.parent.year0 - this.parent.window])
                    .range([this.X0, this.W])

        //scale to place the current g
        this.year_to_x_for_g = d3.scaleLinear()
                .domain([this.parent.oldest, this.parent.window])
                .range([this.X0, this.W - this.g_width])
        //drawn background color
        this.draw_background()

        // //finds current index and sets buffer
        this.set_current()
        this.update_current()


        this.distribution_graph = this.svg.append('g')
                        .attr('transform', `rotate(90) translate(${this.label_height}, ${-this.X0})`)
                        .attr('width', `${this.AXIS_HEIGHT - this.label_height}`)
                        .attr('height', `${this.W / 4}`)

        this.update_graph()                            
        //g containing the circles
        this.circles = this.svg.append('g')
                        .attr('width', this.g_width)
                        .attr('height', this.AXIS_HEIGHT - this.label_height)
                        .attr('transform', `translate(${this.year_to_x_for_g(this.parent.year0)}, ${this.label_height})`)

        // //draws the axis
        this.draw_axis()
        // //draws all the points
        this.update_points()
        // //draws the labels
        this.draw_label()

        this.info_rect = this.circles.append('g')
                        .attr('class', 'info_box')
                        .attr('height', this.info_box_height)
                        .style('opacity', 0)


    }

    /**
     * finds the current index in the means data array. this.current will be set to the index corresponding to the element that has the first year inside the window.
     */
    set_current(){
        let i = 0
        if(this.means.length > 0){
            while(this.means[i].key >= this.parent.year0 & i < this.means.length){
                i++
            }
        }
        this.current = i
    }
    /**
     * searches for all the points that should be displayed and puts them in the buffer.
     */
    update_current(){
        while(this.current < this.means.length){
            if((this.means[this.current].key >= this.parent.year0 - this.parent.window) && (this.means[this.current].key <= this.parent.year0)){  
                //if before end of window
                //if after start of window
                    this.buffer.push(this.means[this.current])
                    this.current = this.current + 1                                       //add point to buffer
            }else{
                break
            }
        }
    }

    /**
     * this function is called when the roll is on. It simply gives a transition to the g holding all the points.
     */
    update_roll(){
        this.circles.transition()
            .duration(this.parent.speed)
            .ease(d3.easeLinear)
            .attr('transform', `translate(${this.year_to_x_for_g(this.parent.year0)}, ${this.label_height})`)
    }

    /**
     * basically the same method as update_current but called by update_points()
     */
    get_buffer(){
        while(this.current < this.means.length - 2){
            if(this.means[this.current].key == this.parent.year0 - this.parent.window+1){
                this.buffer.push(this.means[this.current])
                this.current = this.current+1
            }else{
                break
            }
        }
        this.buffer = this.buffer.filter(d => d.key < this.parent.year0+1)
    }
    /**
     * updates the points according to the current year. It draws and removes them accordingly.
     */
    update_points(){
        this.get_buffer()
        //adds all the circles
        let c = this.circles.selectAll('circle')
                .data(this.buffer)
        
        const classReference = this

        c.enter()
            .append('circle')
                .merge(c)
                .attr('cy', d => this.y(d.value.mean) - this.label_height)
                .attr('cx', d => this.x(d.key) - this.year_to_x_for_g(this.parent.year0))
                .attr('r', d => {
                    if(d.key == classReference.year_selected){return 10
                    }else{return this.RADIUS}
                })
                .style('fill', d => {
                    if(d.key == classReference.year_selected){return 'red'
                    }else{return this.rgb}
                })
                .style('stroke', 'blue')
                .style('stroke-width', d => {
                    if(d.key == classReference.year_selected){return 5
                    }else{ return 0}
                })
                .style('opacity', '0.8')
                .attr('class','roll_points')

        c.exit()
            .remove()



        // adds the listener for the information pannel 
        this.circles.selectAll('circle')
            .each(function(point_data){classReference.add_hover_function(this, point_data)})

        // adds the listener for the point highlight
        this.circles.selectAll('circle')
            .on('click', function(point_data){
                classReference.year_selected = parseInt(point_data.key)
                classReference.update_points()
                classReference.parent.map.highlight_points(classReference.type, parseInt(point_data.key))
            })

        
    }

    /**
     * updates the data when it has been filtered and redraws the roll.
     * @param {array} data the new data points
     * @param {array} means the new means 
     */
    update_data(data, means){
        this.means = means
        this.data = data
        this.reset()
    }

    /**
     * handles the case when a point is hovered on in the roll
     * @param {svg-circle} circle the svg element that has been hovered
     * @param {Object} point_data the data relative to the point
     */
    add_hover_function(circle, point_data){
        const classReference = this
        d3.select(circle).on('mouseover', function(){
            d3.select(this).style('fill','rgba(250,0,0,0.7)')
                           .style('cursor', 'pointer')
            let info_box = classReference.info_rect
            info_box.text('')
            let a = classReference.x(point_data.key)
            let x = this.cx.animVal.value
            let y = this.cy.animVal.value

            //if pannel too high
            if(y - classReference.info_box_height > 0){y = y - classReference.info_box_height}
            //if pannel too right
            if(a + classReference.info_box_width > classReference.WIDTH){x = x - classReference.info_box_width}
            info_box.attr('transform', `translate(${x}, ${y})`)

            info_box.append('rect')
                .attr('width',classReference.info_box_width)
                .attr('height', classReference.info_box_height)
                .attr('rx', 10)

            //text container
            let text = info_box.append('text')
                .attr('x', '5px')
                .attr('dy', 0)
                .attr('y', '10')

            //paragraphs
            text.append('tspan')
                .text(`Year: ${2018 - point_data.key}`)
                .attr('dy', `${classReference.info_box_height/5}`)
                .attr('x', `${classReference.info_box_width/2}`)
            text.append('tspan')
                .text(`Mean: ${d3.format(".0f")(point_data.value.mean)}`)
                .attr('dy', `${classReference.info_box_height/2}`)
                .attr('x', `${classReference.info_box_width/2}`)
            
            info_box.transition()
                .duration(500)
                .style('opacity', 0.9)
                .style('visibility','visible')

            
        })//what happens when unhovering of a point
        .on('mouseout', function(){
            d3.select(this)
                .style('fill', classReference.rgb)
            classReference.info_rect.transition()
                            .duration(300)
                            .style('opacity', 0)
                            .style('visibility','hidden')
        })
    }

    /**
     * handles the drawing of the x-axis, the y-axis and the horizontal lines
     */
    draw_axis(){
        //Y-axis and horizontal grid
        let axis_left = d3.axisLeft(this.y)
                            .ticks(this.TICKS)
                            .tickFormat(d => d)

        this.svg.append('g')
            .attr('transform', `translate(${this.X0}, 0)`)
            .style('font', '14px times')
            .attr('class', 'axis_y')
            .call(axis_left)

        let h_grid = d3.axisLeft(this.y)
                .tickSize(-this.W + this.X0)
                .tickFormat('')
                .ticks(this.TICKS)



        this.svg.append('g')
                .attr('transform', `translate(${this.X0}, 0)`)
                .attr('class', 'h_grid')
                .call(h_grid)


        //X-axis and vertical grid
        this.axis_bottom = d3.axisBottom(this.x)
                 .ticks(10)
                 .tickFormat(d => 2018 - d)

        this.axis_x = this.svg.append('g')
            .style('font', '14px times')
             .attr('transform', `translate(0, ${this.AXIS_HEIGHT})`)
             .attr('class', 'axis_x')
             .call(this.axis_bottom)



    }

    /**
     * updates the x-axis position according to the current time
     */
    update_axis(){
        this.x.domain([this.parent.year0, this.parent.year0 - this.parent.window])
        this.axis_x.transition()
             .ease(d3.easeLinear)
             .duration(this.parent.speed)
             .call(this.axis_bottom)
    }

    /**
     * draws the title of the roll
     */
    draw_label(){
        this.svg.append('rect')
            .attr("class", "timeline-label")
            .attr("x", "0")
            .attr("y", "0")
            .attr("width", `${this.WIDTH}`)
            .attr("height", `${this.label_height}`)

        this.svg.append('text')
            .attr('x', `${this.X0 - 30}`)
            .attr('text-anchor', 'left')
            .attr('y', this.label_height - 15)
            .attr('class','roll_label')
            .text(`Mean per year of ${this.y_attribute.toLowerCase()} of ${this.type} in ${this.unit}`)

    }
    
    /**
     * draws the colored background of the roll
     */
    draw_background(){
        this.svg.append('rect')
            .attr("class", "timeline-bg")
            .attr('y', `${this.label_height - 5}`)
            .attr('x', -5)
            .attr('width', `${this.WIDTH}`)
            .attr('height', '100%')
    }

    /**
     * reset the roll with respect to the current year, window and data.
     */
    reset(){
        this.buffer = []
        this.svg.selectAll('*').remove()
        this.setup()
    }

    /**
     * draws the distribution wrt the data, the year and the window
     */
    update_graph(){
        this.distribution_graph.selectAll('rect').remove()
        let classRef = this
        let temp = this.data.filter(d => (d['date'] < this.parent.year0) && (d['date'] > this.parent.year0 - this.parent.window)).map(d => d[classRef.y_attribute])
        if(temp.length > 0){
            this.hist = d3.histogram()
            .value(d => d)
            .domain(classRef.y.domain())
            .thresholds(classRef.y.ticks(this.TICKS * 4))

            let bins = this.hist(temp)
            let height_scale = d3.scaleLinear()
                .domain([0, d3.max(bins, b => b.length)])
                .range([0, this.W / 5])

                this.distribution_graph.selectAll("rect")
                                .data(bins)
                                .enter()
                                .append("rect")
                                    .attr("x", 1)
                                    .attr("transform", d => `translate(${classRef.y(d.x1) - classRef.label_height}, ${-height_scale(d.length)})`)
                                    .attr("width", d => classRef.y(d.x0) - classRef.y(d.x1))
                                    .attr("height", d => height_scale(d.length))
                                    .style("fill", this.rgb)
                                    .style('opacity', 0.7)
        }

    }
}
