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
var searchAddress;

//Function for locating address
function Locate() {
    if (dojo.byId('imgGPS').src = "images/bluegps.png") {
        dojo.byId('imgGPS').src = "images/imggeolocation.png";
        var gpsButton = dijit.byId('btnGeolocation');
        gpsButton.attr("checked", false);
    }
    //Hide Basemap control if open
    var nodeBaseMap = dojo.byId('divBaseMapTitleContainer');
    if (nodeBaseMap.style.display != "none") {
        HideBaseMapWidget();
    }

    //Hide Sharing control if open
    var nodeShare = dojo.byId('divAppContainer');

    if (nodeShare.style.display != "none") {
        ToggleApplication();
    }

    var node = dojo.byId('divAddressContainer');
    if (node.style.display != "none") {
        WipeOutControl(node, 100);
    }

    if (dojo.byId('rbAddress').checked) {
        var searchAdd = dojo.byId("txtAddress").value.trim();
        if (searchAdd == '') {
            ShowDialog('Locator Error', messages.getElementsByTagName("addressToLocate")[0].childNodes[0].nodeValue);
            return;
        }
        else if (searchAddress == dojo.byId("txtAddress").value && node.style.display != "none") {
            WipeOutControl(node, 500);
        }
        else if (searchAddress == dojo.byId("txtAddress").value && node.style.display == "none") {
            WipeInControl(node, 500);
        }


        var address = [];

        address[locatorFields] = dojo.byId('txtAddress').value;

        ShowLoadingMessage('Searching...');
        var locator = new esri.tasks.Locator(locatorURL);
        locator.outSpatialReference = map.spatialReference;
        locator.addressToLocations(address, ["Loc_name"], function (candidates) {
            ShowLocatedAddress(candidates);
        }, function (err) {
            HideLoadingMessage();

            ShowDialog('Locator Error', messages.getElementsByTagName("unableToLocate")[0].childNodes[0].nodeValue);
        });
    }
    else {
        if (dojo.byId("txtAddress").value.trim() == '') {
            ShowDialog('Locator Error', messages.getElementsByTagName("caseName")[0].childNodes[0].nodeValue);
            return;
        }
        else if (searchAddress == dojo.byId("txtAddress").value && node.style.display != "none") {
            WipeOutControl(node, 500);
        }
        else if (searchAddress == dojo.byId("txtAddress").value && node.style.posHeight == 0) {
            WipeInControl(node, 500);
        }
        else {
            ShowLoadingMessage('Searching...');
            searchAddress = dojo.byId("txtAddress").value.trim();
            var query = new esri.tasks.Query();
            query.where = "CASENAME like '%" + searchAddress + "%'";
            map.getLayer(devPlanLayerID).queryFeatures(query, function (featureSet) {
                if (featureSet.features.length > 0) {
                    PopulateCaseNames(featureSet.features);
                }
                else {
                    RemoveChildren(dojo.byId('divAddressContainer'));
                    searchAddress = '';
                    map.infoWindow.hide();
                    ShowDialog('Locator Result', messages.getElementsByTagName("noMatchingCaseName")[0].childNodes[0].nodeValue);
                    HideLoadingMessage();
                }
            }, function () {
                RemoveChildren(dojo.byId('divAddressContainer'));
                searchAddress = '';
                map.infoWindow.hide();
                ShowDialog('Locator Result', messages.getElementsByTagName("noMatchingCaseName")[0].childNodes[0].nodeValue);
                HideLoadingMessage();
            });
        }
    }
}

//Function to populate all the case names
function PopulateCaseNames(features) {
    RemoveChildren(dojo.byId('divAddressContainer'));
    if (features.length == 1) {
        searchAddress = '';
        var td1 = document.createElement("td");
        td1.setAttribute("objectId", features[0].attributes[map.getLayer(devPlanLayerID).objectIdField]);
        td1.setAttribute("caseName", features[0].attributes[caseName]);
        LocateCaseOnMap(td1);
    }
    else {
        var table = document.createElement("table");
        var tBody = document.createElement("tbody");
        table.appendChild(tBody);
        table.className = "tbl";
        table.cellSpacing = 0;
        table.cellPadding = 0;
        for (var i = 0; i < features.length; i++) {
            var tr = document.createElement("tr");
            tBody.appendChild(tr);
            var td1 = document.createElement("td");
            td1.innerHTML = features[i].attributes[caseName];
            td1.className = 'tdAddress';
            td1.height = 20;
            td1.title = 'Click to locate case';
            td1.setAttribute("objectId", features[i].attributes[map.getLayer(devPlanLayerID).objectIdField]);
            td1.setAttribute("caseName", features[i].attributes[caseName]);
            td1.onclick = function () {
                LocateCaseOnMap(this);
            }
            tr.appendChild(td1);
        }
        dojo.byId('divAddressContainer').appendChild(table);
        AnimateAdvanceSearch();
        HideLoadingMessage();
    }
}

//Function to locate case on map
function LocateCaseOnMap(imgCase) {
    ShowLoadingMessage('Populating...');
    var objectId = imgCase.getAttribute("objectId");
    var query = new esri.tasks.Query();
    query.where = map.getLayer(devPlanLayerID).objectIdField + " = " + objectId;
    map.getLayer(devPlanLayerID).queryFeatures(query, function (featureSet) {

        if (featureSet.features[0], featureSet.features[0].geometry.contains(featureSet.features[0].geometry.getExtent().getCenter())) {
            DisplayInfoWindow(featureSet.features[0], featureSet.features[0].geometry.getExtent().getCenter());
        }
        else {
            DisplayInfoWindow(featureSet.features[0], featureSet.features[0].geometry.getPoint(0, 0));
        }
        HideLoadingMessage();
        map.setExtent(featureSet.features[0].geometry.getExtent().expand(5));
    });
    dojo.byId('txtAddress').value = imgCase.getAttribute("caseName");
    WipeOutControl(dojo.byId('divAddressContainer'), 500);
}

//Function to populate address
function ShowLocatedAddress(candidates) {
    RemoveChildren(dojo.byId('divAddressContainer'));
    if (candidates.length > 0) {
        if (candidates[0].score == 100) {
            searchAddress = '';
            var td1 = document.createElement("td");
            td1.setAttribute("x", candidates[0].location.x);
            td1.setAttribute("y", candidates[0].location.y);
            td1.setAttribute("address", candidates[0].address);
            LocateAddressOnMap(td1);
        }
        else {
            var table = document.createElement("table");
            var tBody = document.createElement("tbody");
            table.appendChild(tBody);
            table.className = "tbl";
            table.cellSpacing = 0;
            table.cellPadding = 0;
            for (var i = 0; i < candidates.length; i++) {
                var candidate = candidates[i];
                var tr = document.createElement("tr");
                tBody.appendChild(tr);
                var td1 = document.createElement("td");
                td1.innerHTML = candidate.address;
                td1.className = 'tdAddress';
                td1.height = 20;
                td1.setAttribute("x", candidate.location.x);
                td1.setAttribute("y", candidate.location.y);
                td1.setAttribute("address", candidate.address);
                td1.title = 'Click to locate address';
                td1.onclick = function () {
                    LocateAddressOnMap(this);
                }

                tr.appendChild(td1);
            }
            dojo.byId('divAddressContainer').appendChild(table);
            AnimateAdvanceSearch();
        }
    }
    else {
        dojo.byId('txtAddress').focus();
        ShowDialog('Locator Error', messages.getElementsByTagName("unableToLocate")[0].childNodes[0].nodeValue);
    }
    HideLoadingMessage();
}

//Function to locate address on map
function LocateAddressOnMap(imgLocate) {
    var mapPoint = new esri.geometry.Point(imgLocate.getAttribute("x"), imgLocate.getAttribute("y"), map.spatialReference);
    ClearGraphics();

    var graphicCollection = new esri.geometry.Multipoint(map.spatialReference);
    graphicCollection.addPoint(mapPoint);
    geometryService.project([graphicCollection], map.spatialReference, function (newPointCollection) {
        mapPoint = newPointCollection[0].getPoint(0);
        map.centerAndZoom(mapPoint, map._slider.maximum - 2);

        var symbol = new esri.symbol.PictureMarkerSymbol('images/pushpin.png', 25, 25);
        graphic = new esri.Graphic(mapPoint, symbol, null, null);
        var features = [];
        features.push(graphic);
        var featureSet = new esri.tasks.FeatureSet();
        featureSet.features = features;
        var layer = map.getLayer(tempGraphicLayer);
        layer.add(featureSet.features[0]);
    });
    dojo.byId('txtAddress').value = imgLocate.getAttribute("address");
    WipeOutControl(dojo.byId('divAddressContainer'), 500);
}
