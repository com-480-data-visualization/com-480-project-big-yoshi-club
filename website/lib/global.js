class Yoshi{

    constructor(data, map_svg, roll_svgs){
        this.data
        this.svg_map = map_svg
        this.roll_svgs = roll_svgs
        this.projection_style = d3.geoNaturalEarth1()
        
        d3.select('#projection-dropdown')
            .on('click', () => this.projection_select())
        let a = data[0][0]['Last Known Eruption']
        let b = data[1][0]['Date']
        let c = data[2][0]['year']

        console.log(a)
        console.log(b)
        console.log(c)

        this.map = new Map('map', this.data, this.projection_style)

        this.volcano_roll = new Roll(data[0], roll_svgs[0], 'volcanoes', 'Last Known Eruption')
        this.earthquakes_roll = new Roll(data[1], roll_svgs[1], 'earthquakes', 'Date')
        this.meteores_roll = new Roll(data[2], roll_svgs[2], 'meteors', 'year')

        
    }

    projection_select(){
        
        d3.select('#projection-dropdown')
            
            .on('click', () => menu())        

       
    }

    
}

function menu(){
    document.getElementById("myDropdown").classList.toggle("show");
  }
  
  // Close the dropdown menu if the user clicks outside of it
  window.onclick = function(event) {
    
    if (event.target.id === "Gnomonic"){
        this.projection_style = d3.geoGnomonic()
        
        this.map = new Map('map', this.data, this.projection_style)
        
    }
    else if (event.target.id == "Natural"){
        this.projection_style = d3.geoNaturalEarth1()
        this.map = new Map('map', this.data, this.projection_style)
    }
    
  } 