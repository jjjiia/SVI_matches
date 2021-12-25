//views
//map of centroids
//each bin


//todo
//fix each category data button
//turn to real grid with labels of amount
//add population? add land?
//color north to south or east to west

var gridSize
var pointsAcross
var centroids
var census
var projection
var centroidsByFips
var activeKey ="EP_MINRTY"


var limitsOutliers = {
    "EP_POV":"below poverty",
    "EP_PCI":"Per capita income",
    "EP_UNEMP":"unemployment",
    "EP_NOHSDP":"no high school diploma",

    "EP_AGE17":"under 18",
    "EP_AGE65":"over 64",
    "EP_DISABL":"disability",
    "EP_SNGPNT":"single parent households",


    "EP_LIMENG":{top:65,outlier:["36005027600"]},
    "EP_MINRTY":{top:100},

    "EP_CROWD":"more people than rooms",
    "EP_GROUPQ":"group quarters",
    "EP_MOBILE":"mobile homes",
    "EP_MUNIT":"structures with 10+ units",
    "EP_NOVEH":"no vehicle available"

}


var measures = ["EP_POV","EP_PCI","EP_UNEMP","EP_NOHSDP","EP_AGE17","EP_AGE65","EP_DISABL","EP_SNGPNT", "EP_LIMENG","EP_MINRTY","EP_CROWD","EP_GROUPQ","EP_MOBILE", "EP_MUNIT","EP_NOVEH"]

var themeGroupDisplayText = {
    THEME1:"Socioeconomic Status",
    THEME2:"Household Composition & Disability",
    THEME3:"Minority Status & Language",
    THEME4:"Housing Type & Transportation"
}
var groups = {
    THEME1:["EP_POV","EP_PCI","EP_UNEMP","EP_NOHSDP"],
    THEME2:["EP_AGE17","EP_AGE65","EP_DISABL","EP_SNGPNT"],
    THEME3:["EP_LIMENG","EP_MINRTY"],
    THEME4:["EP_GROUPQ","EP_NOVEH","EP_CROWD","EP_MUNIT","EP_MOBILE"]
}
var themeDisplayTextShort = {
    "EP_POV":"below poverty",
    "EP_PCI":"Per capita income",
    "EP_UNEMP":"unemployment",
    "EP_NOHSDP":"no high school diploma",

    "EP_AGE17":"under 18",
    "EP_AGE65":"over 64",
    "EP_DISABL":"disability",
    "EP_SNGPNT":"single parent households",


    "EP_LIMENG":"limited english",
    "EP_MINRTY":"minorities",

    "EP_CROWD":"more people than rooms",
    "EP_GROUPQ":"group quarters",
    "EP_MOBILE":"mobile homes",
    "EP_MUNIT":"structures with 10+ units",
    "EP_NOVEH":"no vehicle available"

}
function drawMenu(){
	for(var g in groups){
		var group = groups[g]
		var groupDiv = d3.select("#sections").append("div")
		.attr("class","section")
		
		groupDiv.append("div")
		.attr("id",g).html(themeGroupDisplayText[g])
		.attr("class","sectionTitle")
		
		for(var m in group){
			var measure = group[m]
			//console.log(measure)
			groupDiv.append("div").attr("id",measure+"_button")
			.html(themeDisplayTextShort[measure])
			.style("cursor","pointer")
		}
	}
}


var censusFile = d3.csv("SVI2018_US.csv")
var centroidsFile = d3.json("tract_centroids.geojson")
Promise.all([censusFile,centroidsFile])
.then(function(data){
	console.log(data[1])
	census = data[0]//.slice(0,1000)
	centroids = data[1]
	var width = window.innerWidth
	var height = window.innerHeight
	console.log(width,height)
	
	var pixelsTotal = width*height
	console.log(pixelsTotal)
	var pixelsPerPoint = pixelsTotal/data[0].length
	console.log("pixels per point" + pixelsPerPoint)
	gridSize = 2//Math.round(Math.sqrt(pixelsPerPoint))
	
	pointsAcross = Math.floor(width/gridSize*2)
	console.log("points across "+pointsAcross)
	console.log(gridSize)
	
	var padding = 20
    projection = d3.geoAlbers()
	.fitExtent([[padding,padding],[width-padding,height-padding]],centroids)
//	makeGrid(data[0])
	
	centroidsByFips =  makeFipsDictionary(centroids["features"])
	//console.log(centroidsByFips)

	// initialize regl
	createREGL({
	  // callback when regl is initialized
	  onDone: main,
	});
	
	drawMenu()
})

function makeFipsDictionary(data){
	var formatted ={}
	for (var i in data){
		var gid = "_"+data[i]["properties"]["GEOID"]
		var coords = data[i]["geometry"]["coordinates"]
		formatted[gid]=coords
	}
	return formatted
}

// function makeGrid(data){
// 	var formatted = []
// 	for(var i in data){
// 		var x = i%pointsAcross
// 		var y = Math.floor(i/pointsAcross)
// 		var color = [Math.random(), Math.random(), 0,.5];
// 		formatted.push({x:x,y:y,color:color})
// 	}
// 	console.log(formatted)
// }
function hexToRgb(hex) {
	//console.log(hex)
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
//  console.log(result)
  return result ? [parseInt(result[1], 16), parseInt(result[2], 16),parseInt(result[3], 16)]: null;
}
var pointWidth = 1;

function main(err, regl) {
  const numPoints = census.length;
  const width = window.innerWidth;
  const height = window.innerHeight;

  // duration of the animation ignoring delays
  const duration = 800; // 1500ms = 1.5s
	const delayByIndex=1000/census.length;
    const maxDuration = duration + delayByIndex * census.length; // include max delay in here
  
  function barLayout(points){
	  var maxHeight = width/(2)//Math.floor(height/(gridSize+2))
	   var max = d3.max(census, d => parseFloat(d[activeKey]))
	  var formatted = {}
	  var xOffset = 0	  

	  	var histogram = d3.histogram()
			.value(function(d) { return parseFloat(d[activeKey]); })   // I need to give the vector of value
			.domain(function(){
  			  if(activeKey=="EP_PCI"){
  				  var max = d3.max(census, function(d){return d[activeKey]})
  				  var min = d3.min(census, function(d){return d[activeKey]})
  				  var cScale = d3.scaleLinear().domain([min,max]).range(["red","green"])
			  	return [min,max]
  			  }else{
  			  	return [0,100]
  			  }
			})  // then the domain of the graphic
			.thresholds(10); // then the numbers of bins
			
		var bins = histogram(census);  
		//bins = bins.slice(0,limitsOutliers[activeKey].top)		
		var maxBinSize = d3.max(bins, d => d.length)
		var split = (maxBinSize/(width/2))
		
	gridSize = 3
	  	pointWidth=3
		
		
  	  var noneValues = census.filter(function(d) { return d[activeKey] <0 })
  	  if(noneValues.length>0){
  	  	//draw not enough values block
  		  for(var n in noneValues){
  			 var gid = noneValues[n]["FIPS"]
			  var binSize = noneValues.length
			var split = Math.floor((width-20)/gridSize)
				var columnInBar = Math.floor(n/maxHeight)
			  
  			formatted[gid]={split:split,
				columnInBar:columnInBar,
				xOffset:xOffset, 
				gid:gid,binNumber:-1, 
				index:parseInt(n),value:parseFloat(noneValues[n][activeKey])}
		  	
  		  }
  			  xOffset+=Math.ceil(binSize/split)
  	  }
	  
		
		for(var b in bins){
			var bin = bins[b]
			var binSize = bin.length
			var split = Math.floor((width-20)/gridSize)
			for(var dot in bin){
				var index = dot//%maxHeight
				var columnInBar = Math.floor(dot/maxHeight)
				var value = bin[dot][activeKey]
				//xOffset=Math.floor(index/(height/gridSize))
				if(bin[dot]["FIPS"]!=undefined){
					formatted[bin[dot]["FIPS"]]={split:split,columnInBar:columnInBar,xOffset:xOffset, gid:bin[dot]["FIPS"],binNumber:parseInt(b), index:parseInt(index),value:parseFloat(value)}
				}
			}				
			xOffset+=Math.ceil(binSize/split)//Math.ceil(bin.length/maxHeight)
		//	console.log(bin.length,xOffset,split)
		}	
	
  	  for(var i in points){
		  //console.log(points[i])
		  var gid = points[i].data["FIPS"]
		  
		  if(formatted[gid]!=undefined){
			  
	  		  points[i]["y"]=formatted[gid].binNumber*(gridSize)+10
			  +formatted[gid].xOffset*(gridSize)
			  +Math.floor(formatted[gid].index/formatted[gid].split)*(gridSize)//+formatted[i].xOffset)//*(gridSize+1)
		  
	  		  points[i]["x"]=height-Math.floor(formatted[gid].index%formatted[gid].split)*(gridSize)-10
			  if(activeKey=="EP_PCI"){
				  var max = d3.max(census, function(d){return d[activeKey]})
				  var min = d3.min(census, function(d){return d[activeKey]})
				  var cScale = d3.scaleLinear().domain([min,max]).range(["red","green"])
			  	
			  }else{
				  var cScale = d3.scaleLinear().domain([0,100]).range(["red","green"])
			  }
	var scaledColor = cScale(parseFloat(points[i].data[activeKey]))
	var rgb = d3.color(scaledColor)
	var rgbScale = d3.scaleLinear().domain([0,255]).range([0,1])

	
	if(points[i].data[activeKey]<0){
		//console.log("less than zero")
			  points[i]["color"]=[0,0,0]
	}else{
			  points[i]["color"]=[rgbScale(rgb.r),rgbScale(rgb.g),rgbScale(rgb.b)]
	}
			  
		  }else{
			  console.log(points[i].data["FIPS"],points[i])
		  	console.log("no")
		  }
  		
  	  }
	  points.sort(function(a,b){
  	  	return a.data[activeKey]-b.data[activeKey]
  	  })
  }
  
  function mapLayout(points){
	  var max = d3.max(census, function(d){
		  var fips = d["FIPS"]
		  if(centroidsByFips["_"+fips]!=undefined){
		 	 return parseFloat(centroidsByFips["_"+fips][0])
		  	
		  }
	  	
	  }
	  )
	  
	  var min = d3.min(census, function(d){
		  var fips = d["FIPS"]
		  if(centroidsByFips["_"+fips]!=undefined){
			  return parseFloat(centroidsByFips["_"+fips][0])
		  }
	  }
	  )
	  
	  	  for(var i in points){
		  var fips = "_"+census[i]["FIPS"]
		  if(centroidsByFips[fips]!=undefined){

				
			  var lat = centroidsByFips[fips][1]
			  var lng = centroidsByFips[fips][0]
			  var px = projection([lng,lat])[0]
			  var py = projection([lng,lat])[1]
			  points[i]["x"]=px
			  points[i]["y"]=py
			  			  
			 //  var colorValue = parseFloat(census[i][activeKey])
			  //console.log(colorValue)
  			 // if(colorValue==-999){colorValue=0}
  			  // var scaledColor = colorScale(px)
		//	 console.log(scaledColor)
  			  var rgb = d3.color(scaledColor)
			// console.log(rgb)
 
  			//  points[i]["color"]=[rgb.r,rgb.g,rgb.b,1]
  			  points[i]["color"]=[0,0,0]
			 
	var cScale = d3.scaleLinear().domain([0,100]).range(["yellow","white"])
	var scaledColor = cScale(parseFloat(points[i].data[activeKey]))
	var rgb = d3.color(scaledColor)
	var rgbScale = d3.scaleLinear().domain([0,255]).range([0,1])
	
	points[i]["color"]=[rgbScale(rgb.r),rgbScale(rgb.g),rgbScale(rgb.b)]
			
		  }else{
			  points[i]["x"]=100
			  points[i]["y"]=100
			  points[i]["color"]=[0,0,0]
		  }
		  		  
	  }
	  	  console.log(points)
  }

  // set the order of the layouts and some initial animation state
  const layouts = [mapLayout,barLayout]//, blueNormalLayout];
  let currentLayout = 0; // start with green circle layout

  // function to compile a draw points regl func
  function createDrawPoints(points) {
    const drawPoints = regl({
      frag: `
			// set the precision of floating point numbers
		  precision highp float;

		  // this value is populated by the vertex shader
			varying vec3 fragColor;

			void main() {
				// gl_FragColor is a special variable that holds the color of a pixel
				gl_FragColor = vec4(fragColor, 1);
			}
			`,

      vert: `
			// per vertex attributes
			attribute vec2 positionStart;
			attribute vec2 positionEnd;
			attribute vec3 colorStart;
			attribute vec3 colorEnd;
			attribute float index;
			// variables to send to the fragment shader
			varying vec3 fragColor;

			// values that are the same for all vertices
			uniform float pointWidth;
			uniform float stageWidth;
			uniform float stageHeight;
			uniform float elapsed;
			uniform float duration;
			uniform float delayByIndex;
			// helper function to transform from pixel space to normalized device coordinates (NDC)
			// in NDC (0,0) is the middle, (-1, 1) is the top left and (1, -1) is the bottom right.
			vec2 normalizeCoords(vec2 position) {
				// read in the positions into x and y vars
	      float x = position[0];
	      float y = position[1];

				return vec2(
		      2.0 * ((x / stageWidth) - 0.5),
		      // invert y since we think [0,0] is bottom left in pixel space
		      -(2.0 * ((y / stageHeight) - 0.5)));
			}

			// helper function to handle cubic easing (copied from d3 for consistency)
			// note there are pre-made easing functions available via glslify.
			float easeCubicInOut(float t) {
				t *= 2.0;
        t = (t <= 1.0 ? t * t * t : (t -= 2.0) * t * t + 2.0) / 2.0;

        if (t > 1.0) {
          t = 1.0;
        }

        return t;
			}

			void main() {
				// update the size of a point based on the prop pointWidth
				gl_PointSize = pointWidth;
				float delay = delayByIndex * index;

				// number between 0 and 1 indicating how far through the animation this
				// vertex is.
				float t;

	      // drawing without animation, so show end state immediately
	      if (duration == 0.0) {
	        t = 1.0;

	      // otherwise we are animating, so use cubic easing
		} else if (elapsed < delay) {
			        t = 0.0;

			      // otherwise we are animating, so use cubic easing
			      } else {
			        t = easeCubicInOut((elapsed - delay) / duration);
			      }

	      // interpolate position
	      vec2 position = mix(positionStart, positionEnd, t);

	      // interpolate and send color to the fragment shader
	      fragColor = mix(colorStart, colorEnd, t);

				// scale to normalized device coordinates
				// gl_Position is a special variable that holds the position of a vertex
	      gl_Position = vec4(normalizeCoords(position), 0.0, 1.0);
			}
			`,

      attributes: {
        // each of these gets mapped to a single entry for each of the points.
        // this means the vertex shader will receive just the relevant value for a given point.
        positionStart: points.map(d => [d.sx, d.sy]),
        positionEnd: points.map(d => [d.tx, d.ty]),
        colorStart: points.map(d => d.colorStart),
        colorEnd: points.map(d => d.colorEnd),
		  index:d3.range(census.length),
      },

      uniforms: {
        // by using `regl.prop` to pass these in, we can specify them as arguments
        // to our drawPoints function
        pointWidth: regl.prop('pointWidth'),

        // regl actually provides these as viewportWidth and viewportHeight but I
        // am using these outside and I want to ensure they are the same numbers,
        // so I am explicitly passing them in.
        stageWidth: regl.prop('stageWidth'),
        stageHeight: regl.prop('stageHeight'),
        delayByIndex: regl.prop('delayByIndex'),
        duration: regl.prop('duration'),
        // time in milliseconds since the prop startTime (i.e. time elapsed)
        // note that `time` is passed by regl whereas `startTime` is a prop passed
        // to the drawPoints function.
        elapsed: ({ time }, { startTime = 0 }) => (time - startTime) * 1000,
      },

      // specify the number of points to draw
      count: points.length,

      // specify that each vertex is a point (not part of a mesh)
      primitive: 'points',
    });

    return drawPoints;
  }

  // function to start the animation loop (note: time is in seconds)
  function animate(layout, points) {
    console.log('animating with new layout');
    // make previous end the new beginning
    points.forEach(d => {
      d.sx = d.tx;
      d.sy = d.ty;
      d.colorStart = d.colorEnd;
    });

    // layout points
    layout(points);

    // copy layout x y to end positions
    points.forEach((d, i) => {
      d.tx = d.x;
      d.ty = d.y;
      d.colorEnd = d.color;
    });

    // create the regl function with the new start and end points
    const drawPoints = createDrawPoints(points);

    // start an animation loop
    let startTime = null; // in seconds
    const frameLoop = regl.frame(({ time }) => {
      // keep track of start time so we can get time elapsed
      // this is important since time doesn't reset when starting new animations
      if (startTime === null) {
        startTime = time;
      }

      // clear the buffer
      regl.clear({
        // background color (black)
        color: [0.1,0.1,0.3,1],
        depth: 1,
      });

      // draw the points using our created regl func
      // note that the arguments are available via `regl.prop`.
      drawPoints({
        pointWidth,
        stageWidth: width,
        stageHeight: height,
		  delayByIndex,
        duration,
        startTime,
      });
   

for(var m in measures){
	console.log(measures[m])
	d3.select("#"+measures[m]+"_button")
	.on("click",function(d){
		var thisId = d3.select(this).attr("id").replace("_button","")
		 activeKey = thisId
		console.log(thisId)
	    frameLoop.cancel();	
	    animate(barLayout, points);
	})
	d3.select("#map")
	.on("click",function(d){
		console.log(d)
		// var thisId = d3.select(this).attr("id").replace("_button","")
	// 	 activeKey = thisId
	// 	console.log(activeKey)
	    frameLoop.cancel();	
	    animate(mapLayout, points);
	})
}

      // if we have exceeded the maximum duration, move on to the next animation
     // if (time - startTime > duration / 1000) {
    //      console.log('done animating, moving to next layout');
    //
    //      // cancel this loop, we are going to start another
    
    //    frameLoop.cancel();
    //      // increment to use next layout function
    //      currentLayout = (currentLayout + 1) % layouts.length;
    //
    //      // start a new animation loop with next layout function
    //      animate(layouts[currentLayout], points);
    //    }
    });
  }
  
  const points =[]
 census.sort(function(a,b){
  return b["E_TOTPOP"]-a["E_TOTPOP"]
 })
  for(var i =0;i<census.length;i++){
	  var fips = "_"+census[i]["FIPS"]
	  if(centroidsByFips[fips]!=undefined){

			
		  var lat = centroidsByFips[fips][1]
		  var lng = centroidsByFips[fips][0]
		  var px = projection([lng,lat])[0]
		  var py = projection([lng,lat])[1]
		//  points[i]["x"]=px
		 // points[i]["y"]=py
		  			  
		//   var colorValue = parseFloat(census[i][activeKey])
		  //console.log(colorValue)
		  // if(colorValue==-999){colorValue=0}
 // 		  var scaledColor = colorScale(colorValue)
 // 		  var rgb = d3.color(scaledColor)
  		  var color = [1,1,1]
		//  points[i]["color"]=[rgb.r,rgb.g,rgb.b,.5]
	//	  points[i]["color"]=[0,0,0]
		
		  points.push({tx:px,ty:0,colorEnd:color,index:i,data:census[i]})
		
		
	  }else{
		  // points[i]["x"]=100
		  // points[i]["y"]=100
		  // points[i]["color"]=[0,0,0]
		  points.push({tx:100,ty:100,colorEnd:[1,1,1],index:i,data:census[i]})
		  
	  }
	  		  
  }
 
  animate(barLayout, points);

  // start the initial animation
 
}