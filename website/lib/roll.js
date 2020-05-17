/**
 * Represent a timelapse of datapoints per year.
 */
class Roll{
    /**
     * 
     * @param { parent class } parent 
     * @param { data specific to roll } data 
     * @param { svg id to plot on } svg 
     * @param { name of the data type (for axis) } type 
     * @param { name of the attribute on y axis} y_attribute 
     * @param { means per year wrt y_axis } means 
     */
    constructor(parent, data, svg, type, y_attribute, means){
        this.means = means
        this.parent = parent
        this.svg = d3.select('#' + svg)
        this.type = type
        this.data = data
        this.y_attribute = y_attribute
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
        //point radius
        this.RADIUS = 7
        //size of the infobox
        this.info_box_height = 80
        this.info_box_width = 120

        //scalings
        //right x padding
        this.W = this.WIDTH - this.X0
        //x scaling
        this.x = d3.scaleLinear()
                    .domain([this.parent.year0, this.parent.year0 - this.parent.window])
                    .range([this.X0, this.W])

        //right padding
        let min = d3.min(this.data, d => d[this.y_attribute])
        let max = d3.max(this.data, d => d[this.y_attribute])
        let padding = (this.AXIS_HEIGHT - this.label_height) * 0.1
        this.y = d3.scaleLinear()
            .domain([min, max])
            .range([this.AXIS_HEIGHT, this.label_height + padding])
        
        //drawn background color
        this.draw_background()

        this.g_width = Math.ceil(this.WIDTH * this.parent.oldest / this.parent.window)

        //scale to place the current g
        this.year_to_x_for_g = d3.scaleLinear()
                            .domain([this.parent.oldest, this.parent.window]) //try 2
                            .range([this.X0, this.W - this.g_width])

        //g containing the circles
        this.circles = this.svg.append('g')
                                .attr('width', this.g_width)
                                .attr('height', this.AXIS_HEIGHT - this.label_height)
                                .attr('transform', `translate(${this.year_to_x_for_g(this.parent.year0)}, ${this.label_height})`)

        
        // //finds current index and sets buffer
        this.set_current()
        this.update_current()
        // //draws all the points
        this.update_points()
        // //draws the axis
        this.draw_axis()
        // //draws the labels
        this.draw_label()

        this.info_rect = this.circles.append('g')
                        .attr('class', 'info_box')
                        .attr('height', this.info_box_height)
                        .style('opacity', 0)
    }

    /**
     * finds the current index
     */
    set_current(){
        let i = 0
        while(this.means[i].key >= this.parent.year0 & i < this.means.length){
            i++
        }
        this.current = i
    }
    /**
     * searches for all the points that should be displayed and puts them in the buffer
     */
    update_current(){
        while(this.means[this.current].key >= this.parent.year0 - this.parent.window){  //if before end of window
            if(this.means[this.current].key <= this.parent.year0){      //if after start of window
                this.buffer.push(this.means[this.current])
                this.current = this.current + 1                                       //add point to buffer
            }

        }
    }
    on(){
        this.circles.transition()
            .duration(this.parent.speed * (this.parent.year0 - this.parent.window))
            .ease(d3.easeLinear)
            .attr('transform', `translate(${-this.g_width + this.W}, ${this.label_height})`)
    }
    off(){
        this.circles.transition().duration(0)
    }

    /**
     * draws the points that are in the interval [year0, year0 - YEAR_WINDOW]
     */
    draw_points(){
        let c = this.circles.selectAll('circle')
            .data(this.buffer)

        c.enter()
            .append('circle')
            .merge(c)
                .attr('cy', d => this.y(d.value.mean) - this.label_height)
                .attr('cx', d => this.x(d.key) - this.year_to_x_for_g(this.parent.year0))
                .attr('r', this.RADIUS)
                .attr('class','roll_points')
            
        c.exit()
                .remove()
        
        //adds the hover function displaying more information on the point
        const classReference = this
        this.circles.selectAll('circle')
            .each(function(point_data){classReference.add_hover_function(this, point_data)})
    }
    /**
     * updates the points according to the current year
     */
    update_points(){
        //first finds the current elements in the buffer 
        while(this.current < this.means.length - 2){
            if(this.means[this.current].key == this.parent.year0 - this.parent.window){
                this.buffer.push(this.means[this.current])
                this.current = this.current+1
            }else{
                break
            }
        }

                //adds all the circles
        let c = this.circles.selectAll('circle')
                .data(this.buffer)

        c.enter()
            .append('circle')
                .merge(c)
                .attr('cy', d => this.y(d.value.mean) - this.label_height)
                .attr('cx', d => this.x(d.key) - this.year_to_x_for_g(this.parent.year0))
                .attr('r', this.RADIUS)
                .attr('class','roll_points')

        this.buffer = this.buffer.filter(d => d.key < this.parent.year0 - 2)

        c.exit()
            .remove()


        const classReference = this
        this.circles.selectAll('circle')
        .each(function(point_data){classReference.add_hover_function(this, point_data)})
    }


    add_hover_function(circle, point_data){
        const classReference = this
        d3.select(circle).on('mouseover', function(){
            d3.select(this).style('fill','rgba(250,0,0,0.7)')
            let info_box = classReference.info_rect
            info_box.text('')
            let a = classReference.x(point_data.key)
            let x = this.cx.animVal.value
            let y = this.cy.animVal.value
            if(y - classReference.info_box_height < 0){
                 info_box.attr('transform', `translate(${x}, ${y})`)
            }else{
                 info_box.attr('transform', `translate(${x}, ${y - classReference.info_box_height})`)
            }
            if(a + classReference.info_box_width > classReference.WIDTH){
                info_box.attr('transform', `translate(${x - classReference.info_box_width}, ${y})`)
            }
            info_box.append('rect')
                .attr('width',classReference.info_box_width)
                .attr('height', classReference.info_box_height)
                .attr('rx', 10)

            let text = info_box.append('text')
                .attr('x', '5px')
                .attr('dy', 0)
                .attr('y', '10')

            text.append('tspan')
                .text(`Year: ${2018 - point_data.key}`)
                .attr('dy', `${classReference.info_box_height/5}`)
                .attr('x', `${classReference.info_box_width/2}`)
                
            text.append('tspan')
                .text(`Mean: ${point_data.value.mean}`)
                .attr('dy', `${classReference.info_box_height/2}`)
                .attr('x', `${classReference.info_box_width/2}`)
            
            info_box.transition()
                .duration(500)
                .style('opacity',0.6)
                .style('visibility','visible')

        })//what happens when unhovering of a point
        .on('mouseout', function(){
            d3.select(this)
                .style('fill', 'rebeccapurple')
            classReference.info_rect.transition()
                            .duration(300)
                            .style('opacity', 0)
                            .style('visibility','hidden')
        })
    }

    draw_axis(){
        //axis
        this.x.domain([this.parent.year0, this.parent.year0 - this.parent.window])
        let axis_left = d3.axisLeft(this.y)
                            .ticks(4)
        this.svg.append('g')
            .attr('transform', `translate(${this.X0}, 0)`)
            .attr('class', 'axis_y')
            .call(axis_left)

        // this.axis_bottom = d3.axisBottom(this.x)
        //         .ticks(10)
        //         .tickFormat(d => 2018 - d)

        // this.axis_x = this.svg.append('g')
        //     .attr('transform', `translate(0, ${this.AXIS_HEIGHT})`)
        //     .attr('class', 'axis_x')
        //     .call(this.axis_bottom)



    }

    update_axis(){
        this.x.domain([this.parent.year0, this.parent.year0 - this.parent.window])
        // this.axis_x.transition()
        //     .ease(d3.easeLinear)
        //     .duration(this.parent.speed)
        //     .call(this.axis_bottom)
    }

    draw_label(){

        this.svg.append('path')
            .attr('d', `M-5 -5 L${this.WIDTH - 15} 0 Q${this.WIDTH} 0 ${this.WIDTH} ${this.label_height} L-5 ${this.label_height} Z`)
            .style('fill', 'red')


        this.svg.append('text')
            .attr('x', `${this.X0 - 30}`)
            .attr('text-anchor', 'left')
            .attr('y', this.label_height - 15)
            .attr('class','roll_label')
            .text(`Mean per year of ${this.y_attribute.toLowerCase()} for ${this.type}`)

    }
    
    draw_background(){
        this.svg.append('rect')
            .attr('y', `${this.label_height - 5}`)
            .attr('x', -5)
            .attr('width', `${this.WIDTH}`)
            .attr('height', '100%')
            .style('fill','rgba(0,0,0,0.7)')
    }

}
