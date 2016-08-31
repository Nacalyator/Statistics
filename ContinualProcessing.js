var xlsx = require("xlsx");
var csv = require('csv');
var fs = require('fs');
var path = require('path');
var log = console.log;


function fsSpider (way, callback) {
    fs.stat(way, function(err, stats) {
        if (err) throw err;
        if (stats.isFile() === true && path.extname(way) === '.xlsx') {
            callback(way);
        } else if (stats.isDirectory() === true) {
            fs.readdir(way, function (err, files) {
                if (err) throw err;
                var fixedWay = (way[way.length - 1] === '/') ? way : way + '/'; 
                for (var i = 0; i < files.length; i ++) {
                    fsSpider(fixedWay + files[i], callback);
                }
            })
        }
    })
    
}

fsSpider('./Continual', excellDiscrete);

function excellDiscrete (path) {
    var workbook = xlsx.readFile(path);
    var worksheet = workbook.Sheets[/*workbook.SheetNames[8]*/'Фильтр. Сигналы2'];
    var sheetContent = xlsx.utils.sheet_to_csv(worksheet);
    csv.parse(sheetContent, {delimiter: ',', skip_empty_lines: true}, function(err, data) {
        if (err) throw err;
        var table = numberFix(data); 
        var step_size = 20;
        var step = getCountsOfDisctreteSteps(table);
        var stepsCounter = getCountsOfDisctreteSteps(table, step_size);
        var result = sortByTimeAndAmplitude(table, step_size);
        csv.stringify(result, {delimiter: ';'}, function(err, data){
            if (err) throw err;
            fs.writeFile(path.substring(0, path.length - 4) + 'csv', data, 'utf8', function (err) {
                if (err) throw err;
                log('welldone!')
            })
        });
        
    })
};

function getCountsOfDisctreteSteps (arr, disc) {
    var steps = getNumberOfSteps(arr);
    var arr_discrete = Array.apply(null, {length: steps}).map(() => 0);
    for(var index = 1; index < arr.length; index++){
        arr_discrete[Math.floor(arr[index][0]/disc)]++;
    };
    return arr_discrete;
}

function numberFix(val) {
    if (typeof val === 'string' && isNaN(parseInt(val, 10))) {
        return val;
    } else if (typeof val === 'number') {
        return val;
    } else if (typeof val === 'string' && !isNaN(parseInt(val, 10))) {
        return parseFloat(val.replace(",", "."));
    } else if (Array.isArray(val)) {
        for (var i = 0; i < val.length; i++) {val[i] = numberFix(val[i]);}
        return val;
    }
};

function getNumberOfSteps(arr) {
    return Math.ceil(arr[arr.length - 1][0] / 20);
}

function sortByTimeAndAmplitude (arr, disc) {
    var timeBar = 0.015, amplitudeBar = 200;
    var steps = getCountsOfDisctreteSteps(arr, disc);
    var times = [], amplitudes = [];
    var stepsTimes = [], stepsAmplitudes = [];
    for (var i = 1; i < arr.length; i++) {
        times.push(((arr[i][7]) * 1000) / ((arr[i][5]) * (arr[i][5])));
        amplitudes.push(numberFix(arr[i][5]));
    }
    
    var CTA = [['Total signals', 'High A, short T', 'Low A, long T', 'Low A, short T', 'High A, long T']];
    for (var i = 0; i < steps.length; i++) {
        stepsTimes.push(times.splice(0, steps[i]));
        stepsAmplitudes.push(amplitudes.splice(0, steps[i]));
    }
    for (var k = 0; k < steps.length; k++) {
        CTA.push([steps[k], 0, 0, 0, 0]);
        for (var l = 0; l < steps[k]; l++) {
            if (stepsAmplitudes[k][l] >= amplitudeBar && stepsTimes[k][l] <= timeBar) {
                CTA[k + 1][1]++;
            } else if (stepsAmplitudes[k][l] <= amplitudeBar && stepsTimes[k][l] >= timeBar) {
                CTA[k + 1][2]++;
            } else if (stepsAmplitudes[k][l] < amplitudeBar && stepsTimes[k][l] < timeBar) {
                CTA[k + 1][3]++;
            } else if (stepsAmplitudes[k][l] > amplitudeBar && stepsTimes[k][l] > timeBar) {
                CTA[k + 1][4]++;
            }
        }
    }
    return CTA;
}