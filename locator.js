var csv = require('csv');
var fs = require('fs');

fs.readFile('./from.csv', function (err, data) {
  if (err) throw err;
  csv.parse(data, function(err, data) {
      if (err) throw err;
      var locateArr = rightCSVArray(transformArray(repairArray(data)));
      csv.stringify(locateArr, {delimiter: ';'},function (err, data) {
          if (err) throw err;
          fs.writeFile('./to.csv', data, 'utf8', function (err) {
              if (err) throw err;
              console.log("Well done!");
          })
      });
  });
});

function repairArray (arr) {
    var ar = new Array();
    for (var i = 0; i < arr.length; i++) {
        ar.push(parseInt(arr[i][0]));
    }
    return ar;
}

function transformArray (arr) {
    var output = [];
    for (var j = 0; j < 256; j++) {output[j] = 0};
    for (var i = 0; i < arr.length; i++) {output[arr[i]]++};
    return output;
}

function rightCSVArray (arr) {
    var count = [];
    for (var j = 0; j < 256; j++) {count[j] = j};
    return [count, arr]
}