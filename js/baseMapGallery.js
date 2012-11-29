/** @license
 | Version 10.1.1
 | Copyright 2012 Esri
 |
 | Licensed under the Apache License, Version 2.0 (the "License");
 | you may not use this file except in compliance with the License.
 | You may obtain a copy of the License at
 |
 |    http://www.apache.org/licenses/LICENSE-2.0
 |
 | Unless required by applicable law or agreed to in writing, software
 | distributed under the License is distributed on an "AS IS" BASIS,
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 | See the License for the specific language governing permissions and
 | limitations under the License.
 */
var containerHeight = 0;

//Function for adding the basemap layers
function CreateBaseMapComponent() {
    if (baseMapLayerCollection.length != 0) {
        for (var i = 0; i < baseMapLayerCollection.length; i++) {
            map.addLayer(CreateBaseMapLayer(baseMapLayerCollection[i].MapURL, baseMapLayerCollection[i].Key, (i == 0) ? true : false));
        }

        if (baseMapLayerCollection.length == 1) {
            dojo.byId('divBaseMapTitleContainer').style.display = 'none';
            HideLoadingMessage();
            return;
        }
        var layerList = dojo.byId('layerList');

        for (var i = 0; i < Math.ceil(baseMapLayerCollection.length / 2); i++) {
            var previewDataRow = document.createElement("tr");
            containerHeight += 100;
            if (baseMapLayerCollection[(i * 2)]) {
                var layerInfo = baseMapLayerCollection[(i * 2)];
                layerList.appendChild(CreateBaseMapElement(layerInfo));
            }

            if (baseMapLayerCollection[(i * 2) + 1]) {
                var layerInfo = baseMapLayerCollection[(i * 2) + 1];
                layerList.appendChild(CreateBaseMapElement(layerInfo));
            }
        }

        dojo.addClass(dojo.byId("imgThumbNail" + baseMapLayerCollection[0].Key), "selectedBaseMap");
    }
    else {
        ShowDialog('Error', messages.getElementsByTagName("noBasemap")[0].childNodes[0].nodeValue);
        HideLoadingMessage();
    }
}

//Function for changing the map on selection
function CreateBaseMapElement(baseMapLayerInfo) {
    var divContainer = document.createElement("div");
    divContainer.className = "baseMapContainerNode";
    var imgThumbnail = document.createElement("img");
    imgThumbnail.src = baseMapLayerInfo.ThumbnailSource;
    imgThumbnail.className = "basemapThumbnail";
    imgThumbnail.id = "imgThumbNail" + baseMapLayerInfo.Key;
    imgThumbnail.setAttribute("layerId", baseMapLayerInfo.Key);
    imgThumbnail.onclick = function () {
        ChangeBaseMap(this);
    };
    var spanBaseMapText = document.createElement("span");
    var spanBreak = document.createElement("br");
    spanBaseMapText.id = "spanBaseMapText" + baseMapLayerInfo.Key;
    spanBaseMapText.className = "basemapLabel";
    spanBaseMapText.innerHTML = baseMapLayerInfo.Name;
    divContainer.appendChild(imgThumbnail);
    divContainer.appendChild(spanBreak);
    divContainer.appendChild(spanBaseMapText);
    return divContainer;
}

//Function for displaying the selected map and hiding previous map
function ChangeBaseMap(spanControl) {
    HideMapLayers();
    var key = spanControl.getAttribute('layerId');
    for (var i = 0; i < baseMapLayerCollection.length; i++) {
        dojo.removeClass(dojo.byId("imgThumbNail" + baseMapLayerCollection[i].Key), "selectedBaseMap");
        dojo.removeClass(dojo.byId("imgThumbNail" + baseMapLayerCollection[i].Key), "selectedBaseMapIE");
        dojo.byId("imgThumbNail" + baseMapLayerCollection[i].Key).style.marginTop = "0px";
        dojo.byId("imgThumbNail" + baseMapLayerCollection[i].Key).style.marginLeft = "0px";
        dojo.byId("spanBaseMapText" + baseMapLayerCollection[i].Key).style.marginTop = "1px";
        if (baseMapLayerCollection[i].Key == key) {

            dojo.addClass(dojo.byId("imgThumbNail" + baseMapLayerCollection[i].Key), "selectedBaseMap");
            var layer = map.getLayer(baseMapLayerCollection[i].Key);
            ShowHideBaseMapComponent();
            layer.show();
        }
    }
}


//Function for displaying a map on window
function CreateBaseMapLayer(layerURL, layerId, isVisible) {
    var layer = new esri.layers.ArcGISTiledMapServiceLayer(layerURL, { id: layerId, visible: isVisible });
    return layer;
}

//Function for hiding a map on window
function HideMapLayers() {
    for (var i = 0; i < baseMapLayerCollection.length; i++) {
        var layer = map.getLayer(baseMapLayerCollection[i].Key);
        if (layer) {
            layer.hide();
        }
    }
}

//Function for showing and hiding basemap container
function ShowHideBaseMapComponent() {
    dojo.byId('imgGPS').src = "images/imggeolocation.png";
    var gpsButton = dijit.byId('btnGeolocation');
    gpsButton.attr("checked", false);
    var node = dojo.byId('divBaseMapTitleContainer');
    var anim = dojo.byId('divContainer');
    var divNode = dojo.byId('divAddressContainer');
    if (dojo.coords(divNode).h > 0) {
        WipeOutControl(divNode, 500);
    }
    var appNode = dojo.byId('divAppContainer');
    if (dojo.coords(appNode).h > 0) {
        ToggleApplication();
    }
    if (dojo.coords(node).h > 0) {
        WipeOutControl(node, 500);
    }
    else {
        WipeInControl(node, node.style.height, 500);
    }
}

//Function to hide BaseMapWidget onmouseout
function HideBaseMapWidget() {
    dijit.byId('btnImgBaseMap').attr("checked", false);
    var node = dojo.byId('divBaseMapTitleContainer');
    if (dojo.coords(node).h > 0) {
        WipeOutControl(node, 500);
    }
}