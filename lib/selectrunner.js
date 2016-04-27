// -*- mode: js; indent-tabs-mode: nil; js-basic-offset: 4 -*-
//
// This file is part of DataShare
//
// Copyright 2016 Giovanni Campagna <gcampagn@cs.stanford.edu>
//
// See COPYING for details
"use strict";

const Q = require('q');

class QueryNode {
    pushProject(variables) {
        throw new Error('Not Implemented');
    }

    optimize() {
        throw new Error('Not Implemented');
    }

    serialize() {
        throw new Error('Not Implemented');
    }

    evaluate() {
        throw new Error('Not Implemented');
    }
}

// A query node that always produces the empty dataset
class EmptyQueryNode extends QueryNode {
    pushProject() {}
    optimize() { return false; }

    evaluate() {
        return [];
    }
}

class JoinQueryNode extends QueryNode {
}

class LeftJoinQueryNode extends QueryNode {
}

class MinusQueryNode extends QueryNode {
}

class BasicQueryNode extends QueryNode {
}

class UnionQueryNode extends QueryNode {
}

class FilterQueryNode extends QueryNode {
}

class ExtendQueryNode extends QueryNode {
}

// A query node that involves a remote graph
// This is where (most of) the magic happens
class GraphQueryNode extends QueryNode {
}

module.exports = class SelectRunner {
    constructor(db, query) {
        this._messaging = db.messaging;
        this._user = db.user;

        this._query = query;
        this._local = db.localstore;
    }

    _isLocal(uri) {
        // XXX: technically, uri schemes are case-insensitive
        // but also I don't remember if RDF says something about it
        return uri === 'omlet://me' || (uri === 'omlet://' + this._messaging.account);
    }

    _translateGroup(group) {
        if (group.length === 1)
            return this._translatePattern(group[0]);

        var join = null;
        for (var e of group) {
            if (e.type === 'optional')
                join = new LeftJoinQueryNode(join, this._translatePattern(e));
            else if (e.type === 'minus')
                join = new MinusQueryNode(join, this._translatePattern(e));
            else if (e.type === 'bind')
                join = new ExtendQueryNode(join, e.variable, this._translateExpression(e.expression));
            else if (e.type === 'filter')
                join = new FilterQueryNode(join, this._translateExpression(e.expression));
            if (join === null)
                join = this._translatePattern(e);
            else
                join = new JoinQueryNode(join, this._translatePattern(e));
        }

        return join;
    }

    _translateUnion(union) {
        if (union.length === 1)
            return this._translatePattern(union[0]);

        var result = null;
        for (var e of union) {
            if (result === null)
                result = this._translatePattern(e);
            else
                result = new UnionQueryNode(result, this._translatePattern(e));
        }

        return result;
    }

    _translatePattern(pattern) {
        switch (pattern.type) {
        case 'union':
            return this._translateUnion(pattern.patterns);
        case 'bgp':
            return new BasicQueryNode(pattern.triples);
        case 'graph':
            return new GraphQueryNode(pattern.name, this._translateGroup(pattern.patterns));
        case 'group':
        case 'minus':
        case 'optional':
            return this._translateGroup(pattern.patterns);
        default:
            throw new Error('Unhandled pattern type ' + pattern.type);
        }
    }

    run() {
        console.log('Query:', this._query);

        var from = this._query.from;
        if (!from || (from.default.length === 1 && this._isLocal(from.default[0]) && from.named.length === 0)) {
            // fast path local only
            console.log('Query is local only, running fast path');
            return this._local.runSelect(this._query);
        }

        var translated = this._translateGroup(this._query.where);

        if (this._query.variables[0] !== '*')
            translated.pushProject(this._query.variables);

        var progress = false;
        do {
            progress = translated.optimize();
        } while(progress);

        return translated.evaluate();
    }
}
