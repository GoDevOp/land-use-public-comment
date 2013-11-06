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
dojo.require("dojox.mobile.parser");
dojo.require("dojox.mobile");
dojo.require("dojo.window");
dojo.require("dojo.date.locale");

dojo.require("esri.map");
dojo.require("esri.tasks.geometry");
dojo.require("esri.tasks.locator");
dojo.require("esri.tasks.query");
dojo.require("esri.layers.FeatureLayer");

dojo.require("mobile.InfoWindow");
dojo.require("js.config");
dojo.require("js.date");
dojo.require("dojox.mobile.View");
var map; //variable to store map object
var isiOS = false; //This variable will be set to 'true' if the application is accessed from iPhone or iPad
var isBrowser = false; //This variable will be set to 'true' when application is accessed from desktop browsers
var isMobileDevice = false; //This variable will be set to 'true' when application is accessed from mobile phone device
var devPlanMobileLayerURL; //variable to store public comment mobile Layer URL
var devPlanLayerURL; //variable to store serviceRequest mobile Layer URL
var isTablet = false; //This variable will be set to 'true' when application is accessed from tablet device
var baseMapLayers; //Variable for storing base map layers
var showNullValueAs; //variable to store the default value for replacing null values
var mapSharingOptions; //variable for storing the tiny service URL
var geometryService; //variable to store the Geometry service used for Geo-coding
var devPlanLayerId = "devPlanLayerID"; //variable to store public comment layer id
var tempGraphicsLayerId = "tempGraphicsLayerID"; //variable to store temporary graphics request layer id
var touchStart = false; //flag set for touchStart

var infoWindowContent; //variable used to store the info window content
var infoWindowHeader; //variable used to store the info window header
var infoPopupHeight; //variable used for storing the info window height
var infoPopupWidth; //variable used for storing the info window width
var showCommentsTab; //variable used for toggling the comments tab
var mapPoint;   //variable to store map point
var publicCommentsLayerURL; //variable for public comment layer
var formatDateAs; //variable to store date format
var selectedMapPoint; // variable to store selected map point
var publicCommentsLayerId = "publicCommentsLayerID"; //variable for comment layer
var infoWindowData; //Variable for Info window collection
var defaultCmnt; //variable to store data when no comments available
var commentsInfoPopupFieldsCollection; //variable to store fields for adding and displaying comment
var databaseFields; // Define the database field names
var attachmentDisplayName; //variable to store display name for attachments
var windowURL = window.location.toString();
var locatorSettings; //variable to store locator settings
var showCommentsMessage;

var customRenderer; //variable to store graphic symbol to display on map
var rendererColor; //variable to store the renderer color

var featureID; //variable to store feature Id while sharing

var lastSearchString; //variable for storing the last search string value
var stagedSearch; //variable for storing the time limit for search
var lastSearchTime; //variable for storing the time of last searched value

//This initialization function is called when the DOM elements are ready
function init() {
    esri.config.defaults.io.proxyUrl = "proxy.ashx";
    esriConfig.defaults.io.alwaysUseProxy = false;
    esriConfig.defaults.io.timeout = 180000;

    var userAgent = window.navigator.userAgent;
    if (userAgent.indexOf("iPhone") >= 0 || userAgent.indexOf("iPad") >= 0) {
        isiOS = true;
    }
    if ((userAgent.indexOf("Android") >= 0 && userAgent.indexOf("Mobile") >= 0) || userAgent.indexOf("iPhone") >= 0) {
        isMobileDevice = true;
        dojo.byId('dynamicStyleSheet').href = "styles/mobile.css";
        dojo.byId('divSplashContent').style.fontSize = "15px";
    }
    else if ((userAgent.indexOf("iPad") >= 0) || (userAgent.indexOf("Android") >= 0)) {
        isTablet = true;
        dojo.byId('dynamicStyleSheet').href = "styles/tablet.css";
        dojo.byId('divSplashContent').style.fontSize = "14px";
    }
    else {
        isBrowser = true;
        dojo.byId('dynamicStyleSheet').href = "styles/browser.css";
        dojo.byId('divSplashContent').style.fontSize = "11px";
    }

    // Identify the key presses while implementing auto-complete and assign appropriate actions
    dojo.connect(dojo.byId("txtAddress"), 'onkeyup', function (evt) {
        if (evt) {
            if (evt.keyCode == dojo.keys.ENTER) {
                if (dojo.byId("txtAddress").value != '') {
                    dojo.byId("imgSearchLoader").style.display = "block";
                    LocateAddress();
                    return;
                }
            }
            if ((!((evt.keyCode >= 46 && evt.keyCode < 58) || (evt.keyCode > 64 && evt.keyCode < 91) || (evt.keyCode > 95 && evt.keyCode < 106) || evt.keyCode == 8 || evt.keyCode == 110 || evt.keyCode == 188)) || (evt.keyCode == 86 && evt.ctrlKey) || (evt.keyCode == 88 && evt.ctrlKey)) {
                evt = (evt) ? evt : event;
                evt.cancelBubble = true;
                if (evt.stopPropagation) evt.stopPropagation();
                return;
            }

            if (dojo.coords("divAddressContent").h > 0) {
                if (dojo.byId("txtAddress").value.trim() != '') {
                    if (lastSearchString != dojo.byId("txtAddress").value.trim()) {
                        lastSearchString = dojo.byId("txtAddress").value.trim();
                        RemoveChildren(dojo.byId('tblAddressResults'));

                        // Clear any staged search
                        clearTimeout(stagedSearch);

                        if (dojo.byId("txtAddress").value.trim().length > 0) {
                            // Stage a new search, which will launch if no new searches show up
                            // before the timeout
                            stagedSearch = setTimeout(function () {
                                dojo.byId("imgSearchLoader").style.display = "block";
                                LocateAddress();
                            }, 500);
                        }
                    }
                } else {
                    lastSearchString = dojo.byId("txtAddress").value.trim();
                    dojo.byId("imgSearchLoader").style.display = "none";
                    RemoveChildren(dojo.byId('tblAddressResults'));
                    CreateScrollbar(dojo.byId("divAddressScrollContainer"), dojo.byId("divAddressScrollContent"));
                }
            }

        }
    });

    dojo.connect(dojo.byId("txtAddress"), 'onpaste', function (evt) {
        setTimeout(function () {
            LocateAddress();
        }, 100);
    });

    dojo.connect(dojo.byId("txtAddress"), 'oncut', function (evt) {
        setTimeout(function () {
            LocateAddress();
        }, 100);
    });

    //Check whether browser supports geolocation or not using modernizr
    if (!Modernizr.geolocation) {
        dojo.byId("tdGeolocation").style.display = "none";
    }
    // Read config.js file to set appropriate values
    var responseObject = new js.config();
    baseMapLayers = responseObject.BaseMapLayers;
    mapSharingOptions = responseObject.MapSharingOptions;
    dojo.byId("tdSearchAddress").innerHTML = responseObject.LocatorSettings.Locators[0].DisplayText;
    dojo.byId("tdSearchCase").innerHTML = responseObject.LocatorSettings.Locators[1].DisplayText;

    var infoWindow = new mobile.InfoWindow({
        domNode: dojo.create("div", null, dojo.byId("map"))
    });
    if (isMobileDevice) {
        dojo.byId('divInfoContainer').style.display = "none";
        dojo.replaceClass("divAddressHolder", "hideContainer", "hideContainerHeight");
        dojo.byId('divAddressContainer').style.display = "none";
        dojo.removeClass(dojo.byId('divInfoContainer'), "opacityHideAnimation");
        dojo.removeClass(dojo.byId('divAddressContainer'), "hideContainerHeight");
        dojo.byId('divSplashScreenContent').style.width = "95%";
        dojo.byId('divSplashScreenContent').style.height = "95%";
        dojo.byId("divLogo").style.display = "none";
        dojo.byId('imgDirections').style.display = "none";
        dojo.byId("lblAppName").style.display = "none";
        dojo.byId("lblAppName").style.width = "80%";
        dojo.byId("tdSearchAddress").className = "tdSearchByAddress";
    }
    else {
        var imgBasemap = document.createElement('img');
        imgBasemap.src = "images/imgbasemap.png";
        imgBasemap.className = "imgOptions";
        imgBasemap.title = "Switch Basemap";
        imgBasemap.id = "imgBaseMap";
        imgBasemap.style.cursor = "pointer";
        imgBasemap.onclick = function () {
            ShowBaseMaps();
        }
        dojo.byId("tdBaseMap").appendChild(imgBasemap);
        dojo.byId("tdBaseMap").className = "tdHeader";
        dojo.byId("divSplashScreenContent").style.width = "350px";
        dojo.byId("divSplashScreenContent").style.height = "290px";
        dojo.byId("divAddressContainer").style.display = "block";
        dojo.byId('imgDirections').src = "images/details.png";
        dojo.byId('imgDirections').title = "Details";
        dojo.byId('imgDirections').style.display = "none";
        dojo.byId("divLogo").style.display = "block";
    }
    dojo.byId('imgApp').src = responseObject.ApplicationIcon;
    dojo.byId('divSplashContent').innerHTML = responseObject.SplashScreenMessage;
    dojo.byId('lblAppName').innerHTML = responseObject.ApplicationName;
    dojo.xhrGet({
        url: "ErrorMessages.xml",
        handleAs: "xml",
        preventCache: true,
        load: function (xmlResponse) {
            messages = xmlResponse;
        }
    });

    map = new esri.Map("map", {
        slider: true,
        infoWindow: infoWindow
    });
    dojo.connect(map, "onLoad", function () {
        var zoomExtent;
        var extent = GetQuerystring('extent');
        if (extent != "") {
            zoomExtent = extent.split(',');
        }
        else {
            zoomExtent = responseObject.DefaultExtent.split(",");
        }
        var startExtent = new esri.geometry.Extent(parseFloat(zoomExtent[0]), parseFloat(zoomExtent[1]), parseFloat(zoomExtent[2]), parseFloat(zoomExtent[3]), map.spatialReference);
        map.setExtent(startExtent);
    });
    ShowProgressIndicator();
    CreateBaseMapComponent();

    defaultCmnt = responseObject.DefaultCmnt;
    publicCommentsLayerURL = responseObject.PublicCommentsLayerURL;
    devPlanLayerURL = responseObject.DevPlanLayerURL;
    formatDateAs = responseObject.FormatDateAs;
    devPlanMobileLayerURL = responseObject.DevPlanMobileLayerURL;
    showNullValueAs = responseObject.ShowNullValueAs;
    infoPopupHeight = responseObject.InfoPopupHeight;
    infoPopupWidth = responseObject.InfoPopupWidth;
    infoWindowData = responseObject.InfoWindowData;
    infoWindowContent = responseObject.InfoWindowContent;
    infoWindowHeader = responseObject.InfoWindowHeader;
    showCommentsTab = responseObject.ShowCommentsTab;
    showCommentsMessage = responseObject.ShowCommentsMessage;
    customRenderer = responseObject.CustomRenderer;
    rendererColor = responseObject.RendererColor;
    attachmentDisplayName = responseObject.AttachmentDisplayName;
    locatorSettings = responseObject.LocatorSettings;
    commentsInfoPopupFieldsCollection = responseObject.CommentsInfoPopupFieldsCollection;
    databaseFields = responseObject.DatabaseFields;
    geometryService = new esri.tasks.GeometryService(responseObject.GeometryService);

    // Set address search parameters
    dojo.byId("txtAddress").setAttribute("defaultAddress", responseObject.LocatorSettings.Locators[0].DefaultValue);
    dojo.byId('txtAddress').value = responseObject.LocatorSettings.Locators[0].DefaultValue;
    lastSearchString = dojo.byId("txtAddress").value.trim();
    dojo.byId("txtAddress").setAttribute("defaultAddressTitle", responseObject.LocatorSettings.Locators[0].DefaultValue);
    dojo.byId("txtAddress").style.color = "gray";
    dojo.byId("txtAddress").setAttribute("defaultCase", responseObject.LocatorSettings.Locators[1].DefaultValue);
    dojo.byId("txtAddress").setAttribute("defaultCaseTitle", responseObject.LocatorSettings.Locators[1].DefaultValue);
    dojo.connect(dojo.byId('txtAddress'), "ondblclick", ClearDefaultText);
    dojo.connect(dojo.byId('txtAddress'), "onfocus", function (evt) {
        this.style.color = "#FFF";
    });
    dojo.connect(dojo.byId('txtAddress'), "onblur", ReplaceDefaultText);

    dojo.connect(dojo.byId('imgHelp'), "onclick", function () {
        window.open(responseObject.HelpURL);
    });
    MapInitFunction();
    dojo.connect(map, "onExtentChange", function (evt) {
        map.infoWindow.hide();
        SetMapTipPosition();
        if (dojo.coords("divAppContainer").h > 0) {
            ShareLink(false);
        }
    });
}

//Function to create graphics and feature layer
function MapInitFunction() {
    if (dojo.query('.logo-med', dojo.byId('map')).length > 0) {
        dojo.query('.logo-med', dojo.byId('map'))[0].id = "esriLogo";
    }
    else if (dojo.query('.logo-sm', dojo.byId('map')).length > 0) {
        dojo.query('.logo-sm', dojo.byId('map'))[0].id = "esriLogo";
    }
    dojo.addClass("esriLogo", "esriLogo");
    dojo.byId('divSplashScreenContainer').style.display = "block";
    dojo.addClass(dojo.byId('divSplashScreenContent'), "divSplashScreenDialogContent");
    SetSplashScreenHeight();
    if (isMobileDevice) {
        SetAddressResultsHeight();
        SetCommentHeight();
        SetViewDetailsHeight();
        SetCmtControlsHeight();
    }
    dojo.byId("esriLogo").style.bottom = "10px";

    // Create graphics layer
    var glayer = new esri.layers.GraphicsLayer();
    glayer.id = tempGraphicsLayerId;
    map.addLayer(glayer);

    // Create feature layer
    var devPlanLayer = new esri.layers.FeatureLayer(isBrowser ? devPlanLayerURL.ServiceURL : devPlanMobileLayerURL.ServiceURL, {
        mode: esri.layers.FeatureLayer.MODE_SNAPSHOT,
        outFields: ["*"],
        id: devPlanLayerId,
        displayOnPan: false
    });

    var hearingDt = isBrowser ? devPlanLayerURL.HearingDate : devPlanMobileLayerURL.HearingDate
    var todayDate = new Date();
    var dateFrom = todayDate.getFullYear() + '/' + (todayDate.getMonth() + 1) + '/' + todayDate.getDate();
    devPlanLayer.setDefinitionExpression(hearingDt + " >= '" + dateFrom + "'");

    if (customRenderer) {
        var lineColor = new dojo.Color();
        lineColor.setColor(rendererColor);

        var fillColor = new dojo.Color();
        fillColor.setColor(rendererColor);
        fillColor.a = 0.75;

        var symbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID,
                    new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, lineColor, 3), fillColor);
        devPlanLayer.setRenderer(new esri.renderer.SimpleRenderer(symbol));
    }
    map.addLayer(devPlanLayer);

    var handle = dojo.connect(devPlanLayer, "onUpdateEnd", function () {
        var url = esri.urlToObject(window.location.toString());
        if (url.query && url.query != null) {
            if (url.query.extent.split("$featureID=").length > 0) {
                featureID = url.query.extent.split("$featureID=")[1];
            }
        }
        if (featureID != "" && featureID != null && featureID != undefined) {
            ExecuteQueryTask();
        }
        HideProgressIndicator();
        dojo.disconnect(handle);
    });
    dojo.connect(devPlanLayer, "onClick", function (evt) {
        map.infoWindow.hide();
        //Cancelling event propagation
        evt = (evt) ? evt : event;
        evt.cancelBubble = true;
        if (evt.stopPropagation) {
            evt.stopPropagation();
        }
        setTimeout(function () {
            ShowInfoWindowDetails(evt.mapPoint, evt.graphic.attributes, false);
        }, 700);
    });

    // Add comment feature layer
    var publicCommentsLayer = new esri.layers.FeatureLayer(publicCommentsLayerURL.ServiceURL, {
        mode: esri.layers.FeatureLayer.MODE_SELECTION,
        outFields: ["*"],
        id: publicCommentsLayerId,
        displayOnPan: false
    });
    map.addLayer(publicCommentsLayer);
    window.onresize = function () {
        if (isMobileDevice) {
            OrientationChanged();
        } else {
            ResizeHandler();
        }
    }
}
dojo.addOnLoad(init);