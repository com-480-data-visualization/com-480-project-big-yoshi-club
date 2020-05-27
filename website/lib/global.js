class Yoshi {
    /*COLOR SCHEME
    volcanoes: #466DC9,#1143B5,#859FDE
    earthquakes: #FF63E2,#FF23D7,#FFA3EE
    meteors: #E25238,#D92100,#EC8776
    background: #EDEDEC, #C2C2AF, #81886E



    */
    constructor(data, map_svg, roll_svgs) {
        this.data = [[], [], []]
        this.data[0] = data[0]
        this.data[1] = data[1].filter(function (d) {
            let rand = Math.random() <= 0.2
            return (parseFloat(d.Magnitude) >= 5.5) && (rand)
        })
        this.data[2] = data[2].filter(function (d) {
            return (Math.random() <= 0.1)
        })
        this.full_data = [...this.data]
        //this.data = data
        this.map_svg = map_svg
        this.roll_svgs = roll_svgs

        this.y_attributes = ['Elevation', 'Depth', 'mass']
        this.get_means()
        // Setup drop down menu
        // 1. On dropdown button hover, display dropdown
        d3.select('#dropdown-button')
            .on('mouseover', () => {
                d3.select('#dropdown-content').style('display', 'block')
            })
            .on('mouseout', () => {
                d3.select('#dropdown-content').style('display', 'none')
            })
        // 2. On dropdown content hover, keep it displayed
        d3.select('#dropdown-content')
            .on('mouseover', () => {
                d3.select('#dropdown-content').style('display', 'block')
            })
            .on('mouseout', () => {
                d3.select('#dropdown-content').style('display', 'none')
            })
        // 3. Change map projection depending on which button is pressed
        this.projection_select()

        this.get_old_young()

        //time management
        this.on = false
        this.year0 = this.oldest
        //speed is actually the period (in ms) of transition for 1 year
        this.max_speed = 100
        this.min_speed = 300
        this.speed = 200
        this.window = 500
        this.map = new Map(this, 'map', this.data, ['date', 'date', 'date'])
        //this.make_stats()
        
        this.make_filters()
        this.make_rolls()
        this.make_buttons()
        // Add timeline controls and display
        const svgId = "#time-controls"
        const minDate = 2018 - this.oldest
        const maxDate = 2018 - this.youngest
        const twLoBnd = 2018 - this.year0
        const twUpBnd = twLoBnd + this.window
        this.timelineControl = new TimelineControl(this, svgId, minDate, maxDate, twLoBnd, twUpBnd)
        // Force statistics to be aligned with the rolls
        // Align the one placed higher with the one placed lower
        const rolls = d3.select("#timelines")
        const stats = d3.select("#controls")
        const rollsRect = rolls.node().getBoundingClientRect()
        const statsRect = stats.node().getBoundingClientRect()
        if (rollsRect.y > statsRect.y) {
            const diff_px = rollsRect.y - statsRect.y
            stats.style("margin-top", `${diff_px}px`)
        } else {
            const diff_px = statsRect.y - rollsRect.y
            rolls.style("margin-top", `${diff_px}px`)
        }
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

                this.map.PROJECT_SCALE = 158

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
        for (let idx = 0; idx < this.data.length; idx++) {
            this.map.point_container.selectAll('.static_point' + this.map.classes[idx]).remove()
        }
        this.map.cont_fade()
        this.tick()
        this.interval = setInterval(() => this.tick(), this.speed)
    }
    stop() {
        
        clearInterval(this.interval)
        this.on = false
        this.map.stop_fade()

        d3.select('#start-stop')
            .style('background-image', 'url(img/play.png)')
            .on('click', () => this.start())
    }

    reset(year0, window) {
        this.stop()
        this.year0 = 2018 - year0
        this.window = window
        this.map.point_container.selectAll('*').remove()
        this.map.buffer = [[], [], []]


        //console.log(`Reset set this.year0 = ${this.year0}, this.window = ${this.window} (called with year0 = ${year0}, window = ${window})`);

        this.timelineControl.update(year0, year0 + window)

        this.rolls.forEach((r, idx) => {

            r.reset()

            this.map.set_current(idx)
            this.map.update_current(idx)
            this.map.draw_points(idx)
        })
    }

    update() {
        this.rolls.forEach(r => {
            r.update_axis()
            r.update_points()
            r.update_roll()
            r.update_graph()
        })
        this.map.update_points()
        // Update the timeline control display
        const loBnd = 2018 - this.year0
        const upBnd = Math.floor(loBnd + this.window)
        this.timelineControl.update(loBnd, upBnd)
    }


    update_data() {
        
        this.get_means()
        this.rolls.forEach((r, i) => { r.update_data(this.data[i], this.means[i]) })
        this.map.point_container.selectAll('*').remove()
        this.map.buffer = [[], [], []]

        for (let idx = 0; idx < this.data.length; idx++) {
            this.map.set_current(idx)
            this.map.update_current(idx)
            this.map.draw_points(idx)
        }

    }

    tick() {
        if (this.year0 - this.window > 0) {
            this.year0 = this.year0 - 1
            this.update()
        } else {
            this.stop()
        }
    }

    //finds the largest-lowest time value of the datasets
    get_old_young() {
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
    get_means() {
        this.means = []
        for (let i = 0; i < this.data.length; i++) {
            this.means[i] = d3.nest()
                .key(d => d['date'])
                .rollup((v) => {
                    return {
                        mean: d3.mean(v, d => Math.floor(parseInt(d[this.y_attributes[i]])))
                    }
                })
                .entries(this.data[i])
        }
    }

    //generate the rolls 
    make_rolls() {
        let names = ['volcanoes', 'earthquakes', 'meteors']
        let units = ['meters', 'kilometers', 'grams']
        this.rolls = []
        for (let i = 0; i < 3; i++) {
            let roll = new Roll(this, this.data[i], this.roll_svgs[i], names[i], this.y_attributes[i], this.means[i], units[i])
            this.rolls[i] = roll
        }
    }

    make_stats() {
        let names = ['volcano_stats', 'earthquake_stats', 'meteor_stats']
        this.stats = new Statistics(this, names, this.data)
    }

    make_buttons() {
        
        d3.select('#start-stop')
            .style('background-image', 'url(img/play.png)')
            .style('background-size', 'cover')
            .on('click', () => this.start())

        d3.select('#reset')
            .style('background-image', 'url(img/reset.png)')
            .style('background-size', 'cover')
            .on('click', () => this.reset(2018 - this.oldest, this.window))

        let classRef = this
        let scale_speed = d3.scaleLinear()
            .domain([0, 100])
            .range([this.min_speed, this.max_speed])

        d3.select('#speed').on('change', function (d) {
            let wasOn = classRef.on
            classRef.stop()
            classRef.speed = scale_speed(this.value)
            if (wasOn) { classRef.start() }
        })
    }

    make_filters() {
        
        filter_data(this.data, this)
    }

}


