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
dojo.provide("js.config");
dojo.declare("js.config", null, {

    // This file contains various configuration settings for "Public Comments" template
    //
    // Use this file to perform the following:
    //
    // 1.  Specify application title                  - [ Tag(s) to look for: ApplicationName ]
    // 2.  Set path for application icon              - [ Tag(s) to look for: ApplicationIcon ]
    // 3.  Set splash screen message                  - [ Tag(s) to look for: SplashScreenMessage ]
    // 4.  Set URL for help page                      - [ Tag(s) to look for: HelpURL ]
    //
    // 5.  Specify URLs for basemaps                  - [ Tag(s) to look for: BaseMapLayers ]
    // 6.  Set initial map extent                     - [ Tag(s) to look for: DefaultExtent ]

    // 7.  Specify URL(s) for operational layers      - [ Tag(s) to look for: DevPlanLayer,CommentLayer]
    // 8.  Customize data formatting                  - [ Tag(s) to look for: ShowNullValueAs]

    //
    // 9.  Customize address search settings          - [ Tag(s) to look for: LocatorURL, LocatorDefaultAddress, LocatorMarkupSymbolPath]
    //
    // 10. Set URL for geometry service               - [ Tag(s) to look for: GeometryService ]
    //
    // 11. Customize info-Window settings             - [ Tag(s) to look for: InfoWindowHeader ]
    // 11a.Customize info-Popup settings              - [ Tag(s) to look for: InfoPopupFieldsCollection]
    //
    // 12. Set the default comment                    - [ Tag(s) to look for: DefaultCmnt]
    // 13. Customize the renderer                     - [  Tag(s) to look for: CustomRenderer, RendererColor]
    // 14. Specify URLs for map sharing               - [ Tag(s) to look for: FacebookShareURL, TwitterShareURL, ShareByMailLink ]
    // 14a.In case of changing the TinyURL service
    //     Specify URL for the new service            - [ Tag(s) to look for: MapSharingOptions (set TinyURLServiceURL, TinyURLResponseAttribute) ]


    // ------------------------------------------------------------------------------------------------------------------------
    // GENERAL SETTINGS
    // ------------------------------------------------------------------------------------------------------------------------
    // Set application title
    ApplicationName: "Land Use Public Comment",

    // Set application icon path
    ApplicationIcon: "images/imgapplication.png",

    // Set splash window content - Message that appears when the application starts
    SplashScreenMessage: "<b>Land Use Public Comments</b> <br/> <hr/> <br/>The <b>Land Use Public Comment</b> application allows the general public and other interested parties to comment on proposed land use cases being heard in their Local Government. It provides 24x7 access to your government organization and supplements statutory public notice requirements. <br/> <br/> You can review pending land use cases, submit public comment and finally review comments from other members of the community to see what is being said about land use activities in your community. <br/> <br /> <b>Contact Us By Phone:</b> <br/> <br/> Naperville Planning Department <br/> Phone: (555) 555-1212 <br/> Open: 8:00 am - 4:00 pm<br/><hr/> <br/>",

    // Set URL of help page/portal
    HelpURL: "help.html",

    // ------------------------------------------------------------------------------------------------------------------------
    // BASEMAP SETTINGS
    // ------------------------------------------------------------------------------------------------------------------------
    // Set baseMap layers
    // Please note: All basemaps need to use the same spatial reference. By default, on application start the first basemap will be loaded
    BaseMapLayers: [
                       {
                           Key: "parcelMap",
                           ThumbnailSource: "images/parcelmap.png",
                           Name: "Parcel Map",
                           MapURL: "http://localgovtemplates.esri.com/ArcGIS/rest/services/ParcelPublicAccess/MapServer"
                       },
                       {
                           Key: "hybridMap",
                           ThumbnailSource: "images/imageryhybrid.png",
                           Name: "Hybrid Map",
                           MapURL: "http://localgovtemplates.esri.com/ArcGIS/rest/services/ImageryHybrid/MapServer"
                       }
                   ],

    // Initial map extent. Use comma (,) to separate values and dont delete the last comma
    DefaultExtent: "-9820540.250415744,5123891.2880908195,-9808654.292517414,5130751.511379406",

	// ------------------------------------------------------------------------------------------------------------------------
	// OPERATIONAL DATA SETTINGS

	// Configure operational layers
	DevPlanLayer: "http://localgovtemplates2.esri.com/ArcGIS/rest/services/Planning/LandUseCases/FeatureServer/0",
	CommentLayer: "http://localgovtemplates2.esri.com/ArcGIS/rest/services/Planning/LandUseCases/FeatureServer/1",

    CaseID: "CASEID",
    CaseName: "CASENAME",
    Comments: "COMMENTS",
    HearingDate: "HEARINGDT",
    Submitdate: "SUBMITDATE",

    // ------------------------------------------------------------------------------------------------------------------------

	// Set string value to be shown for null or blank values
    ShowNullValueAs: "Not Available",

	// ------------------------------------------------------------------------------------------------------------------------
	// ADDRESS SEARCH SETTINGS
	// ------------------------------------------------------------------------------------------------------------------------
    // Set Locator service URL
    LocatorURL: "http://tasks.arcgisonline.com/ArcGIS/rest/services/Locators/TA_Address_NA_10/GeocodeServer",

    // Set Locator fields (fields to be used for searching)
    LocatorFields: "SingleLine",

    // Set default address to search
    LocatorDefaultAddress: "971 Sylvan Cir,Naperville,IL,60540",

    // Set pushpin image path
    LocatorMarkupSymbolPath: "images/pushpin.png",

	// ------------------------------------------------------------------------------------------------------------------------
	// GEOMETRY SERVICE SETTINGS
	// ------------------------------------------------------------------------------------------------------------------------
    // Set geometry service URL
    GeometryService: "http://localgovtemplates2.esri.com/ArcGIS/rest/services/Geometry/GeometryServer",

    // ------------------------------------------------------------------------------------------------------------------------
    // INFO-WINDOW SETTINGS
    // ------------------------------------------------------------------------------------------------------------------------
    // Info-window is a small, two line popup that gets displayed on selecting a feature
    // Set Info-window title. Configure this with text/fields
    InfoWindowHeader: "CASENAME",

    // ------------------------------------------------------------------------------------------------------------------------
    // INFO-POPUP SETTINGS
    // ------------------------------------------------------------------------------------------------------------------------
    // Info-popup is a popup dialog that gets displayed on selecting a feature
    // Set the content to be displayed on the info-Popup. Define labels, field values, field types and field formats
    InfoPopupFieldsCollection:
         [
              {
                  DisplayText: "",
                  FieldName: "CASEID"
              },
              {
                  DisplayText: "",
                  FieldName: "CASENAME"
              },
              {
                  DisplayText: "",
                  FieldName: "APPLICANT"
              },
              {
                  DisplayText: "",
                  FieldName: "CASEDESC"
              },
              {
                 DisplayText: "",
                 FieldName: "CASETYPE"
              },
              {
                 DisplayText: "",
                 FieldName: "CASESTATUS"
              },
              {
                 DisplayText: "",
                 FieldName: "HEARINGDT"
              },
              {
                 DisplayText: "",
                 FieldName: "HEARINGLOC"
              }
         ],
    //Set the default comment to be displayed
    DefaultCmnt: "Please Submit Your Comments",

    //Set the custom renderer
    CustomRenderer: false,

    //Set the custom renderer color
    RendererColor: "#1C86EE",

    // ------------------------------------------------------------------------------------------------------------------------
    // SETTINGS FOR MAP SHARING
    // ------------------------------------------------------------------------------------------------------------------------
    // Set URL for TinyURL service, and URLs for social media
    MapSharingOptions:
    {
        TinyURLServiceURL: "http://api.bit.ly/v3/shorten?login=esri&apiKey=R_65fd9891cd882e2a96b99d4bda1be00e&uri=${0}&format=json",
        TinyURLResponseAttribute: "data.url",

         FacebookShareURL: "http://www.facebook.com/sharer.php?u=${0}&t=Public%20Comments%20Map",
         TwitterShareURL: "http://twitter.com/home/?status=Public%20Comments%20Map ${0}",
         MailShare: "mailto:%20?subject=checkout%20this%20Public%20Comments%20map!&body=${0}"
    }

});