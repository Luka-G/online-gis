angular.module("onlineGIS")
   .service("geometry", ["$rootScope", "map", function($rootScope, map) {
      var olMap = map.map
      var geometry = map.layers.geometry;

      //STYLES FOR DRAWING, SELECTING AND MODIFYING
      var drawStyle = new ol.style.Style({
         fill: new ol.style.Fill({
            color: "rgba(83, 233, 0, 0.2)"
         }),
         stroke: new ol.style.Stroke({
            color: "rgba(83, 233, 0, 1.0)",
            width: 2
         }),
         //CURSOR
         image: new ol.style.Icon({
            src: "img/draw-pointer.png"
         })
      });

      var selectStyle = new ol.style.Style({
         fill: new ol.style.Fill({
            color: "rgba(51, 51, 51, 0.2)"
         }),
         stroke: new ol.style.Stroke({
            color: "rgb(51, 51, 51)",
            width: 4
         })
      });

      var modifyStyle = new ol.style.Style({
         image: new ol.style.Circle({
            radius: 7,
            fill: new ol.style.Fill({
               color: "rgb(51, 51, 51)"
            }),
            stroke: new ol.style.Stroke({
               width: 2,
               color: "rgb(255, 255, 255)"
            })
         })
      });

      var pointDrawStyle = new ol.style.Style({
         image: new ol.style.Circle({
            radius: 7,
            fill: new ol.style.Fill({
               color: "rgba(83, 233, 0, 1.0)"
            }),
            stroke: new ol.style.Stroke({
               width: 2,
               color: "rgb(255, 255, 255)"
            })
         })
      });

      //TOOLS CONTAINER
      var tools = {
         draw: {
            init: function() {
               olMap.addInteraction(this.interaction.PolygonDraw);
               olMap.addInteraction(this.interaction.LineDraw);
               olMap.addInteraction(this.interaction.PointDraw);
               olMap.addInteraction(this.interaction.Snap);
               this.setActive(true, "Snap");
               this.setActive(false, "PolygonDraw");
               this.setActive(false, "LineDraw");
               this.setActive(false, "PointDraw");

               this.setEvents();
            },
            interaction: {
               PolygonDraw: new ol.interaction.Draw({
                  source: geometry.getSource(),
                  type: "Polygon",
                  style: drawStyle
               }),
               LineDraw: new ol.interaction.Draw({
                  source: geometry.getSource(),
                  type: "LineString",
                  style: drawStyle
               }),
               PointDraw: new ol.interaction.Draw({
                  source: geometry.getSource(),
                  type: "Point",
                  style: pointDrawStyle
               }),
               Snap: new ol.interaction.Snap({
                  source: geometry.getSource()
               })
            },
            setActive: function(active, interaction) {
               if (active) {
                  this.interaction[interaction].setActive(active);
               } else {
                  for (var i in this.interaction) {
                     if (i != "Snap") {
                        this.interaction[i].setActive(false)
                     }
                  }
               }
               $rootScope.$broadcast("cursor:change", active);
            },
            setEvents: function() {
               function drawendHandler(event) {
                  var feature = event.feature;
                  feature.setProperties({
                     "layer": $rootScope.activeLayer.name,
                     "attributes": $rootScope.activeLayer.attributes
                  });
                  $rootScope.$emit("geometry:drawend", feature);
               }
               this.interaction.PolygonDraw.on("drawend", drawendHandler);

               this.interaction.LineDraw.on("drawend", drawendHandler);

               this.interaction.PointDraw.on("drawend", drawendHandler);
            }
         },
         modify: {
            init: function() {},
            setActive: function(active) {},
         },
         delete: {
            init: function() {
               this.event = olMap.on('singleclick', this.deleteHandler);
               this.unSetEvent();
            },
            setActive: function(active) {
               if(active) {
                  this.event = olMap.on('singleclick', this.deleteHandler);
               } else {
                  this.unSetEvent();
               }
            },
            event: null,
            unSetEvent: function() {
               ol.Observable.unByKey(this.event)
            },
            deleteHandler: function(ev) {
               var featureFound = false;
               olMap.forEachFeatureAtPixel(ev.pixel, function(feature) {
                  if(!featureFound && feature.getProperties().layer == $rootScope.activeLayer.name) {
                     $rootScope.$emit("geometry:delete", feature);
                     featureFound = true;
                  }
               });
            }
         }
      }
      tools.draw.init();
      tools.modify.init();
      tools.delete.init();

      function setToolActivity(tool, active, opt_draw_interaction) {
         (opt_draw_interaction) ? tools[tool].setActive(active, opt_draw_interaction): tools[tool].setActive(active);
      }

      function removeAllFeaturesFromLayer(layer) {
         var features = geometry.getSource().getFeatures();
         angular.forEach(features, function(feature) {
            if (feature.getProperties().layer == layer) {
               geometry.getSource().removeFeature(feature);
            }
         });
      }

      function discardFeature(feature) {
         geometry.getSource().removeFeature(feature);
      }

      function removeFeature(feature) {
         discardFeature(feature);
         //TODO: REST API - REMOVE FEATURE
      }

      function saveFeature(model, feature) {
         feature.setProperties({attributes: model});
         //TODO: POST GEOMETRY VIA REST API
      }



      //PUBLIC API
      this.setToolActivity = setToolActivity;
      this.discardFeature = discardFeature;
      this.removeFeature = removeFeature;
      this.saveFeature = saveFeature;
      this.removeAllFeaturesFromLayer = removeAllFeaturesFromLayer;


   }])
