const filter = function () {
    return new Promise(function(resolve) {
        var output = [];
        var lineReader = require('readline').createInterface({
            input: require('fs').createReadStream('int.csv')
        });

        lineReader.on('line', function (line) {
            var jsonFromLine = {};
            var lineSplit = line.split(',');
            // select columns you want
            jsonFromLine.req = lineSplit[0];
            jsonFromLine.column1 = lineSplit[1];
            // ...  
            if (jsonFromLine.req === 'RQ0191223') {
                output.push(jsonFromLine);
            }
        });

        lineReader.on('close', function (line) {
            resolve(output);
        });
    });
}


method().then(function(outputOfResolve) { console.log(outputOfResolve); });