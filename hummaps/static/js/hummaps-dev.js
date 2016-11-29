/**
 * Created by Charlie on 11/27/2016.
 */

var $target;          // current map list item
var mapList;          // map list is displayed
var mapPage;          // current map mapPage
var shiftPressed;     // shift key is down
var ctrlPressed;      // ctrl key is down
var altPressed;       // alt key is down

// hide content if there are messages

if ($("div.flashed-messages").length) {

  $("#map-list").hide();
  $("#map-frame").hide();

} else {

  // select the first map in the list
  $target = $("#map-list a.map-item:not(.disabled)").first();
  if ($target.length) {
    $target.addClass("active");
    mapPage = 1;
  } else {
    $target = null;
  }
  showMapList();
}

$(window).resize(function (e) {

  // setup frame heights
  var win = $(window).height();
  var pad = 6;
  var nav = $("nav").outerHeight(false) + pad;
  var content = win - nav - pad;
  $("#content-frame").height(content).css("margin-top", nav + 'px');
  $("#map-list").height(content).css("overflow-y", "auto");
  $("#map-frame").height(content).css("overflow", "hidden");
  if (!mapList) {
    zoomMap(0);
  }

}).trigger("resize");

function showMapList() {

  $("#map-frame").hide();
  $("#map-list").show();
  mapList = true;
}

function showMap() {

  if ($target) {
    // swap in and display the current map image
    $target.find("div.map-images img").eq(mapPage - 1).clone().replaceAll("#map-frame img");
    $("#map-list").hide();
    $("#map-frame").show();
    zoomMap(0);
    mapList = false;
  }
}

function nextMap() {

  if ($target) {
    var $item = $target.nextAll("a.map-item:not(.disabled)").first();
    if ($item.length) {
      $target.removeClass("active");
      $target = $item.addClass("active");
      mapPage = 1;
      if (!mapList) {
        showMap();
      }
    }
  }
}

function nextPage() {
  if ($target) {
    $mapimages = $target.find("div.map-images img");
    if (mapPage < $mapimages.length) {
      mapPage += 1;
      showMap();
    } else {
      nextMap();
    }
  }
}

function prevMap() {
  if ($target) {
    var $item = $target.prevAll("a.map-item:not(.disabled)").first();
    if ($item.length) {
      $target.removeClass("active");
      $target = $item.addClass("active");
      mapPage = 1;
      if (!mapList) {
        showMap();
      }
    }
  }
}

function prevPage() {
  if ($target) {
    if (mapPage == 1) {
      prevMap();
    } else {
      mapPage -= 1;
      showMap();
    }
  }
}

var mapZoomed = false;  // map image is zoomed
var zoomScale = 0.0;    // scale factor for map image

function zoomMap(increment, pageX, pageY) {

  // Scale the map image holding the origin fixed.
  // If increment is zero zoom image to minimum scale.
  // Mimimum scale is smaller of 100% height and 100% width.
  var zoomFactor = 1.5;     // change in zoom per zoom increment

  var $frame = $("#map-frame");
  var $img = $frame.find("img");

  if (increment < 0) {
    // negative increment means zoom out
    zoomScale /= zoomFactor * Math.abs(increment);
  } else {
    // positive or zero increment, zero means minimum scale
    zoomScale *= zoomFactor * increment;
  }

  // natural size of the image
  var natX = $img[0].naturalWidth;
  var natY = $img[0].naturalHeight;
  // console.log('natural size X/Y: ' + natX + '/' + natY);

  // fit entire image into the frame
  var minScale = Math.min($frame.width() / natX, $frame.height() / natY);

  if (!zoomScale || zoomScale < minScale) {
    zoomScale = minScale;
    mapZoomed = false;
  } else {
    mapZoomed = true;
  }
  // console.log('zoom scale: ' + zoomScale.toFixed(3));

  // top-left corner of frame relative to the viewport
  var offsetX = $frame.offset().left;
  var offsetY = $frame.offset().top;
  // console.log('offset X/Y: ' + offsetX + '/' + offsetY);

  // origin relative frame corner, parameter is optional
  var originX = pageX ? (pageX - offsetX) : 0.0;
  var originY = pageY ? (pageY - offsetY) : 0.0;
  // console.log('origin X/Y: ' + originX + '/' + originY);

  // image size
  var imgX = $img.outerWidth();
  var imgY = $img.outerHeight();
  // console.log('img size X/Y: ' + imgX + '/' + imgY);

  // top-left corner frame relative to the image
  var scrollX = $frame.scrollLeft();
  var scrollY = $frame.scrollTop();
  // console.log('scroll X/Y: ' + scrollX + '/' + scrollY);

  // zoom origin relative to the image
  // 0.0, 0.0 => top-left corner, 1.0, 1.0 => bottom-right corner
  var relX = (originX + scrollX) / imgX;
  var relY = (originY + scrollY) / imgY;
  // console.log('rel X/Y: ' + relX.toFixed(3) + '/' + relY.toFixed(3));

  // scaled image size
  imgX = Math.round(zoomScale * natX);
  imgY = Math.round(zoomScale * natY);
  // console.log('scaled img X/Y: ' + imgX + '/' + imgY);

  // new scroll offsets
  scrollX = Math.round(imgX * relX - originX);
  scrollY = Math.round(imgY * relY - originY);
  // console.log('new scroll X/Y: ' + scrollX + '/' + scrollY);

  // set new image size and frame scroll
  $img.css("width", imgX).css("height", imgY);
  $frame.scrollLeft(scrollX).scrollTop(scrollY);
}

function findBootstrapEnv() {
  var envs = ['xs', 'sm', 'md', 'lg'];

  var $el = $('<div>');
  $el.appendTo($('body'));

  for (var i = envs.length - 1; i >= 0; i--) {
    var env = envs[i];

    $el.addClass('hidden-' + env);
    if ($el.is(':hidden')) {
      $el.remove();
      return env;
    }
  }
}

$("#show-maps").click(function (e) {

  // toggle display of map list/image
  if (mapList)
    showMap();
  else
    showMapList()

  e.preventDefault();
});

$("#next").click(function (e) {

  // next map/page
  if (mapList)
    nextMap();
  else
    nextPage();

  e.preventDefault();
});

$("#prev").click(function (e) {

  // previous map/page
  if (mapList)
    prevMap();
  else
    prevPage();

  e.preventDefault();
});

// callback for map-item click events

$("#map-list").on("click", "a.map-item:not(.disabled)", function (e) {

  $target.removeClass('active');
  $target = $(this).addClass('active');
  mapPage = 1;
  showMap();

  e.preventDefault();
});

// keypress related stuff

var arrorLockout = false;     // prevent keydown repeat for arrows

$(window).keydown(function (e) {

  console.log('keydown: ' + e.which);
  switch (e.which) {
    case 13:  // enter
      // if (mapList) {
      //   showMap();
      //   e.preventDefault();
      // }
      break;
    case 16:  // shift
      shiftPressed = true;
      break;
    case 17:  // ctrl
      ctrlPressed = true;
      break;
    case 18:  // alt
      altPressed = true;
      break;
    case 27:  // esc
      if (!mapList) {
        showMapList();
      }
      break;
    case 37:  // left arrow
      if (!mapList) {
        prevPage();
        arrowLockout = true;
        e.preventDefault();
      }
      break;
    case 38:  // up arrow
      prevMap();
      arrowLockout = true;
      e.preventDefault();
      break;
    case 39:  // right arrow
      if (!mapList) {
        nextPage();
        arrowLockout = true;
        e.preventDefault();
      }
      break;
    case 40:  // down arrow
      nextMap();
      arrowLockout = true;
      e.preventDefault();
      break;
  }
}).keyup(function (e) {

  console.log('keyup: ' + e.which);
  switch (e.which) {
    case 16:  // shift
      shiftPressed = false;
      break;
    case 17:  // ctrl
      ctrlPressed = false;
      break;
    case 18:  // alt
      altPressed = false;
      break;
    case 37:  // left arrow
    case 38:  // up arrow
    case 39:  // right arrow
    case 40:  // down arrow
      arrowLockout = false;
      break;
  }
}).keypress(function(e) {

  console.log('keypress: ' + e.which);
  switch (e.which) {
    case 32:  // space bar
      if (!mapList) {
        // spacebar in map view will zoom to minimum
        zoomMap(0);
      }
      break;
  }
});

// mouse related stuff

var mouseDown;        // mouse button is down
var mouseMove;        // accumulate absolute X/Y mouse movements while mouse down
var lastX;            // last mouse x while down
var lastY;            // last mouse y while down

$("#map-frame").on("mousedown", "img", function (e) {

  // start monitoring mouse movements
  // console.log('mousedown: ' + e.which);
  if (e.which == 1) {

    lastX = e.pageX;
    lastY = e.pageY;
    mouseDown = true;
    mouseMove = 0;
  }

  e.preventDefault();
});

$("#map-frame").on("mouseup", "img", function (e) {

  // zoom if accumulated mouse movements are small
  // console.log('mouseup: ' + e.which);
  if (mouseDown && mouseMove < 10) {
    if (shiftPressed) {
      zoomMap(-1, e.pageX, e.pageY);  // zoom out
    } else {
      zoomMap(+1, e.pageX, e.pageY);  // zoom in
    }
  }
  mouseDown = false;

  e.preventDefault();
});

$("#map-frame").on("mousemove", "img", function (e) {

  var accel = 2;
  var dx = lastX - e.pageX;
  var dy = lastY - e.pageY;
  mouseMove += Math.abs(dx) + Math.abs(dy);
  if (mapZoomed && mouseDown) {

    // scroll the map image
    $("#map-frame").scrollLeft($("#map-frame").scrollLeft() + dx * accel);
    $("#map-frame").scrollTop($("#map-frame").scrollTop() + dy * accel);
    lastX = e.pageX;
    lastY = e.pageY;
  }

  e.preventDefault();
});

$("#map-frame").on("mouseleave", "img", function (e) {

  // stop accumulating mouse movements
  mouseDown = false;

  e.preventDefault();
});

$('#map-frame').on("mousewheel", "img", function (e) {

  if (e.deltaY < 0) {
    zoomMap(-1, e.pageX, e.pageY);
  } else {
    zoomMap(+1, e.pageX, e.pageY);
  }

  e.preventDefault();
});