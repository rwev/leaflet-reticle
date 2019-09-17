// TODO add scale to reticle tick marks (adapt from BetterScale)

L.Control.Reticle = L.Control.extend({
        options: {
                position: `topright`,
                toggleReticleHTML: `&#9769`, // cross of jerusalem
                fetchElevation: true,
                placeholderHTML: `-----`,
                offsetFromCenter: 10,
                tickLength: 5,
                maxLength: 100
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

                this.canvas = document.createElement(`canvas`);
                this.canvas.classList.add(`leaflet-reticle-center`);
                this.canvas.style.margin = `-${this.options.tickLength}px 0 0 -${this.options.tickLength}`;

                document.body.appendChild(this.canvas);

                this.ctx = this.canvas.getContext(`2d`);

                this.map.on(`resize` ,() => this.update(true));
                this.map.on(`zoomend` ,() => this.update(true));
                this.map.on(`moveend` ,() => this.update(true));

                this.map.on(`zoom` ,() => this.update(false));
                this.map.on(`move` ,() => this.update(false));

                this.map.whenReady(() => this.update(true));

                return this.container;
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

                this.drawScales();
             
        },

        drawScales: function() {
                
                mapSize = this.map.getSize();
                mapWidthFromCenter = mapSize.x / 2;
                mapHeightFromCenter = mapSize.y / 2;

                maxWidthMeters = this.calculateMaxMeters(
                                        mapWidthFromCenter,  mapHeightFromCenter,
                                        mapWidthFromCenter + this.options.maxLength,mapHeightFromCenter
                                );

                maxHeightMeters = this.calculateMaxMeters(
                                        mapWidthFromCenter,  mapHeightFromCenter,
                                        mapWidthFromCenter,mapHeightFromCenter + this.options.maxLength
                                );


                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.beginPath();

                this.drawWidthScale(maxWidthMeters);
                this.drawHeightScale(maxHeightMeters);
        },

        drawWidthScale: function(maxWidthMeters) {

                roundMeters = this.getRoundNum(maxWidthMeters);
                ratio = roundMeters / maxWidthMeters;

                label = this.getScaleLabel(roundMeters);

                end = (this.options.maxLength - this.options.offsetFromCenter) * ratio;

                this.drawLine(
                        this.ctx, 
                        this.options.offsetFromCenter, this.options.tickLength,
                        end, this.options.tickLength);

                this.drawLine(
                        this.ctx,
                        end, this.options.tickLength,
                        end, 0
                );

                // this.ctx.fillText(label, end, end);
                this.ctx.fillText(label, end + 2, 7);

        },

        drawHeightScale: function(maxHeightMeters) {

                roundMeters = this.getRoundNum(maxHeightMeters);
                ratio = roundMeters / maxHeightMeters;

                label = this.getScaleLabel(roundMeters);

                end = (this.options.maxLength - this.options.offsetFromCenter) * ratio;
                this.drawLine(
                        this.ctx,
                        this.options.tickLength, this.options.offsetFromCenter,
                        this.options.tickLength, end
                );
                 
                this.drawLine(
                        this.ctx,
                        this.options.tickLength, end,
                        0, end
                );
                this.ctx.fillText(label, 0, end + 10);
        },

        getScaleLabel: function(roundMeters) {
                return roundMeters < 1000 ? `${roundMeters} m` : `${roundMeters / 1000} km`;
        },

        calculateMaxMeters: function(xS, yS, xE, yE) {
                return this.map.distance(
                        this.map.containerPointToLatLng([xS, yS]),
                        this.map.containerPointToLatLng([xE, yE]), 
                );
        },

        getRoundNum: function(num) {
                // from L.Control.scale
                pow10 = Math.pow(10, (Math.floor(num) + ``).length -1);
                d = num / pow10;

                d = d >= 10 ? 10 :
                        d >= 5 ? 5 :
                        d >= 3 ? 3 :
                        d >= 2 ? 2 : 1;

                return pow10 * d;
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
