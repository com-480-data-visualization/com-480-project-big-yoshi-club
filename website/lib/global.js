class Yoshi{

    constructor(data, map_svg, roll_svgs){
        this.data
        this.svg_map = map_svg
        this.roll_svgs = roll_svgs

        let a = data[0][0]['Last Known Eruption']
        let b = data[1][0]['Date']
        let c = data[2][0]['year']

        console.log(a)
        console.log(b)
        console.log(c)

        this.map = new Map(data)

        this.volcano_roll = new Roll(data[0], roll_svgs[0], 'volcanoes', 'Last Known Eruption')
        this.earthquakes_roll = new Roll(data[1], roll_svgs[1], 'earthquakes', 'Date')
        this.meteores_roll = new Roll(data[2], roll_svgs[2], 'meteors', 'year')
    }
}