// All of the various robot brain operations that go on.
// I got tired of writing string-literal 'graphs' everywhere

/*jslint node:true*/
'use strict';

module.exports = {
    hemisphere: 'graphs',
    getGraphs: function (robot) {
        return robot.brain.get(this.hemisphere) || [];
    },
    setGraphs: function (robot, graphs) {
        robot.brain.set(this.hemisphere, graphs);
    },
    maybeGetSavedTarget: function (name, robot) {
        var graphs = this.getGraphs(robot);
        return graphs.filter(function (e) { return e.name === name; });
    },
    saveNewTarget: function (name, target, robot, server) {
        var graphs = this.getGraphs(robot);

        graphs.push({'name': name, 'target': target, 'server': server});
        this.setGraphs(robot, graphs);

        return graphs;
    },
    getIntendedTarget: function (name, from, robot) {
        var targets = this.maybeGetSavedTarget(name, robot),
            server;
        if (targets.length > 0) {
            name = targets[0].target;
            server = targets[0].server;
        }

        if (from && from !== "undefined") {
            name = name + "&from=" + from.trim();
        }

        return {server: server, target: name};
    }
};
