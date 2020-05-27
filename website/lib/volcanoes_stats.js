class Volcanoes_stats{
    constructor(data, svg){
        this.data = data
        this.svg = d3.select('#' + svg)
        const svg_viewbox = this.svg.node().viewBox.animVal;
        //width & height of the containing svg
        this.WIDTH = svg_viewbox.width
        this.HEIGHT = svg_viewbox.height
        this.Y0 = 0
        this.MARGIN = 50
        this.name = 'Dominant Rock Type'
        this.temp = d3.nest().key(d => d[this.name])
                .rollup((v) => {
                    return v.length
                }).entries(this.data)

        this.color_map = {}
        this.temp.forEach(e => {
            this.color_map[e.key] = "#"+((1<<24)*Math.random()|0).toString(16)
        })
        this.setup()
    }

    /**
     * creates an object with the number of points per category
     */
    generate_data(){
        this.temp = d3.nest().key(d => d[this.name])
        .rollup((v) => {
            return v.length
        }).entries(this.data)
        this.plot_data = {}
        for(let i = 0; i < this.temp.length; i++){
            this.plot_data[this.temp[i].key] = this.temp[i].value
        }

        let label = this.svg.append('g')
        label.append('rect')
                .attr('x', this.WIDTH - 175)
                .attr('y', this.Y0)
                .attr('width', '180')
                .attr('height','70')
                .style('fill', '#81886E')
                .style('stroke', '#81886E')
                .style('stroke-width', '1px')

        label.append('text')
                .text(this.name)
                .attr('x',this.WIDTH - 85)
                .attr('dy','42')
                .style('font-family', "font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode', Geneva, Verdana, sans-serif")
                .style('text-anchor','middle')
                .style('fill', 'whitesmoke')
                .style('stroke-width', '1px')
    }

    //https://www.d3-graph-gallery.com/graph/donut_basic.html
    //http://bl.ocks.org/dbuezas/9572040
    setup(){
        this.svg.append('rect')
        .attr('width', this.WIDTH)
        .attr('height', this.HEIGHT)
        .style('fill', '#EDEDEC')
        this.generate_data()
        this.radius = Math.min(this.WIDTH, this.HEIGHT) / 2 - this.MARGIN
        this.small_radius = 50
        this.plot = this.svg.append('g')
            .attr('transform', `translate(${this.WIDTH / 2}, ${this.HEIGHT / 2})`)
        
        this.pie = d3.pie()
            .value(d => {return d.value})

        let data_ready = this.pie(d3.entries(this.plot_data))
        this.plot.selectAll('slices')
                .data(data_ready)
                .enter()
                .append('path')
                .attr('d', d3.arc()
                    .innerRadius(this.small_radius)
                    .outerRadius(this.radius))
                    .attr('fill', d => this.color_map[d.data.key])
                    .attr("stroke", "black")
                    .style("stroke-width", "2px")
                    .style("opacity", 0.7)

        let line_data = this.generate_path(data_ready)
        let line = d3.line()
            .x(d => d.x)
            .y(d => d.y)

        line_data.forEach(e => 
            this.svg.append('path')
                .attr('d', line(e))
                .attr("stroke", "rgba(100,10,10,1)")
                .attr("stroke-width", 2)
                .attr("fill", "none")
            )

        let names = data_ready.map(e => {
            if(e.data.key == ''){ return 'Unknown'}
            else{return e.data.key}
        })
        this.svg.append('g').selectAll('text')
                    .data(line_data)
                    .enter()
                    .append('text')
                        .text((d, i) => names[i])
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



