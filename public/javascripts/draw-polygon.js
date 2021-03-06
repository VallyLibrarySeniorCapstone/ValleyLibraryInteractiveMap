/**
 * Project:
 * File: render-map
 * Author: Nathan Healea, Matthew Zakrevsky
 * Created: 1/16/17
 */

 var data;
 var count;
 var pointArray = [];
 var result = [];
 var start = false;
 var end = false;
 var show  =false;
 var startPos = null;
 var endPos = null;
 var locationLayers = false;



 function getNavPoints(svg){

    if(start){
        svg.select(start).style("fill","blue").style("opacity",.5);
    }

    if(end){
        svg.select(end).style("fill","red").style("opacity",.5);
    }

    if((start && end)){
        var location1 = start.split("-")
        var location2 = end.split("-")
        var point1 = getEntryPoint(location1[1]);
        var point2 = getEntryPoint(location2[1]);
        navigate(point1,point2);
    }
    
    
}

function buildLayers(svg){
    var known = svg.append('g')
        .attr('id', 'layer-known');
    var unknow = svg.append('g')
        .attr('id', 'layer-unknown');
    var servicepoint = svg.append('g')
        .attr('id', 'layer-servicepoint');
    var room = svg.append('g')
        .attr('id', 'layer-room');

        locationLayers = true;
}

function getEntryPoint(location, callback) {
    var temp = false
    $.ajax({
        type: "POST",
        async: false,
        url: '/mapapi/getEntryPoint',
        data: {
            location: location
        }
    })
    .done(function (data) {
            // console.log(data);
            var result = JSON.parse(data);
            temp = result
        })
    .fail(function () {
        console.log("Ajax Failed.");
    });
    return temp;
}



/*****************************
 * renderPolygons
 * arguments:
 * svg: object containing XML data from the map
 * data: object containing information about the location to be drawn on the map
 * Return: none
 *****************************/ 
 function renderPolygons(svg, data) {
    $('body').append(createTooltip(data));

    points = JSON.parse(data.data_point)

    var attrArray = []

    var layer = null;

    if(locationLayers){
        layer = svg.select('#layer-' + data.type);
    }
    else{
        console.log(svg.select('#layer-locaiton').empty());
        if(svg.select('#layer-locaiton').empty()){
            layer = svg.append('g').attr('id', 'layer-locaiton');
        }
        else{
            layer = svg.select('#layer-locaiton');
        }
    }

    

    //var foo = svg.append('g').attr('class', 'newLayer')
    //.text("hello world")
    //.style('fill', 'black')
    //
    layer.append("polygon")
    .attr("id", "poly-"+ data.id +"" )
    .attr("points", points)
    .on("click", function(){
        var div = $('#tooltip-' + data.id);

        if (div.hasClass('hidden')){

            div.css('position', 'absolute');
            div.css('top', (d3.event.pageY - 28) + "px");
            div.css('left', (d3.event.pageX) + "px");
            div.removeClass('hidden');


        }else{
            div.addClass('hidden');
        }
    })
    .style("fill", data.color)
    .style("stroke", data.color)
    .style("opacity", 0.5);


    if(data.display){
        var g = getCenter(points);
        svg.append('text')
        .attr('x', g.x )
        .attr('y', g.y)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .text(data.name);
    }

}
/*****************************************
 * getCenter
 * returns: the x,y point in the near center of the shape.
 * variables:
 * points-string containing comma separated and space separated variables  
 * will parse the string split by commas and derive the centerish point of the 
 * shape. Best for rectangles.
 * */
function getCenter(points){
    var points = points.split(" ");

    var point1 = points[0].split(",");
    var point2 =  points[2].split(",");

    var center = {
        'x' : (Number(point1[0]) + Number(point2[0]))/2,
        'y' : (Number(point1[1]) + Number(point2[1]))/2
    }
    return center;
}



/*****************************
 * selecByShape
 * arguments:
 * svg: object containing XML data from the map
 * Return: none
 * This function will derive data for the location forms in order to make it so that the 
 * shape data is saved to the database. Must derive the corners for all rectangles and ellipses
 *****************************/

function selectByShape(svg) {
var oldColor = null;
    
    var rects = svg.selectAll("rect");

        rects.on("mouseenter", function () {
            if(this.attributes.getNamedItem("fill").value != "none"){
                oldColor = this.attributes.getNamedItem("fill").value
            }
            this.attributes.getNamedItem("fill").value = "#5bc0de";
        });

        rects.on("mouseleave", function () {
            if (oldColor){
                this.attributes.getNamedItem("fill").value = oldColor;
                oldColor = null;
            } else {
                this.attributes.getNamedItem("fill").value = "none";
            }
        });

        //get data from map
        rects.on("click", function () {
     
        this.attributes.getNamedItem("fill").value = "red"
        oldColor = "red"
        var values = {
            "x": this.attributes.getNamedItem("x").value,
            "y": this.attributes.getNamedItem("y").value,
            "width": this.attributes.getNamedItem("width").value,
            "height": this.attributes.getNamedItem("height").value
        }

        //points go clockwise with point 1 being top left
        //derive each corner in x,y coordinates
        var p = {
            point1: {
                x: values.x,
                y: values.y
            },
            point2: {
                x: Number(values.x) + Number(values.width),
                y: values.y
            },
            point3: {
             x: Number(values.x) + Number(values.width),
             y: Number(values.y) + Number(values.height)

         },
         point4: {
            x: values.x,
            y: Number(values.y) + Number(values.height)
        }
    };

        //save coordinates for the form in the form "x,y x,y x,y x,y"
        data = p.point1.x + ',' + p.point1.y + ' ' +  p.point2.x + ',' + p.point2.y + ' '
        +  p.point3.x + ',' + p.point3.y + ' ' +  p.point4.x + ',' + p.point4.y 

        
        this.attributes.getNamedItem("fill").value = "red";

    });


    //polygons
    var polygon = svg.selectAll("polygon");

    polygon.on("mouseenter", function () {
        if(!this.attributes.getNamedItem("fill").value ){
            oldColor = this.attributes.getNamedItem("fill").value
        }
        
        this.attributes.getNamedItem("fill").value = "#5cb85c";

    });

    polygon.on("mouseleave", function () {
       if (oldColor){
            this.attributes.getNamedItem("fill").value = oldColor;
            oldColor = null;
        } else {
        this.attributes.getNamedItem("fill").value = "white";
    }
})

    polygon.on("click", function () {
      
        this.attributes.getNamedItem("fill").value = "red"
        oldColor = "red"


        data = {
            "points": this.attributes.getNamedItem("points").value
        }

        this.attributes.getNamedItem("fill").value = "red";

    });

    //elipses
    var ellipse = svg.selectAll("ellipse");

    ellipse.on("mouseenter", function () {
        if(this.attributes.getNamedItem("fill").value ){
            oldColor = this.attributes.getNamedItem("fill").value
        }
        this.attributes.getNamedItem("fill").value = "#428bca";

    });
    ellipse.on("mouseleave", function () {
        if (oldColor){
            this.attributes.getNamedItem("fill").value = oldColor;
            oldColor = null;
        } else {
            this.attributes.getNamedItem("fill").value = "white";
        }        
    });


    //derives a polygon based upon the ellipse's attributes
    ellipse.on("click", function () {
        
        this.attributes.getNamedItem("fill").value = "red"
        oldColor = "red"

        var ellipseVal =  {
            "cx": this.attributes.getNamedItem("cx").value,
            "cy": this.attributes.getNamedItem("cy").value,
            "rx": this.attributes.getNamedItem("rx").value,
            "ry": this.attributes.getNamedItem("ry").value
        }
        
        //determines x,y coordinates
        var corners = {
            point1 : {
              'x' : Number(ellipseVal.cx) - Number(ellipseVal.rx),
              'y' :  Number(ellipseVal.cy) - Number(ellipseVal.ry)
          },
          point2 : {
              'x' : Number(ellipseVal.cx) + Number(ellipseVal.rx),
              'y' :  Number(ellipseVal.cy) - Number(ellipseVal.ry)
          },
          point3 : {
              'x' : Number(ellipseVal.cx) + Number(ellipseVal.rx),
              'y' :  Number(ellipseVal.cy) + Number(ellipseVal.ry)
          },
          point4 : {
              'x' : Number(ellipseVal.cx) - Number(ellipseVal.rx),
              'y' :  Number(ellipseVal.cy) + Number(ellipseVal.ry)
          }

      }


            //produces test tring in form "x,y x,y x,y x,y"
            data = corners.point1.x + ',' + corners.point1.y + ' ' +  corners.point2.x + ',' + corners.point2.y + ' '
            +  corners.point3.x + ',' + corners.point3.y + ' ' +  corners.point4.x + ',' + corners.point4.y 

            this.attributes.getNamedItem("fill").value = "red";
        });

}

/*****************************
 * drawByButton
 * arguments:
 * svg: object containing XML data from the map
 * Return: none
 * Allows for shapes to be drawn point by point
 *****************************/

 function drawByButton(svg) {

    count = 0;

    // creates a new polygons layer
    var polyLayer = svg.append("g").attr("id", "polygons");


    // onclick to add points to svg
    svg.on("click", function (ev) {
        pos = d3.mouse(this);
        point = {
            "x": pos[0],
            "y": pos[1]
        };
    

        // add points to array
        pointArray.push(point);

        //console.log(pointArray);

        // create representation of position clicked by user
        polyLayer.append("circle")
        .attr("class", "click-circle")
            //.attr("transform", "translate("+ p.x+ ","+ p.y+")")
            .attr('cx', point.x)
            .attr('cy', point.y)
            .attr("r", "5")
            .style("fill", "000000");


        // connect lines between points drawn on map
        svg.append("line")
        .attr("class", "click-line")
        .attr("x1", pointArray[count].x)
        .attr("y1", pointArray[count].y)
        .attr("x2", pointArray[(count + 1)].x)
        .attr("y2", pointArray[(count + 1)].y)
        .style("fill", "0cff00")
        .style("stroke", "0cff00")
        .style("strokeWidth", 0.5);

        count++;

    });

}
/******************************
 * clear
 * return: none
 * variables:
 * svg- the svg saved as a html div, used in d3 
 * removes all temporary points and polygons * 
 */
function clear(svg) {
    
    svg.selectAll("circle.click-circle").remove();
    svg.selectAll("polygon.drawn-poly").remove();
    svg.selectAll("line.click-line").remove();
    while (pointArray.length > 0) {
        pointArray.pop();
    }
    count = 0;
}


/******************************
 * fill
 * return: none
 * variables:
 * svg- the svg saved as a html div, used in d3 
 * fills in the point-by-point drawn shapes * 
 */
function fill(svg) {
    svg.append("polygon")
    .attr("class", "drawn-poly")
    .attr("points", function () {
        return data = pointArray.map(function (d) {
            return [d.x, d.y].join(",");
        }).join(" ");
    })
    .style("fill", "0cff00")
    .style("stroke", "0cff00")
    .style("opacity", .25);
}

/******************************
 * createTooltips 
 * return: html with all text for the tooltip.
 * variables:
 * data-the necessary data for the location to build the tool tip. 
 */
function createTooltip(data){
    var locationTags = JSON.parse(data['attribute']);
    var locationAttrs = JSON.parse(data['tag']);
    var tooltip = $('<div>',{
        'id': 'tooltip-' + data.id,
        'class': 'location-tooltip hidden'
    });

    var close= $('<div>',{
        'id': 'close-' + data.id,
        'class': 'close',
        'text': 'X'
    })

    var name = $('<div>',{
        'id': 'row'
    }).append(
    $('<div>',{
        'id': 'col-md-12',
        'class':'title'
    }).append(
    $('<h4>',{
        'text': data.name
    })));

    // Create html structure to hold locaiton attributes
    var attributes = $('<div>',{
        'class': 'col-md-6'
    }).append('<h5><strong>Attributes</strong></h5>');

    // appending attributes
    /*for(a in locationAttrs){
        attributes.append(
            '<p>' + locationAttrs[a] + '</p>');
    }*/

    attributes.append('<p>' + locationAttrs.join(', ') + '</p>');

    // Create html structure to hold locaiton tags
    var tags = $('<div>',{
        'class': 'col-md-6'
    }).append('<h5><strong>Tags</strong></h5>');

    // appending atgs
    /*for(t in locationTags){
        tags.append(
            '<p>' + locationTags[t] + '</p>');
    }*/

    tags.append('<p>' + locationTags.join(', ') + '</p>');

    var startBtn = $('<div>',{
        'class': 'col-md-6'
    }).append(
    $('<div>',{
        'id': 'start-' + data.id,
        'class': 'btn btn-success',
        'text': 'Start Here'

    }));
    
    startBtn.on("click",function(){
       close.click(); 
    });
    
    

    var endBtn = $('<div>',{
        'class': 'col-md-6'
    }).append(
    $('<div>',{
        'id': 'end-' + data.id,
        'class': 'btn btn-danger',
        'text': 'End Here'

    }));
    
    endBtn.on("click",function(){
       close.click(); 
    });

    // Adding content to tooltip
    tooltip.append(
        close,
        name,
        $('<div>',{'class': 'row'}).append(attributes, tags),
        $('<div>',{'class': 'row tt-nav-row'}).append(startBtn, endBtn)

    )


    return tooltip;

}

/**
 * creates click events for all buttons in tooltips
 */
 function tooltipBtn(){
    var id = null;
    var startLable = $('#start-location');
    var endLable = $('#end-location');

    // Start button on click event
    $('[id*="start-"]').on('click', function(){

        // parse id 
        id = this.id.split('start-')[1];

        // find locaiton object
        locationObj = findObj(id);

        // write location name to start-locaiton lable
        if(startLable.text() == ""){
            startLable.text(locationObj.name);
        }
        else{
            startLable.empty()
            startLable.text(locationObj.name);
        }


        startPos = locationObj;

    });

    // End butten on click event
    $('[id*="end-"]').on('click', function(){
        // parse id 
        id = this.id.split('end-')[1];

        // find locaiton object
        locationObj = findObj(id);

        // write location name to start-locaiton lable
        if(endLable.text() == ""){
            endLable.text(locationObj.name);
        }
        else{
            endLable.empty()
            endLable.text(locationObj.name);
        }


        endPos = locationObj;
    });

    // End butten on click event
    $('[id*="close-"]').on('click', function(){
        id = this.id.split('-')[1];
        //console.log(id);
        $('#tooltip-' + id).addClass('hidden');
    });
}

function findObj(id){
    var result = false;
    for(var l in locations){
        if(locations[l].id == parseInt(id)){
            result = locations[l];
        }
    }
    return result;

}

/**************************************
 * drawByBox  
 * return:none
 * Variables:
 * svg: svg: the html object containg the SVG xml datat
 * Allow the user to draw a box to the map by first clicking 
 * where the top left corner is to be located and then
 * clicking where the bottom right corner is located
 */
function drawByBox(svg){
  var point1 = null;
  var point2 = null;
  var polyLayer = svg.append("g").attr("id", "polygons");


  svg.on("click", function (ev) {
    pos = d3.mouse(this);
    if (point1 == null){
        point1 = {
            "x": pos[0],
            "y": pos[1]

        }
        polyLayer.append("circle")
        .attr("class", "click-circle")
            //.attr("transform", "translate("+ p.x+ ","+ p.y+")")
            .attr('cx', point1.x)
            .attr('cy', point1.y)
            .attr("r", "5")
            .style("fill", "000000");

        } else {
            point2= {
                "x": pos[0],
                "y": pos[1]
            }
            polyLayer.append("circle")
            .attr("class", "click-circle")
            //.attr("transform", "translate("+ p.x+ ","+ p.y+")")
            .attr('cx', point2.x)
            .attr('cy', point2.y)
            .attr("r", "5")
            .style("fill", "000000");

        }
        if (point1 != null && point2 != null){
            //console.log()
            var points =  deriveCorners(point1, point2)
            drawSpace(svg, points)
            data = points;
        }

    });


}
/************************
 * deriveCorners 
 * return: the string of the polygon with the four corners of a rectangle 
 * shape in polygon form
 * vairables
 * point1: the top left corner of the rectangle
 * point2: bottom right corner of the rectangle to be drawn
 * Mathematicaly derives a rectangle shape before returning the results of the 
 * function in polygon form 
 */
function deriveCorners(point1, point2){

    var point3 = {
        'x' : point1.x,
        'y' : point2.y 
    }

    var point4 = {
        'x' : point2.x,
        'y' : point1.y 
    }

    var points = point1.x + ',' + point1.y + ' '  + point4.x + ','+ point4.y +  ' ' + point2.x + ',' + point2.y + ' '  + point3.x + ',' + point3.y + ' '

    return points;
}

/************************
 * drawSpace
 * return: None
 * variables:
 * svg: the html object containg the SVG xml data
 * points: the points of the polygon to be drawn in the svg
 * draws a polygon and appends to the svg
 ************************/
function drawSpace(svg,points){
    svg.append('polygon')
    .attr('class', 'drawn-poly')
    .attr('points', points)
    .style('fill', 'blue')
    .style('opacity', 0.5)
}
