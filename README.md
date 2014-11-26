# Hubot Chart Room

Give your Hubot its own room for piles of Graphite graphs
![](http://img526.imageshack.us/img526/9514/92526164.png)

[![Build Status](https://travis-ci.org/maclennann/hubot-chartroom.png)](https://travis-ci.org/maclennann/hubot-chartroom)

## Why not just use hubot-graphite

Actually, you should use hubot-graphite if you can. That has support for saved graphs and is significantly faster to respond.

However.

Since it just constructs you a URL and puts it in the room, users with Graphite instances that are inaccessibile to HipChat 
will not be able to take advantage of auto-generated thumbnails on the links. And if they are not in the office they will be 
unable to click the links themselves.

This script actually downloads the image from Graphite, then shares it with a configured room in HipChat. Sharing it in HipChat
has the side-effect of uploading it to S3. Once the file is uploaded, Hubot finds the S3 link for it and shares it back to whomever
requested it.

This extra step of uploading it to a specific room first is to get around issues with the hubot-hipchat plugin regarding renaming
rooms. If a room has been renamed, Hubot will be unable to locate the API ID of the room and so will be unable to share that image
directly to the room. So now users are just expected to provide an API ID for a room in the environment variables. Images will be shared
there first, before their links are copied to the end user/room.

## Configuration

**GRAPHITE_SERVER**: the hostname/ip of your graphite server

**GRAPH_ROOM_ID**: the API ID of a HipChat room to which all graphs will be initially shared (log into your http://[your-hipchat].hipchat.com/rooms then click your room to find it).

**HIPCHAT_TOKEN**: an API token for your hubot can use for uploading to hipchat.