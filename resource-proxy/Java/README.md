Java Proxy File
===============

A Java proxy that handles support for
* Accessing cross domain resources
* Requests that exceed 2048 characters
* Accessing resources secured with token based authentication.
* [OAuth 2.0 app logins](https://developers.arcgis.com/en/authentication).
* Enabling logging
* Both resource and client IP based rate limiting

##Instructions

* Download and unzip the .zip file or clone the repository.
* Install the contents of the Java folder as a Web Application in an web container such as Apache Tomcat.
* Use the ProxyConfig tag to specify the following proxy level settings.
    * **mustMatch="true"** : When true only the sites listed using serverUrl will be proxied. Set to false to proxy any site. Setting mustMatch to false is a good way to test the proxy setup but shouldn't be used in most cases in production sites.
    * **logFile="<file with local path>"** : When a path to a local file is specified event messages will be logged.
    * **logLevel="<SEVERE|WARNING|INFO|CONFIG|FINE|FINER|FINEST>"** : Sets the level of logging to be used.  Defaults to SEVERE.
* Open the proxy.config file in the text editor of your choice and add new <serverUrl> entry for each service that will use the proxy page. The proxy.config allows you to use the serverUrl tag to specify one or more ArcGIS Server services that the proxy will forward requests to. The serverUrl tags has the following attributes:
    * **url=<location>**: Location of the ArcGIS Server service to proxy. Specify either the specific url or the root.  If the location starts with "//", any protocol will be accepted, if the location starts with "http://", http or https will be accepted, and if the location starts with "https://", only https will be accepted.
    * **matchAll=true**: When true all requests that begin with the specified URL are forwarded, otherwise, the url must match exactly.
    * **username=""** and **password=""**: The proxy will use the supplied username and password credentials to request a token when needed using ArcGIS Server token based authentication.
    * **tokenServiceUri="": If username and password are specified, the proxy will use the supplied token service uri to request a token.  If this value is left blank, the proxy page will request a token url from the ArcGIS server.
    * **oauth2Endpoint**: When using OAuth 2.0 authentication specify the portal specific OAuth 2.0 authentication endpoint. The default value is https://www.arcgis.com/sharing/oauth2/.
    * **clientId=""** and **clientSecret=""**: Specify the client id and client secret and the proxy will obtain the token as needed using OAuth 2.0 authentication.
    * **rateLimit="<number>"**: The maximum number of requests from a particular client ip address over the specified **rateLimitPeriod**.
    * **rateLimitPeriod="<number>**: The time period (in minutes) within which the specified number of requests (rate_limit) sent from a particular client ip address will be tracked. The default value is 60.
See the proxy.config for examples. Note: Refresh the proxy application after updates to the proxy.config have been made.
* Update your application to use the proxy for the specified services. In this example requests to route.arcgis.com will utilize the proxy.

```
    urlUtils.addProxyRule({
        urlPrefix: "route.arcgis.com",
        proxyUrl: "http://localhost/sproxy/auth_proxy.ashx"
    });
```

##Folders and Files

The proxy consists of the following files:
* proxy.jsp: This file contains several classes inside a JSP page which defines the contract Java uses to synchronously process HTTP Web requests.  In most cases you will not need to modify this file.
* WEB-INF/classes/proxy.config: This file contains the configuration settings for the proxy. This is where you will define all the resources that will use the proxy. After updating this file you will need to restart or update the proxy application from your web container.

##Requirements

* Java 6 or greater

##Issues

Found a bug or want to request a new feature? Let us know by submitting an issue.

##Contributing

All contributions are welcome.

##Licensing

Copyright 2013 Esri

Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for specific language governing permissions and limitations under the license.
