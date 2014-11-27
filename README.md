# Hubot Chart Room

Give your Hubot its own room for piles of Graphite graphs
![](http://img526.imageshack.us/img526/9514/92526164.png)

[![Build Status](https://travis-ci.org/maclennann/hubot-chartroom.png)](https://travis-ci.org/maclennann/hubot-chartroom)

## Why not just use hubot-graphite

Actually, you **should** use hubot-graphite if you can. That has support for saved graphs and is significantly faster to respond.

However, the reason it is significantly faster to respond, is because the majority of what it does is construct a URL for the graph.

This is great if your Graphite is accessible from outside of the LAN, so HipChat can generate a thumbnail and all users in the room can get to the graph. But what makes ChartRoom different is that this actually downloads the image from Graphite and shares it via the HipChat API.

**NOTE:** This script needs a single preconfigured room to share this image with. **However** once it is posted, Hubot finds the S3 URL and shares that with the requesting user or room.

This extra step of uploading it to a specific room first is to get around [issues with the hubot-hipchat adapter](https://github.com/hipchat/hubot-hipchat/issues/196) regarding renaming rooms. If a room has been renamed, Hubot will be unable to locate the API ID of the room and so will be unable to share that image
directly to the room. So users are just expected to provide an API ID for a room in the environment variables. Images will be shared
there first, before their links are copied to the end user/room.

## Configuration

**GRAPHITE_SERVER**: the hostname/ip of your graphite server.

**GRAPH_ROOM_ID**: the API ID of a HipChat room to which all graphs will be initially shared:

* This should be a "service room" without anyone else in it (unless they just want to see random graphs).
* To get the API ID, log into your account on hipchat.com, go to the room list then click on your room to find it.
* As I say elsewhere, this is just where graphs get uploaded, they eventually end up shared with the right room/user.

**HIPCHAT_TOKEN**: an API token for your hubot can use for uploading to hipchat.
* You need to log into hipchat.com as your hubot, click Edit Profile, then click API to generate your token.

## Use

The user saves and requests a graph...
```
[Room: warroom]
<Norm> hubot save graph jenkinscpu as target=collectd.jenkins001.CPU.load
<Hubot> You can now use "graph me jenkinscpu" to see this graph.
<Norm> hubot graph me jenkinscpu
<Hubot> (yougotitdude) Fetching graph and uploading to HipChat...
```

Hubot fetches the graph from Graphite and uploads it to the configured room...
```
[Room: hubot_graphs]
<Hubot> upload.png 539bdb5b-9ff4-2e7d-8cfa-5f889c50645b
```

Hubot finds the URL of the file in the message containing the above GUID and posts it to the requesting room/user
```
[Room: warroom]
<Hubot> https://s3.amazonaws.com/uploads.hipchat.com/....etc
```
