// before you begin
// 1. Complete the input file with your specific credentials.  
//    please be sure to change the filename so as not to overwrite a previous file.
// 2. Please make sure to obtain the clipper lib and save as clipper.js  in the  aliasSorter Directory.  
//    This is essential in determining event overlap and can be found at https://github.com/junmer/clipper-lib
// 3. navigate to the aliasSorter directory in you commandLine and run the following commands:
//      $ npm install fs node-fetch
//      $ node aliasSorter.js
// 4. view the json output in the aliasSorter directory

const inputs = {
        name: 'MyCity',
        uaa: 'MyUAAurl',
        eventservice: '',
        metadataservice: '',
        developer: 'myClientID:myClientSecret',
        parking: 'Parking-Predix-Zone-ID',
        bbox: '45.468313:-73.723621,45.449219:-73.689406',
        startTime:1546362000000,
        endTime:1546448400000,
        percentThreshold: 0.5,          // overlap threshold - cityiq resolution is about half a vehicle
        timeThreshold: 1000*60*3,       // debouncing period - 3 minuites
        filename: 'Example'
    }

module.exports = inputs
  