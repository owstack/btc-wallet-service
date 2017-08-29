The following document is a step-by-step guide to run BTCWS.

### Prerequisites
Ensure MongoDB (2.6+) is installed and running. This document assumes that mongod is running at the default port 27017.
See the configuration section to configure a different host/port.

### Install BTCWS from NPM
Use the following steps to Install BTCWS from the npmjs repository and run it with defaults.
```bash
npm install btccore-wallet-service
cd btccore-wallet-service
```
To change configuration before running, see the Configuration section.
```bash
npm start
```

### Install BTCWS from github source
Use the following steps to Install BTCWS from github source and run it with defaults.
```bash
git clone https://github.com/owstack/btccore-wallet-service.git
cd btccore-wallet-service
npm install
```
To change configuration before running, see the Configuration section.
```bash
npm start
```
### Configuration
Configuration for all required modules can be specified in https://github.com/owstack/btccore-wallet-service/blob/master/config.js

BTCWS is composed of 5 separate node services -
Locker - locker/locker.js
Message Broker - messagebroker/messagebroker.js
Blockchain Monitor - bcmonitor/bcmonitor.js (This service talks to the Blockchain Explorer service configured under blockchainExplorerOpts - see Configure blockchain service below.)
Email Service - emailservice/emailservice.js
Btccore Wallet Service - btcws.js

#### Configure MongoDB
Example configuration for connecting to the MongoDB instance:
```javascript
  storageOpts: {
    mongoDb: {
      uri: 'mongodb://localhost:27017/btcws',
    },
  }
```
#### Configure Locker service
Example configuration for connecting to locker service:
```javascript
  lockOpts: {
    lockerServer: {
      host: 'localhost',
      port: 3231,
    },
  }
```

#### Configure Message Broker service
Example configuration for connecting to message broker service:
```javascript
  messageBrokerOpts: {
    messageBrokerServer: {
      url: 'http://localhost:3380',
    },
  }
```

#### Configure blockchain service
Note: this service will be used by blockchain monitor service as well as by BTCWS itself.
An example of this configuration is:
```javascript
  blockchainExplorerOpts: {
    defaultProvider: 'insight',

    // Providers
    'insight': {
      'livenet': {
        url: 'https://insight.bitpay.com:443',
        apiPrefix: '/insight-api'
      },
      'testnet': {
        url: 'https://test-insight.bitpay.com:443',
        apiPrefix: '/insight-api'
      }
    }
  }
```

#### Configure Email service
Example configuration for connecting to email service (using postfix):
```javascript
  emailOpts: {
    host: 'localhost',
    port: 25,
    ignoreTLS: true,
    subjectPrefix: '[Wallet Service]',
    from: 'wallet-service@openwalletstack.com',
  }
```

#### Enable clustering
Change `config.js` file to enable and configure clustering:
```javascript
{
  cluster: true,
  clusterInstances: 4,
}
```

