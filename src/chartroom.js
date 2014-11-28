// Description:
//   Fetch a graph from graphite via render URL, upload to a
//   designated room, then share the URL to whichever room/user requested it.
//
// Dependencies:
//   "request": "~2.48.0",
//   "node-promise": "*"
//
// Configuration:
//   GRAPHITE_SERVER: the hostname/ip of your graphite server,
//   GRAPH_ROOM_ID: the API ID of a HipChat room all graphs will first be uploaded to,
//   HIPCHAT_TOKEN: an API token for your hubot can use for uploading to hipchat
//
// Commands:
//   hubot graph me <graphname or render query> (from <time code>) - fetches a graph by saved name or render api querystrings
//   hubot save grah <name> as <render query> - save a graph to hubot with the desired render api querystrings
//   hubot list graphs - show all saved graphs
//   hubot forget all graphs - deletes all saved graphs
//   hubot forget graph <name> - delete the named graph
//
// Notes:
//   If your Graphite is accessible by the outside world (e.g. HipChat can get to it
//   to generate thumbnails, and users can get to the graphs wherever they are),
//   you're probably better off using hubot-graphite.
//
//  This script's utility is in uploading the image to HipChat (which uploads it to S3)
//  so HipChat can generate a thumbnail and all users can view it.
//
// Author:
//   maclennann

/*jslint node:true*/
'use strict';

// Graphite and HipChat configuration
var GRAPHITE_SERVER = process.env.GRAPHITE_SERVER;
var GRAPH_ROOM_ID = process.env.GRAPH_ROOM_ID;
var HIPCHAT_TOKEN = process.env.HIPCHAT_TOKEN;
var SUCCESS_MESSAGE = "(yougotitdude)";

var Graph = require('./graphite.js');

module.exports = function (robot) {

    // Filter out graphs named <name> and save the results
    robot.respond(/forget graph (\w*)/i, function (msg) {
        var name = msg.match[1].trim(),
            graphs = robot.brain.get('graphs') || [],
            new_graphs = graphs.filter(function (e) { return e.name !== name; });

        robot.brain.set('graphs', new_graphs);
        msg.send(SUCCESS_MESSAGE);
    });

    // Empty the graphs array
    robot.respond(/forget all graphs/i, function (msg) {
        robot.brain.set('graphs', []);
        msg.send(SUCCESS_MESSAGE);
    });

    // Take a render URL or a saved graph name and fetch it
    robot.respond(/graph me (\S*)( from )?([\-\d\w]*)$/i, function (msg) {
        var target = msg.match[1].trim(),
            from = msg.match[3],
            graphs = robot.brain.get('graphs') || [],
            target_arr = graphs.filter(function (e) { return e.name === target; }),
            graph;

        // Is this one of our saved arrays?
        if (target_arr.length > 0) {
            target = target_arr[0].target;
        }

        // Has the user specified a time range?
        if (from) {
            target = target + "&from=" + from.trim();
        }

        graph = new Graph({
            target: target,
            server: GRAPHITE_SERVER,
            room_id: GRAPH_ROOM_ID,
            api_token: HIPCHAT_TOKEN
        });

        msg.send(SUCCESS_MESSAGE + " Fetching graph and uploading to HipChat...");

        // Fetch the graph from Graphite
        graph.fetch()
            .then(function () {
                // Upload it to our service room
                return graph.upload();
            }).then(function () {
                // Harvest the S3 link
                return graph.getLink();
            }).then(function (link) {
                // Share it back with the requestor
                msg.send(link);
            });

    });

    // Save a render URL with a friendly name
    robot.respond(/save graph (\w*) as ([\S]*)/i, function (msg) {
        var name = msg.match[1].trim(),
            target = msg.match[2].trim(),
            graphs = robot.brain.get('graphs') || [];

        if (graphs.filter(function (e) { return e.name === name; }).length !== 0) {
            msg.send("Graph " + name + " already exists. Please have me forget this graph first.");
            return;
        }

        graphs.push({'name': name, 'target': target});

        robot.brain.set('graphs', graphs);
        msg.send('You can now use "graph me ' + name + '" to see this graph');
    });

    // List all saved graphs
    robot.respond(/list graphs/i, function (msg) {
        var graphs = robot.brain.get('graphs') || [],
            reply = "Saved graphs found: " + graphs.length;

        graphs.forEach(function (e) {
            reply += "\n" + e.name + " - " + e.target;
        });

        msg.send(reply);
    });
};
