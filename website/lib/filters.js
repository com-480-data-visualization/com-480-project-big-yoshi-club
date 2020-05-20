
var VOLCANOES_FILTERS = [
    {
        'name' : 'Primary Volcano Type',
        'type' : 'categories'
    },
    {
        'name' : 'Elevation',
        'type' : 'number'
    },
    {
        'name' : 'Dominant Rock Type',
        'type' : 'categories'
    }
];
var EARTHQUAKES_FILTERS = [
    {
        'name' : 'Depth',
        'type' : 'number'
    },
    {
        'name' : 'Magnitude',
        'type' : 'number'
    }
];
var METEORS_FILTERS = [
    {
        'name' : 'recclass',
        'type' : 'categories'
    },
    {
        'name' : 'mass',
        'type' : 'number'
    }
];

var FILTERS = [
    VOLCANOES_FILTERS,
    EARTHQUAKES_FILTERS,
    METEORS_FILTERS
]

function filter_data(data, yoshi){
    //--------Generate range / categories for every filter
    for(i = 0; i < data.length; i++){ //for every data type
        for(k = 0; k < FILTERS[i].length; k++){ // for every filter

            let name = FILTERS[i][k]['name']
            let type = FILTERS[i][k]['type']


            if(type == 'categories'){// if the filter applies on categories
                let temp = d3.nest().key(d => d[name]).entries(data[i])
                FILTERS[i][k]['categories'] = temp.map(e => e.key)
                FILTERS[i][k]['lists'] = temp.map(e => e.values.length)
            }else if(type == 'number'){
                FILTERS[i][k]['max'] = d3.max(data[i], d => parseInt(d[name]))
                FILTERS[i][k]['min'] = d3.min(data[i], d => d[name])
            }else{
                console.error('wrong type for filters')
            }
        }
    }
    console.log(FILTERS)

    //--------volcanoes filters display--------
    let volcanoes_div = d3.select('#' + 'volcanoes_filters')
        .style('background-color', 'yellow')

    //---- first filters ----
    let filter_data = FILTERS[0][0]
    let div_11 = volcanoes_div.append('div')
    div_11.append('h4')
        .text(filter_data['name'])
    filter_data['categories'].forEach((elem, idx) => {
        div_11.append('input')
                    .attr('value', elem)
                    .attr('name', elem)
                    .attr('id', elem)
                    .attr('type', 'checkbox')
                    .attr('height', '12px')
    
        div_11.append('label')
                    .text(elem)
                    .attr('for', elem)
                    .style('font-size', '12px')
    });

    //---- second filters ----
    filter_data = FILTERS[0][1]
    let div_12 = volcanoes_div.append('div')
    div_12.append('h4')
        .text(filter_data['name'])

    div_12.append('label')
        .text('min')
    div_12.append('input')
        .attr('type', 'number')
        .attr('id', filter_data['name'])
        .attr('name', filter_data['name'])
        .attr('min', filter_data['min'])
        .attr('max', filter_data['max'])

    div_12.append('label')
        .text('max')
    div_12.append('input')
        .attr('type', 'number')
        .attr('id', filter_data['name'])
        .attr('name', filter_data['name'])
        .attr('min', filter_data['min'])
        .attr('max', filter_data['max'])

    //---- third filters ----
    filter_data = FILTERS[0][2]
    let div_13 = volcanoes_div.append('div')
    div_13.append('h4')
        .text(filter_data['name'])

    filter_data['categories'].forEach(elem => {
        div_13.append('input')
            .attr('value', elem)
            .attr('name', elem)
            .attr('id', elem)
            .attr('type', 'checkbox')
            .attr('height', '12px')

        div_13.append('label')
                .text(elem)
                .attr('for', elem)
                .style('font-size', '12px')
    })    

    //--------earthquakes filters display--------
    let earthquakes_div = d3.select('#' + 'earthquakes_filters')
                        .style('background-color', 'blue')
    //---- first filters ----
    filter_data = FILTERS[1][0]
    let div_21 = earthquakes_div.append('div')
    div_21.append('h4')
        .text(filter_data['name'])

    div_21.append('label')
        .text('min')
    div_21.append('input')
        .attr('type', 'number')
        .attr('id', filter_data['name'])
        .attr('name', filter_data['name'])
        .attr('min', filter_data['min'])
        .attr('max', filter_data['max'])

    div_21.append('label')
        .text('max')
    div_21.append('input')
        .attr('type', 'number')
        .attr('id', filter_data['name'])
        .attr('name', filter_data['name'])
        .attr('min', filter_data['min'])
        .attr('max', filter_data['max'])

    //---- second filters ----
    filter_data = FILTERS[1][1]
    let div_22 = earthquakes_div.append('div')
    div_22.append('h4')
        .text(filter_data['name'])

    div_22.append('label')
        .text('min')
    div_22.append('input')
        .attr('type', 'number')
        .attr('id', filter_data['name'])
        .attr('name', filter_data['name'])
        .attr('min', filter_data['min'])
        .attr('max', filter_data['max'])

    div_22.append('label')
        .text('max')
    div_22.append('input')
        .attr('type', 'number')
        .attr('id', filter_data['name'])
        .attr('name', filter_data['name'])
        .attr('min', filter_data['min'])
        .attr('max', filter_data['max'])
    //--------meteors filters display--------
    let meteors_div = d3.select('#' + 'meteors_filters')
                        .style('background-color', 'green')
    //---- first filters ----
    //---- second filters ----
}
