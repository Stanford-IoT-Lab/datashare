// -*- mode: js; indent-tabs-mode: nil; js-basic-offset: 4 -*-
//
// This file is part of DataShare
//
// Copyright 2016 Giovanni Campagna <gcampagn@cs.stanford.edu>
//
// See COPYING for details
"use strict";

const Q = require('q');
const Cursor = require('./cursor');

module.exports = class SelectRunner {
    constructor(db, query) {
        this._messaging = db.messaging;
        this._user = db.user;

        this._query = query;
    }

    run() {
        return Q(new Cursor());
    }
}
