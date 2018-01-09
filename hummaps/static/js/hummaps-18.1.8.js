/**
 * Created by Charlie on 11/27/2016.
 */

var mapList = true;       // map list is displayed
var currentMap;           // current map-info
var mapPage;              // current map page
var mapImage;             // current DOM map image
var imageSize;            // natural size of the map image
var canvasSize;           // size of the map image canvas
var imageOffset;          // origin of the map image relative to the map frame
var imageScale;           // scale of the map image
var imageScaleMin;        // minimum scale to fit map into the map frame
var zoomStep = 1.35;      // factor to change zoom scale per step
var shiftPressed;         // shift key is down
var ctrlPressed;          // ctrl key is down
var altPressed;           // alt key is down
var loader = null;        // map view loader
var loaderTimeout = null; // setTimeout ID for delayed loader display

$(function() {

  // initialize the contents
  $(window).trigger('resize');

  if ($('div.flashed-messages').length) {

    // hide content if there are messages
    $('#map-list').hide();
    $('#map-frame').hide();

  } else {

    // select the first map in the list
    currentMap = $('#map-list').find('.map-info:not(.disabled)').first();
    if (currentMap.length) {
      currentMap.addClass('active');
      mapPage = 1;
    } else {
      currentMap = null;
    }
    showMapList();
  }

});

// Handlers for window resize, map-item click and focus.

$(window).on('resize', function (e) {

  // setup frame heights
  var win = $(window).height();
  var pad = 6;
  var nav = $('nav').outerHeight(false) + pad;
  var content = win - nav - pad;
  $('#content-frame').height(content).css({
    position: 'relative',
    top: nav,
    left: 0
  });
  $('#map-list').height(content).css('overflow-y', 'auto');
  $('#map-frame').height(content).css('overflow', 'hidden');
  if (!mapList) {
    showMap();
  }
});

$('#map-list').on('click', 'a.map-info:not(.disabled)', function (e) {

  e.preventDefault();
  currentMap = $(this).focus();
  showMap();

}).on('focus', 'a.map-info:not(.disabled)', function (e) {

  if (this != currentMap[0]) {

    // update the currentMap
    currentMap.removeClass('active');
    currentMap = $(this).addClass('active');
    mapPage = 1;
  }
});

// Handlers for nav buttons.

$('#show-maps').on('click', function (e) {
  if (mapList) {
    showMap();
  } else {
    showMapList()
  }
});

$('#next').on('click', function (e) {
  if (mapList) {
    nextMap();
  } else {
    nextPage();
  }
});

$('#prev').on('click', function (e) {
  if (mapList) {
    prevMap();
  } else {
    prevPage();
  }
});

// Map list navigation.

function nextMap() {
  if (currentMap) {
    var $item = currentMap.parent().nextAll().children('.map-info:not(.disabled)').first();
    if ($item.length) {
      currentMap.removeClass('active');
      currentMap = $item.addClass('active');
      currentMap.focus();
      mapPage = 1;
      if (!mapList) {
        showMap();
      }
    }
  }
}

function prevMap(lastpage) {
  if (currentMap) {
    var $item = currentMap.parent().prevAll().children('.map-info:not(.disabled)').first();
    if ($item.length) {
      currentMap.removeClass('active');
      currentMap = $item.addClass('active');
      currentMap.focus();
      if (mapList) {
        mapPage = 1;
      } else {
        mapPage = lastpage ? currentMap.find('.map-image-list .map-image').length : 1;
        showMap();
      }
    }
  }
}

function nextPage() {
  if (currentMap) {
    $mapimages = currentMap.find('.map-image-list .map-image');
    if (mapPage < $mapimages.length) {
      mapPage += 1;
      showMap();
    } else {
      nextMap();
    }
  }
}

function prevPage() {
  if (currentMap) {
    if (mapPage == 1) {
      prevMap(true);
    } else {
      mapPage -= 1;
      showMap();
    }
  }
}

function showMapList() {
  if (loader) {
    loader.hide();
    loader = null;
  }
  $('#map-frame').hide();
  $('#map-list').show();
  if (currentMap) {
    currentMap.focus();
  }
  mapList = true;
}

function showMap() {
  if (currentMap) {

    // Remove any curent canvas.
    var frame = $('#map-frame');
    frame.find('canvas').remove();

    if (mapList) {
      $('#map-list').hide();
      $('#map-frame').show();
      mapList = false;
    }

    // Add a new canvas.
    var canvas = document.createElement('canvas');
    canvas.width = Math.floor(frame.width());
    canvas.height = Math.floor(frame.height());
    canvas.id = 'map-canvas';
    frame.prepend(canvas);
    canvasSize = {x: canvas.width, y: canvas.height};

    // Get the current map image from the image list.
    var img = currentMap.find('.map-image-list .map-image').eq(mapPage - 1);
    if (img.is('div')) {

      // display a loader if needed
      loaderTimeout = window.setTimeout(function() {
        // console.log('timeout: ' + loaderTimeout);
        if (loaderTimeout) {
          loader = $('#loader-frame').show();
          loaderTimeout = null;
        }
      }, 750);

      // Replace div with an img element, this starts the download.
      img = $('<img class="map-image">').attr({
        src: img.attr('data-src'),
        alt: img.attr('data-alt')
      }).replaceAll(img)

      // Callback to draw the image and cancel the loader.
      img.on('load', function() {
        if (loaderTimeout) {
          window.clearTimeout(loaderTimeout);
          loaderTimeout = null;
        }
        if (loader) {
          loader.hide();
          loader = null;
        }

        mapImage = img[0];
        imageSize = {x: mapImage.naturalWidth, y: mapImage.naturalHeight};
        imageOffset = {x: 0, y: 0};
        imageScaleMin = Math.min(canvasSize.x / imageSize.x, canvasSize.y / imageSize.y);
        imageScale = imageScaleMin;

        drawMapImage();
      });

    } else {

      // Image should be ready to to display.
      // Cancel any loader and draw the image.
      if (loaderTimeout) {
        window.clearTimeout(loaderTimeout);
        loaderTimeout = null;
      }
      if (loader) {
        loader.hide();
        loader = null;
      }

      mapImage = img[0];
      imageSize = {x: mapImage.naturalWidth, y: mapImage.naturalHeight};
      imageOffset = {x: 0, y: 0};
      imageScaleMin = Math.min(canvasSize.x / imageSize.x, canvasSize.y / imageSize.y);
      imageScale = imageScaleMin;
      drawMapImage();
    }

    // update the map name label and scan link
    $('#map-name span').text(img.attr('alt'));
    var scan = currentMap.find('.scanfile-list .scanfile').eq(mapPage - 1);
    if (scan.length == 1) {
      $('<a>')
          .attr('href', scan.attr('data-href'))
          .text(scan.attr('data-alt'))
          .appendTo('#map-name span')
          .before('<br>');
    }
  }
}

function drawMapImage() {

  var ctx = document.getElementById('map-canvas').getContext('2d');
  ctx.clearRect(0, 0, canvasSize.x, canvasSize.y);
  ctx.save();
  ctx.transform(imageScale, 0, 0, imageScale, imageOffset.x, imageOffset.y);
  ctx.drawImage(mapImage, 0, 0);
  ctx.restore();
}

function panMapImage(dx, dy) {

  // Clamp new offset to frame boundaries.
  imageOffset.x = Math.round(Math.max(dx, canvasSize.x - imageSize.x * imageScale));
  imageOffset.y = Math.round(Math.max(dy, canvasSize.y - imageSize.y * imageScale));
  if (imageOffset.x > 0) imageOffset.x = 0;
  if (imageOffset.y > 0) imageOffset.y = 0;

  drawMapImage();
}

function zoomMapImage(scale, pageX, pageY) {

  var initialScale = imageScale;
  imageScale = (scale > imageScaleMin) ? scale : imageScaleMin;

  // Zoom origin relative to the frame.
  var frame = $('#map-frame');
  var originX, originY;
  if (pageX && pageY) {
    originX = pageX - frame.offset().left;
    originY = pageY - frame.offset().top;
  } else {
    originX = frame.width() / 2;
    originY = frame.height() / 2;
  }

  // Set new offset and clamp to frame boundaries.
  imageOffset.x = imageScale / initialScale * (imageOffset.x - originX) + originX;
  imageOffset.y = imageScale / initialScale * (imageOffset.y - originY) + originY;
  imageOffset.y = Math.round(Math.max(imageOffset.y, canvasSize.y - imageSize.y * imageScale));
  imageOffset.x = Math.round(Math.max(imageOffset.x, canvasSize.x - imageSize.x * imageScale));
  if (imageOffset.x > 0) imageOffset.x = 0;
  if (imageOffset.y > 0) imageOffset.y = 0;

  drawMapImage();
}

// Keypress related stuff.

// Prevent query and dialog keyboard events from propagating.
// $('#search-query').add('#search-dialog')
//   .on('keydown keyup keypress', function(e) {
//     e.stopPropagation();
// })

$(window).on('keydown', function (e) {

  var key = e.key;
  if (key.indexOf('Arrow') == 0) {
    key = key.substr(5);
  } else if (key.indexOf('Esc') == 0) {
    key = 'Esc';
  }
  // console.log('keydown: ' + e.key + ' (' + key + ')');
  switch (key) {
    case 'Shift':  // shift
      shiftPressed = true;
      break;
    case 'Control':  // ctrl
      ctrlPressed = true;
      break;
    case 'Alt':  // alt
      altPressed = true;
      break;
    case 'Esc':  // esc
      showMapList();
      break;
    case 'Left':  // left arrow
      if (!mapList) {
        prevPage();
        arrowLockout = true;
        e.preventDefault();
      }
      break;
    case 'Up':  // up arrow
      prevMap();
      arrowLockout = true;
      e.preventDefault();
      break;
    case 'Right':  // right arrow
      if (!mapList) {
        nextPage();
        arrowLockout = true;
        e.preventDefault();
      }
      break;
    case 'Down':  // down arrow
      nextMap();
      arrowLockout = true;
      e.preventDefault();
      break;
  }

}).on('keyup', function (e) {

  var key = e.key;
  if (key.indexOf('Arrow') == 0) {
    key = key.substr(5);
  } else if (key.indexOf('Esc') == 0) {
    key = 'Esc';
  }
  // console.log('keyup: ' + e.key + ' (' + key + ')');
  switch (key) {
    case 'Shift':
      shiftPressed = false;
      break;
    case 'Control':
      ctrlPressed = false;
      break;
    case 'Alt':
      altPressed = false;
      break;
    case 'Left':
    case 'Up':
    case 'Right':
    case 'Down':
      arrowLockout = false;
      break;
  }

}).on('keypress', function(e) {

  var key = e.char || e.key;
  // console.log('keypress: "' + key + '"');
  if (!mapList) {
    switch (key) {
      case '+':
        zoomMapImage(imageScale * zoomStep);
        break;
      case '-':
        zoomMapImage(imageScale / zoomStep);
        break;
      case ' ':
        zoomMapImage(0);  // space zooms to minimum
        break;
    }
  }
});

// Mouse and touch related stuff.

var mc = new Hammer.Manager($('#map-frame').get(0), {
  // domEvents: true
});

mc.add( new Hammer.Pan({ }) );
mc.add( new Hammer.Pinch({ }) );

// mc.add( new Hammer.Tap({ event: 'singletap' }) );
// mc.add( new Hammer.Tap({ event: 'doubletap', taps: 2 }) );
// mc.get('doubletap').recognizeWith('singletap');
// mc.get('singletap').requireFailure('doubletap');
//
// mc.on('singletap', function(e) {
//   console.log(e.type);
// });

// mc.add( new Hammer.Swipe({
//   direction: Hammer.DIRECTION_HORIZONTAL,
//   threshold: Math.floor(0.6 * $(window).width()),
//   velocity: 1.0
// }));
//
// mc.get('swipe').recognizeWith('pan');
//
// mc.on('swiperight swipeleft', function (e) {
//   if (e.type == 'swiperight') {
//     nextPage();
//   } else {
//     prevPage();
//   }
// });

//
// Make pan work???
//
// $('#map-frame').on('mousedown', function (e) {
//   console.log('mousedown');
//   e.preventDefault();
// });

var startX, startY, startScale;

mc.on('pinchstart pinchmove', function(e) {

  if (e.type == 'pinchstart') {
    startScale = imageScale;
  } else {
    zoomMapImage(startScale * e.scale, e.center.x, e.center.y);
  }
});

mc.on('panstart panmove', function(e) {

  // var x = e.center.x, y = e.center.y;
  // var dx = e.deltaX, dy = e.deltaY;
  // var dt = e.deltaTime;
  // var dist = e.distance, ang = e.angle;
  // var vx = e.velocityX, vy = e.velocityY;
  // var scale = e.scale;
  //
  // var str = '' +
  //   ' x/y=' + x + '/' + y +
  //   ' dx/dy=' + dx + '/' + dy +
  //   ' dt=' + dt +
  //   ' dist=' + dist.toFixed(2) +
  //   ' ang=' + ang.toFixed(2) +
  //   ' vx/vy=' + vx.toFixed(2) + '/' + vy.toFixed(2) +
  //   ' scale=' + scale.toFixed(3);
  // console.log(e.type + str);

  if (imageScale > imageScaleMin) {
    if (e.type == 'panstart') {
      startX = imageOffset.x;
      startY = imageOffset.y;
    } else {
      panMapImage(startX + e.deltaX, startY + e.deltaY);
    }
  }
});

$('#map-frame').on('mousewheel', function (e) {

  // console.log('mousewheel');
  if (e.deltaY > 0) {
    zoomMapImage(imageScale * zoomStep, e.pageX, e.pageY);
  } else {
    zoomMapImage(imageScale / zoomStep, e.pageX, e.pageY);
  }
  e.stopPropagation();
});
