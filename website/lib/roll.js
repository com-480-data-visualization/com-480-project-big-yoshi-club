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
        const svg_viewbox = this.svg.node().viewBox.animVal;
        this.WIDTH = svg_viewbox.width
        this.HEIGHT = svg_viewbox.height
        this.label_height = 20
        this.AXIS_HEIGHT = this.HEIGHT * 0.85
        this.X0 = 55
        this.buffer = []
        this.RADIUS = 5
        this.current = 0
        this.y_attribute = y_attribute

        this.info_rect = this.svg.append('g')
                .attr('width', '30px')
                .attr('height', '40px')
                .attr('class', 'info_box')
                .style('opacity', 0)

        //scalings
        let W = this.RADIUS + this.WIDTH
        this.x = d3.scaleLinear()
                    .domain([this.parent.year0, this.parent.year0 - this.parent.window])
                    .range([this.X0, W])

        this.y = d3.scaleLinear()
                .domain([d3.min(this.data, d => d[this.y_attribute]), d3.max(this.data, d => d[this.y_attribute])])
                .range([this.AXIS_HEIGHT - this.RADIUS, this.label_height + this.RADIUS])
                    
        this.circles = this.svg.append('g')

        this.set_current()
        this.update_current()
        this.draw_points()
        this.draw_axis()
        this.draw_label()
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


    //draws the points that are in the interval [year0, year0 - YEAR_WINDOW]
    draw_points(){
        this.circles.selectAll('circle')
            .data(this.buffer)
            .enter()
            .append('circle')
                .attr('cy', d => this.y(d.value.mean))
                .attr('cx', d => this.x(d.key))
                .attr('r', this.RADIUS)
                .style('fill', 'red')
                .on('mouseout', () => {
                    this.info_rect.transition().duration(300).style('opacity', 0)
                })
        
        const classReference = this

        this.circles.selectAll('circle')
            .each(function(point_data){
                d3.select(this).on('mouseover', function(){
                    let rect = classReference.info_rect
                    rect.text('')
                    let x = this.cx.animVal.value
                    let y = this.cy.animVal.value
                    rect.attr('transform', `translate(${x}, ${y})`)

                    rect.append('text')
                        .text(`
                        Year : ${2018 - point_data.key}
                        Mean : ${point_data.value.mean}
                        `)

                    rect.transition()
                        .duration(500)
                        .style('opacity',0.9)
                })
            })
    }

    update_points(){
        while(this.current < this.means.length - 2){
            if(this.means[this.current].key == this.parent.year0 - this.parent.window){
                this.buffer.push(this.means[this.current])
                this.current = this.current+1
            }else{
                break
            }
        }


        this.circles.selectAll('circle')
            .data(this.buffer)
            .enter()
            .append('circle')
                .attr('cy', d => this.y(d.value.mean))
                .attr('cx', d => this.x(d.key))
                .attr('r', this.RADIUS)
                .style('fill', 'red')
                .on('mouseover', this.mouseOver)
                .on('mouseout', () => {
                    this.info_rect.transition().duration(500).style('opacity', 0)
                    this.info_rect.text('')
                })
                .transition()
                    .duration(d =>  this.parent.speed * (this.parent.year0 - d.key))
                    .ease(d3.easeLinear)
                    .attr('cx', this.X0 + this.RADIUS/2)
                    .on('end', () => {
                        this.buffer.shift()
                    })
                    .remove()

        const classReference = this

        this.circles.selectAll('circle')
            .each(function(point_data){
                d3.select(this).on('mouseover', function(){
                    let rect = classReference.info_rect
                    let x = this.cx.animVal.value
                    let y = this.cy.animVal.value
                    rect.attr('transform', `translate(${x}, ${y})`)

                    rect.append('text')
                        .text(`
                        Year : ${2018 - point_data.key}
                        Mean : ${point_data.value.mean}
                        `)

                    rect.transition()
                        .duration(500)
                        .style('opacity',0.9)
                })
            })
    }

    stop_points(){
        this.circles.selectAll('circle')
            .transition()
            .duration(0)
        this.axis_x.transition()
            .duration(0)
    }
    draw_axis(){
        //axis
        this.x.domain([this.parent.year0, this.parent.year0 - this.parent.window])
        let axis_left = d3.axisLeft(this.y)
                            .ticks(5)
        this.svg.append('g')
            .attr('transform', `translate(${this.X0}, 0)`)
            .attr('class', 'axis_y')
            .call(axis_left)
        this.svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -250)
            .attr('y', -70)
            .text(this.y_attribute)

        this.axis_bottom = d3.axisBottom(this.x)
                            .ticks(10)
                            .tickFormat(d => 2018 - d)
        this.axis_x = this.svg.append('g')
                    .attr('transform', `translate(0, ${this.AXIS_HEIGHT})`)
                    .attr('class', 'axis_x')
                    .call(this.axis_bottom)


    }

    update_axis(){
        this.x.domain([this.parent.year0, this.parent.year0 - this.parent.window])
        this.axis_x.transition()
            .ease(d3.easeLinear)
            .duration(this.parent.speed)
            .call(this.axis_bottom)
    }

    draw_label(){

        this.svg.append('text')
            .attr('x', this.WIDTH/2)
            .attr('text-anchor', 'middle')
            .attr('y', this.label_height - 5)
            .style('text-decoration', 'underline')
            .text(`mean per year of ${this.y_attribute.toLowerCase()} for ${this.type}`)
    }

    mouseOver(){
        d3.select(this)
            .style('fill', 'blue')
            .attr('r', '9')
        console.log(this)
    }
    
    mouseOut(){
        d3.select(this)
            .style('fill', 'red')
            .attr('r', '5')
    }

}
