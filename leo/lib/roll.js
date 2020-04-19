
class roll{
    constructor(data, svg){
        this.svg = d3.select('#' + svg)
        this.data = data
        const svg_viewbox = this.svg.node().viewBox.animVal;
        console.log(svg_viewbox)
        this.WIDTH = svg_viewbox.width
        this.HEIGHT = svg_viewbox.height
        this.YEAR_WINDOW = 1000
        this.TIME_WINDOW = 1000 * 5
        this.AXIS_HEIGHT = this.HEIGHT * 0.8
        this.X0 = 0
        this.current = 0
        this.buffer = []
        this.RADIUS = 5
        this.on = false

        //getting time intervals
        this.year0 = d3.max(this.data, d => parseInt(d['Last Known Eruption']))
        //scalings
        let W = this.RADIUS + this.WIDTH
        this.x = d3.scaleLinear()
                    .domain([this.year0, this.year0 - this.YEAR_WINDOW])
                    .range([this.X0, W])
        this.y = d3.scaleLinear()
                    .domain([d3.min(this.data, d => parseInt(d['Elevation'])) - 100, d3.max(this.data, d=> parseInt(d['Elevation'])) + 150])
                    .range([this.AXIS_HEIGHT, 0])
                    
        this.svg.append('rect')
                    .attr('fill', 'cyan')
                    .attr('x', `${this.X0}`)
                    .attr('y', '0')
                    .attr('width', `${W}`)
                    .attr('height', `${this.AXIS_HEIGHT}`)
        this.circles = this.svg.append('g')


        this.update_current()
        this.draw_points()
        this.draw_axis()
        //this.draw_points()
        //set the button
        d3.select('#start-stop')
            .style('background-image', 'url(ressources/imgs/play.png)')
            .on('click', () => this.start())
        d3.select('#reset')
            .style('background-image', 'url(ressources/imgs/reset.png)')
            .on('click', () => this.reset())

        d3.select('#faster')
            .style('background-image', 'url(ressources/imgs/faster.png)')

        d3.select('#slower')
            .style('background-image', 'url(ressources/imgs/slower.png)')



    }

    update_current(){
        while(parseInt(this.data[this.current]['Last Known Eruption']) >= this.year0 - this.YEAR_WINDOW){  //if before end of window
            if(parseInt(this.data[this.current]['Last Known Eruption']) < this.year0){               //if after start of window
                this.buffer.push(this.data[this.current])                                           //add point to buffer
            }
            this.current++;
        }
    }

    //draws the points that are in the interval [year0, year0 - YEAR_WINDOW]
    draw_points(){
        while(parseInt(this.data[this.current]['Last Known Eruption']) == this.year0 - this.YEAR_WINDOW){
            this.buffer.push(this.data[this.current])
            this.current = this.current+1
        }
        this.circles.selectAll('circle')
            .data(this.buffer)
            .enter()
            .append('circle')
                .attr('cy', d => this.y(d['Elevation']))
                .attr('cx', d => (this.year0 - d['Last Known Eruption']) * this.WIDTH / this.YEAR_WINDOW)
                .attr('r', this.RADIUS)
                .style('fill', 'red')
                .on('mouseover', mouseOver)
                .on('mouseout', mouseOut)
    }

    update_points(){
        while(parseInt(this.data[this.current]['Last Known Eruption']) == this.year0 - this.YEAR_WINDOW){
            this.buffer.push(this.data[this.current])
            this.current = this.current+1
        }
        this.circles.selectAll('circle')
            .data(this.buffer)
            .enter()
            .append('circle')
                .attr('cy', d => this.y(d['Elevation']))
                .attr('cx', d => (this.year0 - d['Last Known Eruption']) * this.WIDTH / this.YEAR_WINDOW)
                .attr('r', '5')
                .style('fill', 'red')
                .on('mouseover', mouseOver)
                .on('mouseout', mouseOut)
                .transition()
                    .duration(d => 3.4 * this.TIME_WINDOW * (this.year0 - d['Last Known Eruption']) / this.YEAR_WINDOW)
                    .ease(d3.easeLinear)
                    .attr('cx', this.X0 + this.RADIUS)
                    .on('end', () => {
                        this.buffer.shift()
                    })
                    .remove()
    }

    draw_axis(){
        //axis
        this.x.domain([this.year0, this.year0 - this.YEAR_WINDOW])
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
            .text('elevation wrt sea level (m)')

        this.axis_bottom = d3.axisBottom(this.x)
                            .ticks(this.YEAR_WINDOW / 100)
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
        this.x.domain([this.year0, this.year0 - this.YEAR_WINDOW])
        this.axis_x.transition()
            .ease(d3.easeLinear)
            .duration((this.TIME_WINDOW / this.YEAR_WINDOW))
            .call(this.axis_bottom)
            .on('end', () =>  this.tick())
    }

    tick(){
        if(this.year0 - this.YEAR_WINDOW > 0 && this.on){ //stops when reaching the end
            this.year0 = this.year0 - 1
    
            //Updating the circles
            this.update_points()

            //updating the axis
            this.update_axis()
            
        }else{//stops transitions of points when reahing the end
            this.circles.selectAll('circle')
                    .transition()

        }
    }


    start(){
        this.on = true
        this.circles.selectAll('circle')
                    .remove()
        d3.select('#start-stop')
            .style('background-image', 'url(ressources/imgs/pause.png)')
            .on('click', () => this.stop())

        this.tick()
    }


    stop(){
        this.on = false
        d3.select('#start-stop')
            .style('background-image', 'url(ressources/imgs/play.png)')
            .on('click', () => this.start())
    }

    reset(){
        this.stop()
        this.current = 0
        this.year0 = d3.max(this.data, d => parseInt(d['Last Known Eruption']))
        this.update_current()

        this.circles.selectAll('circle')
                    .remove()
        this.draw_points()
        this.axis_x.remove()
        this.draw_axis()
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