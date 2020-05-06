class Yoshi{

    constructor(data, map_svg, roll_svgs){
        this.data
        this.svg_map = map_svg
        this.roll_svgs = roll_svgs

        this.map = new Map(data)
        this.volcano_roll = new Roll(data[0], roll_svgs[0])
        this.earthquakes_roll = new Roll(data[1], roll_svgs[1])
        this.meteores_roll = new Roll(data[2], roll_svgs[2])

        // Add timeline controls and display
        const svgId = "#time-controls"
        const minDate = new Date(860, 1, 1)
        const maxDate = new Date(2020, 1, 1)
        const twLoBnd = new Date(1245, 1, 1)
        const twUpBnd = new Date(1963, 1, 1)
        this.timelineControl = new TimelineControl(svgId, minDate, maxDate, twLoBnd, twUpBnd)
        this.timelineControl.display()
    }
}