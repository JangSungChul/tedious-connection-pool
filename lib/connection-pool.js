var PooledConnection = require('./pooled-connection');

var connectionEventNames = [
  'connect',
  'end',
  'debug',
  'infoMessage',
  'errorMessage',
  'databaseChange',
  'languageChange',
  'charsetChange',
  'secure'
];

function ConnectionPool(poolConfig, connectionConfig) {
  var pool = this;

  pool.config = poolConfig;
  pool.requestNumber = 0;
  pool.stats = {
    maxSize: poolConfig.maxSize,
    connections: 0,
    connectionsInUse: 0
  };
  pool.inUseConnections = [];
  pool.availableConnections = [];
  pool.pendingConnectionRequests = [];

  pool.returnConnectionToPool = function(connection) {
    connectionEventNames.forEach(function removeAllListeners(eventName) {
      connection.removeAllListeners(eventName);
    });

    pool.inUseConnections.splice(pool.inUseConnections.indexOf(connection), 1);
    pool.stats.connectionsInUse--;

    if (pool.pendingConnectionRequests.length > 0) {
      var pendingConnectionRequest = pool.pendingConnectionRequests.shift();

      pendingConnectionRequest(connection);
    }
  };

  pool.requestConnection = function(callback) {
    var requestNumber = ++pool.requestNumber;
    var connection;

    if (pool.availableConnections.length > 0) {
      connection = availableConnections.shift();
      connection.emit('connect');
    } else if (pool.inUseConnections.length < pool.config.maxSize) {
      connection = new PooledConnection(pool, connectionConfig);
      connection.number = ++pool.stats.connections;
    }

    if (connection) {
      useConnection(connection);
    } else {
      pool.pendingConnectionRequests.push(function (connection) {
        useConnection(connection);
        connection.emit('connect');
      });
    }

    function useConnection(connection) {
      pool.inUseConnections.push(connection);
      pool.stats.connectionsInUse++;

      callback(connection);
    }
  };

  return {
    requestConnection: pool.requestConnection,
    stats: pool.stats
  };
};

module.exports = ConnectionPool;