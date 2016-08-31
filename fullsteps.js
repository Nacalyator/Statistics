var csv = require('csv');
var fs = require('fs');

fs.readFile('./from.csv', function (err, data) {
  if (err) throw err;
  csv.parse(data,{delimiter: '\t'}, function(err, data) {
      if (err) throw err;
      var counts = [], locations = [], steps = [], stepsLocations = [], locationsReworked = [];
      for (var i = 1; i < data.length; i++) {
        counts.push(data[i][0]);
        locations.push(parseInt(data[i][1]));
      }
      var temp = counts.join(',').split(',1,');
      for (var j = 0; j < temp.length; j++) {
        if (j !== 0) {
          steps.push(temp[j].split(',').length + 1);
        } else {
          steps.push(temp[j].split(',').length);
        }
      }
      for (var i = 0; i < steps.length; i++) {
        stepsLocations.push(locations.splice(0, steps[i]));
        locationsReworked.push(locationTransform(stepsLocations[i]));
      }
      console.log(stepsLocations)
      csv.stringify(locationsReworked, {delimiter: '\t'},function (err, data) {
          if (err) throw err;
          fs.writeFile('./to.csv', data, 'utf8', function (err) {
              if (err) throw err;
              console.log("Well done!");
          })
      });
  });
});

function locationTransform (arr) {
    var output = [];
    for (var j = 0; j < 256; j++) {output[j] = 0};
    for (var i = 0; i < arr.length; i++) {output[arr[i]]++};
    return output;
}