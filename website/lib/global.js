class Yoshi {

    constructor(data, map_svg, roll_svgs) {
        this.data = data
        this.map_svg = map_svg
        this.roll_svgs = roll_svgs

        this.y_attributes = ['Elevation', 'Depth', 'mass']
        this.get_means()

        d3.select('#projection-dropdown')
            .on('mouseover', () => document.getElementById("myDropdown").classList.toggle("show"))

        d3.select('#myDropdown')
            .on('mouseover', () => this.projection_select())
            .on('mouseout', () => document.getElementById("myDropdown").classList.toggle("show"))

        this.get_old_young()

        //time management
        this.on = false
        this.year0 = this.oldest
        //speed is actually the period (in ms) of transition for 1 year
        this.max_speed = 100
        this.min_speed = 300
        this.speed = 200
        this.window = 200

        this.map = new Map(this, 'map', data, ['date', 'date', 'date'])
        this.make_stats()
        this.make_rolls()

        this.make_buttons()
        // Add timeline controls and display
        const svgId = "#time-controls"
        const minDate = this.youngest
        const maxDate = 2018
        const twLoBnd = this.year0
        const twUpBnd = this.year0 + this.window
        //this.timelineControl = new TimelineControl(this, svgId, minDate, maxDate, twLoBnd, twUpBnd)
    }


    projection_select() {
        
        d3.select('#Natural')
            .on('click', () => {
                this.stop()
                
                this.map.PROJECT_SCALE = 180
                
                this.map.projection_style = d3.geoNaturalEarth1()
                this.map.update_projection()
            })
        d3.select('#Rectangular')
            .on('click', () => {
                this.stop()
                
                this.map.PROJECT_SCALE = 150
                
                this.map.projection_style = d3.geoEquirectangular()
                this.map.update_projection()
            })
        
    }

    //button functionalities
    start() {
        this.on = true

        d3.select('#start-stop')
            .style('background-image', 'url(img/pause.png)')
            .on('click', () => this.stop())
        this.map.point_container.selectAll('*').remove()
        this.tick()
        this.interval = setInterval( () => this.tick(), this.speed)
        //this.rolls.forEach(r => r.on())
    }
    stop() {
        //this.rolls.forEach(r =>r.off())
        clearInterval(this.interval)
        this.on = false
        this.map.stop_fade()

        d3.select('#start-stop')
            .style('background-image', 'url(img/play.png)')
            .on('click', () => this.start())
    }

    reset() {
        this.stop()
        this.year0 = this.oldest
        this.map.point_container.selectAll('*').remove()
        this.map.buffer = [[],[],[]]

        this.rolls.forEach((r, idx) =>{
            r.reset()
            this.map.set_current(idx)
            this.map.update_current(idx)
        })

    }

    update(){
        this.rolls.forEach(r => {
            r.update_axis()
            r.update_points()
            r.update_roll()
            r.update_graph()
        })
        this.map.update_points()
        // Update the timeline control display
        const loBnd = 2018 - this.year0
        const upBnd = loBnd + this.window
        //this.timelineControl.update(loBnd, upBnd)
    }

    tick() {
        if(this.year0 - this.window >= 0){
            this.year0 = this.year0 - 1
            this.update()
        }else{
            this.stop()
        }
    }

    //finds the largest-lowest time value of the datasets
    get_old_young(){
        let oldest_v = d3.max(this.data[0], v => v['date'])
        let oldest_e = d3.max(this.data[1], e => e['date'])
        let oldest_m = d3.max(this.data[2], m => m['date'])
        let temp = d3.max([oldest_v, oldest_e, oldest_m]) - 11500
        this.oldest = temp - (temp % 10) + 10

        let youngest_v = d3.min(this.data[0], v => v['date'])
        let youngest_e = d3.min(this.data[1], e => e['date'])
        let youngest_m = d3.min(this.data[2], m => m['date'])
        this.youngest = d3.min([youngest_v, youngest_e, youngest_m])
    }

    //generates the means array per year for all the rolls
    get_means(){ 
        this.means = []
        for(let i = 0; i<this.data.length; i++){
            this.means[i] = d3.nest()
                                .key(d => d['date'])
                                .rollup( (v) => {
                                    return {
                                        mean : d3.mean(v, d =>  d[this.y_attributes[i]])
                                    }
                                })
                                .entries(this.data[i])
        }
    }

    //generate the rolls 
    make_rolls(){
        let names = ['volcanoes', 'earthquakes', 'meteors']
        let units = ['meters', 'kilometers', 'grams']
        this.rolls = []
        for(let i = 0; i<3; i++){
            let roll = new Roll(this, this.data[i], this.roll_svgs[i], names[i], this.y_attributes[i], this.means[i], units[i])
            this.rolls[i] = roll
        }
    }

    make_stats(){
        let names = ['volcano_stats', 'earthquake_stats', 'meteor_stats']
        let y_vals = ['Elevation', 'Depth', 'mass']
        let x_vals = ['Dominant Rock Type', 'Magnitude', 'recclass']
        this.stats = []
        for(let i = 0; i<3; i++){
            let stat = new Statistics(this, names[i], this.data[i], y_vals[i], x_vals[i])
            this.stats[i] = stat
        }
    }

    make_buttons(){
        d3.select('#start-stop')
            .style('background-image', 'url(img/play.png)')
            .style('background-size', 'cover')
            .on('click', () => this.start())

        d3.select('#reset')
            .style('background-image', 'url(img/reset.png)')
            .style('background-size', 'cover')
            .on('click', () => this.reset())

        let classRef = this
        let scale_speed = d3.scaleLinear()
                        .domain([0, 100])
                        .range([this.min_speed, this.max_speed])

        d3.select('#speed').on('change', function(d){
            let wasOn = classRef.on
            classRef.stop()
            classRef.speed = scale_speed(this.value)
            if(wasOn){classRef.start()}
        })
    }
}


