/*jslint node:true,unparam:true,nomen:true*/
'use strict';
var path = require('path');

module.exports = function (robot) {
    var scriptsPath = path.resolve(__dirname, 'src');
    robot.loadFile(scriptsPath, 'chartroom.js');
};
