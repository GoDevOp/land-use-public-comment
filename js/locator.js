/** @license
 | Version 10.2
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
//Get candidate results for searched address/case name
function LocateAddress() {
    var thisSearchTime = lastSearchTime = (new Date()).getTime();

    isContainerVisible = true;
    dojo.byId("imgSearchLoader").style.display = "block";
    if (dojo.byId("tdSearchAddress").className.trim() == "tdSearchByAddress") {
        //Search for address
        if (dojo.byId("txtAddress").value.trim() == '') {
            dojo.byId("imgSearchLoader").style.display = "none";
            RemoveChildren(dojo.byId('tblAddressResults'));
            CreateScrollbar(dojo.byId("divAddressScrollContainer"), dojo.byId("divAddressScrollContent"));
            if (dojo.byId("txtAddress").value != "") {
                alert(messages.getElementsByTagName("addressToLocate")[0].childNodes[0].nodeValue);
            }
            return;
        }
        var address = [];
        address[locatorSettings.Locators[0].LocatorParamaters] = dojo.byId('txtAddress').value;

        var locator1 = new esri.tasks.Locator(locatorSettings.Locators[0].LocatorURL);
        locator1.outSpatialReference = map.spatialReference;
        locator1.addressToLocations(address, [locatorSettings.Locators[0].CandidateFields], function (candidates) {
            if (dojo.coords("divAddressHolder").h > 0) {
                if (isContainerVisible) {
                    // Discard searches made obsolete by new typing from user
                    if (thisSearchTime < lastSearchTime) {
                        return;
                    }
                    ShowLocatedAddress(candidates);
                }
            }
            else {
                dojo.byId("imgSearchLoader").style.display = "none";
                RemoveChildren(dojo.byId('tblAddressResults'));
                CreateScrollbar(dojo.byId("divAddressScrollContainer"), dojo.byId("divAddressScrollContent"));
                return;
            }
        },
    function (err) {
        dojo.byId("imgSearchLoader").style.display = "none";
    });
    }
    else {
        //Search for case name
        if (dojo.byId("txtAddress").value.trim() == '') {
            dojo.byId("imgSearchLoader").style.display = "none";
            RemoveChildren(dojo.byId('tblAddressResults'));
            CreateScrollbar(dojo.byId("divAddressScrollContainer"), dojo.byId("divAddressScrollContent"));
            if (dojo.byId("txtAddress").value != "") {
                alert(messages.getElementsByTagName("caseToLocate")[0].childNodes[0].nodeValue);
            }
            return;
        }
        else {
            var query = new esri.tasks.Query();
            query.where = dojo.string.substitute(locatorSettings.Locators[1].QueryString, [dojo.byId("txtAddress").value.trim()]);
            map.getLayer(devPlanLayerId).queryFeatures(query, function (featureSet) {
                // Discard searches made obsolete by new typing from user
                if (thisSearchTime < lastSearchTime) {
                    return;
                }

                if (featureSet.features.length > 0) {
                    PopulateCaseNames(featureSet.features);
                }
                else {
                    RemoveChildren(dojo.byId('tblAddressResults'));
                    LoctorErrBack("noMatchingCaseName");
                    dojo.byId("imgSearchLoader").style.display = "none";
                }
            }, function () {
                RemoveChildren(dojo.byId('tblAddressResults'));
                LoctorErrBack("noMatchingCaseName");
                dojo.byId("imgSearchLoader").style.display = "none";
            });
        }
    }
}

//Display address container upon selecting 'Address' tab in search panel
function SearchByAddress() {
    if (dojo.byId("imgSearchLoader").style.display == "block") {
        return;
    }
    if (dojo.byId("txtAddress").getAttribute("defaultAddress") == dojo.byId("txtAddress").getAttribute("defaultAddressTitle")) {
        dojo.byId("txtAddress").style.color = "gray";
    }
    else {
        dojo.byId("txtAddress").style.color = "white";
    }
    dojo.byId("txtAddress").value = dojo.byId("txtAddress").getAttribute("defaultAddress");
    lastSearchString = dojo.byId("txtAddress").value.trim();
    RemoveChildren(dojo.byId('tblAddressResults'));
    RemoveScrollBar(dojo.byId("divAddressScrollContainer"));
    dojo.byId("tdSearchAddress").className = "tdSearchByAddress";
    dojo.byId("tdSearchCase").className = "tdSearchByUnSelectedCase";
}

//Populate candidate address list in address container
function ShowLocatedAddress(candidates) {

    if (dojo.byId("tdSearchAddress").className.trim() == "tdSearchByAddress") {
        RemoveChildren(dojo.byId('tblAddressResults'));
        CreateScrollbar(dojo.byId("divAddressScrollContainer"), dojo.byId("divAddressScrollContent"));

        if (candidates.length > 0) {
            var table = dojo.byId("tblAddressResults");
            var tBody = document.createElement("tbody");
            table.appendChild(tBody);
            table.cellSpacing = 0;
            table.cellPadding = 0;

            //Filter and display valid address results according to locator settings in configuration file
            var counter = 0;
            for (var i in candidates) {
                if (candidates.hasOwnProperty(i)) {
                    if (candidates[i].score > locatorSettings.Locators[0].AddressMatchScore) {
                        for (var bMap = 0; bMap < baseMapLayers.length; bMap++) {
                            if (map.getLayer(baseMapLayers[bMap].Key).visible) {
                                var bmap = baseMapLayers[bMap].Key;
                            }
                        }

                        if (map.getLayer(bmap).fullExtent.contains(candidates[i].location)) {
                            for (j in locatorSettings.Locators[0].LocatorFieldValues) {
                                if (locatorSettings.Locators[0].LocatorFieldValues.hasOwnProperty(j)) {
                                    if (candidates[i].attributes[locatorSettings.Locators[0].LocatorFieldName] == locatorSettings.Locators[0].LocatorFieldValues[j]) {
                                        counter++;
                                        var candidate = candidates[i];
                                        var tr = document.createElement("tr");
                                        tBody.appendChild(tr);
                                        var td1 = document.createElement("td");
                                        td1.innerHTML = dojo.string.substitute(locatorSettings.Locators[0].DisplayField, candidate.attributes);
                                        td1.align = "left";
                                        td1.className = 'bottomborder';
                                        td1.style.cursor = "pointer";
                                        td1.setAttribute("x", candidate.location.x);
                                        td1.setAttribute("y", candidate.location.y);
                                        td1.setAttribute("address", dojo.string.substitute(locatorSettings.Locators[0].DisplayField, candidate.attributes));
                                        td1.onclick = function () {
                                            dojo.byId("txtAddress").value = this.innerHTML;
                                            dojo.byId('txtAddress').setAttribute("defaultAddress", this.innerHTML);
                                            mapPoint = new esri.geometry.Point(Number(this.getAttribute("x")), Number(this.getAttribute("y")), map.spatialReference);
                                            dojo.byId("txtAddress").setAttribute("defaultAddressTitle", this.innerHTML);
                                            LocateGraphicOnMap(mapPoint);
                                            dojo.byId("imgGeolocation").src = "images/gps.png";
                                        }
                                        tr.appendChild(td1);
                                    }
                                }
                            }
                        }
                    }
                }
            }
            //Display error message if there are no valid candidate addresses
            if (counter == 0) {
                var tr = document.createElement("tr");
                tBody.appendChild(tr);
                var td1 = document.createElement("td");
                td1.innerHTML = messages.getElementsByTagName("noSearchResults")[0].childNodes[0].nodeValue;
                tr.appendChild(td1);
                dojo.byId("imgSearchLoader").style.display = "none";
                return;
            }
            dojo.byId("imgSearchLoader").style.display = "none";
            SetAddressResultsHeight();
        } else {
            dojo.byId("imgSearchLoader").style.display = "none";
            LoctorErrBack("noSearchResults");
        }
    }
}

//Locate searched address on map with pushpin graphic
function LocateGraphicOnMap(mapPoint) {
    selectedMapPoint = null;
    featureID = null;
    map.infoWindow.hide();
    ClearGraphics();
    if (mapPoint) {
        map.setLevel(locatorSettings.Locators[0].ZoomLevel);
        map.centerAt(mapPoint);
        var symbol = new esri.symbol.PictureMarkerSymbol(locatorSettings.DefaultLocatorSymbol, locatorSettings.MarkupSymbolSize.width, locatorSettings.MarkupSymbolSize.height);
        var graphic = new esri.Graphic(mapPoint, symbol, { "Locator": true }, null);
        map.getLayer(tempGraphicsLayerId).add(graphic);
    }
    HideAddressContainer();
}

//Display case name container upon selecting 'Case Name' tab in search panel
function SearchByCase() {
    if (dojo.byId("imgSearchLoader").style.display == "block") {
        return;
    }

    if (dojo.byId("txtAddress").getAttribute("defaultCase") == dojo.byId("txtAddress").getAttribute("defaultCaseTitle")) {
        dojo.byId("txtAddress").style.color = "gray";
    }
    else {
        dojo.byId("txtAddress").style.color = "white";
    }

    RemoveChildren(dojo.byId('tblAddressResults'));
    RemoveScrollBar(dojo.byId("divAddressScrollContainer"));
    dojo.byId("txtAddress").value = dojo.byId("txtAddress").getAttribute("defaultCase");
    lastSearchString = dojo.byId("txtAddress").value.trim();
    dojo.byId("tdSearchAddress").className = "tdSearchByUnSelectedAddress";
    dojo.byId("tdSearchCase").className = "tdSearchByCase";
}

//Populate list of case names in case container
function PopulateCaseNames(features) {
    if (dojo.byId("tdSearchAddress").className.trim() != "tdSearchByAddress") {
        RemoveChildren(dojo.byId('tblAddressResults'));
        var table = dojo.byId("tblAddressResults");
        var tBody = document.createElement("tbody");
        table.appendChild(tBody);
        table.className = "tbl";
        table.cellSpacing = 0;
        table.cellPadding = 0;
        if (features.length > 0) {
            if (features.length == 1) {
                dojo.byId('txtAddress').setAttribute("objectId", features[0].attributes[map.getLayer(devPlanLayerId).objectIdField]);
                dojo.byId('txtAddress').setAttribute("caseName", dojo.string.substitute(locatorSettings.Locators[1].DisplayField, features[0].attributes));
                dojo.byId('txtAddress').setAttribute("defaultCase", dojo.string.substitute(locatorSettings.Locators[1].DisplayField, features[0].attributes));
                dojo.byId("txtAddress").setAttribute("defaultCaseTitle", dojo.string.substitute(locatorSettings.Locators[1].DisplayField, features[0].attributes));
                LocateCaseOnMap(dojo.byId('txtAddress'));
            }
            else {
                var caseFeatures = [];
                for (var j = 0; j < features.length; j++) {
                    caseFeatures.push({ geometry: features[j].geometry, attributes: features[j].attributes, key: dojo.string.substitute(locatorSettings.Locators[1].DisplayField, features[j].attributes) });
                }

                caseFeatures.sort(function (a, b) {
                    var nameA = a.key.toLowerCase(), nameB = b.key.toLowerCase()
                    if (nameA < nameB) //sort string ascending
                        return -1
                    if (nameA > nameB)
                        return 1
                    return 0 //default return value (no sorting)
                });

                for (var i in caseFeatures) {
                    if (caseFeatures.hasOwnProperty(i)) {
                        var tr = document.createElement("tr");
                        tBody.appendChild(tr);
                        var td1 = document.createElement("td");
                        td1.innerHTML = dojo.string.substitute(locatorSettings.Locators[1].DisplayField, caseFeatures[i].attributes);
                        td1.className = 'bottomborder';
                        td1.style.cursor = "pointer";
                        td1.height = 20;
                        td1.title = 'Click to locate case';
                        td1.setAttribute("objectId", caseFeatures[i].attributes[map.getLayer(devPlanLayerId).objectIdField]);
                        td1.setAttribute("caseName", dojo.string.substitute(locatorSettings.Locators[1].DisplayField, caseFeatures[i].attributes));
                        td1.onclick = function () {
                            dojo.byId('txtAddress').setAttribute("defaultCase", this.innerHTML);
                            dojo.byId("txtAddress").setAttribute("defaultCaseTitle", this.innerHTML);
                            LocateCaseOnMap(this);
                        }
                        tr.appendChild(td1);
                    }
                }
            }
        }
        SetAddressResultsHeight();
        dojo.byId("imgSearchLoader").style.display = "none";
    }
}

//Locate searched case on map and open up infowindow
function LocateCaseOnMap(imgCase) {
    ShowProgressIndicator();
    featureID = null;
    map.infoWindow.hide();
    orientationChange = true;
    var objectId = imgCase.getAttribute("objectId");
    var query = new esri.tasks.Query();
    query.where = map.getLayer(devPlanLayerId).objectIdField + " = " + objectId;
    map.getLayer(devPlanLayerId).queryFeatures(query, function (featureSet) {
        map.setExtent(featureSet.features[0].geometry.getExtent().expand(2));
        setTimeout(function () {
            ShowInfoWindowDetails(featureSet.features[0].geometry.getExtent().getCenter(), featureSet.features[0].attributes, false);
            orientationChange = false;
        }, 1200);
        HideProgressIndicator();
    });
    dojo.byId('txtAddress').value = imgCase.getAttribute("caseName");
    HideAddressContainer();
}

//This function is called when locator service fails or does not return any data
function LoctorErrBack(val) {
    var table = dojo.byId("tblAddressResults");
    var tBody = document.createElement("tbody");
    table.appendChild(tBody);
    table.cellSpacing = 0;
    table.cellPadding = 0;

    var tr = document.createElement("tr");
    tBody.appendChild(tr);
    var td1 = document.createElement("td");
    td1.innerHTML = messages.getElementsByTagName(val)[0].childNodes[0].nodeValue;
    tr.appendChild(td1);
}

//Query the features while sharing
function ExecuteQueryTask() {
    ShowProgressIndicator();
    var queryTask = new esri.tasks.QueryTask(devPlanLayerURL.ServiceURL);
    var query = new esri.tasks.Query;
    query.outSpatialReference = map.spatialReference;
    query.where = map.getLayer(devPlanLayerId).objectIdField + "=" + featureID;
    query.outFields = ["*"];
    query.returnGeometry = true;
    queryTask.execute(query, function (fset) {
        if (fset.features.length > 0) {
            ShowInfoWindowDetails(fset.features[0].geometry.getExtent().getCenter(), fset.features[0].attributes, true);
        }
        HideProgressIndicator();
    }, function (err) {
        alert(err.Message);
    });
}
