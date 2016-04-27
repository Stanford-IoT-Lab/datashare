// -*- mode: js; indent-tabs-mode: nil; js-basic-offset: 4 -*-
//
// This file is part of DataShare
//
// Copyright 2016 Giovanni Campagna <gcampagn@cs.stanford.edu>
//
// See COPYING for details
"use strict";

const Q = require('q');
const fs = require('fs');
const N3 = require('n3');
const rdfstore = require('rdfstore');
const SparqlGenerator = require('sparqljs').Generator;

const TripleStore = require('../lib/triplestore');

module.exports = class SimpleTripleStore extends TripleStore {
    constructor(path) {
        super();

        this._path = path;
    }

    start() {
        console.log('start');
        return Q.nfcall(rdfstore.create, { persistent: true }).then((store) => {
            this._store = store;
            this._rdf = store.rdf;
            console.log('created');
        });
    }

    insertData(triples) {
        var graph = this._rdf.createGraph();
        triples.forEach((t) => graph.add(t));
        return Q.ninvoke(this._store, 'insert', graph);
    }

    runSelect(query) {
        var generator = new SparqlGenerator();
        var queryString = generator.stringify(query);
        return Q.ninvoke(this._store, 'execute', queryString);
    }
}
