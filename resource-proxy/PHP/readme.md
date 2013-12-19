
### Installing

1. Run ```checker.php``` on your PHP server to look for missing dependencies (this file must be in same directory as the proxy.php file).

2. Verify that the ```proxy.config``` file not accessible to the public via the Internet (use the link in ```checker.php``` to test)

3. Finish reviewing ```checker.php``` results.  If all messages are Pass or Warning and the ```proxy.config``` file is not accessible, you're done and should review example configurations.

4. Happy proxying!

![checker image](https://raw.github.com/phpmaps/resource-proxy/master/PHP/image_checker.png?login=phpmaps&token=a4005630bc691dc38dfe7f9cc51c1b9c)


### Example Configurations

The PHP proxy supports both XML and JSON configurations. XML is the default.  To change the default you must switch the comments shown in this [link](https://github.com/phpmaps/resource-proxy/blob/master/PHP/proxy.php#L1981-L1983).
No matter what style configuration you choose, always save your configuration as ```proxy.config```.
If the purpose is to use this proxy for testing you may want to consider adding ```*``` to the ```allowedReferers``` property.  However, using ```*``` in production is not reccomended.

XML example

```
<ProxyConfig
	mustMatch="true"
	logFile="proxy_log_xml.log"
	allowedReferers="http://server.com/application1,https://server.com/application2">

  <serverUrls>

      <serverUrl
      	url="http://sampleserver6.arcgisonline.com"
      	username="username"
      	password="password"
      	rateLimit="10"
      	rateLimitPeriod="1"
      	matchAll="true"/>

      <serverUrl
      	url="geoenrich.arcgis.com"
      	username="username"
      	password="password"
      	rateLimit="10"
      	rateLimitPeriod="1"
      	matchAll="true"/>

      <serverUrl
      	url="http://route.arcgis.com/"
      	matchAll="true"
      	oauth2Endpoint="https://www.arcgis.com/sharing/oauth2"
      	clientId="6Xo1x5L1tz7k9Kn2dc"
      	clientSecret="5dca5d50d0e6fe422c867b6efcf969b6a2"
      	rateLimit="10"
      	rateLimitPeriod="1">
      </serverUrl>

      <serverUrl
      	url="http://services.arcgisonline.com/ArcGIS/rest/services/"
      	rateLimit="10"
      	rateLimitPeriod="1"
      	matchAll="false"/>

  </serverUrls>

</ProxyConfig>

```

JSON example

```

{
	"proxyConfig": [
		{
			"mustMatch": true,
			"logFile": "proxy_log_json.log",
			"allowedReferers":["http://server.com/application1","https://server.com/application2"]
		}
	],
    "serverUrls": [
		{
			"serverUrl" : [
				{
					"url": "sampleserver6.arcgisonline.com",
					"username": "username",
					"password": "password",
					"rateLimit": "10",
					"rateLimitPeriod": "1",
					"matchAll": true
				}
			]
		},
		{
			"serverUrl" : [
				{
					"url": "geoenrich.arcgis.com",
					"username": "username",
					"password": "password",
					"rateLimit": "10",
					"rateLimitPeriod": "1",
					"matchAll": true
				}
			]
		},
		{
			"serverUrl" : [
				{
					"url": "http://route.arcgis.com/",
					"oauth2Endpoint": "https://www.arcgis.com/sharing/oauth2",
					"clientId": "6Xo1dcx5L1tz7k9Kn2",
					"clientSecret": "5a5d50d0e6fe422c867b6efcf969bdc6a2",
					"rateLimit": "10",
					"rateLimitPeriod": "1",
					"matchAll": true
				}
			]
		},
		{
			"serverUrl" : [
				{
					"url": "http://services.arcgisonline.com/ArcGIS/rest/services/",
					"rateLimit": "10",
					"rateLimitPeriod": "1",
					"matchAll": false
				}
			]
		}
    ]
}


```




## Guide for Unix and Mac using Apache's HTTP Server

### I can see my configuration file on the internet?

This is a problem because the ```proxy.config``` file will contain credentials once completed.  To resolve this, enable file filtering on your web server.  Apache users can do this by adding
 the following lines to the ```.htaccess``` file.  Note in order to use ```.htaccess``` files you must enable
```mod_rewrite.so``` in your ```httpd.conf``` and change the server directory so that ```AllowOverride``` is set to  ```All```.  The example below also
shows how to filter ```.sqlite``` files.  Sqlite is used to implement Rate Metering in this proxy.

Example .htaccess file:

```

<Files ~ "\.sqlite$">
	Order allow,deny
	Deny from All
</Files>

<Files ~ "\.config$">
	Order allow,deny
	Deny from all
</Files>

```

### When I run the checker my browser displays raw PHP code?

Raw PHP code in the browser indicates that your PHP server is not configured correctly.
If you see this, troubleshoot your Apache ```httpd.conf``` file.  On Mac, typically your built in Apache httpd.conf file is located here ```/private/etc/apache2/httpd.conf```. On a Linux machine sometimes the ```httpd.conf``` file is located in ```etc/httpd/conf```.
A properly configured httpd.conf file, looks something like below. Note that the php_5module
is uncommented and libphp5.so is present the modules directory.  More help [here](http://php.net/manual/en/install.macosx.bundled.php).


![checker image](https://raw.github.com/phpmaps/resource-proxy/master/PHP/image_httpd_conf.png?login=phpmaps&token=48086d4803da2f0720423c445fcda39f)

In addition Apache must be told to accept .php file extensions.  This can be done by adding the below
lines in your ```httpd.conf```.


```
<IfModule php5_module>
	AddType application/x-httpd-php .php
	AddType application/x-httpd-php-source .phps

	<IfModule dir_module>
		DirectoryIndex index.html index.php
	</IfModule>
</IfModule>

```

On a Mac an alternative is to uncommented the line that says ```Include /private/etc/apache2/other/*.conf``` in the ```https.conf``` file.

###PHP version has failed?

This is because the minimum proxy requirements are set to PHP version 5.4.2.  If this fails, the recommendation is to install the most recent stable PHP release.
Other PHP versions may work, however PHP version 5.4.2 contains important security updates.

### My directory is not writable?

To resolve this you'll need to change the directory to read/write where the checker.php file is located.  You may need administrative permissions to change this permission level.  The reason read/write is needed
is because this proxy writes to a log file and to a sqlite file.

### OpenSSL and PDO Sqlite failed?

OpenSSL and PDO Sqlite are PHP extensions.  Depending on how you installed PHP there may be a  wizard to install PHP extensions or you may need to manually download / build and configure the required extensions.  This guide discusses both options to obtain OpenSSL and PDO Sqlite.

To build and configure the required extensions yourself, download the PHP source code from http://php.net and then compile it using the below commands.  Since the default version of PHP comes with Sqlite there is no need to issue a command to install this extension.

```
./configure --with-apxs2=/usr/local/server/sept13/httpd-2.4.6/bin/apxs --with-openssl --enable-shmop --enable-mbstring
make
sudo make install

```
For more detailed instructions use this [help on building PHP with extensions](http://www.php.net/manual/en/install.unix.apache2.php).

Alternatively (if you don't want to compile PHP yourself), you can use 3rd party Apache / PHP products that come with many PHP extensions and a standalone Apache web server.

You may want to try out these solutions:

* [Zend Server Project](http://www.zend.com/en/products/server/index)
* [MAMP](http://www.mamp.info/en/index.html).

Note, if you're using Linux the ```configure```, ```make```, ```make install``` option is likely the shortest path to success to resolve missing extensions.

### PEAR fails how do I resolve this?

PHP is typically bundled with the base distribution of PEAR on Unix and Mac systems unless the ```./configure option --without-pear``` was applied.  If PEAR has failed, it's possible that your PEAR files do not exist or are not in a PHP ```include_path``` directory (a
directory accessible to PHP).  PHP ```include_paths``` are defined in the ```php.ini``` file via keyword ```include_path```.

Run the below script in a web browser to display your PHP ```include_path``` directories or review your php.ini looking for keyword ```include_path```.  Once you identify your include path, this is where you will want to install PEAR.

```
<?php

phpinfo();

?>

```


This image shows include paths.

![php ini](https://raw.github.com/phpmaps/resource-proxy/master/PHP/image_phpini.png?login=phpmaps&token=fe9df0601fd5f89284156a795f592b21)


Note if you look in the directory (shown in the above image) you should see some of the below PEAR files (as shown below).  If you don't see PEAR files or if PEAR has failed in checker.php, you should consider reinstalling PEAR.

![directory](https://raw.github.com/phpmaps/resource-proxy/master/PHP/image_pear_filedir.png?login=phpmaps&token=b843b1cbd8be03b29e58de8bce21c0f2)

If you need to reinstall PEAR run this command in the terminal and if you're prompted for a install path be sure to specify a valid PHP ```include_path```.
However, it a good idea to accept the default install locations (unless you are familiar with Pear).

```

wget http://pear.php.net/go-pear.phar
php go-pear.phar

```

Once you get through the above do a test to confirm that PEAR is working by outputing the PEAR version number in the terminal.  Then run the checker again.

```

pear version

```

If you cannot resolve the PEAR dependency please follow the [PEAR installation instructions on PEAR's website](http://pear.php.net/manual/en/installation.php). PEAR has some nice PHP packages.

### The check for HTTP_Request2 fails?

HTTP_Request2 is a PEAR package that is useful for making complicated HTTP requests easy.  This package can be downloaded and installed using PEAR's
built-in package installer.

```

pear install HTTP_Request2

```

### Why do I see warnings next to shmop and mbstring?

Currently ```shmop``` and ```mbstring``` extensions are not used in the proxy, however these extensions contain useful methods which may make this proxy speeder over time.

### I see errors regarding dates and times?

Make sure you've set the ```date.timezone``` value in the ```php.ini``` file.  See the below example.  For valid PHP timezones, see this [documentation](http://php.net/manual/en/timezones.php).


![time date](https://raw.github.com/phpmaps/resource-proxy/master/PHP/image_phpini_datetime.png?login=phpmaps&token=ee528e109deea0b144e3a0a59f0b619b)

### Why do I see fail messages after adding extensions?

Anytime you make a configuration change to PHP or Apache you must do an Apache restart for those changes to take effect.  Restarting can be accomplished
by finding the Apache executable and then using then issuing the proper command in the terminal, like below.  Proper commands are ```start```, ```stop``` and
```restart```. In this example, the Apache executable is ```apachectl```.

```
sudo /usr/sbin/apachectl restart

```

## Guide for Windows using IIS

### When I checked my configuration I saw the configuration contents?

It is important that others do not have access to your configuration file since a configuration file may contain sensitive content. The solution to this problem is update IIS so that ```.config``` and ```.sqlite``` file types will be filtered and not be shown to the end user.
Please refer to the IIS help documentation explaining
[how to set up request filtering on IIS](http://www.iis.net/configreference/system.webserver/security/requestfiltering/fileextensions).


### When I run the checker my browser displays raw PHP code?

When PHP is not installed or configured correctly this is the symptom.  On Windows there are several good 3rd party utilities that make installing and configuring PHP easy.
The utilities worth looking into are:

* [Microsoft's Web Platform Installer] (http://www.microsoft.com/web/downloads/platform.aspx)
* [Zend Server Project](http://www.zend.com/en/products/server/index)
* [WAMP](http://www.wampserver.com/)

Use the help documentation included in these products to get your PHP server up and running on Windows.

###PHP version has failed?

This is because the minimum proxy requirements are set to PHP version 5.4.2.  If this fails, the recommendation is to install the most recent stable PHP release.
Other PHP versions may work, however PHP version 5.4.2 contains important security updates.


### My directory is not writable?

To resolve this you'll need to change the directory to read/write where the checker.php file is located.  You may need administrative permissions to change this permission level.  The reason read/write is needed
is because this proxy writes to a log file and to a sqlite file.  This is usually accomplished by right click on the folder an

### OpenSSL and PDO Sqlite failed?

If you've chosen to install PHP using either of these utilities, OpenSSL and PDO Sqlite are a part of the PHP install.  However, these extensions need to be activated.  You can do this by uncommenting these lines in the ```php.ini``` file.

``` extension=php_openssl.dll ```
``` extension=php_pdo.dll ```

After modifying ```php.ini``` restart IIS and run the checker again.


### PEAR fails how do I resolve this?

If PEAR has failed, it's possible that your PEAR files do not exist or are not in a PHP include_path directory (a directory accessible to PHP). PHP include_paths are defined in the php.ini file via keyword include_path.

Run the below script in a web browser to display your PHP include_path directories or review your php.ini looking for keyword include_path. Once you identify your include path, this is where Pear install files should exist.

Use the following guide provided by Pear.  When the install asks where to install files, it's a good idea to use the defaults (unless you're comfortable working with Pear).


* [Install Pear on Windows](http://pear.php.net/manual/en/installation.getting.php)

### The check for HTTP_Request2 fails?

HTTP_Request2 is a PEAR package that is useful for making complicated HTTP requests easy.  This package can be downloaded and installed using PEAR's
built-in package installer.

```

pear install HTTP_Request2

```

### Contributing

Esri welcomes contributions from anyone and everyone. Please see our [guidelines for contributing](https://github.com/esri/contributing).


### License

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.



[](Esri Tags: PHP Proxy)
[](Esri Language: PHP)