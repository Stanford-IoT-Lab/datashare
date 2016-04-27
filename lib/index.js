// -*- mode: js; indent-tabs-mode: nil; js-basic-offset: 4 -*-
//
// This file is part of DataShare
//
// Copyright 2016 Giovanni Campagna <gcampagn@cs.stanford.edu>
//
// See COPYING for details
"use strict";

const Q = require('q');
const SparqlParser = require('sparqljs').Parser;

const UserManager = require('./usermanager');
const SelectRunner = require('./selectrunner');

module.exports = class Database {
    constructor(platform, messaging) {
        this._platform = platform;

        this._messaging = messaging;
        this._user = new UserManager(messaging);

        this._store = platform.getCapability('triple-store');
        this._parser = new SparqlParser();

        this._modules = [this._store, this._user];
    }

    get platform() { return this._platform; }
    get messaging() { return this._messaging; }
    get user() { return this._user; }
    get localstore() { return this._store; }

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

    runQuery(query) {
        var parsed = this._parser.parse(query);

        switch (parsed.type) {
        case 'query':
            var runner = new SelectRunner(this, parsed);
            return runner.run();
        case 'update':
            throw new Error('update not implemented');
        default:
            throw new Error('Unrecognized query type ' + parsed.type);
        }
    }
}

