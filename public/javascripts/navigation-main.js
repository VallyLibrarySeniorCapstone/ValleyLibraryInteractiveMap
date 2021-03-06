/*

 Main js file for navigation functionality

 */

/*project global*/
var entryPoint;
var floorGridFromDB;
var ePointsJSON = null;

/*file globals*/
var grid;
var gridCalc;
var startPos;
var finishPos;

/*flags*/
var isHomeNav = false;
var walkable = true;
var startFlag = true;
var finishFlag = false;
var notWalkFlag = false;
var multiFloorNavFlag = false;



/*****************************
 * drawGrid
 * arguments:
 * svg: object containing XML data from the map
 *****************************/ 
var drawGrid = function (svgP) {

    svgP = svgP._groups[0][0];
    var h = null;
    var w = null;

    //delete grid if one is already present
    if(grid !== null){
        deleteGrid();
    }

    //get height and width of svg file
    if(svgP !== null){
        w = svgP.attributes.width.value;
        h = svgP.attributes.height.value;  
    }else{
        w = 700;
        h = 700;    
    }
    
    //size of grid squares
    var square = 9;
    
    w = w.slice(0, -6);
    h = h.slice(0, -6);
    
    // create the svg
    grid = d3.select('#grid').append('svg');

    grid.attr("width", w).attr("height", h).attr("class","navGrid");

    // calculate number of rows and columns
    var squaresRow = _.round(w / square)+1;
    var squaresColumn = _.round(h / square)+1;

    // loop over number of columns
    _.times(squaresColumn, function (n) {

    // create rectangles and append them to the svg, row by row
     grid.selectAll('rect' + ' .row-' + (n + 1)).data(d3.range(squaresRow))
            .enter().append('rect')
            .attr("fill-opacity", '.2')
            .attr("fill", 'white')
            .attr('class', function (d, i) {
                return 'square row-' + (n + 1) + ' ' + 'col-' + (i + 1);
            })
            .attr('id', function (d, i) {
                return 's-' + (n + 1) + "-" + (i + 1);
            })
            .attr("width", square)
            .attr("height", square)
            .attr("x", function (d, i) {
                return i * square;
            })
            .attr('y', n * square)
            .attr("stroke", 'black')
            .attr("stroke-width", ".2");

    });
    
    setGridPathFinderFromDB(squaresColumn, squaresRow, grid);
};
   

/*****************************
 * createNewGridPathFinder
 * arguments:
 * squaresColumn: the number of columns in the grid
 * squaresRow: the number of rows in the grid
 * grid: the grid object
 *****************************/ 
var createNewGridPathFinder = function (squaresColumn, squaresRow, grid) {
    /*Sets new pathfinding grid for pathfinding-js*/
    //set grid
    gridCalc = new PF.Grid(squaresColumn + 1, squaresRow + 1);
    //nonwalk
    _.times(squaresColumn, function (n) {
        _.times(squaresRow, function (m) {
            gridCalc.setWalkableAt(n, m, false);
            var recID = "s-" + n + "-" + m;
            grid.select("rect[id='" + recID + "']").attr('fill', 'grey');
        });
    });
};


/*****************************
 * createNewGridPathFinder
 * arguments:
 * squaresColumn: the number of columns in the grid
 * squaresRow: the number of rows in the grid
 * grid: the grid object
 *****************************/ 
var setGridPathFinderFromDB = function (squaresColumn, squaresRow, grid) {    
    /*grabs pathfinding grid from db, if not available create new grid*/
    //set grid
    gridCalc = new PF.Grid(squaresColumn, squaresRow);
    if(floorGridFromDB === null || floorGridFromDB === undefined){
        createNewGridPathFinder(squaresColumn, squaresRow, grid);
    }else{
        gridCalc.nodes = floorGridFromDB;
        //on backend, color grid    
        fillGrid();
    }
};

/*****************************
 * fillGrid - marks all walkable and non-walkable paths
 * arguments:
 *****************************/ 
var fillGrid = function(){
    
        var recID;

        if(isHomeNav===false){
        //nonwalk
        _.times(floorGridFromDB.length, function (m) {
            _.times(floorGridFromDB[0].length-1, function (n) {
                if(floorGridFromDB[m][n]===undefined){
                   console.log("floorGrid Undefined");
                }else{
                    if(floorGridFromDB[m][n].walkable){
                        recID = "s-" + n + "-" + m;
                        grid.select("rect[id='" + recID + "']").attr('fill', 'blue').attr('fill-opacity',.2);
                    }
                    else{
                        recID = "s-" + n + "-" + m;
                        grid.select("rect[id='" + recID + "']").attr('fill', 'red').attr('fill-opacity',.2);
                    }
                }
            });

        });
        drawAllEntrancePoints();        
    }
}


/*****************************
 * Navigate
 * arguments:
 * point1 : the starting location object
 * point2 : the end destination location object
 *****************************/ 
var navigate = function(point1, point2){
  if(point1.floor != point2.floor && multiFloorNavFlag===false){
        navToDiffFloors(point1,point2);
    }else{
        //uses global svg
        drawGrid(svg);
        drawLine(point1,point2);
    }
};

/*****************************
 * drawLine
 * arguments:
 * point1 : the starting location object
 * point2 : the end destination location object
 *****************************/ 
var drawLine = function(point1, point2){

    /*given two points, draw line from point 1 to point 2*/ 
     var pos1 = point1.entry_point.split('-');
     var row1 = parseInt(pos1[1]);
     var col1 = parseInt(pos1[2]);
     var pos2 = point2.entry_point.split('-');
     var row2 = parseInt(pos2[1]);
     var col2 = parseInt(pos2[2]);
     var gridBackup; 
     var path = null;    
    
    //find path
     var finder = new PF.AStarFinder();
     if(gridCalc === null || gridCalc===undefined){
        setGridPathFinderFromDB();
        gridBackup = gridCalc.clone(); 
        path = finder.findPath(row1, col1,  row2, col2, gridBackup);
     }else{
        gridBackup = 
             gridCalc;
        path = finder.findPath(row1, col1,  row2, col2, gridBackup);
     }
    
    //mark path on grid
     for (var x = 0; x < path.length-1; x++) {
         
    
        var recID = "s-" + path[x][0] + "-" + path[x][1];
       
         
        grid.select("rect[id='" + recID + "']")
             .attr('fill', '#c34500')
             .attr("path", 'true')
             .attr("fill-opacity",".8")
             .attr("stroke", 'none')
             .transition()
             .duration(1000)
             .attr("rx",100)
             .attr("height",7)
             .attr("width", 7)
             .attr("ry",100);
     }
    
    var endPath;
    var startPath;
       startPath = "s-" + path[0][0] + "-" + path[0][1];
         endPath = "s-" + path[path.length-1][0] + "-" + path[path.length-1][1];
    
    pathImages(startPath,endPath);
    

    //hides everything but the path
     hideGridForHomeNav();
 };



/*****************************
 * pathImages
 * Set start and end images 
 *****************************/
var pathImages = function(startPath, endPath){
    
    startPath = grid.select("rect[id='" + startPath + "']");

    
    var g = grid.append("svg:g").attr('id','youRhere');
    
    
    var img = g.append("svg:image")
    //href for start image
    .attr("xlink:href", "public/images/start-navigation.png")
    .attr("width", 30)
    .attr("height", 30)
    .attr("x", startPath._groups[0][0].attributes.getNamedItem('x').value-11)
    .attr("y", startPath._groups[0][0].attributes.getNamedItem('y').value-25);
    
    
    endPath = grid.select("rect[id='" + endPath + "']");
    endPath._groups[0][0].attributes.getNamedItem('fill').value = "none";
    
    var g = grid.append("svg:g").attr('id','star');
    
    var img = g.append("svg:image")
    //href for end image
    .attr("xlink:href", "public/images/end-navigation.svg")
    .attr("width", 30)
    .attr("height", 30)
    .attr("x", endPath._groups[0][0].attributes.getNamedItem('x').value-12)
    .attr("y", endPath._groups[0][0].attributes.getNamedItem('y').value-15);
   
}


/*****************************
 * drawLine
 * arguments:
 * point1 : the starting location object
 * point2 : the end destination location object
 *****************************/ 
var navToDiffFloors = function( point1, point2){
    var elevator1;
    var elevator2;
    var firstFloor = "#floor-" + point1.floor;
    var secondFloor = "#floor-" + point2.floor;
    $(firstFloor).click();
    
    //uses global svg
    drawGrid(svg);
  
        _.forEach(locations, function(loc){
            if(_.includes(loc.name,"elevator") || _.includes(loc.name,"Elevator")){
                if(point1.floor == loc.floor){
                    elevator1 = loc;
                }else if(point2.floor == loc.floor){
                    elevator2 = loc;
                }
            }
        });

        multiFloorNavFlag = true;
        drawLine(point1, elevator1);

        $(secondFloor).css("color","orange");
        var secMultFloorDeny = false; 
    
        $(secondFloor).click(function(){
            if(secMultFloorDeny === false){
            deleteGrid();
            navigate(point2, elevator2);
            secMultFloorDeny = true;
            $(secondFloor).css("color","black");        
            }
            //$(this).off();
        });
};

/* sets all of the on click/drag functionality for the the grid */
var gridMouse = function () {
    var allRectangles = grid.selectAll('rect');
    var isDragging = false;

    allRectangles.on('mousedown', function () {
        isDragging = true;
    });

    allRectangles.on('mousemove', function () {
        var pos = this.id.split('-');
        var row = pos[1];
        var col = pos[2];
        if (isDragging) {
            if (walkable) {
                var thisRec = grid.select("rect[id='" + this.id + "']").attr('fill', 'green').attr('fill-opacity',.5);
                thisRec.attr("walkable", true);
                gridCalc.setWalkableAt(row, col, true);
            } else {
                grid.select("rect[id='" + this.id + "']").attr('fill', 'white').attr('fill-opacity', '.1');
                gridCalc.setWalkableAt(row, col, false);
            }
        }
    });

    allRectangles.on('mouseup', function () {
        isDragging = false;
    });
};

/* mark the entry point for a location  */
var markPoints = function () {

    var lastPoint;
    var allRectangles = grid.selectAll('rect');

    allRectangles.on('click', function (d, i) {

        if (lastPoint !== "" && lastPoint !== undefined && lastPoint !== null)
            grid.select("rect[id='" + lastPoint + "']").attr('fill', 'white');

        lastPoint = this.id;
        grid.select("rect[id='" + this.id + "']").attr('fill', 'blue').attr("fill-opacity", ".8");
        
        //sets entry point for location object
        entryPoint = this.id; 

    });
};

//marks all entry_points on the navigation dashboard page
var drawAllEntrancePoints = function(){
    
    //epoinstJSON is simply a JSON of all locations
    if(ePointsJSON!==null || ePointsJSON === "undefined"){
        _.forEach(ePointsJSON, function(loc){
                if($("#floorSelect").val() == loc.floor){
                      grid.select("rect[id='" + loc.entry_point + "']").attr('fill', 'black').attr("fill-opacity", ".8");
                }
        });
    }
};


/*removes the grid from the page*/
function deleteGrid(){
    $("#grid > svg").remove();
}



/*load grid for point select on known locations dashboard page*/
var loadGridForKnown = function (svgi) {

    if (svgi !== undefined) {
     
        $("#navGrid").ready(function () {
            drawGrid(svgi);
            markPoints();
            hideGridForKnown();
        });
    }

};

/*show grid on the known and unkown location forms*/
var showGrid = function () {
    grid.attr("display","initial");
    grid.attr("z-index","1");
};

/*Hides the grid on the known and unknown locations page*/
var hideGridForKnown = function () {
    grid.attr("display","none");
    grid.attr("z-index","-1");
};

/*Hides the grid on the known page, displaying only path*/
var hideGridForHomeNav = function () {
    var rects = grid.selectAll('rect');
    rects.each(function () {
        if (this.attributes.getNamedItem("path") === null) {
            this.attributes.getNamedItem("fill-opacity").value = 0;
            this.attributes.getNamedItem("stroke").value = "none";
        }
    });
};



/*Test a line on the dashboard navigation page*/
function drawLineTest() {

    var allRectangles = grid.selectAll('rect');

    allRectangles.on('click', function (d, i) {

        var pos = this.id.split('-');
        var row = pos[1];
        var col = pos[2];
        if (startFlag) {
            startPos = [row, col];
            startFlag = false;
            finishFlag = true;
            d3.select(this).attr('fill', 'blue');

        } else if (finishFlag) {
            finishPos = [row, col];
            finishFlag = false;
            d3.select(this).attr('fill', 'red');
        } else {
            notWalkFlag = false;
        }

        if (startFlag !== true && finishFlag !== true) {
            var finder = new PF.AStarFinder();
            var recID;
            var path = finder.findPath(startPos[0], startPos[1], finishPos[0], finishPos[1], gridCalc);
            startFlag = false;
            finishFlag = false;


            for (var x = 1; x < path.length - 1; x++) {
                recID = "s-" + path[x][0] + "-" + path[x][1];
                grid.select("rect[id='" + recID + "']").attr('fill', 'black');
            }

            for (var z = 0; z < path.length; z++) {
                recID = "s-" + path[z][0] + "-" + path[z][1];
                grid.select("rect[id='" + recID + "']").attr("path", 'true');
            }

        }

        d3.select('#grid-ref').text(function () {
            return 'row: ' + (n + 1) + ' | ' + 'column: ' + (i + 1);
        });


    });
    
}


//onclick for backend testing
$("#navLine").on("click", function () {
    var allRectangles = grid.selectAll('rect');
    allRectangles.on('click', null);
    drawLineTest();
});


