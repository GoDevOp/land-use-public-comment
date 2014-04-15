/*global */
/*jslint browser:true,sloppy:true,nomen:true,unparam:true,plusplus:true */
/*
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
var orientationChange = false; //variable for setting the flag on orientation
var tinyResponse; //variable for storing the response getting from tiny URL api
var tinyUrl; //variable for storing the tiny URL
var isContainerVisible = true; //variable for setting the flag on address container

//Display land use case details in infowindow
function ShowInfoWindowDetails(mapPoint, attributes, share) {
    featureID = attributes[map.getLayer(devPlanLayerId).objectIdField];
    dojo.byId("divInfoDetails").style.position = "relative";
    map.infoWindow.hide();
    if (showCommentsTab) {
        dojo.byId("imgComments").style.display = "block";
    }
    if (!isMobileDevice) {
        dojo.byId('divInfoContent').style.display = "none";
        dojo.byId('divInfoContent').style.width = infoPopupWidth + "px";
        dojo.byId('divInfoContent').style.height = infoPopupHeight + "px";
    }
    for (var i in attributes) {
        if (attributes.hasOwnProperty(i)) {
            if (!attributes[i]) {
                attributes[i] = "";
            }
        }
    }
    map.getLayer(tempGraphicsLayerId).clear();
    //Set info window size based on devices or desktop browsers
    (isMobileDevice) ? map.infoWindow.resize(225, 60) : map.infoWindow.resize(infoPopupWidth, infoPopupHeight);
    if (!share) {
        if (!isMobileDevice) {
            map.setExtent(GetBrowserMapExtent(mapPoint));
        }
        else {
            map.setExtent(GetMobileMapExtent(mapPoint));
        }
    }
    setTimeout(function () {
        selectedMapPoint = mapPoint;
        var screenPoint = map.toScreen(selectedMapPoint);
        screenPoint.y = map.height - screenPoint.y;
        map.infoWindow.show(screenPoint);
        if (isMobileDevice) {
            var header;
            if (dojo.string.substitute(infoWindowHeader, attributes)) {
                header = dojo.string.substitute(infoWindowHeader, attributes).trimString(Math.round(225 / 14));
            }
            else {
                header = dojo.string.substitute(infoWindowHeader, attributes);
            }
            map.infoWindow.setTitle(header);
            dojo.connect(map.infoWindow.imgDetailsInstance(), "onclick", function () {
                if (isMobileDevice) {
                    selectedMapPoint = null;
                    featureID = null;
                    map.infoWindow.hide();
                    ShowInfoRequestContainer();
                }
                dojo.byId('divInfoContent').style.display = "block";
                PopulateInfoDetails(attributes);
            });
            var cont;
            if (dojo.string.substitute(infoWindowContent, attributes).trimString) {
                cont = dojo.string.substitute(infoWindowContent, attributes).trimString(Math.round(225 / 12));
            }
            else {
                cont = dojo.string.substitute(infoWindowContent, attributes);
            }
            map.infoWindow.setContent(cont);
        }
        else {
            PopulateInfoDetails(attributes);
        }
    }, 500);
}

//Populate land use case details
function PopulateInfoDetails(attributes) {
    ShowInfoCommentsView();
    if (!isMobileDevice) {
        dojo.byId('divInfoContent').style.display = "block";
        dojo.byId("divInfoDetails").style.display = "block";
    }
    RemoveChildren(dojo.byId('tblInfoDetails'));
    RemoveChildren(dojo.byId('divCommentsContent'));
    if (isBrowser) {
        value = dojo.string.substitute(infoWindowHeader, attributes).trim();
        value = value.trimString(Math.round(infoPopupWidth / 6));

        if (value.length > Math.round(infoPopupWidth / 6)) {
            dojo.byId('tdInfoHeader').title = dojo.string.substitute(infoWindowHeader, attributes);
        }
    }
    else {
        value = dojo.string.substitute(infoWindowHeader, attributes).trim();
        value = value.trimString(Math.round(infoPopupWidth / 10));
    }
    dojo.byId('tdInfoHeader').innerHTML = value;
    var tblInfoDetails = dojo.byId('tblInfoDetails');
    var tbody = document.createElement("tbody");
    tblInfoDetails.appendChild(tbody);
    var date = new js.date();

    for (var i in map.getLayer(devPlanLayerId).fields) {
        if (map.getLayer(devPlanLayerId).fields.hasOwnProperty(i)) {
            if (!attributes[map.getLayer(devPlanLayerId).fields[i].name]) {
                attributes[map.getLayer(devPlanLayerId).fields[i].name] = "-";
                continue;
            }
            if (map.getLayer(devPlanLayerId).fields[i].type == "esriFieldTypeDate") {
                if (attributes[map.getLayer(devPlanLayerId).fields[i].name]) {
                    if (Number(attributes[map.getLayer(devPlanLayerId).fields[i].name])) {
                        var date = new js.date();
                        var utcMilliseconds = Number(attributes[map.getLayer(devPlanLayerId).fields[i].name]);
                        attributes[map.getLayer(devPlanLayerId).fields[i].name] = dojo.date.locale.format(date.utcTimestampFromMs(utcMilliseconds), { datePattern: formatDateAs, selector: "date" });
                    }
                }
            }
        }
    }

    for (var index in infoWindowData) {
        if (infoWindowData.hasOwnProperty(index)) {
            var tr = document.createElement("tr");
            tbody.appendChild(tr);
            CreateTableRow(tr, infoWindowData[index].DisplayText, dojo.string.substitute(infoWindowData[index].AttributeValue, attributes));
        }
    }

    if (showCommentsTab) {
        FetchRequestComments(dojo.string.substitute((isBrowser ? devPlanLayerURL.PrimaryKeyForCase : devPlanMobileLayerURL.PrimaryKeyForCase), attributes));
    }
    else {
        selectedRequestID = dojo.string.substitute((isBrowser ? devPlanLayerURL.PrimaryKeyForCase : devPlanMobileLayerURL.PrimaryKeyForCase), attributes);
    }
    FetchAttachmentDetails(attributes[map.getLayer(devPlanLayerId).objectIdField], tbody);
    SetViewDetailsHeight();
}

//Create row in a table
function CreateTableRow(tr, displayName, value) {
    var td = document.createElement("td");
    td.innerHTML = displayName;
    td.style.height = "18px";
    td.style.width = "120px";
    td.vAlign = "top";
    td.style.paddingTop = "5px";
    var td1 = document.createElement("td");
    td1.style.width = "180px";
    td1.style.paddingTop = "5px";
    td1.style.verticalAlign = "top";
    td1.innerHTML = value;
    tr.appendChild(td);
    tr.appendChild(td1);
}

//Set height for view details in info window
function SetViewDetailsHeight() {
    var height = (isMobileDevice) ? (dojo.window.getBox().h) : dojo.coords(dojo.byId('divInfoContent')).h;
    if (height > 0) {
        dojo.byId('divInfoDetailsScroll').style.height = (height - ((!isTablet) ? 55 : 55)) + "px";
    }
    CreateScrollbar(dojo.byId("divInfoDetails"), dojo.byId("divInfoDetailsScroll"));
}

//Display request container for mobile
function ShowInfoRequestContainer() {
    dojo.byId('divInfoContainer').style.display = "block";
    dojo.byId("divInfoDetails").style.display = "block";
    dojo.replaceClass("divInfoContent", "showContainer", "hideContainer");
}

//Hide info window
function HideInfoContainer() {
    selectedMapPoint = null;
    featureID = null;
    if (isMobileDevice) {
        setTimeout(function () {
            dojo.byId('divInfoContainer').style.display = "none";
            dojo.replaceClass("divInfoContent", "hideContainer", "showContainer");
        }, 500);
    }
    else {
        map.infoWindow.hide();
        dojo.byId('divInfoContent').style.display = "none";
        dojo.byId("divInfoDetails").style.display = "none";
    }
}

//Fetch attachment details
function FetchAttachmentDetails(objectID, tbody) {
    map.getLayer(devPlanLayerId).queryAttachmentInfos(objectID, function (files) {
        if (files.length == 0) {
            var tdAttachments = CreateAttachmentList(tbody);
            tdAttachments.innerHTML = messages.getElementsByTagName("noAttachment")[0].childNodes[0].nodeValue;
        }
        else {
            for (var a = 0; a < files.length; a++) {
                var tdAttachments = CreateAttachmentList(a, tbody);
                if (files[a].contentType.indexOf("image") >= 0) {
                    var filePreview = dojo.create("img");
                    filePreview.style.height = "130px";
                    filePreview.style.width = "130px";
                    filePreview.style.cursor = "pointer";
                    filePreview.src = files[a].url;
                    filePreview.onclick = function () {
                        window.open(this.src);
                    }
                    tdAttachments.appendChild(filePreview);
                }
                else {
                    var filespan = document.createElement("span");
                    filespan.innerHTML = files[a].name;
                    filespan.className = 'spanFileDetails';
                    filespan.setAttribute("attachedLink", files[a].url);
                    tdAttachments.appendChild(filespan);
                    filespan.onclick = function () {
                        window.open(this.getAttribute("attachedLink"));
                    }
                }
            }
        }
        setTimeout(function () {
            CreateScrollbar(dojo.byId("divInfoDetails"), dojo.byId("divInfoDetailsScroll"));
        }, 1000);
    });
}

//Create attachment list
function CreateAttachmentList(order, tbody) {
    var tr = document.createElement("tr");
    tbody.appendChild(tr);
    tr.vAlign = "top";
    var tdTitle = document.createElement("td");
    tdTitle.innerHTML = attachmentDisplayName + " " + (order + 1) + ": ";
    tdTitle.style.paddingTop = "5px";
    tr.appendChild(tdTitle);
    var tdAttachments = document.createElement("td");
    tdAttachments.style.paddingTop = "5px";
    tr.appendChild(tdAttachments);
    return tdAttachments;
}

//Fetch comments for a land use case
function FetchRequestComments(requestID) {
    dojo.byId('btnAddComments').disabled = false;
    selectedRequestID = requestID;
    var query = new esri.tasks.Query();

    var relationshipId;
    publicCommentsLayerURL.PrimaryKeyForComments.replace(/\$\{([^\s\:\}]+)(?:\:([^\s\:\}]+))?\}/g, function (match, key) {
        relationshipId = key;
    });

    query.where = relationshipId + "= '" + requestID + "'";
    query.outFields = ["*"];
    //execute query
    map.getLayer(publicCommentsLayerId).selectFeatures(query, esri.layers.FeatureLayer.SELECTION_NEW, function (features) {
        RemoveChildren(dojo.byId("divCommentsContent"));
        var commentsTable = document.createElement("table");
        commentsTable.style.width = "95%";
        var commentsTBody = document.createElement("tbody");
        commentsTable.appendChild(commentsTBody);
        dojo.byId("divCommentsContent").appendChild(commentsTable);
        if (features.length > 0) {
            features.sort(SortResultFeatures);      //Sort comments based on submitted date
            for (var i = 0; i < features.length; i++) {
                var trComments = document.createElement("tr");
                var commentsCell = document.createElement("td");
                commentsCell.className = "bottomborder";
                commentsCell.appendChild(CreateCommentRecord(features[i].attributes, i));
                trComments.appendChild(commentsCell);
                commentsTBody.appendChild(trComments);
            }
            SetCommentHeight();
        }
        else {
            var trComments = document.createElement("tr");
            var commentsCell = document.createElement("td");
            commentsCell.appendChild(document.createTextNode(defaultCmnt));
            trComments.setAttribute("noComments", "true");
            trComments.appendChild(commentsCell);
            commentsTBody.appendChild(trComments);
        }
    }, function (err) {
    });
}

//Display comments container in infowindow
function ShowCommentsView() {
    if (dojo.isIE) {
        dojo.byId('txtComments').value = " ";
    }
    dojo.byId("imgComments").style.display = "none";
    dojo.byId('imgDirections').src = "images/Details.png";
    dojo.byId('imgDirections').title = "Details";
    dojo.byId('imgDirections').setAttribute("disp", "Details");
    dojo.byId("imgDirections").style.display = "block";
    ResetCommentValues();
    dojo.byId('divInfoComments').style.display = "block";
    dojo.byId('divInfoDetails').style.display = "none";
    SetCommentHeight();
}

//Validate 10 digit number
function IsPhoneNumber(value) {
    var namePattern = /\d{10}/;
    if (namePattern.test(value)) {
        return true;
    } else {
        return false;
    }
}

//Validate name
function IsName(name) {
    var namePattern = /^[A-Za-z\.\- ]{1,150}$/;
    if (namePattern.test(name)) {
        return true;
    } else {
        return false;
    }
}

//Add comment
function AddPublicComment() {
    var commentsValue = dojo.byId('txtComments').value.trim('');
    if (dojo.byId('txtName').value == "") {
        ShowSpanErrorMessage("spanCommentError", messages.getElementsByTagName("nameRequired")[0].childNodes[0].nodeValue);
        return;
    }
    if (dojo.byId('txtName').value.length > 100) {
        ShowSpanErrorMessage('spanCommentError', messages.getElementsByTagName("nameLength")[0].childNodes[0].nodeValue);
        return;
    }

    if (dojo.byId('txtName').value.length > 0) {
        if (!IsName(dojo.byId('txtName').value.trim())) {
            dojo.byId('txtName').focus();
            ShowSpanErrorMessage("spanCommentError", messages.getElementsByTagName("nameProvisions")[0].childNodes[0].nodeValue);
            return false;
        }
    }

    if ((dojo.byId('txtPhone').value == "") && (dojo.byId('txtMail').value == "")) {
        ShowSpanErrorMessage("spanCommentError", messages.getElementsByTagName("mandatoryFields")[0].childNodes[0].nodeValue);
        return;
    }
    if (dojo.byId('txtPhone').value == '') {
        if (!CheckMailFormat(dojo.byId('txtMail').value)) {
            dojo.byId('txtMail').focus();
            ShowSpanErrorMessage("spanCommentError", messages.getElementsByTagName("enterValidEmailId")[0].childNodes[0].nodeValue);
            return false;
        }
    } else if (dojo.byId('txtMail').value == '') {
        if (!IsPhoneNumber(dojo.byId('txtPhone').value.trim())) {
            dojo.byId('txtPhone').focus();
            ShowSpanErrorMessage("spanCommentError", messages.getElementsByTagName("enterValidPhone")[0].childNodes[0].nodeValue);
            return false;
        }
        if (dojo.byId('txtPhone').value.length < 10 || dojo.byId('txtPhone').value.length > 10) {
            dojo.byId('txtPhone').focus();
            ShowSpanErrorMessage("spanCommentError", messages.getElementsByTagName("enterValidPhone")[0].childNodes[0].nodeValue);
            return false;
        }
    }
    if (dojo.byId('txtPhone').value.length > 0) {
        if (!IsPhoneNumber(dojo.byId('txtPhone').value.trim())) {
            dojo.byId('txtPhone').focus();
            ShowSpanErrorMessage("spanCommentError", messages.getElementsByTagName("enterValidPhone")[0].childNodes[0].nodeValue);
            return false;
        }
    }
    if (dojo.byId('txtPhone').value.length > 10) {
        dojo.byId('txtPhone').focus();
        ShowSpanErrorMessage("spanCommentError", messages.getElementsByTagName("enterValidPhone")[0].childNodes[0].nodeValue);
        return false;
    }
    if (dojo.byId('txtMail').value.length > 0) {
        if (!CheckMailFormat(dojo.byId('txtMail').value)) {
            dojo.byId('txtMail').focus();
            ShowSpanErrorMessage("spanCommentError", messages.getElementsByTagName("enterValidEmailId")[0].childNodes[0].nodeValue);
            return false;
        }
        if (dojo.byId('txtMail').value.length > 50) {
            dojo.byId('txtMail').focus();
            ShowSpanErrorMessage("spanCommentError", messages.getElementsByTagName("emailIdLength")[0].childNodes[0].nodeValue);
            return false;
        }
        if (dojo.byId('txtPhone').value.length > 10) {
            dojo.byId('txtPhone').focus();
            ShowSpanErrorMessage("spanCommentError", messages.getElementsByTagName("enterValidPhone")[0].childNodes[0].nodeValue);
            return false;
        }
    }
    if (dojo.byId('txtAdd').value.length > 100) {
        ShowSpanErrorMessage('spanCommentError', messages.getElementsByTagName("addressLength")[0].childNodes[0].nodeValue);
        return;
    }
    if (commentsValue == "") {
        ShowSpanErrorMessage('spanCommentError', messages.getElementsByTagName("enterComment")[0].childNodes[0].nodeValue);
        return;
    }
    if (dojo.byId('txtComments').value.length > 250) {
        ShowSpanErrorMessage('spanCommentError', messages.getElementsByTagName("commentsLength")[0].childNodes[0].nodeValue);
        return;
    }

    ShowProgressIndicator();
    var commentGraphic = new esri.Graphic();
    var date = new js.date();

    var attr = {};
    attr[databaseFields.CaseIdFieldName] = selectedRequestID;
    attr[databaseFields.CommentsFieldName] = commentsValue;
    attr[commentsInfoPopupFieldsCollection.PhoneNumber] = dojo.byId('txtPhone').value.trim('');
    attr[commentsInfoPopupFieldsCollection.Email] = dojo.byId('txtMail').value.trim('');
    attr[commentsInfoPopupFieldsCollection.Name] = dojo.byId('txtName').value.trim('');
    attr[commentsInfoPopupFieldsCollection.FullAddress] = dojo.byId('txtAdd').value.trim('');

    attr[databaseFields.DateFieldName] = date.utcMsFromTimestamp(date.localToUtc(date.localTimestampNow()));
    commentGraphic.setAttributes(attr);

    dojo.byId('btnAddComments').disabled = true;
    map.getLayer(publicCommentsLayerId).applyEdits([commentGraphic], null, null, function (msg) {
        if (msg[0].error) {
        }
        else {
            if (showCommentsTab) {
                var table = dojo.query('table', dojo.byId("divCommentsContent"));
                if (table.length > 0) {
                    var x = dojo.query("tr[noComments = 'true']", table[0]);
                    if (x.length > 0) {
                        RemoveChildren(table[0]);
                    }
                    var tr = table[0].insertRow(0);
                    var commentsCell = document.createElement("td");
                    commentsCell.className = "bottomborder";
                    var index = dojo.query("tr", table[0]).length;
                    if (index) {
                        index = 0;
                    }
                    commentsCell.appendChild(CreateCommentRecord(attr, index));
                    tr.appendChild(commentsCell);
                }
            }
        }
        dojo.byId('btnAddComments').disabled = false;
        ResetCommentValues();
        HideProgressIndicator();
        SetCommentHeight();
        if (!showCommentsTab) {
            dojo.byId("divCommentsContent").innerHTML = showCommentsMessage;
        }
    }, function (err) {
        dojo.byId('btnAddComments').disabled = false;
        HideProgressIndicator();
    });
}

//Create comment record
function CreateCommentRecord(attributes, i) {
    var table = document.createElement("table");
    table.style.width = "100%";
    var tbody = document.createElement("tbody");
    var trDate = document.createElement("tr");
    tbody.appendChild(trDate);
    var td1 = document.createElement("td");
    var date = new js.date();
    td1.align = "left";
    td1.colSpan = 2;

    try {
        if (!dojo.string.substitute(commentsInfoPopupFieldsCollection.Submitdate, attributes)) {
            dojo.string.substitute(commentsInfoPopupFieldsCollection.Submitdate, attributes) = showNullValueAs;
            td1.innerHTML = "Date: " + showNullValueAs;
        } else {
            var utcMilliseconds = Number(dojo.string.substitute(commentsInfoPopupFieldsCollection.Submitdate, attributes));
            td1.innerHTML = "Date: " + dojo.date.locale.format(date.utcToLocal(date.utcTimestampFromMs(utcMilliseconds)), {
                datePattern: formatDateAs,
                selector: "date"
            });
        }
    }
    catch (err) {
        td1.innerHTML = "Date: " + showNullValueAs;
    }


    trDate.appendChild(td1);
    var tr1 = document.createElement("tr");
    var td2 = document.createElement("td");
    td2.colSpan = 2;
    td2.id = "tdComment";
    if (isMobileDevice) {
        td2.style.width = "100%";
    }
    else {
        td2.style.width = (infoPopupWidth - 40) + "px";
    }
    td2.colSpan = 2;

    if (dojo.string.substitute(commentsInfoPopupFieldsCollection.Comments, attributes)) {
        var wordCount = dojo.string.substitute(commentsInfoPopupFieldsCollection.Comments, attributes).split(/\n/).length;
        if (wordCount > 1) {
            var value = dojo.string.substitute(commentsInfoPopupFieldsCollection.Comments, attributes).split(/\n/)[0].length == 0 ? "<br>" : dojo.string.substitute(commentsInfoPopupFieldsCollection.Comments, attributes).split(/\n/)[0].trim();
            for (var c = 1; c < wordCount; c++) {
                var comment;
                if (value != "<br>") {
                    comment = dojo.string.substitute(commentsInfoPopupFieldsCollection.Comments, attributes).split(/\n/)[c].trim().replace("", "<br>");
                }
                else {
                    comment = dojo.string.substitute(commentsInfoPopupFieldsCollection.Comments, attributes).split(/\n/)[c].trim();
                }
                value += dojo.string.substitute(commentsInfoPopupFieldsCollection.Comments, attributes).split(/\n/)[c].length == 0 ? "<br>" : comment;
            }
        }
        else {
            value = dojo.string.substitute(commentsInfoPopupFieldsCollection.Comments, attributes);
        }
        td2.innerHTML += value;
        if (CheckMailFormat(dojo.string.substitute(commentsInfoPopupFieldsCollection.Comments, attributes)) || dojo.string.substitute(commentsInfoPopupFieldsCollection.Comments, attributes).match("http:" || "https:")) {
            td2.className = "tdBreakWord";
        }
        else {
            td2.className = "tdBreak";
        }
        var x = dojo.string.substitute(commentsInfoPopupFieldsCollection.Comments, attributes).split(" ");
        for (var i in x) {
            if (x.hasOwnProperty(i)) {
                w = x[i].getWidth(15) - 50;
                var boxWidth = (isMobileDevice) ? (dojo.window.getBox().w - 10) : (infoPopupWidth - 40);
                if (boxWidth < w) {
                    td2.className = "tdBreakWord";
                    continue;
                }
            }
        }
    }
    else {
        td2.innerHTML = showNullValueAs;
    }
    tr1.appendChild(td2);
    tbody.appendChild(tr1);
    table.appendChild(tbody);
    return table;
}

//Reset comments data
function ResetCommentValues() {
    dojo.byId('txtComments').value = '';
    dojo.byId('txtName').value = '';
    dojo.byId('txtMail').value = '';
    dojo.byId('txtAdd').value = '';
    dojo.byId('txtPhone').value = '';
    document.getElementById('spanCommentError').innerHTML = "";
    document.getElementById('spanCommentError').style.display = 'none';
    dojo.byId('divAddComment').style.display = "none";
    dojo.byId('divCommentsView').style.display = "block";
    dojo.byId('divCommentsList').style.display = "block";
    SetCommentHeight();
    if (!showCommentsTab) {
        dojo.byId("divCommentsContent").innerHTML = "";
    }
}

function CreateScrollbar(container, content) {
    var yMax;
    var pxLeft, pxTop, xCoord, yCoord;
    var scrollbar_track;
    var isHandleClicked = false;
    this.container = container;
    this.content = content;
    content.scrollTop = 0;
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
    scrollbar_track.style.right = 5 + 'px';
    var scrollbar_handle = document.createElement('div');
    scrollbar_handle.className = 'scrollbar_handle';
    scrollbar_handle.id = container.id + "scrollbar_handle";
    scrollbar_track.appendChild(scrollbar_handle);
    container.appendChild(scrollbar_track);
    if ((content.scrollHeight - content.offsetHeight) <= 5) {
        scrollbar_handle.style.display = 'none';
        scrollbar_track.style.display = 'none';
        return;
    }
    else {
        scrollbar_handle.style.display = 'block';
        scrollbar_track.style.display = 'block';
        scrollbar_handle.style.height = Math.max(this.content.offsetHeight * (this.content.offsetHeight / this.content.scrollHeight), 25) + 'px';
        yMax = this.content.offsetHeight - scrollbar_handle.offsetHeight;
        yMax = yMax - 5; //for getting rounded bottom of handle
        if (window.addEventListener) {
            content.addEventListener('DOMMouseScroll', ScrollDiv, false);
        }
        content.onmousewheel = function (evt) {
            console.log(content.id);
            ScrollDiv(evt);
        }
    }

    //Attaching events to scrollbar components - Using mouse wheel
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
            if (y < 0) y = 2 // Limit vertical movement
            scrollbar_handle.style.top = (y - 2) + "px";
            content.scrollTop = Math.round(scrollbar_handle.offsetTop / yMax * (content.scrollHeight - content.offsetHeight));
        }
    }

    //Attaching events to scrollbar components - Click and Drag
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

    //Attaching events to scrollbar components - Releasing mouse click
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

    var startPos;
    var scrollingTimer;

    dojo.connect(container, "touchstart", function (evt) {
        touchStartHandler(evt);
    });

    dojo.connect(container, "touchmove", function (evt) {
        touchMoveHandler(evt);
    });

    dojo.connect(container, "touchend", function (evt) {
        touchEndHandler(evt);
    });

    //Handlers for Touch Events
    function touchStartHandler(e) {
        startPos = e.touches[0].pageY;
    }

    function touchMoveHandler(e) {
        var touch = e.touches[0];
        e.cancelBubble = true;
        if (e.stopPropagation) e.stopPropagation();
        e.preventDefault();

        pxTop = scrollbar_handle.offsetTop;
        var y;
        if (startPos > touch.pageY) {
            y = pxTop + 10;
        }
        else {
            y = pxTop - 10;
        }

        //setting scrollbar handle
        if (y > yMax) y = yMax // Limit vertical movement
        if (y < 0) y = 0 // Limit vertical movement
        scrollbar_handle.style.top = y + "px";

        //setting content position
        content.scrollTop = Math.round(scrollbar_handle.offsetTop / yMax * (content.scrollHeight - content.offsetHeight));

        scrolling = true;
        startPos = touch.pageY;
    }

    function touchEndHandler(e) {
        scrollingTimer = setTimeout(function () { clearTimeout(scrollingTimer); scrolling = false; }, 100);
    }
    //stop touch event
}

//Remove scroll bar
function RemoveScrollBar(container) {
    if (dojo.byId(container.id + 'scrollbar_track')) {
        container.removeChild(dojo.byId(container.id + 'scrollbar_track'));
    }
}

//Display the current location of the user
function ShowMyLocation() {
    HideBaseMapLayerContainer();
    HideShareAppContainer();
    HideAddressContainer();
    navigator.geolocation.getCurrentPosition(
        function (position) {
            ShowProgressIndicator();
            mapPoint = new esri.geometry.Point(position.coords.longitude, position.coords.latitude, new esri.SpatialReference({ wkid: 4326 }));
            var graphicCollection = new esri.geometry.Multipoint(new esri.SpatialReference({ wkid: 4326 }));
            graphicCollection.addPoint(mapPoint);
            geometryService.project([graphicCollection], map.spatialReference, function (newPointCollection) {
                for (var bMap = 0; bMap < baseMapLayers.length; bMap++) {
                    if (map.getLayer(baseMapLayers[bMap].Key).visible) {
                        var bmap = baseMapLayers[bMap].Key;
                    }
                }
                if (!map.getLayer(bmap).fullExtent.contains(newPointCollection[0].getPoint(0))) {
                    mapPoint = null;
                    selectedMapPoint = null;
                    featureID = null;
                    map.getLayer(tempGraphicsLayerId).clear();
                    map.infoWindow.hide();
                    HideProgressIndicator();
                    alert(messages.getElementsByTagName("geoLocation")[0].childNodes[0].nodeValue);
                    return;
                }
                mapPoint = newPointCollection[0].getPoint(0);
                map.setLevel(locatorSettings.Locators[0].ZoomLevel);
                map.centerAt(mapPoint);
                var locatorMarkupSymbol = new esri.symbol.PictureMarkerSymbol(locatorSettings.DefaultLocatorSymbol, locatorSettings.MarkupSymbolSize.width, locatorSettings.MarkupSymbolSize.height);
                var graphic = new esri.Graphic(mapPoint, locatorMarkupSymbol, { "Locator": true }, null);
                map.getLayer(tempGraphicsLayerId).add(graphic);
                HideProgressIndicator();
            });
        },
            function (error) {
                HideProgressIndicator();
                switch (error.code) {
                    case error.TIMEOUT:
                        alert(messages.getElementsByTagName("geolocationTimeout")[0].childNodes[0].nodeValue);
                        break;
                    case error.POSITION_UNAVAILABLE:
                        alert(messages.getElementsByTagName("geolocationPositionUnavailable")[0].childNodes[0].nodeValue);
                        break;
                    case error.PERMISSION_DENIED:
                        alert(messages.getElementsByTagName("geolocationPermissionDenied")[0].childNodes[0].nodeValue);
                        break;
                    case error.UNKNOWN_ERROR:
                        alert(messages.getElementsByTagName("geolocationUnKnownError")[0].childNodes[0].nodeValue);
                        break;
                }
            }, { timeout: 10000 }
       );
}

//Handle orientation changes
function OrientationChanged() {
    orientationChange = true;
    if (map) {
        var timeout = (isMobileDevice && isiOS) ? 100 : 500;
        map.infoWindow.hide();
        setTimeout(function () {
            map.reposition();
            map.resize();
            if (isMobileDevice) {
                SetAddressResultsHeight();
                SetCommentHeight();
                SetSplashScreenHeight();
                SetViewDetailsHeight();
                SetCmtControlsHeight();
                setTimeout(function () {
                    if (selectedMapPoint) {
                        map.setExtent(GetMobileMapExtent(selectedMapPoint));
                    }
                    orientationChange = false;
                    return;
                }, 1000);
            }
            else {
                setTimeout(function () {
                    if (selectedMapPoint) {
                        map.setExtent(GetBrowserMapExtent(selectedMapPoint));
                    }
                    orientationChange = false;
                }, 500);
            }
        }, timeout);
    }
}

//Set height for splash screen
function SetSplashScreenHeight() {
    var height = (isMobileDevice) ? (dojo.window.getBox().h - 110) : (dojo.coords(dojo.byId('divSplashScreenContent')).h - 80);
    dojo.byId('divSplashContent').style.height = (height + 14) + "px";
    CreateScrollbar(dojo.byId("divSplashContainer"), dojo.byId("divSplashContent"));
}

//Hide splash screen container
function HideSplashScreenMessage() {
    if (dojo.isIE < 9) {
        dojo.byId("divSplashScreenContent").style.display = "none";
    }
    dojo.addClass('divSplashScreenContainer', "opacityHideAnimation");
    dojo.replaceClass("divSplashScreenContent", "hideContainer", "showContainer");
}

//Show address container with wipe-in animation
function ShowLocateContainer() {
    HideBaseMapLayerContainer();
    HideShareAppContainer();
    if (isMobileDevice) {
        ResetSearchContainer();
        dojo.byId('divAddressContainer').style.display = "block";
        dojo.replaceClass("divAddressHolder", "showContainer", "hideContainer");
    }
    else {
        if (dojo.coords("divAddressHolder").h > 0) {
            HideAddressContainer();
            dojo.byId('txtAddress').blur();
        }
        else {
            ResetSearchContainer();
            dojo.byId('divAddressHolder').style.height = "300px";
            dojo.replaceClass("divAddressHolder", "showContainerHeight", "hideContainerHeight");
        }
    }
    RemoveChildren(dojo.byId('tblAddressResults'));
    SetAddressResultsHeight();
}

function ResetSearchContainer() {
    if (dojo.byId("tdSearchAddress").className.trim() == "tdSearchByAddress") {
        dojo.byId("txtAddress").value = dojo.byId("txtAddress").getAttribute("defaultAddress");
    }
    else {
        dojo.byId("txtAddress").value = dojo.byId("txtAddress").getAttribute("defaultCase");
    }
    dojo.byId("txtAddress").style.color = "gray";
    dojo.byId("imgSearchLoader").style.display == "none";
    lastSearchString = dojo.byId("txtAddress").value.trim();
}

//Set height for address results and create scrollbar
function SetAddressResultsHeight() {
    var height = (isMobileDevice) ? (dojo.window.getBox().h - 50) : dojo.coords(dojo.byId('divAddressHolder')).h;
    if (height > 0) {
        dojo.byId('divAddressScrollContent').style.height = (height - ((isMobileDevice) ? 130 : 170)) + "px";
        if (isMobileDevice) {
            dojo.byId("tdSearchAddress").style.width = ((dojo.window.getBox().w - 100) / 3) + "px";
            dojo.byId("tdSearchCase").style.width = ((dojo.window.getBox().w - 100) / 3) + "px";
            dojo.byId("divAddressPlaceHolder").style.width = (dojo.window.getBox().w - 30) + "px";
        }
    }
    CreateScrollbar(dojo.byId("divAddressScrollContainer"), dojo.byId("divAddressScrollContent"));
}

//Hide address container with wipe-out animation
function HideAddressContainer() {
    dojo.byId("imgSearchLoader").style.display = "none";
    dojo.byId("txtAddress").blur();
    if (isMobileDevice) {
        setTimeout(function () {
            dojo.byId('divAddressContainer').style.display = "none";
        }, 500);
        dojo.replaceClass("divAddressHolder", "hideContainerHeight", "showContainerHeight");
    }
    else {
        dojo.replaceClass("divAddressHolder", "hideContainerHeight", "showContainerHeight");
        dojo.byId('divAddressHolder').style.height = '0px';
    }
    isContainerVisible = false;
}

//Set height for comments and create scroll bar
function SetCommentHeight() {
    var height = (isMobileDevice) ? (dojo.window.getBox().h) : (dojo.coords(dojo.byId('divInfoContent')).h - 10);
    if (height > 0) {
        dojo.byId('divCommentsContent').style.height = (height - ((isBrowser) ? 120 : 150)) + "px";
    }
    CreateScrollbar(dojo.byId("divCommentsContainer"), dojo.byId("divCommentsContent"));
    if (isMobileDevice) {
        dojo.byId('divInfoComments').style.width = dojo.window.getBox().w - 15 + "px";
    }
}

//Display land use comments in mobile infowindow
function ShowInfoCommentsView() {
    if (dojo.byId('imgDirections').getAttribute("disp") == "Details") {
        dojo.byId('imgComments').src = "images/comments.png";
        dojo.byId('imgComments').title = "Comments";
        dojo.byId('imgComments').setAttribute("disp", "Comments");
        dojo.byId('divInfoComments').style.display = "none";
        dojo.byId('divInfoDetails').style.display = "block";
        dojo.byId('imgDirections').style.display = "none";
        dojo.byId('imgComments').style.display = "block";
        SetViewDetailsHeight();
    }
}

//Display view to add comments
function ShowAddCommentsView() {
    dojo.byId('divAddComment').style.display = "block";
    dojo.byId('divCommentsView').style.display = "none";
    dojo.byId('divCommentsList').style.display = "none";
    SetCmtControlsHeight();
}

//Display comments controls in infowindow and create scrollbar
function SetCmtControlsHeight() {
    var height = (isMobileDevice) ? (dojo.window.getBox().h - 20) : dojo.coords(dojo.byId('divInfoContent')).h;
    dojo.byId("divCmtIpContainer").style.height = (height - ((isTablet) ? 70 : 50)) + "px";
    dojo.byId('divCmtIpContent').style.height = (height - ((isTablet) ? 70 : 50)) + "px";
    CreateScrollbar(dojo.byId("divCmtIpContainer"), dojo.byId("divCmtIpContent"));
}

//Show error message while submitting blank comments
function ShowSpanErrorMessage(controlId, message) {
    dojo.byId(controlId).style.display = "block";
    dojo.byId(controlId).innerHTML = message;
}

//Get width of a control when text and font size are specified
String.prototype.getWidth = function (fontSize) {
    var test = document.createElement("span");
    document.body.appendChild(test);
    test.style.visibility = "hidden";
    test.style.fontSize = fontSize + "px";
    test.innerHTML = this;
    var w = test.offsetWidth;
    document.body.removeChild(test);
    return w;
}

//Sort comments by date
function SortResultFeatures(a, b) {
    var x = dojo.string.substitute(commentsInfoPopupFieldsCollection.Submitdate, a.attributes);
    var y = dojo.string.substitute(commentsInfoPopupFieldsCollection.Submitdate, b.attributes);
    return ((x > y) ? -1 : ((x < y) ? 1 : 0));
}

//Create the tiny url with current extent and selected feature
function ShareLink(ext) {
    var timeoutId = null;
    tinyResponse = null;
    tinyUrl = null;
    mapExtent = GetMapExtent();

    // Encode the URL as a component
    var url = esri.urlToObject(windowURL);
    if (featureID) {
        var urlStr = url.path + "?extent=" + mapExtent + "$featureID=" + featureID;
    }
    else {
        var urlStr = url.path + "?extent=" + mapExtent;
    }
    urlStr = encodeURIComponent(urlStr);

    // Shorten it
    url = dojo.string.substitute(mapSharingOptions.TinyURLServiceURL, [urlStr]);
    esri.request({
        url: url
    },{
        useProxy: true
    }).then(
        function (response) {
            if(timeoutId !== null) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
            if (response.status_code && response.status_code === 200) {
                tinyResponse = response.data;
                tinyUrl = response.data.url;
                if (ext) {
                    HideBaseMapLayerContainer();
                    HideAddressContainer();
                    var cellHeight = (isMobileDevice || isTablet) ? 81 : 60;

                    if (dojo.coords("divAppContainer").h > 0) {
                        HideShareAppContainer();
                    }
                    else {
                        dojo.byId('divAppContainer').style.height = cellHeight + "px";
                        dojo.replaceClass("divAppContainer", "showContainerHeight", "hideContainerHeight");
                    }
                }
            } else {
                alert(messages.getElementsByTagName(
                    "tinyURLEngine")[0].childNodes[0].nodeValue + ": " + response.status_txt);
            }
        }
    );

    timeoutId = setTimeout(function () {
        if (!tinyResponse) {
            alert(messages.getElementsByTagName("tinyURLEngine")[0].childNodes[0].nodeValue);
            return;
        }
    }, 6000);
}

//Open login page for facebook,tweet and open Email client with shared link for Email
function Share(site) {
    if (dojo.coords("divAppContainer").h > 0) {
        dojo.replaceClass("divAppContainer", "hideContainerHeight", "showContainerHeight");
        dojo.byId('divAppContainer').style.height = '0px';
    }
    if (tinyUrl) {
        switch (site) {
            case "facebook":
                window.open(dojo.string.substitute(mapSharingOptions.FacebookShareURL, [tinyUrl]));
                break;
            case "twitter":
                window.open(dojo.string.substitute(mapSharingOptions.TwitterShareURL, [tinyUrl]));
                break;
            case "mail":
                parent.location = dojo.string.substitute(mapSharingOptions.ShareByMailLink, [tinyUrl]);
                break;
        }
    }
    else {
        alert(messages.getElementsByTagName("tinyURLEngine")[0].childNodes[0].nodeValue);
        return;
    }
}

//Hide share link container
function HideShareAppContainer() {
    dojo.replaceClass("divAppContainer", "hideContainerHeight", "showContainerHeight");
    dojo.byId('divAppContainer').style.height = '0px';
}

//Clear default value for text box controls
function ClearDefaultText(e) {
    var target = window.event ? window.event.srcElement : e ? e.target : null;
    if (!target) return;
    target.style.color = "#FFF";
    target.value = '';
}

//Set default value on blur
function ReplaceDefaultText(e) {
    var target = window.event ? window.event.srcElement : e ? e.target : null;
    if (!target) return;

    if (dojo.byId("tdSearchCase").className == "tdSearchByCase") {
        ResetTargetValue(target, "defaultCaseTitle", "gray");
    }
    else {
        ResetTargetValue(target, "defaultAddressTitle", "gray");
    }
}

//Set changed value for address/casename
function ResetTargetValue(target, title, color) {
    if (target.value == '' && target.getAttribute(title)) {
        target.value = target.title;
        if (target.title == "") {
            target.value = target.getAttribute(title);
        }
    }
    target.style.color = color;
    lastSearchString = dojo.byId("txtAddress").value.trim();
}

//Reset map position
function SetMapTipPosition() {
    if (!orientationChange) {
        if (map.getLayer(tempGraphicsLayerId)) {
            if (map.getLayer(tempGraphicsLayerId).graphics.length > 0) {
                if (map.getLayer(tempGraphicsLayerId).graphics[0].attributes) {
                    return;
                }
                mapPoint = map.getLayer(tempGraphicsLayerId).graphics[0].geometry;
                var screenPoint = map.toScreen(mapPoint);
                screenPoint.y = map.height - screenPoint.y;
                map.infoWindow.setLocation(screenPoint);
                return;
            }
            if (selectedMapPoint) {
                var screenPoint = map.toScreen(selectedMapPoint);
                screenPoint.y = map.height - screenPoint.y;
                map.infoWindow.setLocation(screenPoint);
            }
        }
    }
}

//Get current map Extent
function GetMapExtent() {
    var extents = Math.round(map.extent.xmin).toString() + "," + Math.round(map.extent.ymin).toString() + "," +
                  Math.round(map.extent.xmax).toString() + "," + Math.round(map.extent.ymax).toString();
    return (extents);
}

//Get the extent based on the map point for browser
function GetBrowserMapExtent(mapPoint) {
    var width = map.extent.getWidth();
    var height = map.extent.getHeight();
    var xmin = mapPoint.x - (width / 2);
    var ymin = mapPoint.y - (height / 2.7);
    var xmax = xmin + width;
    var ymax = ymin + height;
    return new esri.geometry.Extent(xmin, ymin, xmax, ymax, map.spatialReference);
}

//Get the extent based on the map point for mobile
function GetMobileMapExtent(mapPoint) {
    var width = map.extent.getWidth();
    var height = map.extent.getHeight();
    var xmin = mapPoint.x - (width / 2);
    var ymin = mapPoint.y - (height / 4);
    var xmax = xmin + width;
    var ymax = ymin + height;
    return new esri.geometry.Extent(xmin, ymin, xmax, ymax, map.spatialReference);
}

//Handle resize browser event handler
function ResizeHandler() {
    if (map) {
        map.reposition();
        map.resize();
    }
}

//Refresh address container
function RemoveChildren(parentNode) {
    if (parentNode) {
        while (parentNode.hasChildNodes()) {
            parentNode.removeChild(parentNode.lastChild);
        }
    }
}

//Clear graphics on map
function ClearGraphics() {
    if (map.getLayer(tempGraphicsLayerId)) {
        map.getLayer(tempGraphicsLayerId).clear();
    }
}

//Get query string value of the provided key, if not found the function returns empty string
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

//Restrict the maximum no of characters in the text area control
function ImposeMaxLength(Object, MaxLen) {
    return (Object.value.length <= MaxLen);
}

//Show progress indicator
function ShowProgressIndicator() {
    dojo.byId('divLoadingIndicator').style.display = "block";
}

//Hide progress indicator
function HideProgressIndicator() {
    dojo.byId('divLoadingIndicator').style.display = "none";
}

//Validate Email in comments tab
function CheckMailFormat(emailValue) {
    var pattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,6}$/i
    if (pattern.test(emailValue)) {
        return true;
    }
    else {
        return false;
    }
}

//Trim the string
String.prototype.trim = function () { return this.replace(/^\s+|\s+$/g, ''); }

//Append '...' for a string
String.prototype.trimString = function (len) {
    return (this.length > len) ? this.substring(0, len) + "..." : this;
}

//Convert String to Boolean
String.prototype.bool = function () {
    return (/^true$/i).test(this);
};
