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
dojo.provide("js.config");
dojo.declare("js.config", null, {

    // This file contains various configuration settings for "Land Use Public Comment" template
    //
    // Use this file to perform the following:
    //
    // 1.  Specify application name                   - [ Tag(s) to look for: ApplicationName ]
    // 2.  Set path for application icon              - [ Tag(s) to look for: ApplicationIcon ]
    // 3.  Set splash screen message                  - [ Tag(s) to look for: SplashScreenMessage ]
    // 4.  Set URL for help page                      - [ Tag(s) to look for: HelpURL ]
    // 5.  Specify URLs for base maps                  - [ Tag(s) to look for: BaseMapLayers ]
    // 6.  Set initial map extent                     - [ Tag(s) to look for: DefaultExtent ]
    // 7.  Or for using map services:
    // 7a. Specify URLs for operational layers        - [ Tag(s) to look for: serviceRequestLayerURL, serviceRequestmobileLayerURL, serviceRequestCommentsLayerURL ]
    // 7b. Customize info-Window settings             - [ Tag(s) to look for: InfoWindowHeader, InfoWindowContent ]
    // 7c. Customize info-Popup settings              - [ Tag(s) to look for: infoWindowData, ShowCommentsTab ]
    // 7d. Customize info-Popup size                  - [ Tag(s) to look for: InfoPopupHeight, InfoPopupWidth ]
    // 7e. Customize data formatting                  - [ Tag(s) to look for: ShowNullValueAs, FormatDateAs ]
    // 8. Customize address search settings           - [ Tag(s) to look for: LocatorSettings ]
    // 9. Set URL for geometry service                - [ Tag(s) to look for: GeometryService ]
    // 10. Specify URLs for map sharing               - [ Tag(s) to look for: FacebookShareURL, TwitterShareURL, ShareByMailLink ]
    // 10a.In case of changing the TinyURL service
    //     Specify URL for the new service            - [ Tag(s) to look for: MapSharingOptions (set TinyURLServiceURL, TinyURLResponseAttribute) ]


    // ------------------------------------------------------------------------------------------------------------------------
    // GENERAL SETTINGS
    // ------------------------------------------------------------------------------------------------------------------------
    // Set application title
    ApplicationName: "Land Use Public Comment",

    // Set application icon path
    ApplicationIcon: "images/logo.png",

    // Set splash window content - Message that appears when the application starts
    SplashScreenMessage: "<b>Land Use Public Comment</b> <br/> <hr/> <br/>The <b>Land Use Public Comment</b> application allows you to comment on proposed land use cases being heard by your Local Government. It provides 24x7 access to your government organization and supplements statutory public notice requirements. <br/> <br /> <b>Contact Us By Phone:</b> <br/> Naperville Planning Department <br/> Phone: (555) 555-1212 <br/> Open: 8:00 am - 4:00 pm<br/><br/>",

    // Set URL of help page/portal
    HelpURL: "help.htm",

    // ------------------------------------------------------------------------------------------------------------------------
    // BASEMAP SETTINGS
    // ------------------------------------------------------------------------------------------------------------------------
    // Set baseMap layers
    // Please note: All base maps need to use the same spatial reference. By default, on application start the first basemap will be loaded
    BaseMapLayers:
          [
                    {
                        Key: "parcelMap",
                        ThumbnailSource: "images/parcelmap.png",
                        Name: "Streets",
                        MapURL: "http://arcgis-tenone2012-1974758903.us-west-1.elb.amazonaws.com/arcgis/rest/services/ParcelPublicAccess/MapServer"
                    },
                    {
                        Key: "hybridMap",
                        ThumbnailSource: "images/imageryhybrid.png",
                        Name: "Imagery",
                        MapURL: "http://arcgis-tenone2012-1974758903.us-west-1.elb.amazonaws.com/arcgis/rest/services/ImageryHybrid/MapServer"
                    }
          ],

    // Initial map extent. Use comma (,) to separate values and don't delete the last comma
    DefaultExtent: "-9816010,5123000,-9809970,5129500",

    // ------------------------------------------------------------------------------------------------------------------------
    // OPERATIONAL DATA SETTINGS
    // ------------------------------------------------------------------------------------------------------------------------

    // Configure operational layers:
    DevPlanLayerURL:
          {
              ServiceURL: "http://services.arcgis.com/b6gLrKHqgkQb393u/arcgis/rest/services/LandUseCasesTryItLive/FeatureServer/0",
              PrimaryKeyForCase: "${CASEID}"
          },
    DevPlanMobileLayerURL:
          {
              ServiceURL: "http://services.arcgis.com/b6gLrKHqgkQb393u/arcgis/rest/services/LandUseCasesTryItLive/FeatureServer/0",
              PrimaryKeyForCase: "${CASEID}"
          },

    PublicCommentsLayerURL:
          {
              ServiceURL: "http://services.arcgis.com/b6gLrKHqgkQb393u/arcgis/rest/services/LandUseCasesTryItLive/FeatureServer/1",
              PrimaryKeyForComments: "${CASEID}"
          },


    // ------------------------------------------------------------------------------------------------------------------------
    // INFO-WINDOW SETTINGS
    // ------------------------------------------------------------------------------------------------------------------------

    // Info-window is a small, two line popup that gets displayed on selecting a feature
    // Set Info-window title. Configure this with text/fields
    InfoWindowHeader: "${CASENAME}",

    // Choose content/fields for the info window
    InfoWindowContent: "${APPLICANT}",

    // ------------------------------------------------------------------------------------------------------------------------
    // INFO-POPUP SETTINGS
    // ------------------------------------------------------------------------------------------------------------------------

    // Info-popup is a popup dialog that gets displayed on selecting a feature
    // Set the content to be displayed on the info-Popup. Define labels, field values, field types and field formats
    InfoWindowData:
          [
                    {
                        DisplayText: "Case ID:",
                        AttributeValue: "${CASEID}"
                    },
                    {
                        DisplayText: "Case Name:",
                        AttributeValue: "${CASENAME}"
                    },
                    {
                        DisplayText: "Applicant:",
                        AttributeValue: "${APPLICANT}"
                    },
                    {
                        DisplayText: "Description:",
                        AttributeValue: "${CASEDESC}"
                    },
                    {
                        DisplayText: "Case Type:",
                        AttributeValue: "${CASETYPE}"
                    },
                    {
                        DisplayText: "Case Status:",
                        AttributeValue: "${CASESTATUS}"
                    },
                    {
                        DisplayText: "Hearing Date:",
                        AttributeValue: "${HEARINGDT}"
                    },
                    {
                        DisplayText: "Hearing Location:",
                        AttributeValue: "${HEARINGLOC}"
                    }
          ],

    // Set display name for attachment
    AttachmentDisplayName: "Related Document",

    // Set this to true to show "Comments" tab in the info-Popup
    ShowCommentsTab: true,

    // Set this message for comments
    ShowCommentsMessage: "Thank you for your feedback.",

    // Set size of the info-Popup - select maximum height and width in pixels (not applicable for tabbed info-Popup)
    //minimum height should be 310 for the info-popup in pixels
    InfoPopupHeight: 310,

    // Minimum width should be 330 for the info-popup in pixels
    InfoPopupWidth: 330,

    // Set string value to be shown for null or blank values
    ShowNullValueAs: "N/A",

    // Set date format
    FormatDateAs: "MMM dd, yyyy",

    // ------------------------------------------------------------------------------------------------------------------------
    // ADDRESS SEARCH SETTINGS
    // ------------------------------------------------------------------------------------------------------------------------

    // Set locator settings such as locator symbol, size, zoom level, display fields, match score
    LocatorSettings: {
        DefaultLocatorSymbol: "images/RedPushpin.png",
        MarkupSymbolSize: { width: 35, height: 35 },
        Locators: [
                {
                    DisplayText: "Address",
                    DefaultValue: "139 W Porter Ave Naperville IL 60540",
                    LocatorParamaters: ["SingleLine"],
                    LocatorURL: "http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer",
                    CandidateFields: "Loc_name, Score, Match_addr",
                    DisplayField: "${Match_addr}",
                    ZoomLevel: 7,
                    AddressMatchScore: 80,
                    LocatorFieldName: 'Loc_name',
                    LocatorFieldValues: ["USA.StreetName" , "USA.PointAddress", "USA.StreetAddress"]
                },
                {
                    DisplayText: "Case Name",
                    DefaultValue: "Naperville",
                    QueryString: "CASENAME like '%${0}%'",
                    DisplayField: "${CASENAME}"
                }
            ]
    },

    // Set the default comment to be displayed
    DefaultCmnt: "No comment available.",

    // Set the custom renderer
    CustomRenderer: false,

    // Set the custom renderer color
    RendererColor: "#1C86EE",

    // Define the database field names
    // Note: DateFieldName refers to a date database field.
    // All other attributes refer to text database fields.
    DatabaseFields: {
        CaseIdFieldName: "CASEID",
        CommentsFieldName: "COMMENTS",
        DateFieldName: "SUBMITDT"
    },

    // Set info-pop fields for adding and displaying comment
    CommentsInfoPopupFieldsCollection: {
        Submitdate: "${SUBMITDT}",
        Comments: "${COMMENTS}"
    },

    // ------------------------------------------------------------------------------------------------------------------------
    // GEOMETRY SERVICE SETTINGS
    // ------------------------------------------------------------------------------------------------------------------------

    // Set geometry service URL
    GeometryService: "http://arcgis-tenone2012-1974758903.us-west-1.elb.amazonaws.com/arcgis/rest/services/Utilities/Geometry/GeometryServer",

    // ------------------------------------------------------------------------------------------------------------------------
    // SETTINGS FOR MAP SHARING
    // ------------------------------------------------------------------------------------------------------------------------

    // Set URL for TinyURL service, and URLs for social media
    MapSharingOptions:
          {
              TinyURLServiceURL: "http://api.bit.ly/v3/shorten?login=esri&apiKey=R_65fd9891cd882e2a96b99d4bda1be00e&uri=${0}&format=json",
              TinyURLResponseAttribute: "data.url",
              FacebookShareURL: "http://www.facebook.com/sharer.php?u=${0}&t=Public%20Comment",
              TwitterShareURL: "http://mobile.twitter.com/compose/tweet?status=Public%20Comment ${0}",
              ShareByMailLink: "mailto:%20?subject=See%20this%20Public%20Comment%20map!&body=${0}"
          }
});
