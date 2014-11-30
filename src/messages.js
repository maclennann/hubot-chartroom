// Various messages used internally and externally
// Feel free to tweak them (though don't break the
// util.format()s if you know what's good for you)

'use strict';

module.exports = {
    loading: '%s Fetching graph and uploading to HipChat...',
    alreadyExists: 'Graph %s already exists. Please have me forget this graph first.',
    savedGraph: 'You can now use "graph me %s" to see this graph',
    listHeader: 'Saved graphs found: %s',
    listItem: '\n--> %s - %s',
    success: process.env.SUCCESS_MESSAGE || '(yougotitdude)',
    badGuid: 'Non-random GUID: %s',
    guidNotFound: 'Failed to fetch graph URL from graph room. GUID not found.',

    urls: {
        graphite: 'http://%s/render?format=png&%s',
        upload: 'https://api.hipchat.com/v2/room/%s/share/file?auth_token=%s',
        history: 'https://api.hipchat.com/v2/room/%s/history?reverse=false&max-results=10&auth_token=%s'
    }
};
