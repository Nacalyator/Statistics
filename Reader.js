var xlsx = require("xlsx");
var csv = require('csv');
var fs = require('fs');
var log = console.log;

var path = './1.xlsx';

excellWorker (path);


function excellWorker (path) {
    var workbook = xlsx.readFile(path);
    var worksheet = workbook.Sheets[workbook.SheetNames[8]];
    var sheetContent = xlsx.utils.sheet_to_csv(worksheet);
    csv.parse(sheetContent, {delimiter: ',', skip_empty_lines: true}, function(err, data) {
        if (err) throw err;
        var table = skipEmptyColumns(numberFix(data));
        var tableCTA = sortByTimeAndAmplitude(table);
        var tableLocations = locationCounterByStepts(table);
        csv.stringify(tableCTA, function(err, data){
            if (err) throw err;
            fs.writeFile('2.csv', data, 'utf8', function (err) {
                if (err) throw err;
            })
        });
    })
};









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

function skipEmptyColumns(arr) {
    var counter = 0
    while (arr[0][arr[0].length - 1] === '') {
        for (var i = 0; i < arr.length; i++) {
            arr[i].pop();
        }
        counter++;
    }
    return arr;
};

function sortByTimeAndAmplitude (arr) {
    var timeBar = 0.015, amplitudeBar = 200;
    var steps = [];
    var counts = [], times = [], amplitudes = [];
    var stepsCounts = [], stepsTimes = [], stepsAmplitudes = [];
    for (var i = 1; i < arr.length; i++) {
        times.push(((arr[i][7]) * 1000) / ((arr[i][5]) * (arr[i][5])));
        amplitudes.push(numberFix(arr[i][5]));
        counts.push(parseInt(arr[i][3]));
    }
    steps = getStepsCounts(counts);
    var CTA = [['Total signals', 'High A, short T', 'Low A, long T', 'Low A, short T', 'High A, long T']];
    for (var i = 0; i < steps.length; i++) {
        stepsCounts.push(counts.splice(0, steps[i]));
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

function getStepsCounts (arr) {
  var result = [];
  var signalCounter = 0;
  var buff = 0;
  for (var i = 0; i < arr.length; i++) {
    if (buff >= arr[i]) {
      result.push(signalCounter);
      signalCounter = 1;
    } else {
      signalCounter++;
    }
    buff = arr[i];
  }
  result.push(signalCounter);
  return result;
}

function locationCounterByStepts (arr) {
    var counts = [], locations = [], steps = [], stepsLocations = [], locationsReworked = [], locationsReworkedZeroFix = [];
    var maxSteps = 15;
    for (var i = 1; i < arr.length; i++) {
        counts.push(arr[i][3]);
        locations.push(arr[i][15]);
    }
    steps = getStepsCounts(counts);
    for (var i = 0; i < steps.length; i++) {
        stepsLocations.push(locations.splice(0, steps[i]));
        locationsReworked.push(locationTransform(stepsLocations[i]));
    }
    for (var i = 0; i < locationsReworked.length; i++) {
        locationsReworkedZeroFix.push(locationsReworked[i]);
        locationsReworkedZeroFix[i][0] = 0;
    }
    while(locationsReworked.length < maxSteps) {
        locationsReworked.push(new Array(256));
        locationsReworkedZeroFix.push(new Array(256));
    }
    locationsReworked = locationsReworked.concat(locationsReworkedZeroFix);
    return locationsReworked;
}

function locationTransform (arr) {
    var output = [];
    for (var j = 0; j < 256; j++) {output[j] = 0};
    for (var i = 0; i < arr.length; i++) {output[arr[i]]++};
    return output;
}