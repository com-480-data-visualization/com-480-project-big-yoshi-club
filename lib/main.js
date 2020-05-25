function whenDocumentLoaded(action){
    if(document.readyState == 'loading'){
        document.addEventListener("DOMContentLoaded", action);
    } else {
    // `DOMContentLoaded` already fired
    action();
    }
}

whenDocumentLoaded(() => {
    Promise.all([
        d3.csv('data/volcanos.csv'),
        d3.csv('data/earthquakes_clean.csv'),
        d3.csv('data/meteors_valid.csv')
    ]).then(function(data){
        //volcanoes parsing
        data[0].forEach(elem => {
            elem['date'] = +elem['Last Known Eruption']
            elem['Elevation'] = +elem['Elevation']
        });

        //earthquakes parsing
        data[1].forEach(elem => {
            elem['date'] = 2018 - elem['Date']
        })

        //meteors parsing
        data[2].forEach(elem => {
            elem['date'] = 2018 - (+elem['year'])
            let geoLoc = elem['GeoLocation'].split(', ')
            elem['Latitude'] = +(geoLoc[0].substring(1))
            elem['Longitude'] = +(geoLoc[1].substring(0, geoLoc[1].length - 1))
        })

        //main class implementing the connecting functionalities and data application
        new Yoshi(data, 'map_svg', ['volcano_svg', 'earthquakes_svg','meteores_svg'])
    }).catch(function(err){
        console.error(err)
    })
})