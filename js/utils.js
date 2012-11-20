/** @license
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
var tinyResponse; //variable for storing the response getting from tiny url api
var tinyUrl;

//Function for displaying Help window
function ShowHelp() {
    window.open(helpURL, "helpwindow");
    var helpbutton = dijit.byId('btnImgHelp');
    helpbutton.attr("checked", false);
}

//Function for creating a control and setting a tooltip for a control
function CreateControl(type, controlId, cssName) {
    var ele = document.createElement(type);
    ele.className = cssName;
    if (id != "") {
        ele.id = controlId;
    }
}

//Function to add graphic on the layer
function AddGraphic(layer, symbol, point, attr) {
    var graphic = new esri.Graphic(point, symbol, attr, null);
    var features = [];
    features.push(graphic);
    var featureSet = new esri.tasks.FeatureSet();
    featureSet.features = features;
    layer.add(featureSet.features[0]);
}

//Function for Clearing graphics on map
function ClearGraphics() {
    if (map.getLayer(tempGraphicLayer)) {
        map.getLayer(tempGraphicLayer).clear();
    }
}

//Function for toggling comments view
function ToggleCommentsView(viewStatus) {
    if (viewStatus) {
        dojo.byId('divAddComment').style.display = 'block';
        dojo.byId('divCommentInput').style.display = 'none';
        dojo.byId('divCommentData').style.display = 'none';
    }
    else {
        dojo.byId('divAddComment').style.display = 'none';
        dojo.byId('divCommentInput').style.display = 'block';
        dojo.byId('divCommentData').style.display = 'block';

    }
    ResetValues();
}

//Function for creating dynamic Tab Container in InfoPopup on Featurelayer click
function CreateContent() {
    var tabContainer = document.createElement('div');
    tabContainer.id = 'divTab';
    var tabPan = document.createElement('div');
    tabPan.id = 'divPan';

    var dtlTab = new dijit.layout.ContentPane({
        title: "<img src='images/info.png' width='30' height='30'/> Details",
        content: dojo.byId("divDetails")
    }, dojo.byId('divPan'));
    var attTab = new dijit.layout.ContentPane({
        title: "<img src='images/attach.png' width='30' height='30'/> Additional Info",
        content: dojo.byId("divAttachments")
    }, dojo.byId('divPan'));
    var cmntTab = new dijit.layout.ContentPane({
        title: "<img src='images/comments.png' width='30' height='30'/> Comments",
        content: dojo.byId("divComments")
    }, dojo.byId('divPan'));

    cmntTab.onShow = function () {
        if (dojo.byId('divCommentsScrollContainer')) {
            CreateScrollbar(dojo.byId('divCommentsScrollContainer'), dojo.byId('divCommentsScrollContent'));
        }
    }

    var tabs = new dijit.layout.TabContainer({
        style: "width: 440px; height: 270px;",
        tabPosition: "bottom"
    }, dojo.byId('divTab'));
    tabs.addChild(dtlTab);
    tabs.addChild(attTab);
    tabs.addChild(cmntTab);

    tabs.startup();

    return tabs;
}

//Function triggered for creating image
function CreateImage(imageSrc) {
    var imgLocate = document.createElement("img");
    imgLocate.style.width = '20px';
    imgLocate.style.height = '20px';
    imgLocate.style.cursor = 'pointer';
    imgLocate.src = imageSrc;
    imgLocate.title = 'Click Here';
    return imgLocate;
}

//Function triggered for animating address container
function AnimateAdvanceSearch() {
    var node = dojo.byId('divAddressContainer');
    if (node.style.display == "none") {
        WipeInControl(node, 0, 500);
    }
}

//Dojo function to animate address container
function WipeInControl(node, height, duration) {
    dojo.fx.wipeIn({
        node: node,
        duration: duration
    }).play();
}

//Dojo function to animate address container
function WipeOutControl(node, duration) {
    dojo.fx.wipeOut({
        node: node,
        duration: duration
    }).play();
}

//Function for refreshing address container div
function RemoveChildren(parentNode) {
    while (parentNode.hasChildNodes()) {
        parentNode.removeChild(parentNode.lastChild);
    }
}

//Function for displaying Standby text
function ShowLoadingMessage(loadingMessage) {
    dojo.byId('divLoadingIndicator').style.display = 'block';
    dojo.byId('loadingMessage').innerHTML = loadingMessage;
}

//Function for hiding Standby text
function HideLoadingMessage() {
    dojo.byId('divLoadingIndicator').style.display = 'none';
}

//Function triggered for getting attachments information from Featurelayer
function GetAttachmentInfo(files) {
    document.getElementById("divAttachmentsData").appendChild(Createfiledata(files));
}

//Function for retrieving files from FeatureLayer
function Createfiledata(files) {
    var fileTable = document.createElement("table");
    var fileTBody = document.createElement("tbody");
    fileTable.appendChild(fileTBody);

    for (var i = 0; i < files.length; i++) {
        fileTBody.appendChild(CreateData(files[i].name, files[i].url, files[i].size));
    }
    fileTable.appendChild(fileTBody);
    return fileTable;
}

//Function for creating data for the attachments
function CreateData(text, attachmentURL, fileSize) {
    var filetr = document.createElement("tr");
    var filetd = document.createElement("td");
    var filespan = document.createElement("span");
    filespan.style.cursor = 'pointer';

    var pdfSize = fileSize / (1024 * 1024);
    var pdfFileSize = Math.round(pdfSize * 100) / 100;

    var filesizetd = document.createElement("td");
    filesizetd.innerHTML = "(" + pdfFileSize + " MB)";
    filespan.innerHTML = text;
    filespan.onclick = function () {
        window.open(attachmentURL);
    }

    filetd.appendChild(filespan);
    filetr.appendChild(filetd);
    filetr.appendChild(filesizetd);

    return filetr;
}

//Function triggered when user mouse over's on featurelayer
function ShowMapTip(evt) {
    CloseMapTip();

    var date = new js.date();
    var utcMilliseconds = Number(evt.graphic.attributes[hearingDate]);

    var dialog = new dijit.TooltipDialog({
        id: "toolTipDialog",
        content: '<a style="font-size:11px; font-family:Verdana; font-weight: bolder;">Case Number</a>: ' + evt.graphic.attributes[caseID] + "<br/>" + '<a style="font-size:11px; font-family:Verdana; font-weight: bolder;">Case Name</a>: ' + evt.graphic.attributes[caseName] + "<br/>" + '<a style="font-size:11px; font-family:Verdana; font-weight: bolder;">Hearing Date</a>: ' + date.utcTimestampFromMs(utcMilliseconds).toDateString().substring(4),
        style: "position: absolute; z-index:1000;"
    });
    dialog.startup();
    dojo.style(dialog.domNode, "opacity", 0.80);
    dijit.placeOnScreen(dialog.domNode, { x: evt.pageX, y: evt.pageY }, ["BL", "BR"], { x: 5, y: 5 });
}

//Function for hiding alert dialog
function CloseMapTip() {
    if (dijit.byId('toolTipDialog')) {
        dijit.byId('toolTipDialog').destroy();
    }
}

//Function for sorting comments according to date
function SortResultFeatures(a, b) {
    var x = a.attributes[submitdate];
    var y = b.attributes[submitdate];
    return ((x > y) ? -1 : ((x < y) ? 1 : 0));
}

//Function for fetching comments from Commentslayer
function FetchComments() {
    ShowDojoLoading(dojo.byId("divComments"));
    var query = new esri.tasks.Query();
    //set query based on CASEID;
    query.where = "CASEID = '" + caseId + "'";
    query.outFields = ["*"];
    //execute query
    map.getLayer(commentLayerID).selectFeatures(query, esri.layers.FeatureLayer.SELECTION_NEW, function (features) {
        if (features.length > 0) {
            features.sort(SortResultFeatures);
            RemoveChildren(dojo.byId("divCommentData"));
            var commentsTable = document.createElement("table");
            commentsTable.style.width = "100%";
            var commentsTBody = document.createElement("tbody");
            for (var i = 0; i < features.length; i++) {
                var trComments = document.createElement("tr");
                var commentsCell = document.createElement("td");
                commentsCell.className = "bottomborder";
                commentsCell.title = features[i].attributes[comments];
                commentsCell.appendChild(document.createTextNode(features[i].attributes[comments].trimString(60)));
                trComments.appendChild(commentsCell);
                commentsTBody.appendChild(trComments);
            }
            commentsTable.appendChild(commentsTBody);

            var scrollbar_container = document.createElement('div');
            scrollbar_container.className = "comments_scrollbar_container";
            scrollbar_container.id = "divCommentsScrollContainer";

            var content = document.createElement("div");
            content.className = 'comments_scrollbar_content';
            content.id = "divCommentsScrollContent";

            content.appendChild(commentsTable);
            scrollbar_container.appendChild(content);

            dojo.byId("divCommentData").appendChild(scrollbar_container);
            CreateScrollbar(dojo.byId('divCommentsScrollContainer'), dojo.byId('divCommentsScrollContent'));

        }
        else {
            var defaultComment = document.createElement("span");
            defaultComment.innerHTML = defaultCmnt;
            defaultComment.className = "bottomborder";
            dojo.byId("divCommentData").appendChild(defaultComment);
        }
        HideDojoLoading();
    }, function (err) {
        HideDojoLoading();
        ShowDialog('Comments Error', messages.getElementsByTagName("unableToFetchComments")[0].childNodes[0].nodeValue + err.message);
    });
}

//Function to append ... for a string
String.prototype.trimString = function (len) {
    return (this.length > len) ? this.substring(0, len) + "..." : this;
}

//Function for displaying loading image in comments tab
function ShowDojoLoading(target) {
    dijit.byId('dojoStandBy').target = target;
    dijit.byId('dojoStandBy').show();
}

//Function for hiding loading image
function HideDojoLoading() {
    dijit.byId('dojoStandBy').hide();
}

//Function for displaying Alert messages
function ShowDialog(title, message) {
    dojo.byId('divMessage').innerHTML = message;
    var dialog = dijit.byId('dialogAlertMessage');
    dialog.titleNode.innerHTML = title;
    dialog.show();
    dojo.byId('divOKButton').focus();
}

//Function for hiding Alert messages
function CloseDialog() {
    dijit.byId('dialogAlertMessage').hide();
}

//Function for validating Email in comments tab
function CheckMailFormat(emailValue) {
    var pattern = /^([a-zA-Z][a-zA-Z0-9\_\-\.]*\@[a-zA-Z0-9\-]*\.[a-zA-Z]{2,4})?$/i
    if (pattern.test(emailValue)) {
        return true;
    } else {
        return false;
    }
}
//function to validate name
function IsName(name) {
    var namePattern = /^[A-Za-z\.\-\, ]{1,100}$/;
    if (namePattern.test(name)) {
        return true;
    } else {
        return false;
    }
}

//function to validate 10 digit number
function IsPhoneNumber(value) {
    var namePattern = /\d{10}/;
    if (namePattern.test(value)) {
        return true;
    } else {
        return false;
    }
}

function IsNumber(input) {
    return (input - 0) == input;
}
String.prototype.trim = function () {
    return this.replace(/^\s+|\s+$/g, '');
}

//Function triggered when user adds a new comment
function AddComment() {
    var errorSpan = document.getElementById('commentError');
    errorSpan.innerHTML = "";
    errorSpan.style.display = 'none';
    if (dijit.byId('txtName').value.trim().length > 0) {
        if (!IsName(dijit.byId('txtName').value.trim())) {
            dojo.byId('txtName').focus();
            errorSpan.innerHTML = messages.getElementsByTagName("nameError")[0].childNodes[0].nodeValue;
            errorSpan.style.display = 'block';
            return;
        }
    }

    if (dijit.byId('txtEmail').value.trim() == '' && dijit.byId('txtPhone').value.trim() == '') {
        errorSpan.innerHTML = messages.getElementsByTagName("emailError")[0].childNodes[0].nodeValue;
        errorSpan.style.display = 'block';
        return;
    }

    if (dijit.byId('txtCmntAddress').value.length > 100) {
        dojo.byId('txtCmntAddress').focus();
        errorSpan.innerHTML = messages.getElementsByTagName("addressError")[0].childNodes[0].nodeValue;
        errorSpan.style.display = 'block';
        return;
    }

    if (dijit.byId('txtPhone').value.trim() == '') {
        if (!CheckMailFormat(dijit.byId('txtEmail').value.trim())) {
            dijit.byId('txtEmail').focus();
            errorSpan.innerHTML = messages.getElementsByTagName("validEmail")[0].childNodes[0].nodeValue;
            errorSpan.style.display = 'block';
            return;
        }
    }

    else if (dijit.byId('txtEmail').value.trim() == '') {
        if (!IsPhoneNumber(dijit.byId('txtPhone').value.trim())) {
            dijit.byId('txtPhone').focus();
            errorSpan.innerHTML = messages.getElementsByTagName("validPhone")[0].childNodes[0].nodeValue;
            errorSpan.style.display = 'block';
            return;
        }

        if (dijit.byId('txtPhone').value.trim().length != 10) {
            dijit.byId('txtPhone').focus();
            errorSpan.innerHTML = messages.getElementsByTagName("validPhoneLength")[0].childNodes[0].nodeValue;
            errorSpan.style.display = 'block';
            return;
        }
    }

    if (dijit.byId('txtEmail').value.trim() != '') {
        if (!CheckMailFormat(dijit.byId('txtEmail').value.trim())) {
            dijit.byId('txtEmail').focus();
            errorSpan.innerHTML = messages.getElementsByTagName("validEmail")[0].childNodes[0].nodeValue;
            errorSpan.style.display = 'block';
            return;
        }
    }

    if (dijit.byId('txtPhone').value.trim() != '') {
        if (!IsPhoneNumber(dijit.byId('txtPhone').value.trim())) {
            dijit.byId('txtPhone').focus();
            errorSpan.innerHTML = messages.getElementsByTagName("validPhone")[0].childNodes[0].nodeValue;
            errorSpan.style.display = 'block';
            return;
        }

        if (dijit.byId('txtPhone').value.trim().length != 10) {
            dijit.byId('txtPhone').focus();
            errorSpan.innerHTML = messages.getElementsByTagName("validPhoneLength")[0].childNodes[0].nodeValue;
            errorSpan.style.display = 'block';
            return;
        }
    }

    var text = dojo.byId('txtComments').value.trim();
    if (text == "") {
        dojo.byId('txtComments').focus();
        errorSpan.innerHTML = messages.getElementsByTagName("enterComment")[0].childNodes[0].nodeValue;
        errorSpan.style.display = 'block';
        return;
    }

    if (text.length > 250) {
        dojo.byId('txtComments').focus();
        errorSpan.innerHTML = messages.getElementsByTagName("commentsLength")[0].childNodes[0].nodeValue;
        errorSpan.style.display = 'block';
        return;
    }

    else {
        ShowDojoLoading(dojo.byId("divComments"));
        var commentGraphic = new esri.Graphic();

        var date = new js.date();

        var attr =
         {
             "CASEID": caseId,
             "COMMENTS": text,
             "NAME": dojo.byId('txtName').value.trim(),
             "EMAIL": dojo.byId('txtEmail').value.trim(),
             "FULLADDR": dojo.byId('txtCmntAddress').value.trim(),
             "PHONE": dojo.byId('txtPhone').value.trim(),
             "SUBMITDT": date.utcMsFromTimestamp(date.localToUtc(date.localTimestampNow()))
         };
        commentGraphic.setAttributes(attr);
        map.getLayer(commentLayerID).applyEdits([commentGraphic], null, null, function (msg) {
            if (msg[0].error) {
                errorSpan.innerHTML = messages.getElementsByTagName("unableToComment")[0].childNodes[0].nodeValue;
                errorSpan.style.display = 'block';
            }
            else {
                FetchComments();
            }
            ToggleCommentsView(false);
            HideDojoLoading();
        }, function (err) {
            errorSpan.innerHTML = messages.getElementsByTagName("unableToComment")[0].childNodes[0].nodeValue;
            errorSpan.style.display = 'block';
            HideDojoLoading();
        });
        ResetValues();
    }
}

//Function for reset the values
function ResetValues() {
    dijit.byId('txtName').setValue('');
    dijit.byId('txtEmail').setValue('');
    dijit.byId('txtCmntAddress').setValue('');
    dijit.byId('txtPhone').setValue('');
    dojo.byId('txtComments').value = '';
    document.getElementById('commentError').innerHTML = "";
    document.getElementById('commentError').style.display = 'none';
}

//Function for positioning the address list
function PositionAddressList() {
    var coords = dojo.coords('txtAddress');
    var imgBaseMapCoords = dojo.coords('imgBaseMap');
    var screenCoords = dojo.coords('divMainContainer');
    //locating searchlist dynamically.
    var span = dojo.byId('divAddressContainer');
    dojo.style(span, {
        left: coords.x + "px",
        top: parseInt(coords.h) + parseInt(coords.y) + 3 + "px"
    });
}


//Function for toggling the image search according to case or address
function ToggleSearch(radioInput) {
    if (dojo.coords(dojo.byId('divAddressContainer')).h > 0) {
        WipeOutControl(dojo.byId('divAddressContainer'), 500);
    }

    if (radioInput.id == "rbAddress") {
        dojo.byId('spanAddress').className = 'text';
        dojo.byId('spanCaseName').className = 'disabledText';
        dojo.byId('txtAddress').title = 'Enter an address to locate';
        dojo.byId('txtAddress').setAttribute('placeholder', "");
        dojo.byId('txtAddress').value = defaultAddress;

    }
    else {
        dojo.byId('spanAddress').className = 'disabledText';
        dojo.byId('spanCaseName').className = 'text';
        dojo.byId('txtAddress').title = 'Enter a case name';
        dojo.byId('txtAddress').setAttribute('placeholder', "Enter a case name");
        dojo.byId("txtAddress").value = '';
    }
    searchAddress = dojo.byId("txtAddress").value;
}

//Function for toggling the text search according to case or address
function Toggle(radioInput) {
    if (dojo.coords(dojo.byId('divAddressContainer')).h > 0) {
        WipeOutControl(dojo.byId('divAddressContainer'), 500);
    }

    if (radioInput.id == "spanAddress") {
        dojo.byId('rbAddress').checked = true;
        dojo.byId('spanAddress').className = 'text';
        dojo.byId('spanCaseName').className = 'disabledText';
        dojo.byId('txtAddress').title = 'Enter an address to locate';
        dojo.byId('txtAddress').setAttribute('placeholder', "");
        dojo.byId('txtAddress').value = defaultAddress;

    }
    else {
        dojo.byId('rbCaseName').checked = true;
        dojo.byId('spanAddress').className = 'disabledText';
        dojo.byId('spanCaseName').className = 'text';
        dojo.byId('txtAddress').title = 'Enter a case name';
        dojo.byId('txtAddress').setAttribute('placeholder', "Enter a case name");
        dojo.byId("txtAddress").value = '';
    }
    searchAddress = dojo.byId("txtAddress").value;
}

//Function for displaying the current location
function ShowMyLocation(evt) {
    if (dojo.coords(dojo.byId('divBaseMapTitleContainer')).h > 0) {
        WipeOutControl(dojo.byId('divBaseMapTitleContainer'), 400);
    }
    if (dojo.coords(dojo.byId('divAddressContainer')).h > 0) {
        WipeOutControl(dojo.byId('divAddressContainer'), 500);
    }
    if (dojo.coords(dojo.byId('divAppContainer')).h > 0) {
        WipeOutControl(dojo.byId('divAppContainer'), 500);
    }

    dijit.byId('btnImgBaseMap').attr("checked", false);
    dijit.byId('btnImgApplink').attr("checked", false);
    dojo.byId('imgGPS').src = "images/bluegps.png";

    if (navigator.geolocation) {

        navigator.geolocation.getCurrentPosition(
		function (position) {
		    ShowLoadingMessage("Finding your current location...");
		    mapPoint = new esri.geometry.Point(position.coords.longitude, position.coords.latitude, new esri.SpatialReference({ wkid: 4326 }));
		    var graphicCollection = new esri.geometry.Multipoint(new esri.SpatialReference({ wkid: 4326 }));
		    graphicCollection.addPoint(mapPoint);
		    geometryService.project([graphicCollection], map.spatialReference, function (newPointCollection) {
		        HideLoadingMessage();

		        if (!map.getLayer(baseMapLayerCollection[0].Key).fullExtent.contains(newPointCollection[0].getPoint(0))) {
		            ShowDialog('Error', messages.getElementsByTagName("noDataAvlbl")[0].childNodes[0].nodeValue);
		            return;
		        }
		        mapPoint = newPointCollection[0].getPoint(0);
		        map.centerAt(mapPoint);
		        var gpsSymbol = new esri.symbol.PictureMarkerSymbol(defaultImg, 25, 25);
		        var graphic = new esri.Graphic(mapPoint, gpsSymbol, null, null);
		        map.getLayer(tempGraphicLayer).add(graphic);
		    });
		},
		function (error) {
		    if (dojo.byId('imgGPS').src = "images/bluegps.png") {
		        dojo.byId('imgGPS').src = "images/imggeolocation.png";
		        var gpsButton = dijit.byId('btnGeolocation');
		        gpsButton.attr("checked", false);
		    }
		    HideLoadingMessage();
		    switch (error.code) {
		        case error.TIMEOUT:
		            ShowDialog('Error', messages.getElementsByTagName("geolocationTimeout")[0].childNodes[0].nodeValue);
		            break;
		        case error.POSITION_UNAVAILABLE:
		            ShowDialog('Error', messages.getElementsByTagName("geolocationPositionUnavailable")[0].childNodes[0].nodeValue);
		            break;
		        case error.PERMISSION_DENIED:
		            ShowDialog('Error', messages.getElementsByTagName("geolocationPermissionDenied")[0].childNodes[0].nodeValue);
		            break;
		        case error.UNKNOWN_ERROR:
		            ShowDialog('Error', messages.getElementsByTagName("geolocationUnKnownError")[0].childNodes[0].nodeValue);
		            break;
		    }
		}, { timeout: 10000 });
    }
    else {
        ShowDialog('Error', messages.getElementsByTagName("noBrowserSupport")[0].childNodes[0].nodeValue);
        return;
    }
}

//Function to switch to facebook,twitter,email
function ToggleApplication() {
    dojo.byId('imgGPS').src = "images/imggeolocation.png";
    var gpsButton = dijit.byId('btnGeolocation');
    gpsButton.attr("checked", false);

    if (dojo.byId('divAddressContainer').children.length != 0) {
        WipeOutControl(dojo.byId('divAddressContainer'), 500);
        setTimeout(function () { RemoveChildren(dojo.byId('divAddressContainer')); }, 500);
    }
    else {
        dojo.byId('divAddressContainer').style.display = 'none';
    }
    var bmapNode = dojo.byId('divBaseMapTitleContainer');
    if (dojo.coords(bmapNode).h > 0) {
        HideBaseMapWidget();
    }

    var node = dojo.byId('divAppContainer');

    if (node.style.display == 'none') {

        WipeInControl(node, node.style.height, 500);
    }
    else {
        var imgApplinkButton = dijit.byId('btnImgApplink');
        imgApplinkButton.attr("checked", false);
        WipeOutControl(node, 500);
    }
}

//Function to open login page for facebook,tweet,email
function ShareLink(site) {
    tinyUrl = null;
    mapExtent = GetMapExtent();
    var url = esri.urlToObject(String(window.location));
    var urlStr = encodeURI(url.path) + "?extent=" + mapExtent;
    url = dojo.string.substitute(mapSharingOptions.TinyURLServiceURL, [urlStr]);

    dojo.io.script.get({
        url: url,
        callbackParamName: "callback",
        load: function (data) {
            tinyResponse = data;
            tinyUrl = data;
            var attr = mapSharingOptions.TinyURLResponseAttribute.split(".");
            for (var x = 0; x < attr.length; x++) {
                tinyUrl = tinyUrl[attr[x]];
            }

            switch (site) {
                case "facebook":
                    window.open(dojo.string.substitute(mapSharingOptions.FacebookShareURL, [tinyUrl]));
                    break;
                case "twitter":
                    window.open(dojo.string.substitute(mapSharingOptions.TwitterShareURL, [tinyUrl]));
                    break;
                case "mail":
                    parent.location = dojo.string.substitute(mapSharingOptions.MailShare, [tinyUrl]);
                    break;
            }
        },
        error: function (error) {
            ShowDialog('Error', messages.getElementsByTagName("tinyURLEngine")[0].childNodes[0].nodeValue);
        }
    });
    setTimeout(function () {
        if (!tinyResponse) {
            ShowDialog('Error', messages.getElementsByTagName("tinyURLEngine")[0].childNodes[0].nodeValue);
            return;
        }
    }, 6000);
}

//Function to get map Extent
function GetMapExtent() {
    var extents = map.extent.xmin.toString() + ",";
    extents += map.extent.ymin.toString() + ",";
    extents += map.extent.xmax.toString() + ",";
    extents += map.extent.ymax.toString();
    return (extents);
}

//Function to get the query string value of the provided key if not found the function returns empty string
function GetQuerystring(key) {
    var _default;
    if (_default == null) _default = "";
    key = key.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regex = new RegExp("[\\?&]" + key + "=([^&#]*)");
    var qs = regex.exec(window.location.href);
    if (qs == null)
        return _default;
    else
        return qs[1];
}

//mouse handler for hiding component on it mouse out.
var customMouseHandler =
{
    evtHash: [],

    ieGetUniqueID: function (_elem) {
        if (_elem === window) { return 'theWindow'; }
        else if (_elem === document) { return 'theDocument'; }
        else { return _elem.uniqueID; }
    },

    addEvent: function (_elem, _evtName, _fn, _useCapture) {
        if (typeof _elem.addEventListener != 'undefined') {
            if (_evtName == 'mouseenter')
            { _elem.addEventListener('mouseover', customMouseHandler.mouseEnter(_fn), _useCapture); }
            else if (_evtName == 'mouseleave')
            { _elem.addEventListener('mouseout', customMouseHandler.mouseEnter(_fn), _useCapture); }
            else
            { _elem.addEventListener(_evtName, _fn, _useCapture); }
        }
        else if (typeof _elem.attachEvent != 'undefined') {
            var key = '{FNKEY::obj_' + customMouseHandler.ieGetUniqueID(_elem) + '::evt_' + _evtName + '::fn_' + _fn + '}';
            var f = customMouseHandler.evtHash[key];
            if (typeof f != 'undefined')
            { return; }

            f = function () {
                _fn.call(_elem);
            };

            customMouseHandler.evtHash[key] = f;
            _elem.attachEvent('on' + _evtName, f);

            // attach unload event to the window to clean up possibly IE memory leaks
            window.attachEvent('onunload', function () {
                _elem.detachEvent('on' + _evtName, f);
            });

            key = null;
            //f = null;   /* DON'T null this out, or we won't be able to detach it */
        }
        else
        { _elem['on' + _evtName] = _fn; }
    },

    removeEvent: function (_elem, _evtName, _fn, _useCapture) {
        if (typeof _elem.removeEventListener != 'undefined')
        { _elem.removeEventListener(_evtName, _fn, _useCapture); }
        else if (typeof _elem.detachEvent != 'undefined') {
            var key = '{FNKEY::obj_' + customMouseHandler.ieGetUniqueID(_elem) + '::evt' + _evtName + '::fn_' + _fn + '}';
            var f = customMouseHandler.evtHash[key];
            if (typeof f != 'undefined') {
                _elem.detachEvent('on' + _evtName, f);
                delete customMouseHandler.evtHash[key];
            }

            key = null;
            //f = null;   /* DON'T null this out, or we won't be able to detach it */
        }
    },

    mouseEnter: function (_pFn) {
        return function (_evt) {
            var relTarget = _evt.relatedTarget;
            if (this == relTarget || customMouseHandler.isAChildOf(this, relTarget))
            { return; }

            _pFn.call(this, _evt);
        }
    },

    isAChildOf: function (_parent, _child) {
        if (_parent == _child) { return false };

        while (_child && _child != _parent)
        { _child = _child.parentNode; }

        return _child == _parent;
    }
};


//Creating dynamic scrollbar within container for target content
function CreateScrollbar(container, content) {
    var yMax;
    var pxLeft, pxTop, xCoord, yCoord;
    var scrollbar_track;
    var isHandleClicked = false;
    this.container = container;
    this.content = content;

    if (dojo.byId(container.id + 'scrollbar_track')) {
        RemoveChildren(dojo.byId(container.id + 'scrollbar_track'));
        container.removeChild(dojo.byId(container.id + 'scrollbar_track'));
    }
    if (!dojo.byId(container.id + 'scrollbar_track')) {
        scrollbar_track = document.createElement('div');
        scrollbar_track.id = container.id + "scrollbar_track";
        scrollbar_track.className = "scrollbar_track";
    }
    else {
        scrollbar_track = dojo.byId(container.id + 'scrollbar_track');
    }

    var containerHeight = dojo.coords(container);
    scrollbar_track.style.height = containerHeight.h + "px";
    if (container.id == 'divCommentsScrollContainer')
        scrollbar_track.style.top = containerHeight.t + 'px';
    else
        scrollbar_track.style.top = containerHeight.t + 'px';
    scrollbar_track.style.right = containerHeight.l + 'px';

    var scrollbar_handle = document.createElement('div');
    scrollbar_handle.className = 'scrollbar_handle';
    scrollbar_handle.id = container.id + "scrollbar_handle";

    scrollbar_track.appendChild(scrollbar_handle);
    container.appendChild(scrollbar_track);

    if (content.scrollHeight <= content.offsetHeight) {
        scrollbar_handle.style.display = 'none';
        scrollbar_track.style.display = 'none';
        return;
    }
    else {
        scrollbar_handle.style.display = 'block';
        scrollbar_track.style.display = 'block';
        scrollbar_handle.style.height = Math.max(this.content.offsetHeight * (this.content.offsetHeight / this.content.scrollHeight), 25) + 'px';
        yMax = this.content.offsetHeight - scrollbar_handle.offsetHeight;

        if (window.addEventListener) {
            content.addEventListener('DOMMouseScroll', ScrollDiv, false);
        }

        content.onmousewheel = function (evt) {
            console.log(content.id);
            ScrollDiv(evt);
        }
    }

    function ScrollDiv(evt) {
        var evt = window.event || evt //equalize event object
        var delta = evt.detail ? evt.detail * (-120) : evt.wheelDelta //delta returns +120 when wheel is scrolled up, -120 when scrolled down
        pxTop = scrollbar_handle.offsetTop;

        if (delta <= -120) {
            var y = pxTop + 10;
            if (y > yMax) y = yMax // Limit vertical movement
            if (y < 0) y = 0 // Limit vertical movement
            scrollbar_handle.style.top = y + "px";
            content.scrollTop = Math.round(scrollbar_handle.offsetTop / yMax * (content.scrollHeight - content.offsetHeight));
        }
        else {
            var y = pxTop - 10;
            if (y > yMax) y = yMax // Limit vertical movement
            if (y < 0) y = 0 // Limit vertical movement
            scrollbar_handle.style.top = y + "px";
            content.scrollTop = Math.round(scrollbar_handle.offsetTop / yMax * (content.scrollHeight - content.offsetHeight));
        }
    }

    //Attaching events to scrollbar components
    scrollbar_track.onclick = function (evt) {
        if (!isHandleClicked) {
            evt = (evt) ? evt : event;
            pxTop = scrollbar_handle.offsetTop // Sliders vertical position at start of slide.
            var offsetY;
            if (!evt.offsetY) {
                var coords = dojo.coords(evt.target);
                offsetY = evt.layerY - coords.t;
            }
            else
                offsetY = evt.offsetY;
            if (offsetY < scrollbar_handle.offsetTop) {
                scrollbar_handle.style.top = offsetY + "px";
                content.scrollTop = Math.round(scrollbar_handle.offsetTop / yMax * (content.scrollHeight - content.offsetHeight));
            }
            else if (offsetY > (scrollbar_handle.offsetTop + scrollbar_handle.clientHeight)) {
                var y = offsetY - scrollbar_handle.clientHeight;
                if (y > yMax) y = yMax // Limit vertical movement
                if (y < 0) y = 0 // Limit vertical movement
                scrollbar_handle.style.top = y + "px";
                content.scrollTop = Math.round(scrollbar_handle.offsetTop / yMax * (content.scrollHeight - content.offsetHeight));
            }
            else {
                return;
            }
        }
        isHandleClicked = false;
    };

    //Attaching events to scrollbar components
    scrollbar_handle.onmousedown = function (evt) {
        isHandleClicked = true;
        evt = (evt) ? evt : event;
        evt.cancelBubble = true;
        if (evt.stopPropagation) evt.stopPropagation();
        pxTop = scrollbar_handle.offsetTop // Sliders vertical position at start of slide.
        yCoord = evt.screenY // Vertical mouse position at start of slide.
        document.body.style.MozUserSelect = 'none';
        document.body.style.userSelect = 'none';
        document.onselectstart = function () {
            return false;
        }
        document.onmousemove = function (evt) {
            console.log("inside mousemove");
            evt = (evt) ? evt : event;
            evt.cancelBubble = true;
            if (evt.stopPropagation) evt.stopPropagation();
            var y = pxTop + evt.screenY - yCoord;
            if (y > yMax) y = yMax // Limit vertical movement
            if (y < 0) y = 0 // Limit vertical movement
            scrollbar_handle.style.top = y + "px";
            content.scrollTop = Math.round(scrollbar_handle.offsetTop / yMax * (content.scrollHeight - content.offsetHeight));
        }
    };

    document.onmouseup = function () {
        document.body.onselectstart = null;
        document.onmousemove = null;
    };

    scrollbar_handle.onmouseout = function (evt) {
        document.body.onselectstart = null;
    };
}

