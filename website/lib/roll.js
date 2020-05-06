class Roll{
    /**
     * 
     * @param {parent object managing time and data} parent 
     * @param {data to be displayed} data 
     * @param {svg of the Roll} svg 
     * @param {type of data (either 'V', 'E' or 'M')} type 
     * @param {column name for the year of the data} time_accessor 
     */
    constructor(parent, data, svg,type, time_accessor, y_attribute){
        this.parent = parent
        this.svg = d3.select('#' + svg)
        this.type = type
        this.time_accessor = time_accessor
        this.data = data
        const svg_viewbox = this.svg.node().viewBox.animVal;
        this.WIDTH = svg_viewbox.width
        this.HEIGHT = svg_viewbox.height
        this.AXIS_HEIGHT = this.HEIGHT * 0.85
        this.X0 = 55
        this.buffer = []
        this.RADIUS = 5
        this.current = 0
        this.y_attribute = y_attribute
        //this.on = false

        //scalings
        let W = this.RADIUS + this.WIDTH
        this.x = d3.scaleLinear()
                    .domain([this.parent.year0 + 5, this.parent.year0 - this.parent.window - 5])
                    .range([this.X0, W])

        this.y = d3.scaleLinear()
                .domain([d3.min(this.data, d => d[this.y_attribute]) - 100, d3.max(this.data, d=> d[this.y_attribute]) + 150])
                .range([this.AXIS_HEIGHT, 0])
                    
        this.circles = this.svg.append('g')

        this.set_current()
        this.update_current()
        this.draw_points()
        this.draw_axis()

    }

    /**
     * searches for all the points that should be displayed and puts them in the buffer
     */
    update_current(){
        while(this.data[this.current][this.time_accessor] >= this.parent.year0 - this.parent.window){  //if before end of window
            if(this.data[this.current][this.time_accessor] <= this.parent.year0){      //if after start of window
                this.buffer.push(this.data[this.current])
                this.current = this.current + 1                                       //add point to buffer
            }

        }
    }
    /**
     * finds the current index
     */
    set_current(){
        let i = 0
        while(this.data[i][this.time_accessor] >= this.parent.year0 & i < this.data.length){
            i++
        }
        this.current = i
    }

    //draws the points that are in the interval [year0, year0 - YEAR_WINDOW]
    draw_points(){
        this.circles.selectAll('circle')
            .data(this.buffer)
            .enter()
            .append('circle')
                .attr('cy', d => this.y(d[this.y_attribute]))
                .attr('cx', d => this.x(d[this.time_accessor]))
                .attr('r', this.RADIUS)
                .style('fill', 'red')
                .on('mouseover', mouseOver)
                .on('mouseout', mouseOut)
    }

    move_points(){
        this.circles.selectAll('circle')
            .transition()
            .ease(d3.easeLinear)
            .duration(d =>  this.parent.speed * (this.parent.year0 - d[this.time_accessor]))
            .attr('cx', d => this.X0)
            .on('end', () => {
                this.buffer.shift()
            })
            .remove()
    }

    stop_points(){
        this.circles.selectAll('circle')
        .transition()
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
                            .ticks(this.parent.window / 100)
        this.axis_x = this.svg.append('g')
                    .attr('transform', `translate(0, ${this.AXIS_HEIGHT})`)
                    .attr('class', 'axis_x')
                    .call(this.axis_bottom)

        this.svg.append('text')
            .attr('x', this.WIDTH/2 - 120)
            .attr('y', this.AXIS_HEIGHT + 60)
            .text('time (years before 2018)')
    }

    update_axis(){
        this.x.domain([this.parent.year0, this.parent.year0 - this.parent.window])
        this.axis_x.transition()
            .ease(d3.easeLinear)
            .duration(this.parent.speed)
            .call(this.axis_bottom)
    }

}

function mouseOver(){
    d3.select(this)
        .style('fill', 'blue')
        .attr('r', '9')
}

function mouseOut(){
    d3.select(this)
        .style('fill', 'red')
        .attr('r', '5')
}