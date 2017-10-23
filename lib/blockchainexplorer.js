'use strict';

var _ = require('lodash');
var $ = require('preconditions').singleton();
var config = require('../config');
var log = require('npmlog');
log.debug = log.verbose;

var Constants = require('./common/constants');
var Explorer = require('./blockchainexplorers/explorer');
var providers = config.blockchainExplorerOpts;

function BlockchainExplorer(opts) {
  $.checkArgument(opts);

  var network = opts.network || Constants.LIVENET;
  var provider = opts.provider || config.blockchainExplorerOpts.defaultProvider;

  $.checkState(providers[provider], 'Provider ' + provider + ' not supported');
  $.checkState(_.includes(_.keys(providers[provider]), network), 'Network ' + network + ' not supported by this provider');

  var url = opts.url || providers[provider][network].url;
  var apiPrefix = opts.apiPrefix || providers[provider][network].apiPrefix;

  switch (provider) {
    case 'explorer':
      return new Explorer({
        network: network,
        url: url,
        apiPrefix: apiPrefix,
        userAgent: opts.userAgent,
      });
    default:
      throw new Error('Provider ' + provider + ' not supported');
  };
};

module.exports = BlockchainExplorer;
