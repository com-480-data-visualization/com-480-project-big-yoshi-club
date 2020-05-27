class Statistics {
    constructor(parent, svg_element_id, data) {
        this.parent = parent;
        this.data = data
        this.svgs = svg_element_id

        this.setup()
    }

    setup(){
        this.volcanoes_stats = new Volcanoes_stats(this.data[0], this.svgs[0])
        this.earthquakes_stats = new Earthquake_stats(this.data[1], this.svgs[1])
        this.meteors_stats = new Meteors_stats(this.data[2], this.svgs[2])
        
    }

    update(){
        this.volcanoes_stats.svg.selectAll('*').remove()
        this.volcanoes_stats.data = this.data[0]
        this.volcanoes_stats.setup()

        this.earthquakes_stats.svg.selectAll('*').remove()
        this.earthquakes_stats.data = this.data[1]
        this.earthquakes_stats.setup()

        this.meteors_stats.svg.selectAll('*').remove()
        this.meteors_stats.data = this.data[2]
        this.meteors_stats.setup()
    }

}