class Yoshi{

    constructor(data, map_svg, roll_svgs){
        this.data
        this.svg_map = map_svg
        this.roll_svgs = roll_svgs

        this.map = new Map(data)
        this.volcano_roll = new Roll(data[0], roll_svgs[0])
        this.earthquakes_roll = new Roll(data[1], roll_svgs[1])
        this.meteores_roll = new Roll(data[2], roll_svgs[2])
    }
}