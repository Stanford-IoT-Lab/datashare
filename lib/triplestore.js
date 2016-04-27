// -*- mode: js; indent-tabs-mode: nil; js-basic-offset: 4 -*-
//
// This file is part of DataShare
//
// Copyright 2016 Giovanni Campagna <gcampagn@cs.stanford.edu>
//
// See COPYING for details
"use strict";

const Q = require('q');

module.exports = class TripleStore {
    start() {
        return Q();
    }

    stop() {
        return Q();
    }

    runSelect() {
        throw new Error('Not Implemented');
    }

    insertTriples() {
        throw new Error('Not Implemented');
    }
}
