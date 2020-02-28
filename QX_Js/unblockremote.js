#2020.02.28
/**
 * @supported F7664BCEDFBE
 */

/*
QX
简化设备ID流程
[rewrite_local]
^https:\/\/(raw.githubusercontent|\w+\.github)\.(com|io)\/.*\.js$ url script-response-body https://raw.githubusercontent.com/MrPan109/Self-use/master/QX_Js/unblockremote.js
~~~~~~~~~~~~~~~~
MITM = raw.githubusercontent.com, *.github.io,
~~~~~~~~~~~~~~~~
*/

var body = $response.body;
body = '\/*\n@supported F7664BCEDFBE\n*\/\n' + body;

$done(body);
