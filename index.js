/*jslint node:true,unparam:true,nomen:true*/
'use strict';

var fs = require('fs');
var path = require('path');

module.exports = function (robot, scripts) {
    var scriptsPath = path.resolve(__dirname, 'src');
    robot.loadFile(scriptsPath, 'chartroom.js');
};
