from shapely.geometry import shape
from shapely.geometry import Polygon
from shapely.geometry import MultiPolygon
import json
import fiona 


def makePolygons():
    with open("bbox.geojson") as f:
        data = json.load(f)
        d = {}
        for i in range(len(data["features"])):
            fips = data["features"][i]["properties"]["FIPS"]
            bbox = data["features"][i]["bbox"]
            d[fips]=bbox
            #break
      #  print(d)
        with open('bboxOnly.json', 'w') as out:
            json.dump(d, out)
makePolygons() 
