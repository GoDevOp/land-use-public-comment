<html>
<head><title>Prerequisites Checker</title></head>
<style>
body{
	margin-left:12px;
	margin-left:30px;
	margin-right:30px;
	margin-bottom:10px;
}
.requirements-div {
	margin-top:16px;
	margin-left:20px;
	margin-right:20px;
	margin-bottom:10px;
}
table {
	border: 1px solid #696969;
    width: 50%;
}
.pass {
	color:#3CB371;
}
.fail {
	color:#FF4500;
}
.warning {
	color:#FFA500;
}
</style>
<body>
<?php

error_reporting(0);

class Paths
{
	public $pearPath;
	public $requestsPath;
}

function include_exists($fileName){
	if (realpath($fileName) == $fileName) {
		return is_file($fileName);
	}
	if ( is_file($fileName) ){
		return true;
	}

	$paths = explode(PATH_SEPARATOR, get_include_path());

	foreach ($paths as $key => $path) {

		$rp = $path . DIRECTORY_SEPARATOR . $fileName;

		if (is_file($rp)) {

			if($fileName == 'PEAR' . DIRECTORY_SEPARATOR .'Registry.php'){

				$path = $rp;
			}

			if($fileName == 'HTTP' . DIRECTORY_SEPARATOR . 'Request2.php'){

				$path = $rp;
			}

			return array('result' => true, 'path' => $path);
		}
	}

	return false;
}

function pear_prerequisutes()
{
	$exists = include_exists('PEAR' . DIRECTORY_SEPARATOR .'Registry.php');
	if($exists['result'])
	{
		require_once 'PEAR/Registry.php';
		$reg = new PEAR_Registry();
		$packages = $reg->listPackages();
		if(in_array('http_request2', $packages))
		{
			$results = array('pear'=>"Pass", 'http_request2'=>"Pass", 'path'=>$exists['path']);
		}else{
			$results = array('pear'=>"Pass", 'http_request2'=>"Fail", 'path'=>$exists['path']);
		}
	}else{
		$results = array('pear'=>"Fail", 'http_request2'=>"Fail", 'path'=>$exists['path']);
	}
	return $results;
}

function http_requests2_exists()
{
	$exists = include_exists('HTTP' . DIRECTORY_SEPARATOR . 'Request2.php');

	if($exists['result'])
	{
		return array('result' => "Pass", 'path'=> $exists['path']);

	}else{

		return array('result' => "Fail", 'path'=> $exists['path']);

	}
}

function can_write()
{
	$dir = getcwd();
	$t = is_writable($dir);
	return $t;
}

function getShmopMessage($shmop)
{
	$message = null;
	if($shmop == true)
	{
		$message = "Pass";
	}else if($shmop == false){
		$message = "Warning";
	}else{
		$message = "Fail";
	}
	return $message;
}

function getMbstringMessage($mbstring)
{
	$message = null;
	if($mbstring == true)
	{
		$message = "Pass";
	}else if($mbstring == false){
		$message = "Warning";
	}else{
		$message = "Fail";
	}
	return $message;
}

function versionPhpCheck()
{
	if (version_compare(PHP_VERSION, '5.4.2') >= 0) {
		return "Pass";
	}else{
		return "Fail";
	}
}

$bool = array(true=>"Pass", false=>"Fail");
$version = versionPhpCheck();
$extensions = get_loaded_extensions();
$writeable = can_write();
$openssl = in_array('openssl', $extensions);
$pdo_sqlite = in_array('pdo_sqlite', $extensions);
$shmop = in_array('shmop', $extensions);
$shmop_message = getShmopMessage($shmop);
$mbstring = in_array('mbstring', $extensions);
$mbstring_message = getMbstringMessage($mbstring);
$pear = pear_prerequisutes();
$request2 = http_requests2_exists();


?>
<h2>Checks php proxy system requirements</h2>
<small>* Run test from a directory location that includes the proxy.php file on php server</small>
<br/><br/>
<p>Manually test your server configuration by clicking <a href="proxy.config">here</a>.  If you server configuration file displays, your server is <u>not</u> configured properly to use this PHP proxy (see guide for more details).<br/><br/>


<div class="requirements-div">
<table>

<tr>
<td><span>Check PHP version 5.4.2 or newer?</span></td>
<td><?php echo '<span class="'. strtolower($version) . '">' . $version . '</span>'; ?></td>
</tr>

<tr>
<td><span>Check if directory is writable?</span></td>
<td><?php echo '<span class="'. strtolower($bool[$writeable]) . '">' . $bool[$writeable] . '</span>'; ?></td>
</tr>

<tr>
<td><span>Check for OpenSSL extension?</span></td>
<td><?php echo '<span class="'. strtolower($bool[$openssl]) . '">' . $bool[$openssl] . '</span>'; ?></td>
</tr>

<tr>
<td><span>Check for PDO Sqlite extension?</span></td>
<td><?php echo '<span class="'. strtolower($bool[$pdo_sqlite]) . '">' . $bool[$pdo_sqlite] . '</span>'; ?></td>
</tr>

<tr>
<td><span>Check for shmop extension?</span></td>
<td><?php echo '<span class="'. strtolower($shmop_message) . '">' . $shmop_message . '</span>'; ?></td>
</tr>

<tr>
<td><span>Check for mbstring extension?</span></td>
<td><?php echo '<span class="'. strtolower($mbstring_message) . '">' . $mbstring_message . '</span>'; ?></td>
</tr>

<tr>
<td><span>Check for PEAR?</span></td>
<td><?php echo '<span class="'. strtolower($pear['pear']) . '">' . $pear['pear'] . '</span>'; ?></td>
</tr>

<tr>
<td><span>Check for HTTP_Request2? (PEAR Package)</span></td>
<td><?php echo '<span class="'. strtolower($request2['result']) . '">' . $request2['result'] . '</span>'; ?></td>
</tr>

</table>

<div>
<p><small><?php $inipath = php_ini_loaded_file(); echo "Loaded php.ini path:  <i>" . $inipath . "</i>"; ?></small></p>
<p><small><?php $pos = strripos($pear['path'], "/PEAR/Registry.php");  if($pos > 0){ echo "PEAR path: <i>" . substr($pear['path'],0,$pos) . "</i>"; } ?></small></p>
</div>

</div>
</body>
</html>