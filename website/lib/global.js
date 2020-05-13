class Yoshi {

    constructor(data, map_svg, roll_svgs) {
        this.data = data
        this.map_svg = map_svg
        this.roll_svgs = roll_svgs

        this.y_attributes = ['Elevation', 'Depth', 'mass']
        this.get_means()

        d3.select('#projection-dropdown')
            .on('click', () => this.projection_menu_select())

        d3.select('#myDropdown')
            .on('click', () => this.projection_select())

        this.get_old_young()

        //time management
        this.on = false
        this.year0 = this.oldest - 11000
        this.speed = 50
        this.window = 100
        d3.select('#start-stop')
                .style('background-image', 'url(img/play.png)')
                .style('background-size', 'cover')
                .on('click', () => this.start())

        d3.select('#reset')
                .style('background-image', 'url(img/reset.png)')
                .style('background-size', 'cover')
                .on('click', () => this.reset())

        this.map = new Map(this, 'map', data, ['date', 'date', 'date'])

        this.make_rolls()

        // Add timeline controls and display
        const svgId = "#time-controls"
        const minDate = new Date(860, 1, 1)
        const maxDate = new Date(2020, 1, 1)
        const twLoBnd = new Date(1245, 1, 1)
        const twUpBnd = new Date(1963, 1, 1)
        this.timelineControl = new TimelineControl(svgId, minDate, maxDate, twLoBnd, twUpBnd)

    }

    projection_menu_select() {
        d3.select('#projection-dropdown')
            .on('click', () => {
                document.getElementById("myDropdown").classList.toggle("show");
            })
    }

    projection_select() {
        d3.select("#Gnomonic")
            .on('click', () => {      
                this.stop()         
                this.map.projection_style = d3.geoGnomonic()
                this.map.update_projection()
            })
        d3.select('#Natural')
            .on('click', () => {
                this.stop()
                this.map.projection_style = d3.geoNaturalEarth1()
                this.map.update_projection()
            })
    }

    //button functionalities
    start() {
        console.log('start')
        this.on = true
        d3.select('#start-stop')
            .style('background-image', 'url(img/pause.png)')
            .on('click', () => this.stop())
        this.rolls.forEach(r =>  {
            r.circles.selectAll('circle').remove()
        })
        this.interval = setInterval( () => this.tick(), this.speed)

    }
    stop() {
        console.log('stop')
        this.on = false
        this.rolls.forEach(r =>{
            r.stop_points()
        })
        clearInterval(this.interval)
        d3.select('#start-stop')
            .style('background-image', 'url(img/play.png)')
            .on('click', () => this.start())
    }

    reset() {
        this.stop()
        this.year0 = this.oldest -11000
        this.rolls.forEach(r =>{
            r.circles.selectAll('circle').remove()
            r.axis_x.remove()
            r.draw_axis()
            r.set_current()
            r.update_current()
            r.draw_points()
        })
        this.map.update_projection()
        console.log('reset')

    }

    tick() {
        if(this.year0 - this.window > 0){
            this.year0 = this.year0 - 1
            this.rolls.forEach(r => {
                r.update_axis()
                r.update_points()
        })
            this.map.update_points()
        }else{
            this.stop()
        }
    }

    //finds the largest-lowest time value of the datasets
    get_old_young(){
        let oldest_v = d3.max(this.data[0], v => v['date'])
        let oldest_e = d3.max(this.data[1], e => e['date'])
        let oldest_m = d3.max(this.data[2], m => m['date'])
        this.oldest = d3.max([oldest_v, oldest_e, oldest_m])

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
        this.rolls = []
        for(let i = 0; i<3; i++){
            let roll = new Roll(this, this.data[i], this.roll_svgs[i], names[i], this.y_attributes[i], this.means[i])
            this.rolls[i] = roll
        }
    }
}


