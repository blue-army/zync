var winston = require("winston");
require("winston-azure-blob-transport");

let key = process.env.STORAGE_KEY;

if (key !== undefined) {
    var logger = new (winston.Logger)({
        transports: [
            new (winston.transports.AzureBlob)({
                account: {
                    name: "jibestorage",
                    key: key,
                },
                containerName: "logs",
                blobName: "demo",
                level: "info"
            })
        ]
    });
}

export function Info(data: Object) {
    if (key !== undefined) {
        logger.info(data);
    }
    else {
        console.log(data)
    }
}

