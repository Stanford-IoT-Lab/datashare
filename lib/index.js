// -*- mode: js; indent-tabs-mode: nil; js-basic-offset: 4 -*-
//
// This file is part of DataShare
//
// Copyright 2016 Giovanni Campagna <gcampagn@cs.stanford.edu>
//
// See COPYING for details
"use strict";

const Q = require('q');

const UserManager = require('./usermanager');
const SelectRunner = require('./selectrunner');

module.exports = class Database {
    constructor(platform, messaging) {
        this._platform = platform;

        this._messaging = messaging;
        this._user = new UserManager(messaging);

        this._modules = [this._user];
    }

    get platform() { return this._platform; }
    get messaging() { return this._messaging; }
    get user() { return this._user; }

    start() {
        function startSequential(modules, i) {
            if (modules.length === i)
                return Q();

            return modules[i].start().then(function() { return startSequential(modules, i+1); });
        }
        return startSequential(this._modules, 0);
    }

    stop() {
        function stopSequential(modules, i) {
            if (0 === i)
                return Q();

            return modules[i].start().then(function() { return stopSequential(modules, i-1); });
        }
        return startSequential(this._modules, this._modules.length-1);
    }

    runSelect(query) {
        var runner = new SelectRunner(this);
        return runner.run();
    }

    runUpdate(query) {
        throw new Error('not implemented');
    }
}

