const csv = require('csv');
const fs = require('fs');
const path = require('path');
const log = console.log;
const kMeans = require('kmeans-js');

readDataFromCSV('./DataCollection.csv')
  .then(usekmeans)
  .then(writeClustersToCSV);

function readDataFromCSV (path) {
  return new Promise(function(resolve, reject) {
    fs.readFile(path,function(err, data) {
      if (err) reject(err);
      csv.parse(data, {delimiter: ';'}, function(err, data) {
        let fixedData = numberFix(data)
        fixedData.splice(0, 1);
        log('Data has been readed!')
        resolve(fixedData);
      })
    })
  })
}

function usekmeans (arr) {
  return new Promise (function(resolve, reject) {
    let centroids, clusters;
    let km = new kMeans({K: 4});
    let result = [[], [], [], []];
    km.cluster(arr);
    while (km.step()) {
      km.findClosestCentroids();
      km.moveCentroids();
      centroids = km.centroids;
      clusters = km.clusters;
    }
    for (let i=0, n=clusters.length; i<n; i++) {
      for (let j=0, k=clusters[i].length; j<k; j++) {
        result[i].push(arr[clusters[i][j]]);
      }
    }
    result.push(centroids);
    resolve(result);
  })
}

function writeClustersToCSV (arr) {
  for (let i=0, n=arr.length; i<n; i++) {
    let result = fixNumberDelimiter(arr[i]);
    csv.stringify(result, {delimiter: ';'}, function(err, data) {
      if (err) reject(err);
      fs.writeFile('./Cluster' + i + '.csv', data, 'utf8', function(err) {
        if (err) reject(err);
        log('Cluster has been wrote!');
      })
    })
  }
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
}

function fixNumberDelimiter (val) {
    if (typeof val === 'number') {
        return val.toString(10).replace(".", ",");
    } else if (Array.isArray(val)) {
        for (var i = 0; i < val.length; i++) {val[i] = fixNumberDelimiter(val[i]);}
        return val;
    } else if (typeof val === 'string') {
        return val;
    }
}
