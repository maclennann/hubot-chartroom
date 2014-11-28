/*jslint node:true,nomen:true,stupid:true*/
'use strict';

var fs = require('fs');
var path = require('path');

module.exports = function (robot, scripts) {
    var scriptsPath = path.resolve(__dirname, 'src');
    return fs.exists(scriptsPath, function (exists) {
        var script, _i, _len, _ref, _results;
        if (exists) {
            _ref = fs.readdirSync(scriptsPath);
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i += 1) {
                script = _ref[_i];
                if ((scripts !== null) && scripts.indexOf('*') < 0) {
                    if (scripts.indexOf(script) >= 0) {
                        _results.push(robot.loadFile(scriptsPath, script));
                    } else {
                        _results.push(undefined);
                    }
                } else {
                    _results.push(robot.loadFile(scriptsPath, script));
                }
            }
            return _results;
        }
    });
};
