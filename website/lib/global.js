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
        this.oldest = d3.max([oldest_v, oldest_e, oldest_m])

        let youngest_v = d3.min(this.data[0], v => v['Last Known Eruption'])
        let youngest_e = d3.min(this.data[1], e => e['Date'])
        let youngest_m = d3.min(this.data[2], m => m['year'])
        this.youngest = d3.min([youngest_v, youngest_e, youngest_m])

        console.log(this.oldest)
        console.log(this.youngest)
        //time management
        this.on = false
        //this.time_window = 50
        //this.year0 = this.oldest

        //print examples for each data
        let a = data[0][0]
        let b = data[1][0]
        let c = data[2][0]
        console.log(a)
        console.log(b)
        console.log(c)

        this.map = new Map('map', this.data, this.projection_style)

        this.volcano_roll = new Roll(this, data[0], roll_svgs[0], 'V', 'Last Known Eruption')
        this.earthquakes_roll = new Roll(this, data[1], roll_svgs[1], 'E', 'Date')
        this.meteores_roll = new Roll(this, data[2], roll_svgs[2], 'M', 'year')


        // Add timeline controls and display
        const svgId = "#time-controls"
        const minDate = new Date(860, 1, 1)
        const maxDate = new Date(2020, 1, 1)
        const twLoBnd = new Date(1245, 1, 1)
        const twUpBnd = new Date(1963, 1, 1)
        this.timelineControl = new TimelineControl(svgId, minDate, maxDate, twLoBnd, twUpBnd)



    }

    projection_select() {
        d3.select('#projection-dropdown')
            .on('click', () => menu())


    }

    //button functionalities
    start() {
        this.on = true
        while (this.on) {
            this.tick()
        }
    }

    stop() {
        this.on = false
        //draw static points
    }

    reset() {
        this.on = false
        //draw static points
    }

    tick() {
        //update map
        //update rolls
        // this.map = new Map(data)


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