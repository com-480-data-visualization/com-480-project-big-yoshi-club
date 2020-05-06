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
        d3.csv('data/earthquakes.csv'),
        d3.csv('/data/meteores.csv')
    ]).then(function(files){
        let volc = files[0]
        let earth = files[1]
        let mete = files [2]

    }).catch(function(err){
        console.err(err)
    })
})