// -*- mode: js; indent-tabs-mode: nil; js-basic-offset: 4 -*-
//
// This file is part of DataShare
//
// Copyright 2016 Giovanni Campagna <gcampagn@cs.stanford.edu>
//
// See COPYING for details
"use strict";

const Q = require('q');

module.exports = class UserManager {
    constructor(messaging) {
        this._messaging = messaging;
        this._feedRemovedListener = this._onFeedRemoved.bind(this);

        this._feedByUser = {};
        this._userByFeed = {};
    }

    _onFeedRemoved(feedId) {
        var user = this._userByFeed[feedId];
        if (user === undefined)
            return;
        if (this._feedByUser[user] && this._feedByUser.identifier === feedId)
            delete this._feedByUser[user];
        delete this._userByFeed[feedId];
    }

    start() {
        this._messaging.on('feed-removed', this._feedRemovedListener);
        return Q();
    }

    stop() {
        this._messaging.removeListener('feed-removed', this._feedRemovedListener);
        return Q();
    }

    getFeedForUser(user) {
        if (this._feedByUser[user])
            return Q(this._feedByUser[user]);

        return this._messaging.getFeedWithContact(user).then((feed) => {
            this._feedByUser[user] = feed;
            this._userByFeed[feed.identifier] = user;
        });
    }
}
