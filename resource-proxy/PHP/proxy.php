<?php

/**
 * PHP Proxy Client
 */

error_reporting(0);

session_start();

require_once 'HTTP/Request2.php';

class Proxy {

	/**
	 * Holds proxy configuration parameters
	 *
	 * @var array
	 */
	public $proxyConfig;

	/**
	 * Holds the referer assocated with client request
	 *
	 * @var string
	 */

	public $referer;

	/**
	 * Holds a collection of server urls listed in configution (keys same as keys in config, but lowercase).
	 *
	 * @var array
	 */

	public $serverUrls;

	/**
	 * Log object used for writing messages
	 *
	 * @var ProxyLog
	 */

	public $proxyLog;

	/**
	 * Holds the action assocated with the request (post, get)
	 *
	 * @var string
	 */

	public $proxyMethod;

	/**
	 * Holds the url being requested
	 *
	 * @var string
	 */

	public $proxyUrl;

	/**
	 * Holds the query string assocated with the request
	 *
	 * @var string
	 */

	public $queryString;

	/**
	 * Holds the query string with Url and all the Data with key values
	 *
	 * @var string
	 */

	public $proxyUrlWithData;

	/**
	 * Holds the data to be sent with a post request
	 *
	 * @var array
	 */

	public $proxyData;

	/**
	 * Holds the resource being requested (keys are the same keys in the serverUrl config file, except lowercase)
	 *
	 * @var array
	 */

	public $resource;

	/**
	 * Holds current resource being proxied where the array keys are the same keys in the serverUrl config file
	 *
	 * @var string
	 */

	public $resourceUrl;

	/**
	 * Holds the request configuration, see http://pear.php.net/manual/en/package.http.http-request2.config.php
	 *
	 * @var array
	 *
	 */

	public $requestConfig;

	/**
	 * Number of allowed attempts to get a new token
	 *
	 * @var int
	 */

	public $allowedAttempts = 3;

	/**
	 * Attempt count when getting a new token
	 *
	 * @var int
	 */

	public $attemptsCount = 0;

	/**
	 * Property indicating if an attempt has been made to get the token from the application session.
	 *
	 * @var boolean
	 */

	public $sessionAttempt = false;

	/**
	 * Holds url which is used in creating the session key
	 *
	 * @var string
	 */

	public $sessionUrl;


	/**
	 * Allowed application urls array is just an array of urls
	 *
	 * @var array
	 */

	public $allowedReferers;

	/**
	 * Holds the response
	 *
	 * @var HTTP_Request2_Response
	 */

	public $response;

	/**
	 * Holds a field to help debug booleans
	 *
	 * @var array
	 */

	public $bool = array(true=>"True", false=>"False");



	public function __construct($configuration, $log, $su) {

		$underMeterCap = null;

		$results = null;

		$canRequest = null;

		$this->proxyLog = $log;

		$this->proxyConfig = $configuration->proxyConfig;

		$this->serverUrls = $configuration->serverUrls;

		$this->setupClassProperties();

		if ($this->proxyConfig['mustmatch'] != null && $this->proxyConfig['mustmatch'] == true || $this->proxyConfig['mustmatch'] == "true") {

			if($this->isAllowedApplication() == false){

				header('Status: 200', true, 200);

				header('Content-Type: application/json');

				$exceededError = array(
						"error" => array("code" => 402,
						"details" => array("This is a protected resource.  Application access is restricted."),
						"message" => "Application access is restricted.  Unable to proxy request."
				));

				echo json_encode($exceededError);

				exit();

			}

			if ($this->canProcessRequest()) {

				$ratemeter = new RateMeter($this->resource['url'], $this->referer, $this->resource['ratelimit'], $this->resource['ratelimitperiod'], $this->proxyLog); //need to pass meter interval and meter cap

				$underMeterCap = $ratemeter->underMeterCap();

			} else {

				$this->proxyLog->log("Proxy could not resolve requested url - " . $this->proxyUrl . ".  Possible solution would be to update 'mustMatch', 'matchAll' or 'url' property in config.");

				header('Status: 200', true, 200);

				header('Content-Type: application/json');

				$configError = array(
						"error" => array("code" => 412,
								"details" => array("The proxy tried to resolve a prohibited or malformed 'url'.  The server does not meet one of the preconditions that the requester put on the request."),
								"message" => "Proxy failed due to configuration error."
						));

				echo json_encode($configError);

				exit();
			}

			if ($underMeterCap) {

				$this->runProxy();

			} else {

				$this->proxyLog->log("Rate meter exceeded by " . $_SERVER['REMOTE_ADDR']);

				header('Status: 200', true, 200);

				header('Content-Type: application/json');

				$exceededError = array(
						"error" => array("code" => 402,
						"details" => array("This is a metered resource, number of requests have exceeded the rate limit interval."),
						"message" => "Unable to proxy request for requested resource."
				));

				echo json_encode($exceededError);

				exit();
			}

		} else if($this->proxyConfig['mustmatch'] != null && $this->proxyConfig['mustmatch'] == false) {

			$this->runProxy();

		}else{

			$this->proxyLog->log("Malformed 'mustMatch' property in config");

			header('Status: 200', true, 200);

			header('Content-Type: application/json');

			$configError = array(
					"error" => array("code" => 412,
							"details" => array("Detected malformed 'mustMatch' property in configuration. The server does not meet one of the preconditions that the requester put on the request."),
							"message" => "Proxy failed due to configuration error."
					));

			echo json_encode($configError);

			exit();
		}

	}

	public function getResponse()
	{

		if(headers_sent()){

			foreach(headers_list() as $header){

				header_remove($header);
			}
		}

		foreach ($this->response->getHeader() as $headerName => $headerValue) {

			if($headerName == "content-type") {

				header($headerName .': '. $headerValue, true);
			}
			if($headerName == "e-tag") {

				header($headerName .': '. $headerValue, true);
			}
		}

		echo $this->response->getBody(); //Send the response back to the client.

		$this->proxyLog->log("Proxy complete");

		exit(0);
	}

	public function setupClassProperties()
	{
		$this->proxyLog->createBreak();

		try {

			if (!empty($_POST) && empty($_FILES)) { // Is it a POST without files?

				$this->proxyLog->log('POST detected');

				$this->proxyUrl = $_SERVER['QUERY_STRING'];

				$this->proxyData = $_POST;

				$this->proxyMethod = "POST";

			} else if (!empty($_POST) && !empty($_FILES)) { // Is it a POST with files?

				$this->proxyLog->log('FILES detected');

				$this->proxyUrl = $_SERVER['QUERY_STRING'];

				$this->proxyData = $_POST;

				$this->proxyMethod = "FILES";

			} else if (empty($_POST) && empty($_FILES)) { // It must be a GET!

				$this->proxyLog->log('GET detected');

				$p = preg_split("/\?/", $_SERVER['QUERY_STRING']); // Finds question marks in query string

				$this->proxyUrl = $p[0];

				$this->proxyUrlWithData = $_SERVER['QUERY_STRING'];

				$this->proxyMethod = "GET";
			}

		} catch (Exception $e) {


			$this->proxyLog->log("Proxy could not detect request method action type (POST, GET, FILES).");
		}

	}

	public function formatWithPrefix($url)
	{
		if(substr($url, 0, 4) != "http"){

			if(substr($this->proxyUrl, 0, 5) == "https") {

				$url = "https://" . $url;

			}else{

				$url = "http://" . $url;
			}

		}

		return $url;
	}

	public function canProcessRequest()
	{
		$canProcess = false;

		if ($this->proxyConfig['mustmatch'] == false || $this->proxyConfig['mustmatch'] === "false") {

			$canProcess = true;

		} else if ($this->proxyConfig['mustmatch'] == true || $this->proxyConfig['mustmatch'] == "true") {

			foreach ($this->serverUrls as $key => $value) {

				$s = $value['serverurl'][0];

				$s['url'] = $this->formatWithPrefix($s['url']);

				if(is_string($s['matchall'])){

					$mustmatch = strtolower($s['matchall']);

					$s['matchall'] = $mustmatch;

				}

				if ($s['matchall'] == true || $s['matchall'] === "true") {

					$urlStartsWith = $this->startsWith($this->proxyUrl, $s['url']);

					if ($urlStartsWith){

						$this->resource = $s;

						$this->sessionUrl = $this->resource['url'];

						$canProcess = true;

						return $canProcess;

					}else{

						//Goes here if startsWith is false
					}

				} else if ($s['matchAll'] == false || $s['matchall'] === "false"){

					$isEqual = $this->equals($this->proxyUrl, $s['url']);

					if($isEqual){

						$this->resource = $s;

						$this->sessionUrl = $this->resource['url'];

						$canProcess = true;
					}

				}
			}

		} else {

			$this->proxyLog->log("Proxy has failed. Review configuration file for errors.");

			$canProcess = false;
		}

		return $canProcess;
	}


	public function getRequestConfig()
	{

		return $this->requestConfig;

	}

	public function setRequestConfig($item)
	{
		/** Documentation: http://pear.php.net/manual/en/package.http.http-request2.config.php **/

		if(!isset($item))
		{

			$this->requestConfig = array(
				//'proxy_host'        => 'proxy.example.com',
				//'proxy_port'        => 3128,
				//'proxy_user'        => 'myuser',
				//'proxy_password'    => 'mypass',
				//'proxy_auth_scheme' => HTTP_Request2::AUTH_DIGEST,
				'ssl_verify_peer' => false,
				'ssl_verify_host' => false
				);

		} else {

			$this->requestConfig = $item;
		}
	}

	public function runProxy()
	{


		$this->setRequestConfig();

		if($this->proxyMethod == "FILES"){

			$this->proxyFiles();

		}else if($this->proxyMethod == "POST"){

			$this->proxyPost();

		}else if($this->proxyMethod == "GET"){

			$this->proxyGet();

		}

		$isUnauthorized = $this->isUnauthorized();

		if($isUnauthorized === true) {

			//Let's try to get a new token since authorization failed

			if(isset($this->sessionAttempt) && $this->sessionAttempt === false){

				if(isset($_SESSION['token_for_' . $this->sessionUrl])) //Try to get token from session
				{

					$this->sessionAttempt = true;

					$token = $_SESSION['token_for_' . $this->resource['url']];

					$this->proxyLog->log("Atempt to use session token");

					$this->appendToken($token);

					$this->runProxy();

				}else{

					$this->sessionAttempt = true;

					$this->proxyLog->log("Token not in session");

					$this->runProxy();
				}

			}else{

				if($this->attemptsCount < $this->allowedAttempts)
				{
					$this->attemptsCount++;

					$this->proxyLog->log("Retry attempt " . $this->attemptsCount . " of " . $this->allowedAttempts);

					$token = $this->getNewTokenIfCredentialsAreSpecified();

					$this->appendToken($token);

					if($this->attemptsCount == $this->allowedAttempts) //Let's give up and take steps to remove anything that may have been put into the session
					{

						$this->proxyLog->log("Removing session value");

						unset($_SESSION['token_for_' . $this->sessionUrl]);
					}

					$this->runProxy();

				}

			}
		}else{

			if($this->response->getStatus() === 200) {

				$this->getResponse();

			}

			$this->getResponse();
		}

		return true;
	}

	public function isUnauthorized()
	{

		$isUnauthorized = false;

		$jsonData = json_decode($this->response->getBody());

		$errorCode = $jsonData->{'error'}->{'code'};

		if($errorCode == 499 || $errorCode == 498)
		{
			$isUnauthorized = true;

			$this->proxyLog->log("Authorization failed : " . $this->response->getBody());

		}else{

			$isUnauthorized = false;

			$this->proxyLog->log("Ok to proxy");

		}

		return $isUnauthorized;
	}



	private function appendToken($token)
	{
		if($this->proxyMethod == 'POST' || $this->proxyMethod == 'FILES')
		{

			if(array_key_exists("token", $this->proxyData))
			{
				$this->proxyData["token"] = $token;

			}else{

				array_merge($this->proxyData, array("token" => $token));

			}

		}else{

			$pos = strripos($this->proxyUrlWithData, "&token=");

			if($pos > 0)
			{

				$this->proxyUrlWithData = substr($this->proxyUrlWithData,0,$pos) . "&token=" . $token; //Remove old tokens.

			}else{

				$this->proxyUrlWithData = $this->proxyUrlWithData . "&token=" . $token;

			}

		}
	}



	public function proxyGet() {

		try {

			$request = new HTTP_Request2($this->proxyUrlWithData, HTTP_Request2::METHOD_GET, $this->getRequestConfig());

			$request->setHeader(array('Referer' => $this->referer));

			$this->response = $request->send();

			return;

		} catch (Exception $e) {

			$this->proxyLog->log($e->getMessage());
		}
	}

	public function proxyPost() {

		try {

			$request = new HTTP_Request2($this->proxyUrl, HTTP_Request2::METHOD_POST, $this->getRequestConfig());

			$request->addPostParameter($this->proxyData);

			$request->setHeader(array('Referer' => $this->referer));

			$this->response = $request->send();

			return;

		} catch (Exception $e) {

			$this->proxyLog->log($e->getMessage());
		}
	}

	public function proxyFiles() {

		$request = new HTTP_Request2($this->proxyUrl, HTTP_Request2::METHOD_POST, $this->getRequestConfig());

		$request->addPostParameter($this->proxyData);

		$request->setHeader(array('Referer' => $this->referer));

		foreach ($_FILES as $key => $value) {

			try {

				if ($value["error"] == UPLOAD_ERR_OK) {

					$handle = fopen($value['tmp_name'], "r");

					$request->addUpload($value["name"], $handle, $value["name"], 'application/octet-stream');

					$this->response = $request->send();

					return;
				}

			} catch (Exception $e) {

				$this->proxyLog->log($e->getMessage());
			}
		}
	}

	function startsWith($requested, $needed)
	{

		return stripos($requested, $needed) === 0;

	}

	function contains($haystack, $needle)
	{

		return stripos($haystack, $needle) !== false ? true : false;

	}

	function equals($string, $anotherstring)
	{

		return $string == $anotherstring;

	}


	public function isUserLogin() {

		if (isset($this->resource['username']) && isset($this->resource['password'])) {

			return true;
		}

		return false;
	}

	public function isAppLogin() {

		if (isset ( $this->resource['clientid']) && isset ($this->resource['clientsecret'])) {

			return true;

		}

		return false;
	}

	public function exchangePortalTokenForServerToken($portalToken, $su) {

		$pos = strripos($this->resource['oauth2endpoint'], "/oauth2");

		$exchangeUri = substr($this->resource['oauth2endpoint'],0,$pos) . "/generateToken";

		$tokenResponse = $this->getToken($exchangeUri, array(
				'token' => $portalToken,
				'serverURL' => $this->proxyUrl,
				'f' => 'json'
		));

		$tokenResponse = json_decode($tokenResponse, true);

		$token = $tokenResponse['token'];

		return $token;


	}

	function getNewTokenIfCredentialsAreSpecified() {

		$this->sessionUrl = $this->resource['url']; //Store url in local variable b/ later we may tweak url

		$token = null;

		$isUserLogin = $this->isUserLogin();

		$isAppLogin = $this->isAppLogin();

		if ($isUserLogin || $isAppLogin) {

			if ($isAppLogin) {

				$token = $this->doAppLogin();


			} else if($isUserLogin) {

				$token = $this->doUserPasswordLogin();

				$this->proxyLog->log("Using a 60 minute token");
			}

		}else{

			$this->proxyLog->log("Failed getting new token");
		}

		try
		{

			$this->proxyLog->log('Adding token to session');

			$_SESSION['token_for_' . $this->sessionUrl] = $token; //Use PHP sessions, to make less token requests

		}catch(Exception $e){

			$this->proxyLog->log("Error setting session: " . $e);
		}

		return $token;
	}

	public function doUserPasswordLogin() {

		$this->proxyLog->log("Resource secured via ArcGIS Server security");

		$infoUrl = $this->formatResourceUrl();

		if (isset($infoUrl)) {

			$infoResponse = $this->getToken($infoUrl,array('f' => 'json'));

			$infoResponse = json_decode($infoResponse, true);

			$tokenServiceUri = $infoResponse['authInfo']['tokenServicesUrl'];

			$this->proxyLog->log("Got token enpoint");

			if (isset($tokenServiceUri)) {

				$tokenResponse = $this->getToken($tokenServiceUri, array (
						'request' => 'getToken',
						'f' => 'json',
						'referer' => $this->referer,
						'expiration' => 60,
						'username' => $this->resource['username'],
						'password' => $this->resource['password']
				));

				$tokenResponse = json_decode($tokenResponse, true);

				$token = $tokenResponse['token'];

			}else {

				$this->proxyLog->log("Token endpoint from " . $infoUrl . "failed.");
			}
		}
		return $token;
	}

	public function formatResourceUrl() {

		if (substr($this->resource['url'], -4) == '.com' ||
		substr($this->resource['url'], -4) == '.org' ||
		substr($this->resource['url'], -4) == '.gov'||
		substr($this->resource['url'], -4) == '.net') //Help folks who use the domain name ie. https://route.arcgis.com
		{
			if (substr($this->resource['url'], -1) != '/')
			{
				$this->resource['url'] = $this->resource['url'] . "/arcgis/rest";

			}else{

				$this->resource['url'] = $this->resource['url'] . "arcgis/rest";
			}
		}

		$pos = strripos($this->resource['url'], "/rest");

		$infoUrl = substr($this->resource['url'],0,$pos) . "/rest/info";

		return $infoUrl;
	}



	public function doAppLogin()
	{

		$pos = strripos($this->resource['oauth2endpoint'], "/oauth2");

		$this->resource['oauth2endpoint'] = isset($this->resource['oauth2endpoint']) ? $this->resource['oauth2endpoint'] : "https://arcgis.com/sharing/oauth2/";

		if (substr($this->resource['oauth2endpoint'], -1) != '/')
		{
			$this->resource['oauth2endpoint'] = $this->resource['oauth2endpoint'] . "/";
		}

		$this->proxyLog->log("Resource secured via OAuth");

		$tokenResponse = $this->getToken('https://arcgis.com/sharing/oauth2/token?', array(
				'client_id' => $this->resource['clientid'],
				'client_secret' => $this->resource['clientsecret'],
				'grant_type' => 'client_credentials',
				'f' => 'json'
		));

		$tokenResponse = json_decode($tokenResponse, true);

		$token = $tokenResponse['access_token'];

		if (!empty($token) || $token != null )
		{
			$token = $this->exchangePortalTokenForServerToken($token, $this->resource['url']);
		}

		return $token;
	}


	public function getToken($url = '', $params = array()) {


		$request = new HTTP_Request2($url, HTTP_Request2::METHOD_POST, $this->getRequestConfig()); //Using POST now

		$request->addPostParameter($params);

		$request->setHeader(array('Referer' => $this->referer));

		try {

			$response = $request->send();

			if ($response->getStatus() != 200) {

				$this->proxyLog->log('Unexpected status getting token : ' . $response->getStatus() . ' ' . $response->getReasonPhrase());

			}else{

				$this->proxyLog->log('Token obtained');

			}

			return $response->getBody();

		} catch (HTTP_Request2_Exception $e) {

			$this->proxyLog->log($e->getMessage());
		}

	}

	public function isAllowedApplication()
	{

		if(in_array("*",$this->proxyConfig['allowedreferers'])){

			$this->referer = $_SERVER['SERVER_NAME']; //This is to enable browser testing when * is used

			$isAllowedApplication = true;

			return $isAllowedApplication;

		}else{

			$this->referer = $_SERVER['HTTP_REFERER'];

		}

		$isAllowedApplication = false;

		$domain = substr($_SERVER['HTTP_REFERER'], strpos($this->referer, '://') + 3);

		$domain = substr($domain, 0, strpos($domain, '/'));

		if (in_array($domain, $this->proxyConfig['allowedreferers'])) {

			$isAllowedApplication = true;

		}else{

			$this->proxyLog->log("Attempt made to use this proxy from " . $this->referer . " and " . $_SERVER['REMOTE_ADDR']);

		}

		return $isAllowedApplication;

	}

	function __destruct()
	{

	}
}




class ProxyLog {

	public $timeFormat = 'm-d-y H:i:s';

	public $seperator = ' | ';

	public $eol = "\r\n";

	public $indent = " ";

	public $proxyConfig;


	public function __construct($configuration = null) {

		if($configuration != null){

			$this->proxyConfig = $configuration->proxyConfig;

			$this->addLogLevel();

		}else{

			throw new Exception ('Problem creating log.');
		}

	}

	 private function addLogLevel() {

		if(!array_key_exists($this->proxyConfig['loglevel'])) { //Is there a logLevel in the proxyConfig properties (probably not)?

			if(!isset($this->proxyConfig['logfile']))
			{
				$this->proxyConfig = array_merge(array('loglevel' => 0), $this->proxyConfig);

			}else{
				$this->proxyConfig = array_merge(array('loglevel' => 0), $this->proxyConfig);
			}

		}else if(!isset($this->proxyConfig['loglevel'])) {

			if($this->proxyConfig['logfile'] == null) //Is there a logLevel property in the proxyConfig without a value? If so we set it to 0 when logPath is null.
			{
				$this->proxyConfig['loglevel'] = 0;

			}
		}

	 }


	public function write($m)
	{

		if (isset($this->proxyConfig['logfile'])) {

			try {

				$fh = null;

				$fh = fopen($this->proxyConfig['logfile'], (file_exists($this->proxyConfig['logfile'])) ? 'a' : 'w');

				if (is_writable($this->proxyConfig['logfile'])) {

					fwrite($fh, $this->eol);

					fwrite($fh, $this->getTime());

					//fwrite($fh, $this->seperator);

					//fwrite($fh, $_SERVER['HTTP_REFERER']);

					fwrite($fh, $this->seperator);

					fwrite($fh, $m);

				}else{

					header('Status: 200', true, 200);

					header('Content-Type: application/json');

					$configError = array(
							"error" => array("code" => 412,
									"details" => array("Detected malformed 'logFile' in configuration.  Make sure this app has write permissions to specified log file in configuration.  The server does not meet one of the preconditions that the requester put on the request."),
									"message" => "Proxy failed due to configuration error."
							));

					echo json_encode($configError);

					exit();

				}

				fclose($fh);

			} catch (Exception $e) {

				$this->log($e->getMessage());

			}
		} else {

			header('Status: 200', true, 200);

			header('Content-Type: application/json');

			$configError = array(
					"error" => array("code" => 412,
							"details" => array("Detected malformed 'logFile' in configuration.  Make sure this app has write permissions to specified log file in configuration.  The server does not meet one of the preconditions that the requester put on the request."),
							"message" => "Proxy failed due to configuration error."
					));

			echo json_encode($configError);

			exit();

		}
	}

	public function createBreak()
	{

		if ($this->proxyConfig['loglevel'] == 0 || $this->proxyConfig['loglevel'] == 2) {

			if (isset($this->proxyConfig['logfile'])) {

				try {

					$fh = null;

					$fh = fopen($this->proxyConfig['logfile'], (file_exists($this->proxyConfig['logfile'])) ? 'a' : 'w');

					if (is_writable($this->proxyConfig['logfile'])) {

						fwrite($fh, $this->eol);

						fwrite($fh, ' ');

					}else{

						header('Status: 200', true, 200);

						header('Content-Type: application/json');

						$configError = array(
								"error" => array("code" => 412,
										"details" => array("Detected malformed 'logFile' in configuration.  Make sure this app has write permissions to specified log file in configuration.  The server does not meet one of the preconditions that the requester put on the request."),
										"message" => "Proxy failed due to configuration error."
								));

						echo json_encode($configError);

						exit();

					}

					fclose($fh);

				} catch (Exception $e) {

					header('Status: 200', true, 200);

					header('Content-Type: application/json');

					$configError = array(
							"error" => array("code" => 412,
									"details" => array("Could not write to log.  Make sure this app has write permissions to specified log file in configuration.  The server does not meet one of the preconditions that the requester put on the request."),
									"message" => "Proxy failed due to configuration error."
							));

					echo json_encode($configError);

					exit();

				}
			} else {

				header('Status: 200', true, 200);

				header('Content-Type: application/json');

				$configError = array(
						"error" => array("code" => 412,
								"details" => array("Detected malformed 'logFile' in configuration.  Make sure this app has write permissions to specified log file in configuration.  The server does not meet one of the preconditions that the requester put on the request."),
								"message" => "Proxy failed due to configuration error."
						));

				echo json_encode($configError);

				exit();

			}

		}

	}


	public function log($message)
	{

		if ($this->proxyConfig['loglevel'] == 0) {

			$this->write($message); //Writes messages and errors to logs

		} elseif ($this->proxyConfig['loglevel'] == 1) {

			echo $message; //Show proxy errors and messages in browser console (should only be used when looking for errors)

		} elseif ($this->proxyConfig['loglevel'] == 2) {

			$this->write($message);  //Writes messages and errors to logs

			echo $message; //Show proxy errors and messages in browser console (should only be used when looking for errors)

		} elseif ($this->proxyConfig['loglevel'] == 3) {

			return; //No logging
		}

	}

	public function getTime() {

		return date($this->timeFormat);
	}

	function __destruct()
	{

	}

}

class RateMeter
{
	/**
	 * Holds proxy log
	 *
	 * @var string
	 * @access public
	 */
	public $proxyLog;

	/**
	 * Holds serverurl property
	 *
	 * @var string
	 * @access public
	 */
	public $serverUrl;

	/**
	 * Ip property
	 *
	 * @var string
	 * @access public
	 */
	public $ip;

	/**
	 * Time property
	 *
	 * @var string
	 * @access public
	 */

	public $time;

	/**
	 * Stores microtime as property allowing for fractional seconds
	 *
	 * @var string
	 * @access public
	 */

	public $microtime;

	/**
	 * Referer
	 *
	 * @var string
	 * @access public
	 */
	public $referer;


	/**
	 * Directory property
	 *
	 * @var string
	 * @access public
	 */
	public $directory;

	/**
	 * Sqlite database name property
	 *
	 * @var string
	 * @access public
	 */
	public $dbname;

	/**
	 * Sqlite connection property
	 *
	 * @var string
	 * @access public
	 */
	public $con;

	/**
	 * Exceeds meter property
	 *
	 * @var bool
	 * @access public
	 */
	public $underMeterCap;


	/**
	 * Meter cap property
	 *
	 * @var int
	 * @access public
	 */

	public $cap;

	/**
	 * Meter interval property
	 *
	 * @var int
	 * @access public
	 */
	public $interval;

	/**
	 * Holds the rate value
	 *
	 * @var int
	 * @access public
	 */
	public $allowedClickRate;

	/**
	 * Holds the count value
	 *
	 * @var int
	 * @access public
	 */
	public $clickRate;


	/**
	 * Set RateMeter::properties
	 *
	 * @var string
	 * @param url
	 */



	public function __construct ($url, $trackback, $limit, $period, $log) {

		$this->proxyLog = $log;

		$this->resourceUrl = $url;

		$this->referer = $trackback;

		$this->cap = $limit;

		$this->interval = $period;  //Interval should always be one second, but is configurable

		$this->ip = $_SERVER['REMOTE_ADDR'];

		$this->dbname = 'proxy_app.sqlite'; // This string may need to come config

		$this->con = $this->getRateMeterDatabase();

	}

	public function getConnection()
	{
		if($this->con != null)
		{
			return $this->con;

		}else{

			$this->proxyLog->log('Cannot get a connection');

			header('Status: 200', true, 200);

			header('Content-Type: application/json');

			$serverError = array(
					"error" => array("code" => 500,
							"details" => array("Cannot make a Sqlite database connection.  Check to see if it exists.  If it does, consider backing up and then deleting sqlite database."),
							"message" => "Proxy failed could not connect to sqlite database."
					));

			echo json_encode($serverError);

			exit();
		}
	}

	public function getRateMeterDatabase()
	{
		try {

			if(file_exists($this->dbname))
			{
				$db = new PDO("sqlite:" . $this->dbname);

				return $db;
			}

		}
		catch(ErrorException $e)
		{
			$this->proxyLog->log($e->getMessage());

			return null;
		}

		try {

			$db = new PDO("sqlite:" . $this->dbname);

			chmod($this->dbname,0777);

			if($db != null)
			{

				$this->createResourceIpTable($db);

			}

			return $db;

		}
		catch(PDOException $e)
		{
			$this->proxyLog->log($e->getMessage());

			return null;
		}
	}

	public function createResourceIpTable($db)
	{
		try {

			$db->beginTransaction();

			$db->exec("CREATE TABLE IF NOT EXISTS ips (
                    id INTEGER PRIMARY KEY,
                    url VARCHAR(255),
                    ip VARCHAR(50),
                    time INTEGER)");

			$db->commit();
		}
		catch(PDOException $e)
		{
			$this->proxyLog->log($e->getMessage());
		}

		try {

			$db->beginTransaction();

			$db->exec('CREATE INDEX id ON ips (id)');

			$db->exec('CREATE INDEX url ON ips (url)');

			$db->exec('CREATE INDEX ip ON ips (ip)');

			$db->exec('CREATE INDEX time ON ips (time)');

			$db->commit();

			$this->proxyLog->log("Index created");

		}
		catch(PDOException $e)
		{
			$this->proxyLog->log($e->getMessage());
		}

	}

	public function selectLastRequestTime() {

		$this->microtime = microtime(true);

		$db = $this->getConnection();

		try {

			$sth = $db->prepare("SELECT time, id FROM ips WHERE url = :url AND ip = :ip");

			$db->beginTransaction();

			$sth->execute(array(':url' => $this->resourceUrl, ':ip' => $this->ip)) or die($this->getDatabaseErrorMessage());

			$db->commit();

			$r = $sth->fetchAll();

			return $r;

		}
		catch(PDOException $e)
		{
			$this->proxyLog->log($e->getMessage());
		}
	}

	public function updateResourceIp($id, $time)
	{
		$db = $this->getConnection();

		try {

			$sth = $db->prepare("UPDATE ips SET id=:id, url=:url, ip=:ip, time=:time WHERE id = :id");

			$db->beginTransaction();

			$sth->bindValue(':id', $id);

			$sth->bindValue(':url', $this->resourceUrl);

			$sth->bindValue(':ip', $this->ip);

			$sth->bindValue(':time', $time);

			$sth->execute() or die($this->getDatabaseErrorMessage());

			$db->commit();
		}
		catch(PDOException $e)
		{
			$this->proxyLog->log($e->getMessage());
		}

	}

	public function insertResourceIp()
	{
		$db = $this->getConnection();

		try {

			$sql = "INSERT INTO ips (id, url, ip, time) VALUES (:id,:url,:ip,:time)";

			$q = $db->prepare($sql);

			$db->beginTransaction();

			$q->bindValue(':id', null);

			$q->bindValue(':url', $this->resourceUrl);

			$q->bindValue(':ip', $this->ip);

			$q->bindValue(':time', $this->microtime);

			$q->execute() or die($this->getDatabaseErrorMessage());

			$db->commit();
		}
		catch(PDOException $e)
		{
			$this->proxyLog->log($e->getMessage());
		}

	}

	public function rateMeterCleanup($time)
	{
		$db = $this->getConnection();

		$sth = $db->prepare("DELETE FROM ips WHERE time < :time");

		try {

			$db->beginTransaction();

			$sth->execute(array(':time' => $time));

			$db->commit();

			if ($sth->rowCount() > 0) {

				$this->proxyLog->log('Performed 14 day cleanup on sqlite database');

			}else{

				$this->proxyLog->log('Cleanup occurred but no rows have been removed');
			}

		} catch (Exception $e) {

			$this->proxyLog->log($e->getMessage());

		}

	}


	public function checkRateMeter()
	{

		$result = $this->selectLastRequestTime();

		if ($result != null || count($result) > 0) {

			$id = $result[0]['id'];

			$timeOfLastRequest = $result[0]['time'];

			$totalSeconds = $this->getTimeDifferenceInSeconds($timeOfLastRequest);

			$this->allowedClickRate = ($this->cap / $this->interval); //Allowed clicks per second. Assumes interval in config is seconds (if minutes we need to divide by 60)

			$this->clickRate = $totalSeconds * $this->allowedClickRate;

			$this->updateResourceIp($id, $this->microtime);

			if ($this->clickRate <= $this->allowedClickRate) { //Is click rate lower then the allowed rate? If yes, exceeding the click rate limmit. If yes, someone may be trying to squeeze in more requests allowed per second.

				$this->underMeterCap = false;

				$secondPerDay = 86400;

				$twoWeeks = 14 * $secondPerDay; //Another option would be to check the sqlite file size and then do a cleanup

				$twoWeeksAndOlder = $this->microtime - $twoWeeks;

				$this->rateMeterCleanup($twoWeeksAndOlder);

				return;

			}else{

				$this->underMeterCap = true;

				return;
			}

		}else{

			$this->insertResourceIp(); //Add item to ips table.

			$this->underMeterCap = true;
		}

	}

	public function getTimeDifferenceInSeconds($firstTime, $secondTime)
	{


		if($firstTime == null)
		{
			$this->proxyLog->log("No time value was returned from 'ips' table in Sqlite database!");

			header('Status: 200', true, 200);

			header('Content-Type: application/json');

			$serverError = array(
					"error" => array("code" => 500,
							"details" => array("No time value was returned from 'ips' table in Sqlite database.  Consider backing up and then deleting sqlite database."),
							"message" => "Proxy failed due to missing value in database."
					));

			echo json_encode($serverError);

			exit();

		}

		if($secondTime == null)
		{
			$secondTime = microtime(true);
		}

		$time = array($firstTime, $secondTime);

		sort($time);

		$diff = $time[1] - $time[0];

		return $diff;

	}


	public function underMeterCap()
	{
		$this->checkRateMeter();

		if($this->underMeterCap)
		{
			return true;

		}else{

			return false;
		}
	}

	public function getDatabaseErrorMessage()
	{
		$this->proxyLog->log("A database error occured.");

		header('Status: 200', true, 200);

		header('Content-Type: application/json');

		$dbError = array(
				"error" => array("code" => 500,
						"details" => array("A database error occured.  Consider backing up and then deleting sqlite database."),
						"message" => "Proxy failed due to database error."
				));

		return json_encode($dbError);
	}

	function __destruct()
	{

	}

}

class ProxyConfig {

	public $proxyConfig;

	public $serverUrls;

	public function __construct()
	{

	}

	public function useXML()
	{

		$xmlParser = new XmlParser();

		$proxyconfig = $xmlParser->results[0]['proxyconfig'];

		$proxyconfig = $this->lowercaseArrayKeys($proxyconfig, CASE_LOWER);

		$proxyConfig = $this->setProxyConfig($proxyconfig);

		$serverUrls = $xmlParser->results[0]['childrens'][0]['childrens'];

		$serverUrls = $this->lowercaseArrayKeys($serverUrls, CASE_LOWER);

		$normalizeServerUrls = $this->normalizeServerUrls($serverUrls);

		$this->setServerUrls($normalizeServerUrls);

		$allowedReferers = explode(",", $this->proxyConfig['allowedreferers']); //Change XML allowedreferers from string to array

		$this->proxyConfig['allowedreferers'] = $allowedReferers; //Add above array to the proxyconfig property

	}

	function lowercaseArrayKeys($array, $case)
	{
		$array = array_change_key_case($array, $case);

		foreach ($array as $key => $value) {

			if ( is_array($value) ) {

				$array[$key] = $this->lowercaseArrayKeys($value, $case);

			}
		}

		return $array;
	}


	public function normalizeServerUrls($serverUrls) {

		$formatedData = [];

		foreach ($serverUrls as $key => $item) {

			if(is_array($item)) {

				foreach ($item as $k => $v) {

					if(is_array($v)) {

						$normal = array("serverurl" => array(0=>$v));

						$formatedData[] = $normal;

					}

				}
			}
		}

		return $formatedData;
	}


	public function useJSON()
	{
		try {

			$c = file_get_contents("proxy.config");

			$configJson = json_decode($c, true);

			$config = $this->lowercaseArrayKeys($configJson, CASE_LOWER);

			$this->setProxyConfig($config['proxyconfig'][0]);

			$this->setServerUrls($config['serverurls']);

		}catch (Exception $e) {

			$this->proxyLog->log($e->getMessage());

		}

	}

	public function __set($property, $value)
	{
		$method = 'set' . $value;

		if (!method_exists($this, $method))
		{

			throw new Exception('Error in proxy config.');
		}

		$this->$method($value);
	}

	public function __get($property)
	{
		$method = 'get' . $property;

		if (!method_exists($this, $method))
		{
			throw new Exception('Error in proxy config.');
		}

		return $this->$method();
	}

	public function setOptions(array $options)
	{
		$methods = get_class_methods($this);

		foreach ($options as $key => $value) {

			$method = 'set' . ucfirst($key);

			if (in_array($method, $methods))
			{
				$this->$method($value);
			}
		}

		return $this;
	}

	public function getServerUrls()
	{

		return $this->serverUrls;

	}

	public function setServerUrls($item)
	{

		$this->serverUrls = $item;

		return $this;

	}

	public function getProxyConfig()
	{

		return $this->proxyConfig;

	}

	public function setProxyConfig($item)
	{

		$this->proxyConfig = $item;

		return $this;
	}

	function __destruct()
	{

	}

}

class XmlParser
{
	public $results = array();

	public $parser;

	public $xmlString;

	public $file;

    function XmlParser($f = "proxy.config")
    {
        if(trim($f) != "") { $this->loadFile($f);}
    }

    function loadFile($f)
    {
        $data = file($f);

        $xml = implode("\n", $data);

        return $this->parse($xml);
    }

	function parse($xml)
	{
		$this->parser = xml_parser_create();

		xml_set_object($this->parser, $this);

		xml_set_element_handler($this->parser, "tagStart", "tagEnd");

		$this->xmlString = xml_parse($this->parser,$xml);

		if(!$this->xmlString)
		{
			die(sprintf("Config XML error: %s at line %d",
					xml_error_string(xml_get_error_code($this->parser)),
					xml_get_current_line_number($this->parser))); //This is before we have the log location
		}

		xml_parser_free($this->parser);

		return $this->results;
	}

	function tagStart($parser, $name, $attrs)
	{
		$attrs = array_change_key_case($attrs, CASE_LOWER);

		$tag = array(strtolower($name) => $attrs);

		array_push($this->results, $tag);
	}


	function tagEnd($parser, $name)
	{

		//http://www.php.net/manual/en/function.xml-parse.php

		$this->results[count($this->results)-2]['childrens'][] = $this->results[count($this->results)-1];

		if(count($this->results[count($this->results)-2]['childrens'] ) == 1)
		{
			$this->results[count($this->results)-2]['firstchild'] =& $this->results[count($this->results)-2]['childrens'][0];
		}

		array_pop($this->results);
	}

}


$proxyConfig = new ProxyConfig();

$proxyConfig->useXML();

//$proxyConfig->useJSON();

$proxyLog = new ProxyLog($proxyConfig);

$proxyObject = new Proxy($proxyConfig, $proxyLog);

$proxyObject->getResponse();

?>