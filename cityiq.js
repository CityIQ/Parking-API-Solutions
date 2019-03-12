const fetch = require('node-fetch')
const btoa = str => new Buffer.from(str).toString('base64') 

// requests function formats requests via node.js
function request(url, headers, body) {
    let options = { headers: headers, body:body}
    return fetch(url, options).then(result => {
        if (result.status>=400) return(result.statusText) 
        else return result.text().then(txt => {
            try { return JSON.parse(txt) }
            catch (err) { return txt }
        })
    })
}

// cityiq main function to be called at least once in each demo.js file
module.exports = async function cityiq(tenant) {
    console.log('starting requests')
    console.log(tenant.uaa)
    let client_token = (await request(tenant.uaa+'/oauth/token?grant_type=client_credentials', {authorization: 'Basic '+btoa(tenant.developer)})).access_token

    // this function searches assets by their content variables (i.e. assetType, eventTypes, mediaTypes, coordinates etc)
    async function assets(zone, type, id){ 
        // id variable can be null
        
        /** set the variables, query headers and query url will be specified here. 
         * Each request will be made in this function
         * options for eventTypes, mediaTypes and assetTypes are specified here
        */ 

        let query, headers, queryURL
        let eventTypes = ['PKIN','PKOUT','PEDEVT','TFEVT','HUMIDITY','PRESSURE','TEMPERATURE','METROLOGY','TIMESERIES']
        let mediaTypes = ['IMAGE','VIDEO']
        let assetTypes = ['CAMERA','ENV_SENSOR','NODE','EM_SENSOR']
        

        /**If statements specify each query for each search parameter. 
         * Default is to search assets by assetUid */
        if (eventTypes.indexOf(type) >= 0) {
          console.debug('querying assets by eventTypes')
          query = '/v2/metadata/assets/search?bbox='+tenant.bbox+'&q=eventTypes:'+type
        } else if (mediaTypes.indexOf(type) >= 0) {
          console.debug('querying assets by mediaType')
          query = '/v2/metadata/assets/search?bbox='+tenant.bbox+'&q=mediaType:'+type
        } else if (assetTypes.indexOf(type) >= 0) {
          console.debug('querying assets by assetType')
          query = '/v2/metadata/assets/search?bbox='+tenant.bbox+'&q=assetType:'+type
        } else if ((id !== undefined) && (type === 'children')) {
          console.debug('querying for children by parentAssetUid')
          query = '/v2/metadata/assets/'+id+'/subAssets'
        } else {
          console.debug('querying by assetUid')
          query = '/v2/metadata/assets/'+type 
        }

        headers = {authorization: 'Bearer '+client_token, 'predix-zone-id': zone} 
        queryURL = tenant.metadataservice+query
        console.log('Query URL: '+queryURL)
        
        let response = (await request(queryURL,headers))
        // if content is not defined then return the response otherwise return the content.
        return (response.content === undefined) ? response : response.content 

    }

    // this function searches locations by their content variables
    async function locations(zone, type, coord){
      
      let query, headers, queryURL
      let locationTypes = ['PARKING_ZONE','TRAFFIC_LANE','WALKWAY']
      
      // (typeof(coord) === undefined) ? tenant.bbox : coord
      if (coord === undefined) {coord = '-90:-180,90:180'}
      
      if (type === 'bbox') {
        console.debug('querying locations by  bbox')
        query = '/v2/metadata/locations/search?bbox='+coord
      } else if (locationTypes.indexOf(type) >= 0) {
        console.debug('querying locations by locationType')
        query = '/v2/metadata/locations/search?bbox='+coord+'&q=locationType:'+type  
      } else {
        console.debug('querying locations by locationUid')
        query = '/v2/metadata/locations/'+type
      }

      headers = {authorization: 'Bearer '+client_token, 'predix-zone-id': zone} 
      queryURL = tenant.metadataservice+query
      console.log('Query URL: '+queryURL)
      
      let response = (await request(queryURL,headers))
      return (response.content === undefined) ? response : response.content 
  }

    async function events(zone, id, idType, type, start, stop) {
      
      let query, headers, queryURL, span

      let eventGroup = ['PKIN','PKOUT','PEDEVT','TFEVT','HUMIDITY','TEMPERATURE', 'PRESSURE', 'METROLOGY', 'TIMESERIES']
      let mediaGroup = ['CAMERA','ENV_SENSOR','EM_SENSOR']


      if (eventGroup.indexOf(type) <= 3) {
        if (idType == 'assetUid') {
          console.debug('querying events by asset, eventTypes and time span')
          query = '/v2/assets/'+id+'/events?eventType='+type
        } else if (idType == 'locationUid') {
          console.debug('querying events by locationUid, eventType, and time span')
          query = '/v2/locations/'+id+'/events?eventType='+type
        } else {
          console.debug('querying events by location, eventType and time span')
          query = '/v2/locations/events?eventTypes='+type+'&bbox='+tenant.bbox
        }
      } else if (eventGroup.indexOf(type) >= 4) {
        console.debug ('querying events by asset, eventTypes and time span')
        query = '/v2/assets/'+id+'/events?eventTypes='+type
      } else if (mediaGroup.indexOf(type) >= 0) {
        if (idType == 'assetUid') {
          console.debug('querying events by asset, assetType and time span')
          query = '/v2/assets/'+id+'/events?assetType='+type
        } else if (idType == 'locationUid') {
          console.debug('querying events by locationUid, assetType, and time span')
          query = '/v2/locations/'+id+'/events?assetType='+type
        } else {
          console.debug('querying events by location, assetType and time span')
          query = '/v2/locations/events?assetType='+type+'&bbox='+coord
        }
      } else {
          console.log('no condition met, no events being queried')
      }

      span = '&startTime='+start+'&endTime='+ ((typeof(stop)=='undefined') ? '9999999999999' : stop)
      headers = {authorization: 'Bearer '+client_token, 'predix-zone-id': zone}  
      queryURL = tenant.eventservice+query+span
      console.log('Query URL: '+queryURL )
      
      let response = (await request(queryURL,headers))
      return (response.content === undefined) ? response : response.content 
    }

    async function assetLocationAssociation(zone, id, type){
      let query, headers, queryURL
      headers = {authorization: 'Bearer '+client_token, 'predix-zone-id': zone} 
      
      if (type == 'locations') {
            console.log('getting locations associated with a specific assetUid: '+id)
            query = '/v2/metadata/assets/'+id+'/'+type

            queryURL = tenant.metadataservice+query
            console.log('Query URL: '+queryURL)
            let response = (await request(queryURL,headers))
            // reutrns a list of locations associated witht he input assetUid
            return (response.locations === undefined) ? response : response.locations 

      } else if (type == 'assets') {
            console.log('getting assets associated with a specific locationUid: '+id)
            query = query = '/v2/metadata/locations/'+id+'/'+type

            queryURL = tenant.metadataservice+query
            console.log('Query URL: '+queryURL)
            let response = (await request(queryURL,headers))
            // returns a list of assets associated with the input locationUid
            return (response.assets === undefined) ? response : response.assets 
          
      } else {
          console.log('incorrect type input')
      }
    }
 
    // calulates the time based on how many hours back you want to see. returns one timestamp since epoch
    function timecalc(hoursBack) {
      // Function to return current time for use to calculate the timeframe parameter for the parkingEvents query.  
      // The function minus the number of hours back accuratly articulates to the api what 
      // timeframe should be viewed.
      var date = new Date()
      return Date.UTC(date.getUTCFullYear(),date.getUTCMonth(), date.getUTCDate() , 
        date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds())-(hoursBack*60*60*1000);   
    }

    function convertTimestamp2Standard(timestamp){
      var utcSeconds = timestamp/1000;
      var d = new Date(0); // The 0 there is the key, which sets the date to the epoch
      d.setUTCSeconds(utcSeconds);
      return d
    }
  



  return {
      assets: assets,
      locations: locations,
      events: events,
      assetLocationAssociation: assetLocationAssociation,
      timecalc: timecalc,
      convertTimestamp2Standard: convertTimestamp2Standard
  }     
}


