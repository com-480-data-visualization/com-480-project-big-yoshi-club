class Earthquake_stats{
    constructor(data, svg){
        this.data = data
        this.svg = d3.select('#' + svg)
        this.name_y = 'Magnitude'
        this.name_x = 'Depth'
        const svg_viewbox = this.svg.node().viewBox.animVal;
        this.WIDTH = svg_viewbox.width
        this.HEIGHT = svg_viewbox.height
        this.X0 = this.WIDTH * 0.1
        this.Y0 = this.HEIGHT * 0.1

        this.setup()
    }

    setup(){
        this.svg.append('rect')
            .attr('width', this.WIDTH)
            .attr('height', this.HEIGHT)
            .style('fill', '#EDEDEC')
        let max_x = d3.max(this.data, d => parseInt(d[this.name_x]) + 1)
        let min_x = d3.min(this.data, d => d[this.name_x]) - 1
        this.x_scale = d3.scaleLinear()
                    .domain([min_x, max_x])
                    .range([this.X0, this.WIDTH - this.X0])

        this.y_scale = d3.scaleLinear()
                    .domain([5.5, 10])
                    .range([this.HEIGHT - this.Y0, this.Y0])

                
        this.y_axis = d3.axisLeft(this.y_scale)
                    .ticks(10)
                    .tickFormat(d => d)
        
        this.h_grid = d3.axisLeft(this.y_scale)
                        .tickSize(-this.WIDTH + 2 * this.X0)
                        .ticks(10)
                        .tickFormat('')

        this.x_axis = d3.axisBottom(this.x_scale)
                    .tickFormat(d => d)

        this.v_grid = d3.axisBottom(this.x_scale)
                    .tickSize( this.HEIGHT - 2 * this.Y0)
                    .ticks(20)
                    .tickFormat('')     

        this.svg.append('g')
                    .attr('transform', `translate(${this.X0}, 0)`)
                    .style('font', '14px times')
                    .attr('class', 'axis_y')
                    .call(this.y_axis)

        this.svg.append('g')
                    .attr('transform', `translate(0, ${this.Y0})`)
                    .attr('class', 'h_grid')
                    .call(this.v_grid)

        this.svg.append('g')
                    .attr('transform', `translate(${this.X0}, 0)`)
                    .attr('class', 'h_grid')
                    .call(this.h_grid)

        this.svg.append('g')
                    .attr('transform', `translate(0, ${this.HEIGHT - this.Y0})`)
                    .style('font', '14px times')
                    .attr('class', 'axis_x')
                    .call(this.x_axis)

        

        this.draw_points()

        let label = this.svg.append('g')
        label.append('rect')
                .attr('x', 2 * this.X0 - 50)
                .attr('y', 2)
                .attr('width', this.WIDTH - 4 * this.X0 + 100)
                .attr('height', this.Y0 / 1.2)
                .style('fill', '#81886E')
                .style('opacity', 0.7)
                .style('stroke', 'whitesmoke')
                .style('stroke-width', '1px')
        label.append('text')
                .text('Magnitude of earthquakes with respect to their depth')
                .attr('x', this.WIDTH / 2)
                .attr('dy', this.Y0 / 1.5)
                .style('font-family', "font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode', Geneva, Verdana, sans-serif")
                .style('text-anchor','middle')
                .style('fill', 'whitesmoke')
                .style('stroke-width', '1px')
    }

    draw_points(){
        this.svg.append('g')
            .selectAll('circle')
            .data(this.data)
            .enter()
                .append('circle')
                .attr('r', 2)
                .attr('cx', d => this.x_scale(d[this.name_x]))
                .attr('cy', d => this.y_scale(d[this.name_y]))
                .style('fill', 'black')
    }
}