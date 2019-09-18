# leaflet-reticle [demo](https://rwev.github.io/leaflet-reticle)
Leaflet control that adds reticle to map center, with independently calculated latitude and longitude scales. Also displays coordinates and (optionally, for United States only) elevation.
![gif](leaflet-reticle.gif)

## features
The calculations for the reticle scale are derived from `L.Control.Scale` with some key differences.

`leaflet-reticle` does the distance projections from map center, resulting in more accurate scaling at the point of focus (assumed to be center of map), especially for low zoom levels (low-scale) map views. 

Additionally, `leaflet-reticle` does two separate projections and scaling calculations for latitude and longitude, further increasing scale accuracy. 

## integration 
See [index.html](https://www.github.com/rwev/leaflet-reticle/blob/master/index.html).

## dependencies
Just [leaflet](https://www.github.com/leaflet/leaflet).  
