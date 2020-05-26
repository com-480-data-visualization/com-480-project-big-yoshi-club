class Statistics {
    constructor(parent, svg_element_id, data, y_val, x_val) {
        this.parent = parent;
        this.name = svg_element_id
        this.y_val = y_val
        this.x_val = x_val
        this.data = data
        this.svg = d3.select('#' + svg_element_id);
        const svg_viewbox = this.svg.node().viewBox.animVal;
        this.svg_width = svg_viewbox.width;
        this.svg_height = svg_viewbox.height;
        this.svg.append('rect')
            .attr("class", "bg")
            .attr('width', `${this.svg_width}`)
            .attr('height', `${this.svg_height}`)


        let group = d3.nest()
            .key(d => d[x_val])
            .rollup(function (d) { return d.length; })
            .entries(data)
            .sort(function (a, b) { return d3.descending(a.value, b.value); })

        if (this.name.indexOf("earthquake") !== -1) {
            let group = d3.nest()
                .key(d => parseFloat(d[x_val]).toFixed(1))
                .rollup(function (d) { return d.length; })
                .entries(data)
                .sort(function (a, b) { return d3.descending(a.value, b.value); })
        }
        const keys = group.map(g => g.key).slice(0, 10)
        group = group.filter(function (d) {
            if (keys.indexOf(d.key) > -1) {
                return d
            }
        })
        this.keys = keys
        let vals = group.map(g => g.value)
        this.x_value_range = [0, this.keys.length];
        let y_value_range = [0, d3.max(vals)];


        this.pointX_to_svgX = d3.scaleLinear()
            .domain(this.x_value_range)
            .range([70, this.svg_width - 20]);

        let pointY_to_svgY = d3.scaleLinear()
            .domain(y_value_range)
            .range([this.svg_height - 20, 10]);


        let xAxisTranslate = this.svg_height - 20;


        let x_axis = d3.axisBottom()
            .scale(this.pointX_to_svgX);

        let y_axis = d3.axisLeft()
            .scale(pointY_to_svgY);

        this.svg.append('g')
            .attr("class", "x_axis")
            .style('font', '14px times')

            .attr("transform", "translate(0, " + xAxisTranslate + ")")
            .style('color', d3.color('black'))
            .call(x_axis);


        this.svg.append("g")
            .attr('class', 'y_axis')
            .style('color', d3.color('black'))
            .style('font', '14px times')
            .attr("transform", "translate(50, 0)")
            .call(y_axis);
        this.draw_hist(data)
    }

    draw_hist(data) {
        if (data.length > 0) {


            this.svg.selectAll("rect.statis").remove()
            this.svg.selectAll('g.y_axis').remove()
            const x_val = this.x_val

            let group = d3.nest()
                .key(d => d[x_val])
                .rollup(function (d) { return d.length; })
                .entries(data)
            if (this.name.indexOf("earthquake") !== -1) {
                let group = d3.nest()
                    .key(d => parseFloat(d[x_val]).toFixed(1))
                    .rollup(function (d) { return d.length; })
                    .entries(data)
                    .sort(function (a, b) { return d3.descending(a.value, b.value); })
            }
            const keys = this.keys
            group = group.filter(function (d) {
                if (keys.indexOf(d.key) > -1) {
                    return d
                }
            })
            let vals = group.map(g => g.value)
            const w = 18


            let y_value_range = [0, d3.max(vals)];
            let pointY_to_svgY = d3.scaleLinear()
                .domain(y_value_range)
                .range([this.svg_height - 20, 10]);


            var y_axis = d3.axisLeft()
                .scale(pointY_to_svgY);

            this.svg.append("g")
                .attr('class', 'y_axis')
                .style('color', d3.color('black'))
                .style('font', '14px times')
                .attr("transform", "translate(50, 0)")
                .call(y_axis);

            this.svg.selectAll("rect")
                .data(group)
                .enter()
                .append("rect")
                .attr('class', 'statis')
                .attr('fill', d3.color('white'))
                .attr('width', w)
                .attr('height', d => pointY_to_svgY(d.value))
                .attr('transform', d => 'translate(' + (-(w / 2) + this.pointX_to_svgX(this.keys.indexOf(d.key))) + ',' + (this.svg_height - 20) + ') scale(1, -1)')

            /* if want to go back
            this.svg.selectAll("circle")
                .data(group)
                .enter()
                .append("circle")
                .attr("r", 3) // radius
                .attr("cx", d => this.pointX_to_svgX(this.keys.indexOf(d.key))) // position, rescaled
                .attr("cy", d => pointY_to_svgY(d.value.count))
                .attr('fill', d3.color('white'))
            */
        } else {
            this.svg.selectAll("rect.statis").remove()
        }
    }



}