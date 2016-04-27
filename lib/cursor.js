// -*- mode: js; indent-tabs-mode: nil; js-basic-offset: 4 -*-
//
// This file is part of DataShare
//
// Copyright 2016 Giovanni Campagna <gcampagn@cs.stanford.edu>
//
// See COPYING for details
"use strict";

module.exports = class Cursor {
    constructor() {}

    [Symbol.iterator]() { return this; }

    next() {
        return { done: true, value: null };
    }
}
