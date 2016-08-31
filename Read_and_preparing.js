const xlsx = require("xlsx");
const csv = require('csv');
const fs = require('fs');
const path = require('path');
const log = console.log;
const execFile = require('child_process').execFile;

getPaths('./test','.xlsx')
    .then(makePromisesByPaths)
    .then((arr)=>Promise.all(arr)) //Here some error!
    .then(concatNestedArrays)
    .then(writeToCSV);


function getPaths(dir, ext) {
    return new Promise(function(resolve, reject) {
        execFile('find', [dir], function(err, stdout, stderr) {
            if (err) reject(err);
            let fullList = stdout.split('\n');
            let filteredList = fullList.filter(function (el){
                return path.extname(el) === ext;
            }); 
            log('Paths have been got!');
            resolve(filteredList);
        });
    });
};    

function makePromisesByPaths(arr) {
    let arrayOfPromises = [];
    for (let i=0, n=arr.length; i<n; i++) {
        arrayOfPromises.push(new Promise(function(resolve, reject) {
            let path = arr[i];
            let workbook = xlsx.readFile(path);
            let worksheet = workbook.Sheets['Фильтр. Сигналы2'];
            let sheetContent = xlsx.utils.sheet_to_csv(worksheet);
            csv.parse(sheetContent, {delimiter: ',', skip_empty_lines: true}, function(err, data){
                if (err) reject(err);
                let table = numberFix(data);
                table.splice(0,1);
                let wow = calculateTime(table);
                resolve(wow);
            });
        }));
    };
    log('Array of Promises has been created!');
    return arrayOfPromises;
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

 
function fixNumberDelimiter (val) {
    if (typeof val === 'number') {
        return val.toString(10).replace(".", ",");
    } else if (Array.isArray(val)) {
        for (var i = 0; i < val.length; i++) {val[i] = fixNumberDelimiter(val[i]);}
        return val;
    } else if (typeof val === 'string' && isNaN(parseInt(val, 10))) {
        return val;
    }
};

function concatNestedArrays (arr) {
    return new Promise(function(resolve, reject) {
        let result = [];
        for (let i=0,n=arr.length; i<n; i++) {
            result = result.concat(arr[i]);
        };
        let table = fixNumberDelimiter(result);
        log('Arrays have been concated!');
        resolve(table);
    });
};

function writeToCSV(arr) {
    csv.stringify(arr, {delimiter: ';'}, function(err, data) {
        if (err) reject(err);
        fs.writeFile('./DataCollection.csv', data, 'utf8', function(err) {
            if (err) reject(err);
            log('well done');
        });
    });
};

function calculateTime (arr) {
  let result = [];
  for (let i=0, n = arr.length; i<n; i++) {
    result.push([arr[i][5], ((arr[i][7]) * 1000) / ((arr[i][5]) * (arr[i][5]))])
  }
  return result;
}
