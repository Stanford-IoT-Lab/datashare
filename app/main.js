// -*- mode: js; indent-tabs-mode: nil; js-basic-offset: 4 -*-
//
// This file is part of DataShare
//
// Copyright 2016 Giovanni Campagna <gcampagn@cs.stanford.edu>
//
// See COPYING for details
"use strict";

const Q = require('q');
const readline = require('readline');

const OmletFactory = require('./omlet');
// GIANT HACK
const LDProto = require('omclient/lib/ldproto');

const Database = require('../lib/index');
const Messaging = require('../lib/deps/messaging');

function readOneLine(rl) {
    return Q.Promise(function(callback, errback) {
        rl.once('line', function(line) {
            if (line.trim().length === 0) {
                errback(new Error('User cancelled'));
                return;
            }

            callback(line);
        })
    });
}

function main() {
    var rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.setPrompt('$ ');

    var platform = require('./platform');
    platform.init();
    var client = OmletFactory(platform, true);
    var messaging = new Messaging(client);
    var database = new Database(platform, messaging);

    Q.try(function() {
        if (!client.auth.isAuthenticated()) {
            console.log('Omlet login required');
            console.log('Insert phone number:');
            rl.prompt();

            var phone;
            return readOneLine(rl).then(function(line) {
                phone = line.trim();
                client._ldClient.auth.connectPhone(phone);
                console.log('Insert confirm code:');
                return readOneLine(rl);
            }).then(function(code) {
                var identity = new LDProto.LDIdentity();
                identity.Type = LDProto.LDIdentityType.Phone;
                identity.Principal = phone;

                return Q.Promise(function(callback) {
                    client._ldClient.onSignedUp = callback;
                    client._ldClient.auth.confirmPinForIdentity(identity, code.trim(),
                                                                client._ldClient.auth._onAuthenticationComplete.bind(client._ldClient.auth));
                });
            });
        }
    }).delay(1000).then(function() {
        return messaging.start();
    }).then(function() {
        return database.start();
    }).then(function() {
        function quit() {
            console.log('Bye\n');
            rl.close();
            process.exit();
        }

        rl.on('line', function(line) {
            if (line[0] === '\\') {
                if (line[1] === 'q')
                    quit();
                else
                    console.log('Unknown command ' + line[1]);
            } else {
                Q.try(function() {
                    return database.runQuery(line);
                }).then(function(cursor) {
                    if (cursor) {
                        for (var value of cursor)
                            console.log(value);
                    }
                }).catch(function(e) {
                    console.log('Failed to execute query: ' + e.message);
                }).then(function() {
                    rl.prompt();
                }).done();
            }
        });
        rl.on('SIGINT', quit);

        rl.prompt();
    }).done();
}

main();
