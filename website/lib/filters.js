
var VOLCANOES_FILTERS = [
    {
        'name' : 'Primary Volcano Type',
        'type' : 'categories'
    },
    {
        'name' : 'Elevation',
        'type' : 'number',
        'unit' : '(m)'
    },
    {
        'name' : 'Dominant Rock Type',
        'type' : 'categories'
    }
];
var EARTHQUAKES_FILTERS = [
    {
        'name' : 'Depth',
        'type' : 'number',
        'unit' : '(km)'
    },
    {
        'name' : 'Magnitude',
        'type' : 'number',
        'unit' : '[0-9]'
    }
];
var METEORS_FILTERS = [
    {
        'name' : 'recclass',
        'type' : 'categories'
    },
    {
        'name' : 'mass',
        'type' : 'number',
        'unit' : '(g)'
    }
];

var FILTERS = [
    VOLCANOES_FILTERS,
    EARTHQUAKES_FILTERS,
    METEORS_FILTERS
]

/**
 * 
 * @param {*} data 
 * @param {*} yoshi 
 */
function filter_data(data, yoshi){
    //--------Generate range / categories for every filter
    for(i = 0; i < data.length; i++){ //for every data type
        for(k = 0; k < FILTERS[i].length; k++){ // for every filter

            let name = FILTERS[i][k]['name']
            let type = FILTERS[i][k]['type']


            if(type == 'categories'){// if the filter applies on categories
                let temp = d3.nest().key(d => d[name]).entries(data[i])
                let cat = {}
                temp.forEach(e => {
                    cat[e.key] = true
                })
                FILTERS[i][k]['categories'] = cat
                FILTERS[i][k]['lists'] = temp.map(e => e.values.length)
            }else if(type == 'number'){// if the filter applies on min-max
                FILTERS[i][k]['max'] = Math.ceil(d3.max(data[i], d => parseInt(d[name])))
                FILTERS[i][k]['current_max'] = Math.ceil(d3.max(data[i], d => parseInt(d[name])))
                FILTERS[i][k]['min'] = Math.floor(d3.min(data[i], d => parseInt(d[name])))
                FILTERS[i][k]['current_min'] = Math.floor(d3.min(data[i], d => parseInt(d[name])))
            }else{
                console.error('wrong type for filters')
            }
        }
    }

    // Filters style
    const point_radius = 15

    //--------volcanoes filters display--------
    let volcanoes_div = d3.select('#' + 'volcanoes_filters')
        // .style('background-color', '#859FDE')
    volcanoes_div.append("h2").text("Volcano Filters ")
    volcanoes_div.append("svg")
        .attr("height", 2 * point_radius).attr("width", 2 * point_radius)
        .append("circle")
            .attr("r", point_radius)
            .attr("fill", "#1243b5")
            .attr("cx", point_radius).attr("cy", point_radius)

    //---- first filters ----
    let filter_data = FILTERS[0][0]
    let div_11 = volcanoes_div.append('div')
    append_categories(filter_data, div_11, yoshi, 0)

    //---- second filters ----
    filter_data = FILTERS[0][1]
    let div_12 = volcanoes_div.append('div')
    append_number(filter_data, div_12, yoshi, 0)

    //---- third filters ----
    filter_data = FILTERS[0][2]
    let div_13 = volcanoes_div.append('div')
    append_categories(filter_data, div_13, yoshi, 0)

    //--------earthquakes filters display--------
    let earthquakes_div = d3.select('#' + 'earthquakes_filters')
                        // .style('background-color', '#FF23D7')
    earthquakes_div.append("h2").text("Earthquake Filters ")
    earthquakes_div.append("svg")
        .attr("height", 2 * point_radius).attr("width", 2 * point_radius)
        .append("circle")
            .attr("r", point_radius)
            .attr("fill", "#ff24d7")
            .attr("cx", point_radius).attr("cy", point_radius)

    //---- first filters ----
    filter_data = FILTERS[1][0]
    let div_21 = earthquakes_div.append('div')
    append_number(filter_data, div_21, yoshi, 1)

    //---- second filters ----
    filter_data = FILTERS[1][1]
    let div_22 = earthquakes_div.append('div')
    append_number(filter_data, div_22, yoshi, 1)

    //--------meteors filters display--------
    let meteors_div = d3.select('#' + 'meteors_filters')
                        // .style('background-color', '#EC8776')
    meteors_div.append("h2").text("Meteorite Filters ")
    meteors_div.append("svg")
        .attr("height", 2 * point_radius).attr("width", 2 * point_radius)
        .append("circle")
            .attr("r", point_radius)
            .attr("fill", "#d92100")
            .attr("cx", point_radius).attr("cy", point_radius)

    //---- first filters ----
    //filter_data = FILTERS[2][0]
    //let div_31 = meteors_div.append('div')
    //append_categories(filter_data, div_31)

    //---- second filters ----
    filter_data = FILTERS[2][1]
    let div_32 = meteors_div.append('div')
    append_number(filter_data, div_32, yoshi, 2)
}

/**
 * appends a div and a series of checkboxes in the filter section for the categories specifies in the filter_data parameter
 * @param {dict} filter_data tells what should be displayed as label and the number of the elements in the data
 * @param {html div} div div where the checkboxes are appended
 * @param {array} data data passed to the callback function of the check box
 */
function append_categories(filter_data, div, yoshi, i){
    div.append('h4')
        .text(filter_data['name'])
    Object.keys(filter_data['categories']).forEach((elem,idx) => {
        div.append('input')
            .attr('value', elem)
            .attr('name', elem)
            .attr('id', elem)
            .attr('type', 'checkbox')
            .attr('height', '12px')
            .property('checked', true)
            .on('change', function(){
                filter_data['categories'][this.name] = !filter_data['categories'][this.name]
                filter(yoshi, i)
            })

        div.append('label')
                .text(`${elem} (${filter_data['lists'][idx]})`)
                .attr('for', elem)
                .style('font-size', '12px')
    })
}


function append_number(filter_data, div, yoshi, i){
    div.append('h4')
        .text(filter_data['name'] + filter_data['unit'])

    div.append('label')
        .text(`min (${Math.ceil(filter_data['min'])}): `)
    div.append('input')
        .attr('type', 'number')
        .attr('id', filter_data['name'])
        .attr('name', filter_data['name'])
        .attr('min', filter_data['min'])
        .attr('max', filter_data['max'])
        .on('change', function(){
            if(this.value > filter_data['current_max']){
                this.value = filter_data['current_max']
            }else{
                filter_data['current_min'] = this.value
                filter(yoshi, i)
            }
        })

    div.append("br")

    div.append('label')
        .text(`max (${Math.ceil(filter_data['max'])}): `)
    div.append('input')
        .attr('type', 'number')
        .attr('id', filter_data['name'])
        .attr('name', filter_data['name'])
        .attr('min', filter_data['min'])
        .attr('max', filter_data['max'])
        .on('change', function(){
            if(this.value < filter_data['current_min']){
                this.value = filter_data['current_min']
            }else{
                filter_data['current_max'] = this.value
                filter(yoshi, i)
            }
        })
}

/**
 * applies all the filters when called
 * @param {*} yoshi the parent class that has the full data and the current data
 * @param {*} i the data that needs to be updated (0, 1 or 2)
 */
function filter(yoshi, i){
    //we copy the original corresponding data
    let data_to_filter = [...yoshi.full_data[i]]
    //we recursivelly apply all the filters 
    for(j=0; j<FILTERS[i].length; j++){
        if(FILTERS[i][j]['type'] == 'categories'){
            //categorical filters
            data_to_filter = filter_categories(data_to_filter, FILTERS[i][j]['name'], FILTERS[i][j]['categories'])
        }else if(FILTERS[i][j]['type']== 'number'){
            //min-max filters
            data_to_filter = filter_number(data_to_filter, FILTERS[i][j]['name'], FILTERS[i][j]['current_min'], FILTERS[i][j]['current_max'])
        }else{
            console.error('unvalid type to filter')
        }
    }
    //we then replace the current data with the filtered one
    yoshi.data[i] = data_to_filter
    yoshi.update_data()
}

//filters the data wrt the current categories
function filter_categories(data_to_filter, name, categories){
    let keep_categories = Object.keys(categories).filter(elem => {return categories[elem]})
    return data_to_filter.filter(e => keep_categories.includes(e[name]))
}

//filters the data wrt to the current min-max
function filter_number(data_to_filter, name, min, max){
    return data_to_filter.filter(e => (min < parseInt(e[name])) && (parseInt(e[name]) < max))
}