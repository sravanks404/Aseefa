const AppDatabase = 'SuitApps_AseefaApp';  // Change Mobile App Database

const dbConfig = {
    user: 'sa',
    password: '1.Microtechxyz',
    //port: 1433, 
    server: '103.205.140.105',
    database: 'SuitApps_AseefaSoft',      // Change Software Database

    options: { 
        encrypt: true,
        enableArithAbort: true,
        trustServerCertificate: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 100000,
    },
    requestTimeout: 100000,
    connectionTimeout: 15000,
};


module.exports = Object.assign({}, dbConfig, { AppDatabase });