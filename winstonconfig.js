const {transports, createLogger, format} = require('winston');
const ETHInfoLogger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.json()
),
  transports: [ 
    new transports.File({ filename: './Logs/ETHInfoLogs.log' }),
  ],
});
const BNBInfoLogger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.json()
),
  transports: [ 
    new transports.File({ filename: './Logs/BNBInfoLogs.log' }),
  ],
});
const POLYInfoLogger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.json()
),
  transports: [ 
    new transports.File({ filename: './Logs/POLYInfoLogs.log' }),
  ],
});
const ETHErrorLogger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.json()
),
  transports: [ 
    new transports.File({ filename: './Logs/ETHErrorLogs.log' }),
  ],
});
const BNBErrorLogger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.json()
),
  transports: [ 
    new transports.File({ filename: './Logs/BNBErrorLogs.log' }),
  ],
});
const POLYErrorLogger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.json()
),
  transports: [ 
    new transports.File({ filename: './Logs/POLYErrorLogs.log' }),
  ],
});


const logger = {
  ETHInfoLogger,
  BNBInfoLogger,
  POLYInfoLogger,
  ETHErrorLogger,
  BNBErrorLogger,
  POLYErrorLogger
} 
module.exports = logger;
// logger.info('What rolls down stairs');
// logger.info('alone or in pairs,');
// logger.info('and over your neighbors dog?');
// logger.warn('Whats great for a snack,');
// logger.info('And fits on your back?');
// logger.error('Its log, log, log');
