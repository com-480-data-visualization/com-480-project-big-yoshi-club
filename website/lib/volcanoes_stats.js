class Volcanoes_stats{
    constructor(data, svg){
        this.data = data
        this.svg = d3.select('#' + svg)
        const svg_viewbox = this.svg.node().viewBox.animVal;
        //width & height of the containing svg
        this.WIDTH = svg_viewbox.width
        this.HEIGHT = svg_viewbox.height
        this.MARGIN = 50

        this.svg.append('rect')
            .attr('width', this.WIDTH)
            .attr('height', this.HEIGHT)
            .style('fill', 'rgba(200, 100, 100, 0.7)')
        this.generate_data()
        this.draw()
    }

    /**
     * creates an object with the number of points per category
     */
    generate_data(){
        let name = 'Dominant Rock Type'
        let temp = d3.nest().key(d => d[name])
                .rollup((v) => {
                    return v.length
                }).entries(this.data)

        this.plot_data = {}
        for(let i = 0; i < temp.length; i++){
            this.plot_data[temp[i].key] = temp[i].value
        }
    }

    //https://www.d3-graph-gallery.com/graph/donut_basic.html
    //http://bl.ocks.org/dbuezas/9572040
    draw(){
        this.radius = Math.min(this.WIDTH, this.HEIGHT) / 2 - this.MARGIN
        this.small_radius = 50
        let plot = this.svg.append('g')
            .attr('transform', `translate(${this.WIDTH / 2}, ${this.HEIGHT / 2})`)
        
        let pie = d3.pie()
            .value(d => {return d.value})

        let classRef = this
        let data_ready = pie(d3.entries(this.plot_data))
        plot.selectAll('slices')
                .data(data_ready)
                .enter()
                .append('path')
                .attr('d', d3.arc()
                    .innerRadius(classRef.small_radius)
                    .outerRadius(classRef.radius))
                    .attr('fill', d => "#"+((1<<24)*Math.random()|0).toString(16))
                    .attr("stroke", "black")
                    .style("stroke-width", "2px")
                    .style("opacity", 0.7)

        let slice = this.svg.select('.slices').selectAll('path.slice')
            .data(pie(this.plot_data), d => d.key)
            .enter()
            .insert('path')
            .attr('class', 'slice')
            .style('fill', function(d){return color(d.key)})

        let line_data = this.generate_path(data_ready)
        let line = d3.line()
            .x(d => d.x)
            .y(d => d.y)

        line_data.forEach(e => 
            this.svg.append('path')
                .attr('d', line(e))
                .attr("stroke", "rgba(20,20,200,1)")
                .attr("stroke-width", 2)
                .attr("fill", "none")
            )

        this.svg.selectAll('text')
            .data(line_data)
            .enter()
            .append('text')
                .text((d, i) => data_ready[i].data.key)
                .attr('x', d => d[2].x)
                .attr('y', d => d[2].y - 4)
    }

    generate_path(data){
        let res = []
        let R = (this.radius + this.small_radius) / 2
        data.forEach(elem => {
            let path = []
            path.push({
                'x' : this.x(elem.startAngle, elem.endAngle, R),
                'y' : this.y(elem.startAngle, elem.endAngle, R)
            })
            path.push({
                'x' : this.x(elem.startAngle, elem.endAngle, R + 50),
                'y' : this.y(elem.startAngle, elem.endAngle, R + 50)
            })
            let x = 0
            if((elem.startAngle + elem.endAngle) / 2 < Math.PI){x = this.x(elem.startAngle, elem.endAngle, R + 50) + 20}
            else{x = this.x(elem.startAngle, elem.endAngle, R + 50) - 130}
            path.push({
                'x' : x,
                'y' : this.y(elem.startAngle, elem.endAngle, R + 50)
            })
            res.push(path)
        });
        return res
    }

    x(a1, a2, r){
        let mid_angle = (a1 + a2) / 2
        return this.WIDTH / 2 + Math.cos(Math.PI / 2 - mid_angle) * r
    }

    y(a1, a2, r){
        let mid_angle = (a1 + a2) / 2
        return this.HEIGHT / 2 - Math.sin(Math.PI / 2 - mid_angle) * r
    }

}



