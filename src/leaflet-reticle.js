// TODO add scale to reticle tick marks (adapt from BetterScale)
// TODO (lat, lng) @ elev lower right of center
L.Control.Reticle = L.Control.extend({
        options: {
                position: `topright`,
                toggleReticleHTML: `&#9769`, // cross of jerusalem
                fetchElevation: true,
                placeholderHTML: `-----`
        },

        onRemove: function() {
                L.DomUtil.remove(this.container);
        },

        onAdd: function(map) {
                this.map = map;

                this.container = L.DomUtil.create(`div`, `leaflet-reticle`);

                L.DomEvent.disableClickPropagation(this.container);
                L.DomEvent.on(this.container, `control_container`, function(e) {
                        L.DomEvent.stopPropagation(e);
                });
                L.DomEvent.disableScrollPropagation(this.container);

                this.button = document.createElement(`button`);
                this.button.id = `leaflet-reticle-button`;
                this.button.classList.add(`off`);
                this.button.innerHTML = this.options.toggleReticleHTML;
                this.button.onclick = () => this.toggle();
                this.container.appendChild(this.button);

                center_div = document.createElement(`div`);
                center_div.classList.add(`leaflet-reticle-center`);

                this.coords_e = document.createElement(`p`);
                this.coords_e.innerHTML = this.options.placeholderHTML;
                center_div.appendChild(this.coords_e);

                if (this.options.fetchElevation) {
                        this.elev_e = document.createElement(`p`);
                        this.elev_e.innerHTML = this.options.placeholderHTML;
                        center_div.appendChild(this.elev_e);
                }
                document.body.appendChild(center_div);

                canvas = document.createElement(`canvas`);
                canvas.classList.add(`leaflet-reticle-center`);
                document.body.appendChild(canvas);

                ctx = canvas.getContext(`2d`);
                this.drawReticle(ctx)

                this.map.on(`resize` ,() => this.update(true));
                this.map.on(`zoomend` ,() => this.update(true));
                this.map.on(`moveend` ,() => this.update(true));

                this.map.on(`zoom` ,() => this.update(false));
                this.map.on(`move` ,() => this.update(false));
                
                this.update(true);
                
                return this.container;
        },

        drawReticle: function(ctx) {
                const OFFSET = 5;
                const LENGTH = 45;

                // half-reticle, lower left of center
                this.drawLine(ctx, 0, OFFSET, 0, LENGTH);
                this.drawLine(ctx, OFFSET, 0, LENGTH, 0);
        },

        drawLine: function(ctx, xS, yS, xE, yE) {
                ctx.moveTo(xS, yS);
                ctx.lineTo(xE, yE);
                ctx.stroke();
        },

        update: function(doReq) {
                center = this.map.getCenter();

                latStr = this.formatNumber(center.lat);
                lngStr = this.formatNumber(center.lng);

                this.coords_e.innerText = `(${latStr}, ${lngStr})`;

                if (doReq && this.options.fetchElevation) {
                        this.fetchElevation(center.lat, center.lng)
                                .then(elev => this.elev_e.innerText = `@ ${elev} ft`)
                } else {
                        if (this.options.fetchElevation) {
                                this.elev_e.innerHTML = this.options.placeholderHTML;
                        }
                }
        },

        fetchElevation: async function(lat, lng) {

                const UNITS = 'Feet';
                const OUTPUT = 'json';
                const baseUrl = `https://nationalmap.gov/epqs/pqs.php?units=${UNITS}&output=${OUTPUT}`;
        	const url = baseUrl + `&x=${lng}&y=${lat}`;

                const usgsQueryResults= await fetch(url).then(response => response.json());
                return usgsQueryResults.USGS_Elevation_Point_Query_Service.Elevation_Query.Elevation;
        },

        formatNumber: function(num) {
                return num.toLocaleString({
                        minimumFractionDigits: 3,
                        maximumFractionDigits: 3
                });
        }
});

L.control.reticle = function(options) {
        return new L.Control.Reticle(options);
};
