// TODO parameterize fillText canvas write positioning

L.Control.Reticle = L.Control.extend({
        _HALF: 1 / 2,
        _QUARTER: 1 / 4,
        _THREE_QUARTERS: 3 / 4,

        options: {
                position: `topright`,
                toggleReticleHTML: `&#9769`, // cross of jerusalem
                fetchElevation: true,
                offsetFromCenter: 15,
                tickLength: 7.5,
                maxLength: 125,
                metric: true
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

                this.canvas = document.createElement(`canvas`);
                this.canvas.classList.add(`leaflet-reticle-center`);
                this.canvas.style.margin = `-${
                        this.options.tickLength
                }px 0 0 -${this.options.tickLength}`;

                document.body.appendChild(this.canvas);

                this.ctx = this.canvas.getContext(`2d`);

                // Move events as catch-all for resizing, zoom, panning

                this.map.on(`moveend`, () => this.update(true));
                this.map.on(`move`, () => this.update(false));

                this.map.whenReady(() => {
                        this.update(true);
                        this.update(false);
                });

                return this.container;
        },

        update: function(doAsyncOnly) {
                center = this.map.getCenter();

                if (doAsyncOnly) {
                        this.drawElevation(center.lat, center.lng);
                        return;
                }

                this.resetCanvas();
                this.drawCenterCoordinates(center.lat, center.lng);
                this.drawScales();
        },

        drawCenterCoordinates: function(lat, lng) {
                latStr = this.formatNumber(center.lat);
                lngStr = this.formatNumber(center.lng);

                this.ctx.fillText(`(${latStr}, ${lngStr})`, 15, 25);
        },

        drawElevation: function(lat, lng) {
                if (!this.options.fetchElevation) {
                        return;
                }

                this.fetchElevation(lat, lng).then(elev =>
                        this.ctx.fillText(
                                `@ ${elev} ${this.options.metric ? `m` : `ft`}`,
                                15,
                                40
                        )
                );
        },

        drawScales: function() {
                mapSize = this.map.getSize();
                mapWidthFromCenter = mapSize.x / 2;
                mapHeightFromCenter = mapSize.y / 2;

                maxWidthDist = this.calculateMaxDistance(
                        mapWidthFromCenter,
                        mapHeightFromCenter,
                        mapWidthFromCenter + this.options.maxLength,
                        mapHeightFromCenter
                );

                maxHeightDist = this.calculateMaxDistance(
                        mapWidthFromCenter,
                        mapHeightFromCenter,
                        mapWidthFromCenter,
                        mapHeightFromCenter + this.options.maxLength
                );

                this.drawWidthScale(maxWidthDist);
                this.drawHeightScale(maxHeightDist);
        },

        drawWidthScale: function(maxWidthDist) {
                
                [ratio, label] = this.getScaleRatioLabel(maxWidthDist);
                
                scaleLength =
                        (this.options.maxLength -
                                this.options.offsetFromCenter) *
                        ratio;

                this.drawLine(
                        this.options.offsetFromCenter,
                        this.options.tickLength,
                        this.options.offsetFromCenter + scaleLength,
                        this.options.tickLength
                );

                this.drawLine(
                        this.options.offsetFromCenter +
                                scaleLength * this._THREE_QUARTERS,
                        this.options.tickLength,
                        this.options.offsetFromCenter +
                                scaleLength * this._THREE_QUARTERS,
                        this.options.tickLength * this._HALF
                );
                this.drawLine(
                        this.options.offsetFromCenter +
                                scaleLength * this._QUARTER,
                        this.options.tickLength,

                        this.options.offsetFromCenter +
                                scaleLength * this._QUARTER,
                        this.options.tickLength * this._HALF
                );
                this.drawLine(
                        this.options.offsetFromCenter +
                                scaleLength * this._HALF,
                        this.options.tickLength,
                        this.options.offsetFromCenter +
                                scaleLength * this._HALF,
                        this.options.tickLength * this._QUARTER
                );

                this.drawLine(
                        this.options.offsetFromCenter + scaleLength,
                        this.options.tickLength,
                        this.options.offsetFromCenter + scaleLength,
                        0
                );

                this.ctx.fillText(
                        label,
                        this.options.offsetFromCenter + scaleLength + 2,
                        7
                );
        },

        drawHeightScale: function(maxHeightDist) {

                [ratio, label] = this.getScaleRatioLabel(maxHeightDist);
                
                scaleLength =
                        (this.options.maxLength -
                                this.options.offsetFromCenter) *
                        ratio;

                this.drawLine(
                        this.options.tickLength,
                        this.options.offsetFromCenter,
                        this.options.tickLength,
                        this.options.offsetFromCenter + scaleLength
                );

                console.log(dist);
                this.drawLine(
                        this.options.tickLength,
                        this.options.offsetFromCenter +
                                scaleLength * this._THREE_QUARTERS,
                        this.options.tickLength * this._HALF,
                        this.options.offsetFromCenter +
                                scaleLength * this._THREE_QUARTERS
                );
                this.drawLine(
                        this.options.tickLength,
                        this.options.offsetFromCenter +
                                scaleLength * this._QUARTER,
                        this.options.tickLength * this._HALF,
                        this.options.offsetFromCenter +
                                scaleLength * this._QUARTER
                );
                this.drawLine(
                        this.options.tickLength,
                        this.options.offsetFromCenter +
                                scaleLength * this._HALF,
                        this.options.tickLength * this._QUARTER,
                        this.options.offsetFromCenter + scaleLength * this._HALF
                );

                this.drawLine(
                        this.options.tickLength,
                        this.options.offsetFromCenter + scaleLength,
                        0,
                        this.options.offsetFromCenter + scaleLength
                );

                this.ctx.fillText(
                        label,
                        0,
                        this.options.offsetFromCenter + scaleLength + 10
                );
        },

        getScaleRatioLabel: function(maxDist) {

                factor = this.options.metric ? 1000 : 5280;

                if (maxDist > factor) {
                        maxDist = maxDist / factor;
                        roundDist = this.getRoundNum(maxDist);
                        unitStr = this.options.metric ? `km` : `mi`
                } else {
                        roundDist = this.getRoundNum(maxDist);
                        unitStr = this.options.metric ? `m` : `ft`
                }

                return [roundDist / maxDist, `${roundDist} ${unitStr}`];
        },

        calculateMaxDistance: function(xS, yS, xE, yE) {
                dist = this.map.distance(
                        this.map.containerPointToLatLng([xS, yS]),
                        this.map.containerPointToLatLng([xE, yE])
                );
                return this.options.metric ? dist : dist * 3.28084;
        },

        getRoundNum: function(num) {
                // from L.Control.scale
                pow10 = Math.pow(10, `${Math.floor(num)}`.length - 1);
                d = num / pow10;
                d = d >= 10 ? 10 : d >= 5 ? 5 : d >= 3 ? 3 : d >= 2 ? 2 : 1;
                return pow10 * d;
        },

        fetchElevation: async function(lat, lng) {
                const UNITS = this.options.metric ? `Meters` : `Feet`;
                const OUTPUT = `json`;
                const baseUrl = `https://nationalmap.gov/epqs/pqs.php?units=${UNITS}&output=${OUTPUT}`;
                const url = baseUrl + `&x=${lng}&y=${lat}`;

                const usgsQueryResults = await fetch(url).then(response =>
                        response.json()
                );
                return usgsQueryResults.USGS_Elevation_Point_Query_Service
                        .Elevation_Query.Elevation;
        },

        formatNumber: function(num) {
                return num.toLocaleString({
                        minimumFractionDigits: 3,
                        maximumFractionDigits: 3
                });
        },

        resetCanvas: function() {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        },

        drawLine: function(xS, yS, xE, yE) {
                this.ctx.beginPath();
                this.ctx.moveTo(xS, yS);
                this.ctx.lineTo(xE, yE);
                this.ctx.stroke();
        }
});

L.control.reticle = function(options) {
        return new L.Control.Reticle(options);
};
