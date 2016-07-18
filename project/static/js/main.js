// Global variable for the id of the user being currently viewed
currentlyViewing = 0;

// Global variable for whether to reRender sections
reRenderChild   = true;
reRenderProfile = false;
reRenderParent  = true;

// Global variable for the various containers
childViewContainer  = null;
parentViewContainer = null;

// Changes the user currently being viewed
function setCurrentlyViewing(id) {
    currentlyViewing = id;

    reRenderChild   = true;
    reRenderProfile = true;
    reRenderParent  = true;
}

// Loads fullpage.js for the main page
function fullPageHandler() {
    $.post(
        '/setDefaultViewing',
        function(data) {
            currentlyViewing = parseInt(data);

            $('#mainPage').fullpage({
                // scrollBar: true, //debug, remove later
                // autoScrolling: false,
                scrollingSpeed: 300,
                navigation: true,
                verticalCentered: false,
                scrollOverflow: true,
                afterRender: function () {
                    loadProfileView();
                    initializeChildView();
                    initializeParentView();
                },
                onLeave: function(index, nextIndex, direction) {
                    if (nextIndex == 1 && reRenderChild) {
                        reRenderChild = false;
                        loadChildView();
                    }
                    else if (nextIndex == 3 && reRenderParent) {
                        reRenderParent = false;
                        loadParentView();
                    }
                    else if (reRenderProfile) {
                        reRenderProfile = false;
                        loadProfileView();
                    }
                }
            });

        }
    );
}

// Initializes the child view
function initializeChildView() {
    var h = $("#childView").height();
    var w = $("#childView").width();

    childViewContainer = d3.select("#childView").append("svg")
        .attr("style", "position: absolute; top: 0; left: 0; z-index: 1")
        .attr("width",  w)
        .attr("height", h);

    //Defs for pattern masks
    childViewContainer.append("defs").attr("id", "allChildren");
    childViewContainer.append("defs").attr("id", "static")
    .append("pattern")
        .attr("id", "trunk")
        .attr("x", 0)
        .attr("y", 0)
        .attr("height", 347)
        .attr("width", 346)
        .attr("patternUnits", "userSpaceOnUse")
    .append("image")
        .attr("height", 347)
        .attr("width", 346)
        .attr("xlink:href", "/static/images/trunk.png");
    d3.select("#static").append("pattern")
        .attr("id", "childrenOfPattern")
        .attr("x", 0)
        .attr("y", 0)
        .attr("height", 1)
        .attr("width", 1)
    .append("image")
        .attr("x", 0)
        .attr("y", 0);

    //Tree trunk
    childViewContainer.append("path")
        .attr("d", drawTrunk(w, h))
        .attr("fill", "url(#trunk)");

    //Ground
    childViewContainer.append("path")
        .attr("d", drawGround(w, h))
        .attr("fill", "sandybrown");

    //Canopy
    childViewContainer.append("path")
        .attr("d", drawCanopy(w, h))
        .attr("fill", "forestgreen");

    //Profile images
    childViewContainer.append("g").attr("id", "childProfileImages");
    childViewContainer.append("circle").attr("id", "childrenOf");
}

// Initializes the parent view
function initializeParentView() {
    parentViewContainer = d3.select("#parentView")
                            .append("svg")
                            .attr("style", "position: absolute; top: 0; left: 0; z-index: 1")
                            .attr("width",  $("#parentView").width())
                            .attr("height", $("#parentView").height());
    parentViewContainer.append("defs");
}

// Fetches the viewed user's children data from the server via ajax POST
function loadChildView() {
    $.post(
        '/childView',
        {"currentlyViewing": currentlyViewing},
        renderChildView
    );
}

// Fetches the viewed user's profile from the server via ajax POST
function loadProfileView() {
    $.post(
        '/profileView',
        {"currentlyViewing": currentlyViewing},
        renderProfileView
    );
}

// Fetches the viewed user's parent + sibling data from the server via ajax POST
function loadParentView() {
    //Add edge case for David's ID

    $.post(
        '/parentView',
        {"currentlyViewing": currentlyViewing},
        renderParentView
    );
}

// Callback function for loadChildView(), renders the children's data
var renderChildView = function (data) {
    var response = jQuery.parseJSON(data);
    var w = $("#childView").width();  //screen width
    var h = $("#childView").height(); //screen height
    var r = (w < h) ? parseInt(w/16) : parseInt(h/16); //radius of profile images
    if (r < 25) //minimum radius is 25
        r = 25;

    //Canopy parameters
    var canopyW = (w < h) ? h*1.2 : w*0.8; //canopy width, minimum is 800
    if (canopyW < 800)
        canopyW = 800;
    var centerX = w/2; //x-coord of canopy center
    var centerY = 50;  //y-coord of canopy center

    //Ellipse parameters, profile pictures are placed inside this half-ellipse
    var areaW = (w < canopyW) ? w : canopyW*0.85; //width of ellipse
    var areaH = h*0.55; //height of ellipse
    var rx = areaW/2-r; //x-radius of ellipse
    var ry = areaH-r;   //y-radius of ellipse

    var capacity = parseInt(areaW*areaH/(16*r*r)); //max number of children that can fit

    //ENFORCE CAPACITY LIMIT AND ADD OVERFLOW SCENARIO

    //DEBUG
    // childViewContainer.append("ellipse").attr("cx", w/2).attr("cy", 50)
    // .attr("rx", areaW/2).attr("ry", areaH)
    // .attr("stroke", "black").attr("stroke-width", 3)
    // .attr("fill", "none");

    //Set parameters for the D3 force layout
    var force = d3.layout.force();
    force.nodes(response.children)
         .links(response.edges)
         .size([areaW, areaH])
         // .charge([(h < 500) ? -1*areaW : -2*areaW])
         .charge([-areaW*capacity/response.children.length])
         .linkDistance([(3*capacity/response.children.length)*r]);

    //Add masks to make profile images circular
    var allPatterns = d3.select("#allChildren").selectAll("pattern").data(response.children);
    allPatterns.enter().append("pattern").append("image");
    allPatterns.exit().remove();
    allPatterns.attr("id", function(d) { return "imga" + d.id; })
               .attr("x", 0)
               .attr("y", 0)
               .attr("height", 1)
               .attr("width", 1);
    allPatterns.select("image")
               .attr("x", 0)
               .attr("y", 0)
               .attr("height", r*2)
               .attr("width", r*2)
               .attr("xlink:href", getImgName);

    //Move the force layout onto the canopy
    var circleContainer = d3.select("#childProfileImages")
                                            .attr("transform", "translate("+ String(centerX-areaW/2) +", "+ centerY +")");

    d3.select("#childrenOfPattern").data(response.user).enter();
    d3.select("#childrenOfPattern").select("image")
                                   .attr("height", r*2)
                                   .attr("width", r*2)
                                   .attr("xlink:href", getImgName);
    d3.select("#childrenOf").attr("cx", w/2)
                            .attr("cy", h-r)
                            .attr("r", r)
                            .attr("fill", "url(#childrenOfPattern)");

    //Set attributes of profile images
    var allCircles = circleContainer.selectAll("circle").data(response.children);
    allCircles.enter().append("circle");
    allCircles.exit().remove();
    allCircles.attr("r", r)
              .attr("fill", function(d) { return "url(#imga" + d.id +")"; })
              .attr("onclick", function(d, i) { return "childViewClick(" + d.id + ")"; });

    //Generate static D3 force layout
    setTimeout(function() {
        var n = response.children.length;

        force.start();
        for (var i = 0; i < n*n+100; ++i) force.tick();
        force.stop();

    }, 10);

    // var link = circleContainer.selectAll("line").data(response.edges).enter().append("line").attr("stroke-width", 1).attr("stroke", "black");

    //Calculations for each step of force layout generation
    force.on("tick", function() {
        allCircles.attr("cx", function(d, i){
            var buffer = 5; //to stop profile images from sinking into navbar

            return d.x = Math.max(r+buffer, Math.min(d.x, areaW-r-buffer));
        }).attr("cy", function(d, i) {
            var b = Math.min(areaW-r, Math.max(d.x, r));
            tempY = ry*Math.sqrt(1-Math.pow(b-rx-r,2)/Math.pow(rx,2));
            
            return d.y = Math.max(r, Math.min(d.y, tempY));
        });
        // allCircles.call(force.drag);

        // link.attr("x1", function(d) { return d.source.x; })
        //     .attr("y1", function(d) { return d.source.y; })
        //     .attr("x2", function(d) { return d.target.x; })
        //     .attr("y2", function(d) { return d.target.y; });
    });
}

// Sets currentlyViewing to the id of the clicked user
// Updates the child view to show the user and their children instead
function childViewClick(id) {
    setCurrentlyViewing(id);
    $.post(
        '/childView',
        {"currentlyViewing": currentlyViewing},
        renderChildView
    );
}

// Callback function for loadProfileView(), renders the user's profile
var renderProfileView = function (data) {
    var response = jQuery.parseJSON(data);

    if ($("#profileView").width() < 767)
        $("#viewingImg").attr("width", 75);
    else
        $("#viewingImg").attr("width", 150);
    $("#viewingImg").attr("src", getImgName(response));
    $("#viewingName").html(response.name);
    $("#viewingEmail").html(response.email);
    // $("#viewingAbout").html(response.about);
    // $("#viewingProject").html(response.project);
    // $("#viewingLink").html(response.fundraise);
    var a = "Lorem ipsum dolor sit amet, mauris parturient, rutrum arcu eu arcu tortor, tincidunt lorem pharetra tincidunt, \
    habitasse eu lobortis erat primis. Eros venenatis, tortor ligula mus lectus senectus orci arcu. Ipsum nostra iaculis ac, \
    gravida rutrum nec ut. Nec tellus nunc, lorem urna vestibulum eget ut et. ";
    $("#viewingAbout").html(a + a);
    $("#viewingProject").html(a);
    $("#viewingLink").html(a);

    // Refresh the iScroll boundaries after AJAX call
    $(window).trigger('resize');
}

// Callback function for loadParentView(), renders the parent + sibling data
var renderParentView = function (data) {
    var response = jQuery.parseJSON(data);
    var w = $("#parentView").width();
    var h = $("#parentView").height();
    var r = (w < h) ? parseInt(w/16) : parseInt(h/16);
    if (r < 25) //minimum radius is 25
        r = 25;
    var ringR = (w < h) ? parseInt(w/3) : parseInt(h/3);
    var sibs = response.length-1;
    var shift = Math.PI/2;

//=================================================================
    // parentViewContainer.append("ellipse").attr("fill", "gray")
    // .attr("cx", w/2).attr("cy", h/2)
    // .attr("rx", ringR).attr("ry", ringR);
//=================================================================

    var patternData = d3.select("#parentView").select("defs").selectAll("pattern").data(response);
    patternData.enter().append("pattern").append("image");
    patternData.exit().remove();

    patterns = parentViewContainer.select("defs").selectAll("pattern")
    patterns.attr("id", function(d) { return "imgc" + d.id; })
            .attr("x", 0)
            .attr("y", 0)
            .attr("height", 1)
            .attr("width", 1);

    patterns.select("image")
            .attr("x", 0)
            .attr("y", 0)
            .attr("height", r*2)
            .attr("width", r*2)
            .attr("xlink:href", getImgName);

    var circleData = parentViewContainer.selectAll("circle").data(response);
    circleData.enter().append("circle");
    circleData.exit().remove();
    parentViewContainer.selectAll("circle")
                      .attr("cx", function(d, i) {
                          if (i != 0)
                              return w/2 + ringR*Math.cos(2*Math.PI*(i-1)/sibs-shift);
                          else
                              return w/2;
                      })
                      .attr("cy", function(d, i) {
                          if (i != 0)
                              return h/2+ringR*Math.sin(2*Math.PI*(i-1)/sibs-shift);
                          else
                              return h/2;
                      })
                      .attr("r", r)
                      .attr("fill", function(d) { return "url(#imgc" + d.id +")"; })
                      .attr("onclick", function(d) { return "updateParentView(" + d.id + ")"; });
}

// Sets currentlyViewing to the clicked user's id
// Renders the new user's full profile and jumps to profileView
function updateParentView(id) {
    setCurrentlyViewing(id);

    $.post(
        '/profileView',
        {"currentlyViewing": currentlyViewing},
         function (data) {
            renderProfileView(data);
            $.fn.fullpage.moveTo(2);
         }
    );
}


/*============================================================================*/

var getImgName = function(d) {
    if (d.imgType == "none" || d.imgType == null)
        return "/static/uploads/default.jpeg";
    else
        return "/static/uploads/" + d.id + "." + d.imgType;
}

function drawTrunk(width, height) {
    var rectW = parseInt(width*0.15);
    if (rectW > 150)
        rectW = 150; // max trunk width is 150px
    var rectH = parseInt(height*0.5);
    var start = "M" + String((width-rectW)/2) + " " + height;
    var outline = "v -" + rectH + "h " + rectW + "v" + rectH;

    return start + outline;
}

function drawGround(width, height) {
    var baseH = parseInt(height*.05);
    var curveX = parseInt(width*.33);
    var curveY = parseInt(height*.07);

    var start = "M0 " + String(height-baseH);
    var arc = "c" + curveX + " -" + curveY + ", " + String(width-curveX) + " -" + curveY + ", " + width + " 0";
    var base = "v" + baseH + " h-" + width + "v-" + baseH;

    return start + arc + base;
}

function drawCanopy(width, height) {
    var canopyW = width*0.8;
    if (width < height) // if portrait oriented, use height to calculate canopy width
        canopyW = height*1.2;
    if (canopyW < 800) // min canopy width is 800px
        canopyW = 800;
    var canopyH = height*1.2;

    var start  = (width-canopyW)/2;
    var center = start+canopyW/2;
    var end    = start+canopyW;
    var n = 15; //numbers of "bumps" in the canopy

    var path = "M" + String(start) + " 50";

    for (var i = 0; i < n+1; i++) {
        var x1 = qBezier(start, center, end, i/n); //starting X
        var y1 = qBezier(50, canopyH+50, 50, i/n); //starting Y

        if (i < n) {
            var x2 = parseInt(qBezier(start, center, end, (i+1)/n)); //ending X
            var y2 = parseInt(qBezier(50, canopyH+50, 50, (i+1)/n)); //ending Y

            var midX = (x1 + x2)/2; //midpoint X
            var midY = (y1 + y2)/2; //midpoint Y
            var norm = -(x2-x1)/(y2-y1); //slope of normal line
            var b = midY-norm*midX;

            var cy = parseInt(midY+height/20); //control X
            var cx = parseInt((cy-b)/norm);    //control Y

            path += " Q" + cx + " " + cy + ", " + x2 + " " + y2;
        }
    }
    return path;
}

// Takes a start, control, and end coordinate
// Returns coordinate of corresponding quadratic Bezier curve at parametrization t
function qBezier(s, c, e, t) {
    return (1-t)*(1-t)*s + 2*(1-t)*t*c + t*t*e;
}

// function loadGraphCallback(data) {

    // childViewContainer.append("path")
    //                   .attr("d", setGround)
    //                   .attr("fill", "sandybrown");

    // profileImages = d3.select("#childView").selectAll("image").data(data).enter().append("image");
    // profileImages.attr("xlink:href", getImgName)
    //              .attr("width", 100)
    //              .attr("height", 100)
    //              .attr("x", getX);


    // var nodeData = graphContainer.append("g").selectAll("rect").data(response).enter().append("rect");
    // var nodeStyle = nodeData.attr("x", getX)
    //                         .attr("y", function(d) { return d.y; })
    //                         .attr("width", 150)
    //                         .attr("height", 150)
    //                         .attr("fill", "white")
    //                         .attr("id", function(d) { return "id" + d.id; });

    // var profileImages = graphContainer.append("g").selectAll("image").data(response).enter().append("image");
    // profileImages.attr("xlink:href", getImgName)
    //              .attr("width", 100)
    //              .attr("height", 100)
    //              .attr("x", getX);

    // var textData = graphContainer.append("g").selectAll("text").data(response).enter();
    // var names  = textData.append("text")
    //                      .attr("x", getX)
    //                      .attr("y", function(d,i) { return 150; })
    //                      .text(function (d) { return d.first_name + " " + d.last_name; });
    // var emails = textData.append("text")
    //                      .attr("x", getX)
    //                      .attr("y", function(d,i) { return 170; })
    //                      .text(function (d) { return d.email; });
    // var status = textData.append("text")
    //                      .attr("x", getX)
    //                      .attr("y", function(d,i) { return 190; })
    //                      .text(function (d) { return d.status; });
    // var about  = textData.append("text")
    //                      .attr("x", getX)
    //                      .attr("y", function(d,i) { return 210; })
    //                      .text(function (d) { return d.about; });
    // var link   = textData.append("text")
    //                      .attr("x", getX)
    //                      .attr("y", function(d,i) { return 230; })
    //                      .text(function (d) { return d.link; })
    //                      .on("click", function() {window.open("http://google.com");})
    //                      .style("cursor", "pointer")
    //                      .style("text-decoration", "underline");

    // graphContainer.selectAll("g").attr("transform", "translate(50,50)");

    // $(document).scrollTop(650);
    // console.log($("#mainPage").width());
    // console.log($(document).width());
    // $(document).scrollLeft( Math.abs($(document).width() - $("#mainPage").width())/2 );
// }