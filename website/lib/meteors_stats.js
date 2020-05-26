
class Meteors_stats{
    constructor(data, svg){
        this.data = data
        this.svg = d3.select('#' + svg)
        this.name = 'recclass'
        const svg_viewbox = this.svg.node().viewBox.animVal;
        this.WIDTH = svg_viewbox.width
        this.HEIGHT = svg_viewbox.height
        this.X0 = this.WIDTH * 0.1
        this.Y0 = this.HEIGHT * 0.1
        this.N = 10

        this.setup()

    }

    setup(){

        this.svg.append('rect')
            .attr('width', this.WIDTH)
            .attr('height', this.HEIGHT)
            .style('fill', 'rgba(200, 200, 100, 0.7)')
        this.groups_data = d3.nest().key(d => d[this.name])
                .rollup(v => v.map(e => +e['mass']))
                .entries(this.data)
                .sort((a,b) => b.value.length - a.value.length)
                .slice(0, this.N)

        let M = d3.max(this.groups_data.map(e => d3.max(e.value)))
        this.y_scale = d3.scaleLinear()
            .domain([0, M * 1.1])
            .range([this.HEIGHT - this.Y0, this.Y0])

        this.x_scale = d3.scaleLinear()
            .domain([1, this.N+2])
            .range([this.X0, this.WIDTH - this.X0])

        this.y_axis = d3.axisLeft(this.y_scale)
                            .ticks(10)
                            .tickFormat(d => d)

        this.hgrid = d3.axisLeft(this.y_scale)
                            .ticks(10)
                            .tickSize(-this.WIDTH + 2 * this.X0)
                            .tickFormat('')

        this.svg.append('g')
                .attr('transform', `translate(${this.X0}, 0)`)
                .style('font', '14px times')
                .attr('class', 'axis_y')
                .call(this.y_axis)

        this.svg.append('g')
                .attr('transform', `translate(${this.X0}, 0)`)
                .attr('class', 'h_grid')
                .call(this.hgrid)


        this.plot_data()
    }

    plot_data(){

        this.groups_data.forEach((elem, i) => {
            let g = this.svg.append('g')
                        .attr('transform', `translate(${this.x_scale(i + 2)})`)

            g.selectAll('circle')
                .data(elem.value)
                .enter()
                .append('circle')
                    .attr('cx', 0)
                    .attr('cy', d => this.y_scale(d))
                    .attr('r', 2)
                    .style('fill', 'red')
        });


        this.svg.append('g')
            .selectAll('text')
            .data(this.groups_data.map(e => e.key))
            .enter()
                .append('text')
                .attr('x', (d, i) => this.x_scale(i + 2))
                .attr('y', this.HEIGHT - this.Y0 / 2)
                .attr('text-anchor', 'middle')
                .text(d => d)
    }
}