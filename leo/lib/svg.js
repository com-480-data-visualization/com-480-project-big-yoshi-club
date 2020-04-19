
function whenDocumentLoaded(action){
    if(document.readyState == 'loading'){
        document.addEventListener("DOMContentLoaded", action);
    } else {
    // `DOMContentLoaded` already fired
    action();
    }
}

whenDocumentLoaded(() => {
    d3.csv('data/volcano.csv').then(function(data){
        new roll(data, 'plot_roll')
    })
})