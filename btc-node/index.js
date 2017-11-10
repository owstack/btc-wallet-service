'use strict';

var util = require('util');
var fs = require('fs');
var io = require('socket.io');
var https = require('https');
var http = require('http');
var async = require('async');
var path = require('path');
var btcLib = require('@owstack/btc-lib');
var Networks = btcLib.Networks;
var Locker = require('locker-server');
var BlockchainMonitor = require('../lib/blockchainmonitor');
var EmailService = require('../lib/emailservice');
var ExpressApp = require('../lib/expressapp');
var child_process = require('child_process');
var spawn = child_process.spawn;
var EventEmitter = require('events').EventEmitter;
var baseConfig = require('../config');
var Constants = require('../lib/common/constants');

/**
 * A Btc Node Service module
 * @param {Object} options
 * @param {Node} options.node - A reference to the Btc Node instance
-* @param {Boolean} options.https - Enable https for this module, defaults to node settings.
 * @param {Number} options.btcwsPort - Port for Btc Wallet Service API
 * @param {Number} options.messageBrokerPort - Port for BTCWS message broker
 * @param {Number} options.lockerPort - Port for BTCWS locker port
 */
var Service = function(options) {
  EventEmitter.call(this);
  this.config = options.config || baseConfig;
  this.node = options.node;
  this.https = options.https || this.node.https;
  this.httpsOptions = options.httpsOptions || this.node.httpsOptions;
  this.btcwsPort = options.btcwsPort || this.config.port;
  this.messageBrokerPort = options.messageBrokerPort || 3380;
  if (this.config.lockOpts) {
    this.lockerPort = this.config.lockOpts.lockerServer.port;
  }
  this.lockerPort = options.lockerPort || this.lockerPort;
};

util.inherits(Service, EventEmitter);

Service.dependencies = ['@owstack/btc-explorer-api'];

/**
 * This method will read `key` and `cert` files from disk based on `httpsOptions` and
 * return `serverOpts` with the read files.
 * @returns {Object}
 */
Service.prototype._readHttpsOptions = function() {
  if (!this.httpsOptions || !this.httpsOptions.key || !this.httpsOptions.cert) {
    throw new Error('Missing https options');
  }

  var serverOpts = {};
  serverOpts.key = fs.readFileSync(this.httpsOptions.key);
  serverOpts.cert = fs.readFileSync(this.httpsOptions.cert);

  // This sets the intermediate CA certs only if they have all been designated in the config.js
  if (this.httpsOptions.CAinter1 && this.httpsOptions.CAinter2 && this.httpsOptions.CAroot) {
    serverOpts.ca = [
      fs.readFileSync(this.httpsOptions.CAinter1),
      fs.readFileSync(this.httpsOptions.CAinter2),
      fs.readFileSync(this.httpsOptions.CAroot)
    ];
  }
  return serverOpts;
};

/**
 * Will get the configuration settings.
 * @returns {Object}
 */
Service.prototype._getConfiguration = function() {
  return this.config;
};

/**
 * Will start the HTTP web server and socket.io for the wallet service.
 */
Service.prototype._startWalletService = function(config, next) {
  var self = this;
  var expressApp = new ExpressApp();

  if (self.https) {
    var serverOpts = self._readHttpsOptions();
    self.server = https.createServer(serverOpts, expressApp.app);
  } else {
    self.server = http.Server(expressApp.app);
  }

  expressApp.start(config, function(err){
    if (err) {
      return next(err);
    }
    self.server.listen(self.btcwsPort, next);
  });
};

/**
 * Called by the node to start the service
 */
Service.prototype.start = function(done) {
  var self = this;
  var config = this._getConfiguration();

  // Locker Server
  var locker = new Locker();
  locker.listen(self.lockerPort);

  // Message Broker
  var messageServer = io(self.messageBrokerPort);
  messageServer.on('connection', function(s) {
    s.on('msg', function(d) {
      messageServer.emit('msg', d);
    });
  });

  async.series([

    function(next) {
      // Blockchain Monitor
      var blockchainMonitor = new BlockchainMonitor();
      blockchainMonitor.start(config, next);
    },
    function(next) {
      // Email Service
      if (config.emailOpts) {
        var emailService = new EmailService();
        emailService.start(config, next);
      } else {
        setImmediate(next);
      }
    },
    function(next) {
      self._startWalletService(config, next);
    }
  ], done);

};

/**
 * Called by node to stop the service
 */
Service.prototype.stop = function(done) {
  setImmediate(function() {
    done();
  });
};

Service.prototype.getAPIMethods = function() {
  return [];
};

Service.prototype.getPublishEvents = function() {
  return [];
};

module.exports = Service;
