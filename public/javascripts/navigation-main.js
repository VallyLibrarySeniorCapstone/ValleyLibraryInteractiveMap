/*

 Main js file for navigation functionality

 */

/*project global*/
var entryPoint;
var floorGridFromDB;

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

/*load grid for navigation dashboard page*/
var loadGridForAdmin = function (svgi) {

    if (svgi != undefined) {
        svgnav = svgi._groups[0][0];

        $("#setWalkTrue").on("click", function () {
            var allRectangles = grid.selectAll('rect');
            walkable = true;
            allRectangles.on("click", null);
            gridMouse();
        });

        $("#setWalkFalse").on("click", function () {
            var allRectangles = grid.selectAll('rect');
            walkable = false;
            allRectangles.on("click", null);
            gridMouse();
        });

        $("#navGrid").ready(function () {

            drawGrid(svgnav);
            gridMouse();

        });
    }

};

/*load grid for point select on known*/
var loadGridForKnown = function (svgi) {

    if (svgi != undefined) {
        svgnav = svgi._groups[0][0];
        $("#navGrid").ready(function () {
            drawGrid(svgnav);
            markPoints();
            hideGridForKnown();
        });
    }

};

/*Takes svg */
var drawGrid = function (svgP) {

    if(svgP!=null){
        var w = svgP.attributes.width.value;
        var h = svgP.attributes.height.value;    
    }else{
        var w = 700;
        var h = 700;
        
    }
    
    var square = 12;
    
    w = w.slice(0, -6);
    h = h.slice(0, -6);

    
    // create the svg
    grid = d3.select('#grid').append('svg');
    grid.attr("width", w).attr("height", h);

    // calculate number of rows and columns
    var squaresRow = _.round(w / square)+1;
    var squaresColumn = _.round(h / square)+1;

    // loop over number of columns
    _.times(squaresColumn, function (n) {

        // create each set of rows

        var rows = grid.selectAll('rect' + ' .row-' + (n + 1)).data(d3.range(squaresRow))
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
            .attr("stroke-width", ".5");

    });
    
    setGridPathFinderFromDB(squaresColumn, squaresRow, grid);
    allRectangles = grid.selectAll('rect');
};
   
/*Sets new pathfinding grid for pathfinding-js*/
var setNewGridPathFinder = function (squaresColumn, squaresRow, grid) {
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

/*grabs pathfinding grid from db, if not available create new grid*/
var setGridPathFinderFromDB = function (squaresColumn, squaresRow, grid) {
    //set grid
    gridCalc = new PF.Grid(squaresColumn, squaresRow);
    if(floorGridFromDB == null || floorGridFromDB === undefined){
        setNewGridPathFinder(squaresColumn, squaresRow, grid);
    }else{
    gridCalc.nodes = floorGridFromDB;
    if(isHomeNav==false){
        //nonwalk
        _.times(squaresColumn, function (n) {

            _.times(squaresRow, function (m) {
                if(floorGridFromDB[m][n].walkable){
                    var recID = "s-" + n + "-" + m;
                    grid.select("rect[id='" + recID + "']").attr('fill', 'green');
                }
                else{
                    var recID = "s-" + n + "-" + m;
                    grid.select("rect[id='" + recID + "']").attr('fill', 'white');
                }
            });

        });
    }
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
    rects = grid.selectAll('rect');
    rects.each(function () {
        var x = this;
        if (this.attributes.getNamedItem("path") == null) {
            this.attributes.getNamedItem("fill-opacity").value = 0;
            this.attributes.getNamedItem("stroke").value = "none";

        } else {
            this.attributes.getNamedItem("fill-opacity").value = .4;
        }
    });
};

/*Test a line on the dashboard navigation page*/
function drawLineTest() {

    
    /*for drawing the test line*/
   
    
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

        if (startFlag != true && finishFlag != true) {
            var finder = new PF.AStarFinder();
            var path = finder.findPath(startPos[0], startPos[1], finishPos[0], finishPos[1], gridCalc);
            startFlag = false;
            finishFlag = false;


            for (var x = 1; x < path.length - 1; x++) {
                var recID = "s-" + path[x][0] + "-" + path[x][1];
                grid.select("rect[id='" + recID + "']").attr('fill', 'black');
            }

            for (var x = 0; x < path.length; x++) {
                var recID = "s-" + path[x][0] + "-" + path[x][1];
                grid.select("rect[id='" + recID + "']").attr("path", 'true');
            }

        }

        d3.select('#grid-ref').text(function () {
            return 'row: ' + (n + 1) + ' | ' + 'column: ' + (i + 1);
        });


    });
    
}

/*clear paths for the navigation line test on the dashboard page*/
var clearPaths = function () {
    startFlag = true;
    finishFlag = false;

    for (var x = 1; x < path.length - 1; x++) {
        var recID = "s-" + path[x][0] + "-" + path[x][1];
        grid.select("rect[id='" + recID + "']").attr('fill', 'white');
    }

    for (var x = 0; x < path.length; x++) {
        var recID = "s-" + path[x][0] + "-" + path[x][1];
        grid.select("rect[id='" + recID + "']").attr("path", 'false');
    }

    var startid = "s-" + startPos[0] + "-" + startPos[1];
    var finishid = "s-" + finishPos[0] + "-" + finishPos[1];
    grid.select("rect[id='" + startid + "']").attr("path", 'false').attr('fill', 'white');
    grid.select("rect[id='" + finishid + "']").attr("path", 'false').attr('fill', 'white');

    startPos = null;
    finishPos = null;
};

/*given two points, navigate from point 1 to point 2*/ 
var drawLine = function(point1, point2){
  
     var pos1 = point1[0].entry_point.split('-');
     var row1 = pos1[1];
     var col1 = pos1[2];
     var pos2 = point2[0].entry_point.split('-');
     var row2 = pos2[1];
     var col2 = pos2[2];
     
     var finder = new PF.AStarFinder();
     if(gridCalc == null || gridCalc===undefined){
        setGridPathFinderFromDB();
        var path = finder.findPath(row1, col1,  row2, col2, gridCalc);
     }else{
        var path = finder.findPath(row1, col1,  row2, col2, gridCalc);
     }


     for (var x = 0; x < path.length; x++) {
         var recID = "s-" + path[x][0] + "-" + path[x][1];
         grid.select("rect[id='" + recID + "']").attr('fill', 'blue');
     }

     for (var x = 0; x < path.length; x++) {
         var recID = "s-" + path[x][0] + "-" + path[x][1];
         grid.select("rect[id='" + recID + "']").attr("path", 'true');
     }

     hideGridForHomeNav();


 };
 
/* sets all of the on click/drag functionality for the the grid */
var gridMouse = function () {
    var allRectangles = grid.selectAll('rect');
    var isDragging = false;

    var makeWalkMouseDown = allRectangles.on('mousedown', function () {
        isDragging = true;
    });

    var makeWalkMouseDrag = allRectangles.on('mousemove', function () {
        var pos = this.id.split('-');
        var row = pos[1];
        var col = pos[2];
        if (isDragging) {
            if (walkable) {
                var thisRec = grid.select("rect[id='" + this.id + "']").attr('fill', 'green');
                thisRec.attr("walkable", true);
                gridCalc.setWalkableAt(row, col, true);
            } else {
                grid.select("rect[id='" + this.id + "']").attr('fill', 'white').attr('fill-opacity', '.4');
                gridCalc.setWalkableAt(row, col, false);
            }
        }
    });

    var makemouseUp = allRectangles.on('mouseup', function () {
        var wasDragging = isDragging;
        isDragging = false;
        if (!wasDragging) {
        }
    });
};

/* mark the entry point for a location  */
var markPoints = function () {

    var lastPoint;
    var allRectangles = grid.selectAll('rect');


    allRectangles.on('click', function (d, i) {

        var pos = this.id.split('-');
        var row = pos[1];
        var col = pos[2];

        if (lastPoint != "" && lastPoint != undefined && lastPoint != null)
            grid.select("rect[id='" + lastPoint + "']").attr('fill', 'white');

        lastPoint = this.id;
        grid.select("rect[id='" + this.id + "']").attr('fill', 'blue').attr("fill-opacity", ".8");
        
        entryPoint = this.id; 

        

    });
};

$("#navLine").on("click", function () {
    var allRectangles = grid.selectAll('rect');
    allRectangles.on('click', null);
    drawLineTest();
});


