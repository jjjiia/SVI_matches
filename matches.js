var bbox
var fipsDictionary
var sviData
var matchAlls = []
//	console.log(window.innerWidth)
	d3.select("#map").style("width",(window.innerWidth-270)+"px")
	Promise.all([d3.csv("SVI2018_US.csv"),d3.json("bboxOnly.json")])
 .then(function(data){
	 //console.log(data)
	 sviData = data[0]
	 bbox = data[1]	 
	 fipsDictionary = dictionary("FIPS",data[0])
	 var map = drawMap(sviData,bbox)
})

function dictionary(keyName,data){
	var formatted = {}
	for(var i in data){
		var key = data[i][keyName]
		formatted[key]=data[i]
	}
	return formatted
}

function drawMap(newInter){
	mapboxgl.accessToken = "pk.eyJ1IjoiYzRzci1nc2FwcCIsImEiOiJja2J0ajRtNzMwOHBnMnNvNnM3Ymw5MnJzIn0.fsTNczOFZG8Ik3EtO9LdNQ"
	map = new mapboxgl.Map({
		container: 'map',
		style:"mapbox://styles/c4sr-gsapp/ckvfwjpx03lod14ro2170an28",
		//style:"mapbox://styles/jjjiia123/ckr5q89fg07qb17tjzrng0lxs",// ,//newest
		// style:"mapbox://styles/jjjiia123/ckoeh9hz9413117qhmh6w4mza",
		zoom: 10,
		preserveDrawingBuffer: true,
		minZoom:3.5,
		//51maxZoom:15,// ,
		center: [-73.95,40.71]
     });	 //
	 
	 map.addControl(new mapboxgl.NavigationControl(),'bottom-right');

      map.on("load",function(){
		//  console.log(map.getStyle().layers)
  		 var geocoder = new MapboxGeocoder({
  				 accessToken:mapboxgl.accessToken,
  				 bbox: [-74.274972,40.498509, -73.67484,40.92322],
  				 mapboxgl: mapboxgl,
 				 flyTo:false,
 				 marker:false
 				 //limit:1
  			 })
			 
 			 //map.addControl(geocoder)
			 document.getElementById('geocoder').appendChild(geocoder.onAdd(map));

		  map.on("mousemove",function(e){
 				var features = map.queryRenderedFeatures(e.point, {layers:["alltracts"]})
		//	console.log(features)
			  
		  })
		  
		  map.on("click","alltracts",function(e){
			//  console.log(e)
 			var features = map.queryRenderedFeatures(e.point, {layers:["alltracts"]})
			//console.log(features)
			  //reset matches
			  matchAlls=[]
			  
			filterOnResult(map,features)
		  })
	
	//https://github.com/mapbox/mapbox-gl-geocoder/blob/master/API.md#parameters
	// geocoder.on("results",function(results){
	// 	d3.selectAll(".mapboxgl-marker").remove()
	// 	d3.select("#currentSelection").html("")
	// 	d3.select("#currentSelectionMap").html("")
	// 	for(var i in layers){
	//       		 map.setPaintProperty(layers[i],'fill-opacity',0);
	//       		 map.setLayoutProperty(layers[i]+"_intersect",'visibility',"none");
	// 	}
	// })
 		geocoder.on('result', function(result) {
			// console.log("geo")
			
			d3.select("#currentSelection")
				.html("<span class=\"highlight\">"
					+result.result["place_name"]
 					.replace(", United States","")
					.split(", ").join("<br>")
					+"</span><br>Your address is in these jurisdictions:")
			
 			if(result!=null){
				var center = result.result.center
				var marker = new mapboxgl.Marker({
					color:"red"
				})
				marker.setLngLat(center)
					.addTo(map);
					
 				var coords = result.result.geometry.coordinates
 				var features = map.queryRenderedFeatures(map.project(coords),  {layers:["alltracts"]})
				filterOnResult(map,features)
 			}
 		});
 	// })
       return map
		 })
}


function combineMatches(gidArray){
	var matches = []
	const counts = {};

	for (const num of gidArray) {
	  counts[num] = counts[num] ? counts[num] + 1 : 1;
	}
	return counts
}

var measures = ["EP_POV","EP_PCI","EP_UNEMP","EP_NOHSDP","EP_AGE17","EP_AGE65","EP_DISABL","EP_SNGPNT", "EP_LIMENG","EP_MINRTY","EP_CROWD","EP_GROUPQ","EP_MOBILE", "EP_MUNIT","EP_NOVEH"]
var themeGroupDisplayText = {
    THEME1:"Socioeconomic Status",
    THEME2:"Household Composition & Disability",
    THEME3:"Minority Status & Language",
    THEME4:"Housing Type & Transportation"
}

var onOffMeasures={}
for(var oom in measures){
	var key = measures[oom]
	onOffMeasures[key]=false
}
onOffMeasures["population"]=false
onOffMeasures["density"]=false
console.log(onOffMeasures)

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

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function filterOnResult(map,features){
	d3.selectAll(".sectionTitle").remove()
	d3.selectAll(".sectionText").remove()

	var allMatches = []
		var layerName = "alltracts"  	 	  
		var gid = features[0]["properties"]["GEOID"]
	
	var coords = bbox[gid]
	var bounds = [[coords[0],coords[1]], // Southwest coordinates
					[coords[2],coords[3]] // Northeast coordinates
					];
	map.fitBounds(bounds, {padding: 20});
	map.setFilter(layerName,["!=","GEOID",gid])
	// 	console.log(fipsDictionary[gid])
	// console.log(gid)
	var totalPop = fipsDictionary[gid]["E_TOTPOP"]
	var populationMatches = filter("E_TOTPOP", totalPop)
	
	var area = fipsDictionary[gid]["AREA_SQMI"]
	var density = totalPop/area
	var filteredDensity = filterDensity(density)
	
	//allMatches.push(populationMatches)
	allMatches.push(filteredDensity)
	
	var text = "<strong>Density:</strong> "+Math.round(density)+" persons per mile <br> "+filteredDensity.length+" other tracts<br>"
	+"<strong>Total Population:</strong> "+totalPop+" | "+populationMatches.length+ " other tracts"
	
	//d3.select("#presentLocation").append("div").attr("id","population").html(text)
	d3.select("#presentLocation").append("div").attr("class","sectionTitleA population")
	.html("Population: "+totalPop+" ~"+populationMatches.length+ " other tracts")
	
	// d3.select("#presentLocation").append("div").attr("class","sectionText population")
// 	.html(populationMatches.length+ " other tracts")

	d3.select("#presentLocation").append("div").attr("class","sectionTitleA density")
	.html("Density: "+Math.round(density)+" persons per mile ~ "+filteredDensity.length+" other tracts")
		//
	// d3.select("#presentLocation").append("div").attr("class","sectionText density")
	// .html(filteredDensity.length+" other tracts")

	var matchesDictionary = {}
	
	for(m in measures){
		var key = measures[m]
		
		var value = fipsDictionary[gid][measures[m]]
		if(value!=-999 && value!=0){
			var filtered = filter(key, value, gid)
			
			matchesDictionary[key]=filtered
			if(key=="EP_PCI"){
				d3.select("#presentLocation").append("div").attr("class","sectionTitle "+key)
				.html(themeDisplayTextShort[key]+": "+"<strong>$"+numberWithCommas(Math.round(value))+"</strong>"+ " ~ "+filtered.length+" other tracts")
					//
			// d3.select("#presentLocation").append("div").attr("class","sectionText "+key)
			// .html(filtered.length+" other tracts across the country has the same "+themeDisplayTextShort[key])
			//			//.on("click",function(){findDataNeighbors(gid,key)})
			}else{
				d3.select("#presentLocation").append("div").attr("class","sectionTitle "+key)
				.html(themeDisplayTextShort[key]+": "+"<strong>"+value+"%</strong>"+ " ~ "+filtered.length+" other tracts")
		
			// d3.select("#presentLocation").append("div").attr("class","sectionText "+key)
	// 		.html(filtered.length+" other tracts across the country has the same % of "+themeDisplayTextShort[key])
			}
		
			
			d3.selectAll(".sectionTitle")
			.style("cursor","pointer")
			.on("click",function(){
				
				var clickedKey = d3.select(this).attr("class").split(" ")[1]
				if(onOffMeasures[clickedKey]==false){
					onOffMeasures[clickedKey]=true
					d3.select(this).style("background-color","gold")
					
					//d3.selectAll(".sectionText").style("display","none")
					//d3.selectAll("."+clickedKey).style('display',"block")
				}else{
					onOffMeasures[clickedKey]=false
					d3.select(this).style("background-color","#aaa")
					//d3.selectAll(".sectionText").style("display","none")
					//d3.selectAll("."+clickedKey).style('display',"none")
				}
				//console.log(clickedKey)
				var matchesAll = findMatchAlls(matchesDictionary)
				d3.select("#matchesForAll").html("There are "+(matchesAll.length)+" tracts that match all the highlighted characteristics of your tract")
				
			})
		}
	}
	
	d3.select("#presentLocationTitle").html(fipsDictionary[gid]["LOCATION"].split(",").join("<br>"))
//	d3.select("#presentLocation").html(text)

	// var matchesAll = allMatches.shift().filter(function(v) {
	//     return allMatches.every(function(a) {
	//         return a.indexOf(v) !== -1;
	//     });
	// });
	//console.log(matchesAll.length)
	//d3.select("#matchesForAll").html("There are "+(matchesAll.length)+" tracts that match all characteristics of your tract")
	//console.log(matchesForAll)
	// console.log(sviData.length)
	// var filtered = filter("EP_MUNIT", fipsDictionary[gid]["EP_MUNIT"])
	// console.log(filtered.length)
	//console.log(filtered)
}

function findMatchAlls(matchesDictionary){
//	console.log(matchesDictionary)
	var combined = []
	var trueCount = 0
	for(var i in onOffMeasures){
		//console.log(i)
		if(onOffMeasures[i]==true){
			trueCount+=1
			//console.log(matchesDictionary[i])
			combined = combined.concat(matchesDictionary[i])
		}
	}
	let result = combined.map(a => a["FIPS"]);
	var resultCount = combineMatches(result)
	var matches = Object.entries(resultCount).filter(function(e){return e[1]==trueCount})
	// console.log(resultCount)
// 	console.log(matches)
	return matches
}

function findDataNeighbors(gid,key){
	var formattedKey = key.replace("EP_","EPL_")
	console.log(formattedKey)
	console.log(Object.entries(fipsDictionary))
	
	var sortByKey = Object.entries(fipsDictionary).sort(function(a,b){
		//break
		return a[1][formattedKey]-b[1][formattedKey]
	})
	
	
	var indexOfGid = sortByKey.findIndex(function(d){
		//console.log(d)
		return d[0]==gid
	})
	console.log(indexOfGid)
	// console.log(indexOfGid-1, sortByKey[indexOfGid-1])
	 console.log(indexOfGid, sortByKey[indexOfGid],sortByKey[indexOfGid][1][formattedKey])
	 console.log(indexOfGid+1, sortByKey[indexOfGid+1],sortByKey[indexOfGid+1][1][formattedKey])
	return sortByKey
}
function filterDensity(value){
	var results = sviData.filter(function(e){
		if(parseFloat(e["E_TOTPOP"]/e["AREA_SQMI"])>parseFloat(value)*0.9 && parseFloat(e["E_TOTPOP"]/e["AREA_SQMI"])<parseFloat(value)*1.1){
			return e
		}else if(parseFloat(e["E_TOTPOP"]/e["AREA_SQMI"])==parseFloat(value)){
			return e
		}
	})
	return results
}

function filter(column, value,gid){
	var results = sviData.filter(function(e){
		if(e["FIPS"]!=gid){
			
			if(column=="EP_PCI"){
				if(parseFloat(e[column])>parseFloat(value)*.9 && parseFloat(e[column])<parseFloat(value)*1.1){
					return e
				}else if(parseFloat(e[column])==parseFloat(value)){
					return e
				}
			}else{
				if(parseFloat(e[column])>parseFloat(value)*.9 && parseFloat(e[column])<parseFloat(value)*1.1){
					return e
				}else if(parseFloat(e[column])==parseFloat(value)){
					return e
				}
			
			}
		}
		
		
	})
	return results
}

