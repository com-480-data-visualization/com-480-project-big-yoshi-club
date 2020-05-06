class Yoshi{

    constructor(data, map_svg, roll_svgs){
        this.data = data
        this.svg_map = map_svg
        this.roll_svgs = roll_svgs
        this.on = false

        //print examples for each data
        let a = data[0][0]
        let b = data[1][0]
        let c = data[2][0]
        console.log(a)
        console.log(b)
        console.log(c)

        //this.map = new Map(map_svg, data)

        let oldest_v = d3.max(this.data[0], v => v['Last Known Eruption'])
        let oldest_e = d3.max(this.data[1], e => e['Date'])
        let oldest_m = d3.max(this.data[2], m => m['year'])

        this.oldest = d3.max([oldest_v, oldest_e, oldest_m])
        console.log(this.oldest)

        this.volcano_roll = new Roll(this, data[0], roll_svgs[0], 'V', 'Last Known Eruption')
        this.earthquakes_roll = new Roll(this, data[1], roll_svgs[1], 'E', 'Date')
        this.meteores_roll = new Roll(this, data[2], roll_svgs[2], 'M', 'year')
    }



    tick(){
        //update map
        //update rolls
        if(this.on){
            this.tick()
        }
    }
}