class Yoshi {

    constructor(data, map_svg, roll_svgs) {
        this.data = data
        this.map_svg = map_svg
        this.roll_svgs = roll_svgs
        this.projection_style = d3.geoNaturalEarth1()

        d3.select('#projection-dropdown')
            .on('click', () => this.projection_select())

        let oldest_v = d3.max(this.data[0], v => v['Last Known Eruption'])
        let oldest_e = d3.max(this.data[1], e => e['Date'])
        let oldest_m = d3.max(this.data[2], m => m['year'])
        let oldest = d3.max([oldest_v, oldest_e, oldest_m])
        this.oldest = oldest

        let youngest_v = d3.min(this.data[0], v => v['Last Known Eruption'])
        let youngest_e = d3.min(this.data[1], e => e['Date'])
        let youngest_m = d3.min(this.data[2], m => m['year'])
        this.youngest = d3.min([youngest_v, youngest_e, youngest_m])

        //time management
        this.on = false
        this.year0 = oldest - 10000
        this.speed = 10
        this.window = 2000
        d3.select('#start-stop')
                .style('background-image', 'url(img/play.png)')
                .style('background-size', 'cover')
                .on('click', () => this.start())

        d3.select('#reset')
                .style('background-image', 'url(img/reset.png)')
                .style('background-size', 'cover')
                .on('click', () => this.reset())

        //this.map = new Map('map', this.data, this.projection_style)

        let volcano_roll = new Roll(this, data[0], roll_svgs[0], 'V', 'Last Known Eruption', 'Elevation')
        let earthquakes_roll = new Roll(this, data[1], roll_svgs[1], 'E', 'Date', 'Depth')
        let meteores_roll = new Roll(this, data[2], roll_svgs[2], 'M', 'year', 'mass')
        this.rolls = [volcano_roll, earthquakes_roll, meteores_roll
        ]
        // Add timeline controls and display
        const svgId = "#time-controls"
        const minDate = new Date(860, 1, 1)
        const maxDate = new Date(2020, 1, 1)
        const twLoBnd = new Date(1245, 1, 1)
        const twUpBnd = new Date(1963, 1, 1)
        this.timelineControl = new TimelineControl(svgId, minDate, maxDate, twLoBnd, twUpBnd)
        this.timelineControl.display()

    }

    projection_select() {
        d3.select('#projection-dropdown')
            .on('click', () => menu())
    }

    //button functionalities
    start() {
        console.log('start')
        this.on = true
        d3.select('#start-stop')
            .style('background-image', 'url(img/pause.png)')
            .on('click', () => this.stop())
        
        this.rolls.forEach(r =>{
            r.move_points()
        })
        this.interval = setInterval( () => this.tick(), this.speed)

    }
    stop() {
        console.log('stop')
        this.on = false
        clearInterval(this.interval)
        d3.select('#start-stop')
            .style('background-image', 'url(img/play.png)')
            .on('click', () => this.start())
        this.rolls.forEach(r =>{
            r.stop_points()
        })
        //draw static points
    }

    reset() {
        this.stop()
        this.year0 = this.oldest
        this.tick()
        console.log('reset')
        //draw static points
    }

    tick() {
        this.year0 = this.year0 - 1
        this.rolls.forEach(r => {
            r.update_axis()
        })
    }


}

function menu() {
    document.getElementById("myDropdown").classList.toggle("show");
}

// Close the dropdown menu if the user clicks outside of it
window.onclick = function (event) {

    if (event.target.id === "Gnomonic") {
        this.projection_style = d3.geoGnomonic()

        this.map = new Map('map', this.data, this.projection_style)

    }
    else if (event.target.id == "Natural") {
        this.projection_style = d3.geoNaturalEarth1()
        this.map = new Map('map', this.data, this.projection_style)
        //this.map = new Map(map_svg, data)

    }

} 