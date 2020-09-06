exports.doc = "##################### >>>>>>>>>>>>>>  Arguements <<<<<<<<<<<<< ###################### " +
    "\n (Chosen_Index, Chosen_Geometry, Chosen_Geometry_M, Chosen_Geometry_H, T_Method) " + 
    "\n" +
    "\n >> Chosen_Index:" +
    "\n * 'ANDWI' " +
    "\n * 'MNDWI' " +
    "\n * 'NDWI' " +
    "\n * 'AWEIsh' " +
    "\n * 'AWEInsh' " +
    "\n * 'WI' " +
    "\n * 'TCW' " +
    "\n" +
    "\n >> Chosen_Geometry:" +
    "\n * Sample study area --> geometry " +
    "\n" +
    "\n >> Chosen_Geometry_M:" +
    "\n * A geometry sample for checking Missing Values such scan line errors  Sample_M --> Valid " +
    "\n" +
    "\n >> Chosen_Geometry_H:" +
    "\n * A geometry sample for creating histogram in Otsu method Sample_H --> Otsu  " +
    "\n" +
    "\n >> Threshold Choice:" +
    "\n * 'Hard Thresholding assuming zero seperating water from non water' --> 'Hard' " +
    "\n * 'Dynamic Thresholding for finding the optimum threshold seperating water from non water' --> 'Dynamic' " +
    "\n" +
    "\n >> Export Choice:" +
    "\n * Exporting the shapefile/featurecollection to Google Drive --> 'Google Drive'  " +
    "\n * Exporting the shapefile/featurecollection to Google Assets --> 'Google Assets'  " +
    "\n" +
    "\n >> Shapefile ID:" +
    "\n * 'A number indicating water body ID that can be obtained from exported .csv file' --> A number i.e., 2 " +
    "\n" +
    "\n   ########################################################################################";

// Packages >>>
var Scaled = require('users/Water_Delineation/water:Functions').Scaled;
var Clipper = require('users/Water_Delineation/water:Functions').Clipper;

// Chosen_Geometry_H >>>> Otsu


exports.init = function(Chosen_Index, Chosen_Geometry, Chosen_Geometry_M, Chosen_Geometry_H, T_Method, Export_Method, ID) {
  
  var Chart_Input = 'No';
  // Initiate zoom
  Map.centerObject(Chosen_Geometry, 10);

  // Initiate Arguements
  // Merge data
  var sensor_band_dict = ee.Dictionary({
                        l8 : ee.List([1,2,3,4,5,6,10]),
                        l7 : ee.List([0,1,2,3,4,6,9]),
                        l5 : ee.List([0,1,2,3,4,6,9]),
                        l4 : ee.List([0,1,2,3,4,6,9])  
                        });
  
  var Percent_Cloud = 80;
  
  // Sensor band names corresponding to selected band numbers                        
  var bandNames = ee.List(['BLUE','GREEN','RED','NIR','SWIR1','SWIR2','pixel_qa']);
  
  // ------------------------------------------------------
  // Landsat 4 - Data availability Aug 22, 1982 - Dec 14, 1993
  var ls4 = ee.ImageCollection('LANDSAT/LT04/C01/T1_SR')
              .filterBounds(Chosen_Geometry.bounds())
              .filterMetadata('CLOUD_COVER', 'less_than', Percent_Cloud)
              .select(sensor_band_dict.get('l4'), bandNames); 
  
  // ------------------------------------------------------
  // Landsat 5 - Data availability Jan 1, 1984 - May 5, 2012 // missing 2003-01/04/2008
  var ls5 = ee.ImageCollection('LANDSAT/LT05/C01/T1_SR')
              .filterBounds(Chosen_Geometry.bounds())
              .filterMetadata('CLOUD_COVER', 'less_than', Percent_Cloud)
              .select(sensor_band_dict.get('l5'), bandNames); 
              
                
  // Landsat 7 data are only used during operational SLC and
  // to fill the gap between the end of LS5 and the beginning
  // of LS8 data collection
                
  // Prior to SLC-off            
  // -------------------------------------------------------
  // Landsat 7 - Data availability Jan 1, 1999 - Aug 9, 2016
  // SLC-off after 31 May 2003
  var ls7 = ee.ImageCollection('LANDSAT/LE07/C01/T1_SR') 
                .filterDate('1999-01-01', '2003-05-31') 
                .filterBounds(Chosen_Geometry.bounds())
                .filterMetadata('CLOUD_COVER', 'less_than', Percent_Cloud)
                //.map(exports.cloudMaskL457)
                .select(sensor_band_dict.get('l7'), bandNames);
          
  // Post SLC-off; fill the LS 5 gap
  // -------------------------------------------------------
  // Landsat 7 - Data availability Jan 1, 1999 - Aug 9, 2016 // this dataset still has SLC_off
  // SLC-off after 31 May 2003
  var ls7_2 = ee.ImageCollection('LANDSAT/LE07/C01/T1_SR') 
                .filterDate('2012-05-05', '2014-04-11') 
                .filterBounds(Chosen_Geometry.bounds())
                .filterMetadata('CLOUD_COVER', 'less_than', Percent_Cloud)
                //.map(exports.cloudMaskL457)
                .select(sensor_band_dict.get('l7'), bandNames);
           
  // --------------------------------------------------------
  // Landsat 8 - Data availability Apr 11, 2014 - present
  var ls8 = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR')  
                .filterBounds(Chosen_Geometry.bounds())
                .filterMetadata('CLOUD_COVER', 'less_than', Percent_Cloud)
                //.map(exports.maskL8sr)
                .select(sensor_band_dict.get('l8'), bandNames);
              
  // Merge landsat collections
  var MergedDataset = ee.ImageCollection(ls4
                .merge(ls5)
                .merge(ls7)
                .merge(ls7_2)
                .merge(ls8).sort('system:time_start'));
                //.filterDate(startdate, enddate);
  
  // Scale  
  var scaled = MergedDataset.map(Scaled);
  
  // Clip
  var newDatasetAll = scaled.map(function(image) { return Clipper(image, Chosen_Geometry); });
  
  // Add new Bands
  var addOnes = newDatasetAll.map(exports.makeNDWI).map(exports.makemNDWI).map(exports.makeaNDWI)
                             .map(exports.makeAWEInsh).map(exports.makeAWEIsh).map(exports.makeWI)
                             .map(exports.makeTCW).map(exports.makeSHADOW).map(exports.QA);
  
  // Date
  var startdate = ee.Date('1984-01-01');
  var enddate = ee.Date('2022-06-01');
  
  // Difference in days between start and finish
  var diff = enddate.difference(startdate, 'month');
  
  // Make a list of all dates
  var range = ee.List.sequence(0, diff.subtract(1)).map(function(month){return startdate.advance(month, 'month')});
  
  // Advance rate in time
  var adv = ee.Number(1);
  
  var sequenceNumber0 = ee.Number(ee.List(range).length()).divide(adv).int().subtract(1);
  
  // Setup elements
  var counter = ee.List.sequence(0, sequenceNumber0);
  
  // Filter out Images with null values
  var NewCol0 = exports.Get_FlawedOnes(range, adv, addOnes, counter, Chosen_Geometry_M);
  
  var NewcolAll = NewCol0.filterMetadata('BV', 'not_equals', ee.Number(0));
  
  // Cloud Filter
  var range2 = NewcolAll
              .reduceColumns(ee.Reducer.toList(), ["system:time_start"])
              .get('list');
  
  var sequenceNumber = ee.Number(ee.List(range2).length()).subtract(1);
  
  // Setup elements
  var counter2 = ee.List.sequence(0, sequenceNumber);
  
  var NewCol2 = exports.Get_Chosen_IndexIndex(NewcolAll, counter2);
  
  // Get the area for NDWI
  var Index = 'NDWI';
  var areaCollectionNDWI = exports.Get_WaterArea(Index, NewCol2, counter2, Chosen_Geometry, range);
  
  // get the area for AWEIsh
  Index = 'WI';
  var areaCollectionAWEIsh = exports.Get_WaterArea(Index, NewCol2, counter2, Chosen_Geometry, range);
  
  // Make a Dictionary on the server.
  var dictionaryIndex = ee.Dictionary({
    NDWI: null,
    AWEInsh: null
  });
  
  var Index0 = ee.Number(0);
  
  var sumNDWI = exports.Get_Sumation(areaCollectionNDWI, Index0);
  
  var sumAWEInsh = exports.Get_Sumation(areaCollectionAWEIsh, Index0);
  
  // average
  var aveNDWI = ee.Number(ee.Number(sumNDWI).divide(ee.Number(ee.List(range2).length())));
  
  var aveAWEIsh = ee.Number(ee.Number(sumAWEInsh).divide(ee.Number(ee.List(range2).length())));
  
  //Min & Max
  var Max = ee.Number(0);
  var MaxNum;
  
  var Min = ee.Number(9999999999);
  var MinNum;
  
  var MaxNDWI = exports.Get_MaxFind(areaCollectionNDWI, Max, MaxNum);
  
  var MinNDWI = exports.Get_MinFind(areaCollectionNDWI, Min, MinNum);
  
  var MaxAWEIsh = exports.Get_MaxFind(areaCollectionAWEIsh, Max);
  
  var MinAWEIsh = exports.Get_MinFind(areaCollectionAWEIsh, Min);
  
  // normalise the data
  var NormNDWI = exports.Get_NormIndex(areaCollectionNDWI, aveNDWI, MaxNDWI, MinNDWI, counter2);
  
  var NormAWEIsh = exports.Get_NormIndex(areaCollectionAWEIsh, aveAWEIsh, MaxAWEIsh, MinAWEIsh, counter2);
  
  // plot the norms 
  var Chart1 = exports.Get_FC(NormNDWI, NormAWEIsh, counter2);
  //--------------> 
  
  // subtract two indicies
  var Subtracted = exports.Get_SUB(areaCollectionNDWI, areaCollectionAWEIsh, counter2);

  var quan1 = Subtracted.reduce(ee.Reducer.percentile([25]));

  var quan3 = Subtracted.reduce(ee.Reducer.percentile([75]));

  var Condition_V1 = exports.Get_Condi1(Subtracted, quan1, quan3, counter2);

  var Condition1 = ee.List(Condition_V1).splice(0, 1);

  var sizeof0 = ee.Number(ee.List(range2).length()).subtract(ee.Number(1));

  // moving average
  var movingAve = exports.Get_movingAverage(Condition1, sizeof0, quan1, counter2);

  var SeriesList = exports.Get_Series(Subtracted, movingAve, counter2);

  //Compute percentile
  var percentile70 = SeriesList.reduce(ee.Reducer.percentile([75]));

  var CloudList = exports.Get_ONOFF(SeriesList, percentile70, counter2);

  // plot the cloud chart
  var Chart2 = exports.Get_FC2(CloudList, counter2);
  //--------------> 
  switch(Chart_Input) {
    
      case 'Yes':
        print(Chart1);
        print(Chart2);
        break;
        
      case 'yes':
        print(Chart1);
        print(Chart2);
        break;
        
      case 'No':
        break;
        
      case 'no':
        break;
        
      default:
        print('Wrong input for chart options! "Yes" for printing and "No" for no print');
        break;
  }
  // add metadata
  var metacollAll = exports.Get_metaAdd(NewCol2, SeriesList, percentile70, counter2);

  var CleanCollection = metacollAll.filterMetadata('cloud', 'not_equals', ee.Number(1));

  //################################### Export Area ############################################# 
  var range3 = CleanCollection
                .reduceColumns(ee.Reducer.toList(), ["system:time_start"])
                .get('list');
                
  var sequenceNumber3 = ee.Number(ee.List(range3).length()).divide(adv).int().subtract(1);
  
  var counter3 = ee.List.sequence(0, sequenceNumber3);
  
  var newcol3 = exports.Get_Chosen_IndexIndex(CleanCollection, counter3);
  
  var sequenceNumber4 = ee.Number(ee.List(range3).length()).subtract(1);
 
  var counter4 = ee.List.sequence(0, sequenceNumber4);
  
  switch(T_Method) {
    
      case 'Dynamic':
        var areaCollection = require('users/Water_Delineation/water:Dynamic_threshold')
        .init(Chosen_Index, Chosen_Geometry, Chosen_Geometry_M, Chosen_Geometry_H, adv, newcol3, CleanCollection, range3, counter4, counter3)
        .areaCollection;
        
        var Otsucol = require('users/Water_Delineation/water:Dynamic_threshold')
        .init(Chosen_Index, Chosen_Geometry, Chosen_Geometry_M, Chosen_Geometry_H, adv, newcol3, CleanCollection, range3, counter4, counter3)
        .Otsucol;
        
        var Q1 = areaCollection.reduce(ee.Reducer.percentile([25]));
  
        var Q3 = areaCollection.reduce(ee.Reducer.percentile([75]));
        
        var IQR = ee.Number(Q3).subtract(ee.Number(Q1));
        
        var Outlier_A = ee.Number(Q3).add(ee.Number(1.5).multiply(IQR));
        
        var Outlier_B = ee.Number(Q1).subtract(ee.Number(1.5).multiply(IQR));
        
        var Final_Coll = exports.Get_Outlier(areaCollection, Otsucol, Outlier_A, Outlier_B, counter4);
        
        var range4 = Final_Coll
                      .reduceColumns(ee.Reducer.toList(), ["system:time_start"])
                      .get('list');
                      
        var sequenceNumber5 = ee.Number(ee.List(range4).length()).subtract(1);
 
        var counter5 = ee.List.sequence(0, sequenceNumber5);
        
        var Final_Coll_Update = exports.Get_Chosen_IndexIndex(Final_Coll, counter5);
                    
        var areaCollection_shape = exports.Get_waterBodies_shape(Final_Coll_Update, Chosen_Index, counter5, T_Method); 
        break;
        
      case 'Hard':
        var areaCollection = exports.Get_waterBodies(newcol3, Chosen_Index, Chosen_Geometry, range, counter4);
        
        var Q1 = areaCollection.reduce(ee.Reducer.percentile([25]));
  
        var Q3 = areaCollection.reduce(ee.Reducer.percentile([75]));
        
        var IQR = ee.Number(Q3).subtract(ee.Number(Q1));
        
        var Outlier_A = ee.Number(Q3).add(ee.Number(1.5).multiply(IQR));
        
        var Outlier_B = ee.Number(Q1).subtract(ee.Number(1.5).multiply(IQR));
        
        var Final_Coll = exports.Get_Outlier(areaCollection, newcol3, Outlier_A, Outlier_B, counter4);
        
        var range4 = Final_Coll
                      .reduceColumns(ee.Reducer.toList(), ["system:time_start"])
                      .get('list');
                      
        var sequenceNumber5 = ee.Number(ee.List(range4).length()).subtract(1);
        
        var counter5 = ee.List.sequence(0, sequenceNumber5);
        
        var Final_Coll_Update = exports.Get_Chosen_IndexIndex(Final_Coll, counter5);
        
        var areaCollection_shape = exports.Get_waterBodies_shape(Final_Coll_Update, Chosen_Index, counter5, T_Method);
        break;
        
      default:
        print('Wrong input for chart options! "Dynamic" for optimum threshold and "Hard" for zero threshold');
        break;
  }
  
  var areaCollection_shape2 = ee.ImageCollection.fromImages(areaCollection_shape);
 
  exports.Export_shape(areaCollection_shape2, newcol3, ID, Chosen_Index, Chosen_Geometry, range3, Export_Method);
  
  var Area_Coll = exports.Get_Areas(Final_Coll_Update, counter5);
  
  //################################### Export time and area #############################################    
  
  var Gedo_time = ee.List(range4).map(exports.gedo);
  
  var listFeature = ee.Feature(ee.Geometry.Point(0, 0), null);
  
  var i = 0;
  
  var listFeature0 = Gedo_time.map(function(data) { return exports.Future_Builder(data, i, listFeature); });
  
  var coll_time = ee.FeatureCollection(listFeature0);
  
  Export.table.toDrive({
    collection: coll_time,
    description: "Dates_" + Chosen_Index,
    fileFormat: 'CSV',
    folder: 'Water',
    fileNamePrefix: "Dates_" + Chosen_Index,
  });
  
  
  listFeature = ee.Feature(ee.Geometry.Point(0, 0), null);
  
  i = 0;

  var listFeature1 = Area_Coll.map(function(data) { return exports.Future_Builder(data, i, listFeature); });
  
  var coll = ee.FeatureCollection(listFeature1);
  
  Export.table.toDrive({
    collection: coll,
    description: Chosen_Index,
    fileFormat: 'CSV',
    folder: 'Water',
    fileNamePrefix: Chosen_Index,
  });

  return {
    makeNDWI: exports.makeNDWI,
    makemNDWI: exports.makemNDWI,
    makeaNDWI: exports.makemNDWI,
    makeSHADOW: exports.makeSHADOW,
    makeQA: exports.QA,
    makeAWEIsh: exports.makeAWEIsh,
    makeAWEInsh: exports.makeAWEInsh,
    makeWI: exports.makeWI,
    makeTCW: exports.makeTCW,
    Get_Years: exports.Get_Years,
    Get_calen: exports.Get_calen,
    Get_FlawedOnes: exports.Get_FlawedOnes,
    Get_Chosen_IndexIndex: exports.Get_Chosen_IndexIndex,
    Get_WaterArea: exports.Get_WaterArea,
    Get_Sumation: exports.Get_Sumation,
    Get_MaxFind: exports.Get_MaxFind,
    Get_MinFind: exports.Get_MinFind,
    Get_NormIndex: exports.Get_NormIndex,
    Get_FC: exports.Get_FC,
    Get_FC2: exports.Get_FC2,
    Get_SUB: exports.Get_SUB,
    Get_Condi1: exports.Get_Condi1,
    Get_movingAverage: exports.Get_movingAverage,
    Get_Series: exports.Get_Series,
    Get_ONOFF: exports.Get_ONOFF,
    Get_metaAdd: exports.Get_metaAdd,
    Get_Outlier: exports.Get_Outlier,
    Get_Areas: exports.Get_Areas,
    gedo: exports.gedo,
    Future_Builder: exports.Future_Builder,
    Get_waterBodies: exports.Get_waterBodies,
    Get_waterBodies_shape: exports.Get_waterBodies_shape,
    Export_shape: exports.Export_shape
  };
};

//################################### Spectral Water Indices ################################################


exports.makeNDWI = function(image)
{
  var ndwi = image.expression(
    '(GREEN - NIR) / (GREEN + NIR)',
    {
      'NIR': image.select('NIR'),
      'GREEN': image.select('GREEN')
    }).rename('NDWI');
  return image.addBands(ndwi);
};

exports.makemNDWI = function(image)
{
  var mndwi = image.expression(
    '(GREEN - SWIR1) / (GREEN + SWIR1)',
    {
      'SWIR1': image.select('SWIR1'),
      'GREEN': image.select('GREEN')
    }).rename('mNDWI');
  return image.addBands(mndwi);
};

exports.makeaNDWI = function(image)
{
  var andwi = image.expression(
    '((RED + GREEN + BLUE) - (NIR + SWIR1 + SWIR2)) / ((RED + GREEN + BLUE) + (NIR + SWIR1 + SWIR2))',
    {
      'BLUE': image.select('BLUE'),
      'RED': image.select('RED'),
      'NIR': image.select('NIR'),
      'GREEN': image.select('GREEN'),
      'SWIR1': image.select('SWIR1'),
      'SWIR2': image.select('SWIR2')
    }).rename('aNDWI');
  return image.addBands(andwi);
};

exports.makeSHADOW = function(image)
{
  var shadow = image.expression(
    '(RED - SWIR1) / (RED + SWIR1)',
    {
      'RED': image.select('RED'),
      'SWIR1': image.select('SWIR1')
    }).rename('SHADOW');
  return image.addBands(shadow);
};

exports.QA = function(image)
{
  var qa = image.expression(
    '(-pixel_qa)',
    {
      'pixel_qa': image.select('pixel_qa'),
    }).rename('pixel_qa2');
  return image.addBands(qa);
};

exports.makeAWEIsh = function(image)
{
  var aweish = image.expression(
    '(4 * (GREEN - SWIR1)) - ((0.25 * NIR) + (2.75 * SWIR2))',
    {
      'NIR': image.select('NIR'),
      'GREEN': image.select('GREEN'),
      'SWIR1': image.select('SWIR1'),
      'SWIR2': image.select('SWIR2')
    }).rename('AWEIsh');
  return image.addBands(aweish);
};

exports.makeAWEInsh = function(image)
{
  var aweinsh = image.expression(
    'BLUE + (2.5 * GREEN) - (1.5 * (NIR + SWIR1)) - (0.25 * SWIR2)',
    {
      'NIR': image.select('NIR'),
      'BLUE': image.select('BLUE'),
      'GREEN': image.select('GREEN'),
      'SWIR1': image.select('SWIR1'),
      'SWIR2': image.select('SWIR2')
    }).rename('AWEInsh');
  return image.addBands(aweinsh);
};

exports.makeWI = function(image)
{
  var wi = image.expression(
    '1.7204 + (171 * GREEN) + (3 * RED) - (70 * NIR) - (45 * SWIR1) - (71 * SWIR2)',
    {
      'RED': image.select('RED'),
      'GREEN': image.select('GREEN'),
      'NIR': image.select('NIR'),
      'SWIR1': image.select('SWIR1'),
      'SWIR2': image.select('SWIR2')
    }).rename('WI');
  return image.addBands(wi);
};

exports.makeTCW = function(image)
{
  var tcw = image.expression(
    '(0.0315 * BLUE) + (0.2021 * GREEN) + (0.3102 * RED) + (0.1594 * NIR) - (0.6806 * SWIR1) - (0.6109 * SWIR2)',
    {
      'BLUE': image.select('BLUE'),
      'RED': image.select('RED'),
      'GREEN': image.select('GREEN'),
      'NIR': image.select('NIR'),
      'SWIR1': image.select('SWIR1'),
      'SWIR2': image.select('SWIR2')
    }).rename('TCW');
  return image.addBands(tcw);
};

//############################ Fillter data with masked values ###################################################

exports.Get_FlawedOnes = function(range, adv, addOnes, counter, Chosen_Geometry_M)
  {
    var flawedOnes = function(count, bvlist)
    {
      var date = ee.Date(range.get(ee.Number(count).multiply(adv)));
      
      bvlist = ee.List(bvlist);
      
      var BV = ee.Number(0);
  
      // Filter collection between date and the next month
      var filtered = addOnes.filterDate(date, date.advance(adv,'month'));
      
      // Post Processing function
      function postProcessing(count, filtered) {
        // Make the mosaic
         var image1 = ee.Image(filtered.qualityMosaic('pixel_qa2'));
      
        // assign time 
        var image = ee.Feature(image1).set('system:time_start', range.get(ee.Number(count).multiply(adv)));
      
        //check the mosaic
        var newSample = image1.select(['RED']);
        
        var lake_mask = newSample.gt(0).unmask(0);
      
        // reduce to the region
        var binaryValue = lake_mask.reduceRegion({
                    reducer: ee.Reducer.product(), 
                    geometry: Chosen_Geometry_M,
                    scale: 30,
                    bestEffort: true
                    });
                  
        // Convert to Number for further use
        BV = ee.Number(binaryValue.get('RED'));
        
        return [BV, image];
      }
      var image;
      
      function catalist (count, filtered, bvlist)
      {
        BV = postProcessing(count, filtered)[0];
        
        image = postProcessing(count, filtered)[1];
        
        // assign bivariate 
        var image2 = ee.Feature(image).set('BV', ee.Number(BV));
        
        return bvlist.add(image2);
      }
      
      // check if empty skip the process
      return ee.Algorithms.If(ee.Number(filtered.size()).eq(0), bvlist, catalist(count, filtered, bvlist));
  };
  var newcol0 = ee.ImageCollection(ee.List(counter.iterate(flawedOnes, ee.List([]))));
  
  return newcol0;
};

// ################################## Cloud Filter ########################################################

// Adjust Chosen_Indextem index 
exports.Get_Chosen_IndexIndex = function(NewcolAll, counter2)
{
  var Chosen_IndexIndex = function(counter2, nlist) 
  {
    nlist = ee.List(nlist);
    
    var listOfImages = NewcolAll.toList(NewcolAll.size());
    
    var image = ee.Feature(listOfImages.get(counter2)).set('system:index', ee.String(ee.Number(counter2).int()));
    
    return nlist.add(image);
  };
  var Newcol2 = ee.ImageCollection(ee.List(counter2.iterate(Chosen_IndexIndex, ee.List([]))));
  
  return Newcol2;
};

// Water Area
exports.Get_WaterArea = function(Index, Newcol2, counter2, Chosen_Geometry, range)
{
  var WaterBodiesCloud = function(count2, areaList)
  {
    areaList = ee.List(areaList);
  
    // convert to string
    var counter = ee.String(ee.Number(count2).int());
    
    // select the NDWI image
    var WATERimage = ee.Image(Newcol2.filterMetadata('system:index', 'equals', counter)
                        .select(Index)
                        .mean());
    
    // find water
    var lake_mask= WATERimage.gt(0);
    
    // remove none water
    var lake_mask1 = ee.Image(1).mask(lake_mask).toInt();
    
    // calculate area
    var areaImage = lake_mask1.multiply(ee.Image.pixelArea().divide(10000));
    var areas = areaImage.reduceRegion({
      reducer:ee.Reducer.sum(),
      geometry: Chosen_Geometry,
      scale: 30,
      maxPixels:1e13
    });
    
    // assign time 
    var area_T = {area: areas.get('constant'), date: range.get(count2)};
  
    // Add the area to a list only if the collection has images
    return areaList.add(area_T.area);//.add(area51.date);//ee.List(ee.Algorithms.If(ee.Number(2).eq(2), area51, areaList));
  };
  
  // Get the area for Index
  var areaCollection_Index = ee.List(counter2.iterate(WaterBodiesCloud, ee.List([])));
  
  return areaCollection_Index;
};

exports.Get_Sumation = function(areaCollectionIndex, Index0)
{
  var Sumation = function(NumList, SumCount){
    
    var areaValue = NumList;
    
    SumCount = ee.Number(SumCount);
    
    return SumCount.add(ee.Number(areaValue));
  };
  var sumIndex = areaCollectionIndex.iterate(Sumation, Index0);
  
  return sumIndex;
};

exports.Get_MaxFind = function(areaCollection, Max, MaxNum)
{
  var MaxFind = function(NumList, MaxCount)
  {
    var areaValue = NumList;
    
    MaxCount = ee.Number(MaxCount);
    
    MaxNum = ee.Algorithms.If(ee.Number(areaValue).gt(MaxCount), ee.Number(areaValue), MaxCount);
    
    return MaxNum;
  };
  var MaxIndex = ee.Number(areaCollection.iterate(MaxFind, Max));
  
  return MaxIndex;
};

exports.Get_MinFind = function(areaCollection, Min, MinNum)
{
  var MinFind = function(NumList, MinCount)
  {
    var areaValue = NumList;
      
    MinCount = ee.Number(MinCount);
      
    MinNum = ee.Algorithms.If(ee.Number(areaValue).lt(MinCount), ee.Number(areaValue), MinCount);
      
    return MinNum;
  };
  var MinIndex = ee.Number(areaCollection.iterate(MinFind, Min));
  
  return MinIndex;  
};

exports.Get_NormIndex = function(areaCollection, aveIndex, MaxIndex, MinIndex, counter2)
{
  var NormIndex = function(count2, normList)
  {
    normList = ee.List(normList);
  
    // convert to string
    var counter = ee.String(ee.Number(count2).int());
    
    // select the varaible
    var IndexVar = ee.Number(areaCollection.get(ee.Number(count2).int()));
  
    // normalize
    var zIndex = (IndexVar.subtract(aveIndex)).divide(MaxIndex.subtract(MinIndex));
  
    // Add the norm value to a list 
    return normList.add(zIndex);
  };
  
  var NormNDWI = ee.List(counter2.iterate(NormIndex, ee.List([])));
  
  return NormNDWI;
};

exports.Get_FC = function(NormNDWI, NormAWEIsh, counter2)
{
  var createFC = function(count2, list0) 
  {
    // cast the 'accumulating' object
    list0 = ee.List(list0); 
  
    var norm1 = ee.Number(NormNDWI.get(count2));
    
    var norm2 = ee.Number(NormAWEIsh.get(count2));
  
    var feat0 = ee.Feature(null, {'class': count2, 
                                 'NDWI': norm1,
                                  'WI': norm2});
                                 
    return list0.add(feat0);
  };
  
  var featList = ee.List(counter2.iterate(createFC, ee.List([])));
  
  var collection = ee.FeatureCollection(featList);
  
  var chart = ui.Chart.feature.byFeature(collection, 'class');
  
  return chart;
};

exports.Get_SUB = function(NormNDWI, NormAWEIsh, counter2)
{
  var SUB = function(count2, normList)
  {
    normList = ee.List(normList);
  
    // select the NDWI

    var NDWIvar = ee.Number(NormNDWI.get(ee.Number(count2).int()));
    // select the AWEInsh

    var AWEIshvar = ee.Number(NormAWEIsh.get(ee.Number(count2).int()));
    // subtract
    var Subt = NDWIvar.subtract(AWEIshvar).abs();
  
    // Add the norm value to a list 
    return normList.add(Subt);
  };
  
  var Subtracted = ee.List(counter2.iterate(SUB, ee.List([])));
  
  return Subtracted;
};

exports.Get_Condi1 = function(Subtracted, quan1, quan3, counter2)
{
  var Condi1 = function(count2, conditionList)
  {
    conditionList = ee.List(conditionList);
  
    var counter0 = ee.Number(count2).int();
    
    // convert to string
    var counter = ee.String(counter0);
    
    // get variable
    var vari1 = ee.Number(Subtracted.get(counter0));
    
    var backup = ee.List(conditionList).get(-1);
    
    // select the varaible
    var num1 = ee.Algorithms.If(vari1.lte(ee.Number(quan3)), ee.Number(vari1.abs()), backup);
    
    // Add the value to a list 
    return conditionList.add(num1);
  };
  
  var Condition1 = ee.List(counter2.iterate(Condi1, ee.List([0])));
  
  return Condition1;
};

exports.Get_movingAverage = function(Condition1, sizeof0, quan1, counter2)
{
  var movingAverage = function(count2, averageList)
  {
    averageList = ee.List(averageList);
    var keyNum = sizeof0.add(1);
    // convert to string
    var counter = ee.String(ee.Number(count2).int());
    var aveNum = ee.Number(0);
    
    switch(keyNum) {
      case 0:
        //last count
        var serverBoolean = ee.Number(count2).int().eq(ee.Number(sizeof0));
        aveNum = ee.Algorithms.If(serverBoolean, ee.Number(Condition1.get(ee.Number(count2).int())), aveNum);
        break;
      case 1:
        //last count
        var serverBoolean = ee.Number(count2).int().eq(ee.Number(sizeof0));
        aveNum = ee.Algorithms.If(serverBoolean, ee.Number(Condition1.get(ee.Number(count2).int())), aveNum);
        //n-1 count
        var serverBoolean1 = ee.Number(count2).int().eq(ee.Number(sizeof0).subtract(ee.Number(1)));
        aveNum = ee.Algorithms.If(serverBoolean1, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1))))))
        .divide(ee.Number(2)), aveNum);
        break;
      case 2:
        //last count
        var serverBoolean = ee.Number(count2).int().eq(ee.Number(sizeof0));
        aveNum = ee.Algorithms.If(serverBoolean, ee.Number(Condition1.get(ee.Number(count2).int())), aveNum);
        //n-1 count
        var serverBoolean1 = ee.Number(count2).int().eq(ee.Number(sizeof0).subtract(ee.Number(1)));
        aveNum = ee.Algorithms.If(serverBoolean1, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1))))))
        .divide(ee.Number(2)), aveNum);
        //n-2 count
        var serverBoolean2 = ee.Number(count2).int().eq(ee.Number(sizeof0).subtract(ee.Number(2)));
        aveNum = ee.Algorithms.If(serverBoolean2, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(2))))))
        .divide(ee.Number(3)), aveNum);
        break;
      case 3:
        //last count
        var serverBoolean = ee.Number(count2).int().eq(ee.Number(sizeof0));
        aveNum = ee.Algorithms.If(serverBoolean, ee.Number(Condition1.get(ee.Number(count2).int())), aveNum);
        //n-1 count
        var serverBoolean1 = ee.Number(count2).int().eq(ee.Number(sizeof0).subtract(ee.Number(1)));
        aveNum = ee.Algorithms.If(serverBoolean1, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1))))))
        .divide(ee.Number(2)), aveNum);
        //n-2 count
        var serverBoolean2 = ee.Number(count2).int().eq(ee.Number(sizeof0).subtract(ee.Number(2)));
        aveNum = ee.Algorithms.If(serverBoolean2, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(2))))))
        .divide(ee.Number(3)), aveNum);
        //n-3 count
        var serverBoolean3 = ee.Number(count2).int().eq(ee.Number(sizeof0).subtract(ee.Number(3)));
        aveNum = ee.Algorithms.If(serverBoolean3, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(2)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(3))))))
        .divide(ee.Number(4)), aveNum);
        break;
      case 4:
        //last count
        var serverBoolean = ee.Number(count2).int().eq(ee.Number(sizeof0));
        aveNum = ee.Algorithms.If(serverBoolean, ee.Number(Condition1.get(ee.Number(count2).int())), aveNum);
        //n-1 count
        var serverBoolean1 = ee.Number(count2).int().eq(ee.Number(sizeof0).subtract(ee.Number(1)));
        aveNum = ee.Algorithms.If(serverBoolean1, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1))))))
        .divide(ee.Number(2)), aveNum);
        //n-2 count
        var serverBoolean2 = ee.Number(count2).int().eq(ee.Number(sizeof0).subtract(ee.Number(2)));
        aveNum = ee.Algorithms.If(serverBoolean2, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(2))))))
        .divide(ee.Number(3)), aveNum);
        //n-3 count
        var serverBoolean3 = ee.Number(count2).int().eq(ee.Number(sizeof0).subtract(ee.Number(3)));
        aveNum = ee.Algorithms.If(serverBoolean3, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(2)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(3))))))
        .divide(ee.Number(4)), aveNum);
         //n-4 count
        var serverBoolean4 = ee.Number(count2).int().eq(ee.Number(sizeof0).subtract(ee.Number(4)));
        aveNum = ee.Algorithms.If(serverBoolean4, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(2)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(3)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(4))))))
        .divide(ee.Number(5)), aveNum);
        break;
      case 5:
        //last count
        var serverBoolean = ee.Number(count2).int().eq(ee.Number(sizeof0));
        aveNum = ee.Algorithms.If(serverBoolean, ee.Number(Condition1.get(ee.Number(count2).int())), aveNum);
        //n-1 count
        var serverBoolean1 = ee.Number(count2).int().eq(ee.Number(sizeof0).subtract(ee.Number(1)));
        aveNum = ee.Algorithms.If(serverBoolean1, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1))))))
        .divide(ee.Number(2)), aveNum);
        //n-2 count
        var serverBoolean2 = ee.Number(count2).int().eq(ee.Number(sizeof0).subtract(ee.Number(2)));
        aveNum = ee.Algorithms.If(serverBoolean2, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(2))))))
        .divide(ee.Number(3)), aveNum);
        //n-3 count
        var serverBoolean3 = ee.Number(count2).int().eq(ee.Number(sizeof0).subtract(ee.Number(3)));
        aveNum = ee.Algorithms.If(serverBoolean3, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(2)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(3))))))
        .divide(ee.Number(4)), aveNum);
         //n-4 count
        var serverBoolean4 = ee.Number(count2).int().eq(ee.Number(sizeof0).subtract(ee.Number(4)));
        aveNum = ee.Algorithms.If(serverBoolean4, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(2)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(3)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(4))))))
        .divide(ee.Number(5)), aveNum);
        //n-5 count
        var serverBoolean5 = ee.Number(count2).int().eq(ee.Number(sizeof0).subtract(ee.Number(5)));
        aveNum = ee.Algorithms.If(serverBoolean5, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(2)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(3)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(4)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(5))))))
        .divide(ee.Number(6)), aveNum);
        break;
      case 6:
        //last count
        var serverBoolean = ee.Number(count2).int().eq(ee.Number(sizeof0));
        aveNum = ee.Algorithms.If(serverBoolean, ee.Number(Condition1.get(ee.Number(count2).int())), aveNum);
        //n-1 count
        var serverBoolean1 = ee.Number(count2).int().eq(ee.Number(sizeof0).subtract(ee.Number(1)));
        aveNum = ee.Algorithms.If(serverBoolean1, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1))))))
        .divide(ee.Number(2)), aveNum);
        //n-2 count
        var serverBoolean2 = ee.Number(count2).int().eq(ee.Number(sizeof0).subtract(ee.Number(2)));
        aveNum = ee.Algorithms.If(serverBoolean2, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(2))))))
        .divide(ee.Number(3)), aveNum);
        //n-3 count
        var serverBoolean3 = ee.Number(count2).int().eq(ee.Number(sizeof0).subtract(ee.Number(3)));
        aveNum = ee.Algorithms.If(serverBoolean3, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(2)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(3))))))
        .divide(ee.Number(4)), aveNum);
         //n-4 count
        var serverBoolean4 = ee.Number(count2).int().eq(ee.Number(sizeof0).subtract(ee.Number(4)));
        aveNum = ee.Algorithms.If(serverBoolean4, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(2)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(3)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(4))))))
        .divide(ee.Number(5)), aveNum);
        //n-5 count
        var serverBoolean5 = ee.Number(count2).int().eq(ee.Number(sizeof0).subtract(ee.Number(5)));
        aveNum = ee.Algorithms.If(serverBoolean5, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(2)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(3)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(4)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(5))))))
        .divide(ee.Number(6)), aveNum);
        //n-6 count
        var serverBoolean6 = ee.Number(count2).int().eq(ee.Number(sizeof0).subtract(ee.Number(6)));
        aveNum = ee.Algorithms.If(serverBoolean6, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(2)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(3)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(4)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(5)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(6))))))
        .divide(ee.Number(7)), aveNum);
        break;
      case 7:
        //last count
        var serverBoolean = ee.Number(count2).int().eq(ee.Number(sizeof0));
        aveNum = ee.Algorithms.If(serverBoolean, ee.Number(Condition1.get(ee.Number(count2).int())), aveNum);
        //n-1 count
        var serverBoolean1 = ee.Number(count2).int().eq(ee.Number(sizeof0).subtract(ee.Number(1)));
        aveNum = ee.Algorithms.If(serverBoolean1, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1))))))
        .divide(ee.Number(2)), aveNum);
        //n-2 count
        var serverBoolean2 = ee.Number(count2).int().eq(ee.Number(sizeof0).subtract(ee.Number(2)));
        aveNum = ee.Algorithms.If(serverBoolean2, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(2))))))
        .divide(ee.Number(3)), aveNum);
        //n-3 count
        var serverBoolean3 = ee.Number(count2).int().eq(ee.Number(sizeof0).subtract(ee.Number(3)));
        aveNum = ee.Algorithms.If(serverBoolean3, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(2)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(3))))))
        .divide(ee.Number(4)), aveNum);
         //n-4 count
        var serverBoolean4 = ee.Number(count2).int().eq(ee.Number(sizeof0).subtract(ee.Number(4)));
        aveNum = ee.Algorithms.If(serverBoolean4, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(2)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(3)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(4))))))
        .divide(ee.Number(5)), aveNum);
        //n-5 count
        var serverBoolean5 = ee.Number(count2).int().eq(ee.Number(sizeof0).subtract(ee.Number(5)));
        aveNum = ee.Algorithms.If(serverBoolean5, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(2)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(3)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(4)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(5))))))
        .divide(ee.Number(6)), aveNum);
        //n-6 count
        var serverBoolean6 = ee.Number(count2).int().eq(ee.Number(sizeof0).subtract(ee.Number(6)));
        aveNum = ee.Algorithms.If(serverBoolean6, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(2)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(3)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(4)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(5)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(6))))))
        .divide(ee.Number(7)), aveNum);
        //n-7 count
        var serverBoolean7 = ee.Number(count2).int().eq(ee.Number(sizeof0).subtract(ee.Number(7)));
        aveNum = ee.Algorithms.If(serverBoolean7, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(2)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(3)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(4)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(5)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(6)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(7))))))
        .divide(ee.Number(8)), aveNum);
        break;
      case 8:
        //last count
        var serverBoolean = ee.Number(count2).int().eq(ee.Number(sizeof0));
        aveNum = ee.Algorithms.If(serverBoolean, ee.Number(Condition1.get(ee.Number(count2).int())), aveNum);
        //n-1 count
        var serverBoolean1 = ee.Number(count2).int().eq(ee.Number(sizeof0).subtract(ee.Number(1)));
        aveNum = ee.Algorithms.If(serverBoolean1, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1))))))
        .divide(ee.Number(2)), aveNum);
        //n-2 count
        var serverBoolean2 = ee.Number(count2).int().eq(ee.Number(sizeof0).subtract(ee.Number(2)));
        aveNum = ee.Algorithms.If(serverBoolean2, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(2))))))
        .divide(ee.Number(3)), aveNum);
        //n-3 count
        var serverBoolean3 = ee.Number(count2).int().eq(ee.Number(sizeof0).subtract(ee.Number(3)));
        aveNum = ee.Algorithms.If(serverBoolean3, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(2)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(3))))))
        .divide(ee.Number(4)), aveNum);
         //n-4 count
        var serverBoolean4 = ee.Number(count2).int().eq(ee.Number(sizeof0).subtract(ee.Number(4)));
        aveNum = ee.Algorithms.If(serverBoolean4, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(2)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(3)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(4))))))
        .divide(ee.Number(5)), aveNum);
        //n-5 count
        var serverBoolean5 = ee.Number(count2).int().eq(ee.Number(sizeof0).subtract(ee.Number(5)));
        aveNum = ee.Algorithms.If(serverBoolean5, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(2)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(3)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(4)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(5))))))
        .divide(ee.Number(6)), aveNum);
        //n-6 count
        var serverBoolean6 = ee.Number(count2).int().eq(ee.Number(sizeof0).subtract(ee.Number(6)));
        aveNum = ee.Algorithms.If(serverBoolean6, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(2)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(3)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(4)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(5)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(6))))))
        .divide(ee.Number(7)), aveNum);
        //n-7 count
        var serverBoolean7 = ee.Number(count2).int().eq(ee.Number(sizeof0).subtract(ee.Number(7)));
        aveNum = ee.Algorithms.If(serverBoolean7, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(2)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(3)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(4)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(5)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(6)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(7))))))
        .divide(ee.Number(8)), aveNum);
        //n-8 count
        var serverBoolean8 = ee.Number(count2).int().eq(ee.Number(sizeof0).subtract(ee.Number(8)));
        aveNum = ee.Algorithms.If(serverBoolean8, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(2)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(3)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(4)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(5)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(6)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(7)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(8))))))
        .divide(ee.Number(9)), aveNum);
        break;
      default:
        //last count
        var serverBoolean = ee.Number(count2).int().eq(ee.Number(sizeof0));
        aveNum = ee.Algorithms.If(serverBoolean, ee.Number(Condition1.get(ee.Number(count2).int())), aveNum);
        //n-1 count
        var serverBoolean1 = ee.Number(count2).int().eq(ee.Number(sizeof0).subtract(ee.Number(1)));
        aveNum = ee.Algorithms.If(serverBoolean1, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1))))))
        .divide(ee.Number(2)), aveNum);
        //n-2 count
        var serverBoolean2 = ee.Number(count2).int().eq(ee.Number(sizeof0).subtract(ee.Number(2)));
        aveNum = ee.Algorithms.If(serverBoolean2, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(2))))))
        .divide(ee.Number(3)), aveNum);
        //n-3 count
        var serverBoolean3 = ee.Number(count2).int().eq(ee.Number(sizeof0).subtract(ee.Number(3)));
        aveNum = ee.Algorithms.If(serverBoolean3, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(2)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(3))))))
        .divide(ee.Number(4)), aveNum);
         //n-4 count
        var serverBoolean4 = ee.Number(count2).int().eq(ee.Number(sizeof0).subtract(ee.Number(4)));
        aveNum = ee.Algorithms.If(serverBoolean4, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(2)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(3)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(4))))))
        .divide(ee.Number(5)), aveNum);
        //n-5 count
        var serverBoolean5 = ee.Number(count2).int().eq(ee.Number(sizeof0).subtract(ee.Number(5)));
        aveNum = ee.Algorithms.If(serverBoolean5, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(2)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(3)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(4)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(5))))))
        .divide(ee.Number(6)), aveNum);
        //n-6 count
        var serverBoolean6 = ee.Number(count2).int().eq(ee.Number(sizeof0).subtract(ee.Number(6)));
        aveNum = ee.Algorithms.If(serverBoolean6, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(2)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(3)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(4)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(5)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(6))))))
        .divide(ee.Number(7)), aveNum);
        //n-7 count
        var serverBoolean7 = ee.Number(count2).int().eq(ee.Number(sizeof0).subtract(ee.Number(7)));
        aveNum = ee.Algorithms.If(serverBoolean7, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(2)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(3)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(4)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(5)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(6)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(7))))))
        .divide(ee.Number(8)), aveNum);
        //n-8 count
        var serverBoolean8 = ee.Number(count2).int().eq(ee.Number(sizeof0).subtract(ee.Number(8)));
        aveNum = ee.Algorithms.If(serverBoolean8, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(2)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(3)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(4)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(5)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(6)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(7)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(8))))))
        .divide(ee.Number(9)), aveNum);
        //n-9 count
        var serverBoolean9 = ee.Number(count2).int().lte(ee.Number(sizeof0).subtract(ee.Number(9)));
        aveNum = ee.Algorithms.If(serverBoolean9, (ee.Number(Condition1.get(ee.Number(count2).int()))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(1)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(2)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(3)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(4)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(5)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(6)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(7)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(8)))))
        .add(ee.Number(Condition1.get(ee.Number(count2).int().add(ee.Number(9))))))
        .divide(ee.Number(10)), aveNum);
    }
    // Add the value to a list 
    return averageList.add(aveNum);
  };
  
  var movingAve = ee.List(counter2.iterate(movingAverage, ee.List([])));
  
  return movingAve;
};

exports.Get_Series = function(Subtracted, movingAve, counter2)
{
  var series = function(count2, seriesList)
  {
    seriesList = ee.List(seriesList);
  
    // select the NDWI
    var SubVar = ee.Number(Subtracted.get(ee.Number(count2).int())).abs();
    
    // select the AWEInsh
    var AveVar = ee.Number(movingAve.get(ee.Number(count2).int()));
  
    // subtract
    var SVar = SubVar.subtract(AveVar).abs();
  
    // Add the norm value to a list 
    return seriesList.add(SVar);
  };
  
  var SeriesList = ee.List(counter2.iterate(series, ee.List([])));
  
  return SeriesList;
};

exports.Get_ONOFF = function(SeriesList, percentile70, counter2)
{
  var ONOFF = function(count2, cloudList)
  {
    cloudList = ee.List(cloudList);
  
    // select the list
    var ListVar = ee.Number(SeriesList.get(ee.Number(count2).int()));
    
    //var metaVar = ee.Algorithms.If(ListVar.gt(ee.Number(percentile70)), ee.Number(0), ee.Number(0));
    var metaVar = ee.Algorithms.If(ListVar.gt(ee.Number(percentile70)), ee.Number(1), ee.Number(0));
  
    // Add the norm value to a list 
    return cloudList.add(metaVar);
  };

  var CloudList = ee.List(counter2.iterate(ONOFF, ee.List([])));
  
  return CloudList;
};

exports.Get_Outlier = function(SeriesList, percentile70, counter2)
{
  var ONOFF2 = function(count2, cloudList)
  {
    cloudList = ee.List(cloudList);
  
    // select the list
    var ListVar = ee.Number(SeriesList.get(ee.Number(count2).int()));
    
    //var metaVar = ee.Algorithms.If(ListVar.gt(ee.Number(percentile70)), ee.Number(0), ee.Number(0));
    var metaVar = ee.Algorithms.If(ListVar.gt(ee.Number(percentile70)), ee.Number(1), ee.Number(0));
  
    // Add the norm value to a list 
    return cloudList.add(metaVar);
  };

  var CloudList = ee.List(counter2.iterate(ONOFF, ee.List([])));
  
  return CloudList;
};

exports.Get_FC2 = function(CloudList, counter2)
{
  var createFC2 = function(count2, list) 
  {
    // cast the 'accumulating' object
    list = ee.List(list); 
  
    var cloud = ee.Number(CloudList.get(count2));
  
    var feat = ee.Feature(null, {'class': count2, 
                                 'cloud': cloud});
                                 
    return list.add(feat);
  };
  
  var featList = ee.List(counter2.iterate(createFC2, ee.List([])));
  
  var collection = ee.FeatureCollection(featList);
  
  var chart = ui.Chart.feature.byFeature(collection, 'class');
  
  return chart;
};

exports.Get_metaAdd = function(Newcol2, SeriesList, percentile70, counter2)
{
  var metaAdd = function(count2, metaList)
  {
    metaList = ee.List(metaList);
    
    // select the Image
    var listOfImages2 = Newcol2.toList(Newcol2.size());
    
    // select the list
    var ListVar = ee.Number(SeriesList.get(ee.Number(count2).int()));
    
    var metaVar = ee.Algorithms.If(ListVar.gt(ee.Number(percentile70)), ee.Number(1), ee.Number(0));
  
    // Assign 
    var metaImage = ee.Feature(listOfImages2.get(count2)).set('cloud', metaVar);
  
    // Add the norm value to a list 
    return metaList.add(metaImage);
  };
  
  var metacollAll = ee.ImageCollection(ee.List(counter2.iterate(metaAdd, ee.List([]))));
  
  return metacollAll;
};

exports.Get_Outlier = function(SeriesList, ImageCollection, Outlier_A, Outlier_B, counter4)
{
  var ONOFF2 = function(count2, OutList)
  {
    OutList = ee.List(OutList);
  
    // select the list
    var ListVar = ee.Number(SeriesList.get(ee.Number(count2).int()));
    
    var OutVar = ee.Algorithms.If(ListVar.gt(ee.Number(Outlier_A)), ee.Number(1), ee.Number(0));
    
    // select the Image
    var List_Image = ImageCollection.toList(ImageCollection.size());
    
    // Assign 
    var New_Image = ee.Feature(List_Image.get(count2)).set('Outlier', OutVar).set('Area', ListVar);
    
    // Add the norm value to a list 
    return OutList.add(New_Image);
  };

  var Outlier_List = ee.ImageCollection(ee.List(counter4.iterate(ONOFF2, ee.List([]))));
  
  var Clean_Coll = Outlier_List.filterMetadata('Outlier', 'not_equals', ee.Number(1)); 
  
  return Clean_Coll;
};

exports.Get_Areas = function(ImageCollection, counter5)
{
  var Extract_Area = function(count, CList)
  {
    CList = ee.List(CList);
  
    // select the Image
    var List_Image = ImageCollection.toList(ImageCollection.size());
    
    // Assign 
    var Area = ee.Feature(List_Image.get(count)).get('Area');
    
    // Add the norm value to a list 
    return CList.add(Area);
  };
  
  var A_List = ee.List(counter5.iterate(Extract_Area, ee.List([])));
  
  return A_List;
};

exports.gedo = function(dat)
{
  return ee.Date(dat).format('YYYY-MM-01');
};

exports.Future_Builder = function(data, i, listFeature)
{
  i++;
  
  return ee.Feature(listFeature.set(i.toString(), data));
};

exports.Get_waterBodies = function(newcol3, Chosen_Index, Chosen_Geometry, range, counter4)
{
  function waterBodies(count2, areaList)
  {
    areaList = ee.List(areaList);
  
    // convert to string
    var counter = ee.String(ee.Number(count2).int());
    
    // select the image
    var WATERimage = ee.Image(newcol3.filterMetadata('system:index', 'equals', ee.String(ee.Number(counter)))
                        .select(Chosen_Index)
                        .mean()); // normal case
    
    // find water
    var lake_mask= WATERimage.gt(0);
    
    // remove none water
    var lake_mask1 = ee.Image(1).mask(lake_mask).toInt();
    
    // calculate area
    var areaImage = lake_mask1.multiply(ee.Image.pixelArea().divide(10000));
    var areas = areaImage.reduceRegion({
      reducer:ee.Reducer.sum(),
      geometry: Chosen_Geometry,
      scale: 30,
      maxPixels:1e13
    });
    
    // assign time 
    var area51 = {area: areas.get('constant'), date: range.get(count2)};
  
    // Add the area to a list only if the collection has images
    return areaList.add(area51.area);
    }
  
  var areaCollection = ee.List(counter4.iterate(waterBodies, ee.List([])));
  
  return areaCollection;
};

exports.Get_waterBodies_shape = function(newcol, Chosen_Index, counter4, T_Method)
{
  function waterBodies_shape(count2, areaList_shape)
  {
    areaList_shape = ee.List(areaList_shape);
  
    // convert to string
    var counter = ee.String(ee.Number(count2).int());
    
    switch(T_Method) {
    
        case 'Dynamic':
          // select the image
          var WATERimage = ee.Image(newcol.filterMetadata('system:index', 'equals', ee.String(ee.Number(counter)))
                              .select(Chosen_Index)
                              .mean()); // normal case
                              
          // find threshold
          var TRimage = ee.ImageCollection(newcol.filterMetadata('system:index', 'equals', ee.String(ee.Number(counter))));
          var TRsh = TRimage.aggregate_first('threshold');
          var TrshNum = ee.Number.parse(TRsh);
        
          // find water
          var lake_mask= WATERimage.gt(TrshNum); // normal case
          break;

        case 'Hard':
          // select the image
          var WATERimage = ee.Image(newcol.filterMetadata('system:index', 'equals', ee.String(ee.Number(counter)))
                              .select(Chosen_Index)
                              .mean()); // normal case
          
          // find water                  
          var lake_mask= WATERimage.gt(0);
          break;
    }
    // remove none water
    var lake_mask1 = ee.Image(1).mask(lake_mask).toInt();
    
    
    var metaImage = ee.Feature(lake_mask1);
  
    // Add the area to a list only if the collection has images
    return areaList_shape.add(metaImage);
  }
  
  var areaCollection_shape = ee.List(counter4.iterate(waterBodies_shape, ee.List([])));
  
  return areaCollection_shape;
};

exports.Export_shape = function(Collection, newcol3, ID, Chosen_Index, Chosen_Geometry, range3, Export_Method)
{
  var Ref = ee.Image(newcol3.filterMetadata('system:index', 'equals', ee.String(ee.Number(0)))
                      .select(Chosen_Index)
                      .mean());
  
  var TargetImage = ee.Image(Collection.filterMetadata('system:index', 'equals', ee.String(ee.Number(ID))).select('constant').first());
  
  var ImageVector = TargetImage.reduceToVectors({
                                            geometry: Chosen_Geometry,
                                            scale: 30,
                                            crs: Ref.projection(),
                                            labelProperty: 'water',
                                            geometryType: 'polygon',
                                            eightConnected: true,
                                            bestEffort: true,
                                            maxPixels: 100000000
                                          });
  
  var ImageVector_meta = ImageVector.set('system:time_start', ee.List(range3).get(ee.Number(ID)))
                                    .set('system:index', ee.String(ee.Number(ID).toInt()));
                                    
  switch(Export_Method) {
    
        case 'Google Drive':
          Export.table.toDrive({
            collection: ImageVector_meta,
            description:'Sahape_' + ID.toString(),
            fileFormat: 'SHP',
            folder: 'Water',
            fileNamePrefix: 'Sahape_' + ID.toString()
          });
          break;
         
        case 'Google Assets': 
          Export.table.toAsset({
            collection: ImageVector_meta,
            description:'Shape_ID_' +  ID.toString(),
            assetId : 'Shape_ID_' +  ID.toString()
          });
          break;
  }
};