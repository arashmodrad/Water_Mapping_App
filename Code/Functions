
exports.init = function(Chosen_Geometry) {
  
return {
    Scaled: exports.Scaled,
    Radiance: exports.Radiance,
    Clipper: exports.Clipper,
    printer: exports.printer,
    stats: exports.stats
  };
};

// scaled to reflectance
exports.Scaled = function(image) 
{
  return image.divide(10000)
      .select(image.bandNames())
      .copyProperties(image, ["system:time_start"]);
};

// Convert the raw data to radiance.
exports.Radiance = function(image)
{
  var radiance = ee.Algorithms.Landsat.calibratedRadiance(image);
  
  return radiance;
};

// clip tool
exports.Clipper = function(image, Chosen_Geometry)
{
  return image.clip(Chosen_Geometry);
};

// printer
exports.printer = function(array)
{
  var string = "";
  array.forEach(function(element){
      string += element;
  });
  console.log(string);
};

// stats of image
exports.stats = function(image1, index, geo)
{
  var image = image1.reproject('EPSG:4326', null, 30);
  // max
  var maxReducer = ee.Reducer.max();
  var maxValue = image.reduceRegion({
    reducer: maxReducer,
    geometry: geo,
    bestEffort: true
  });
  // min
  var minReducer = ee.Reducer.min();
  var minValue = image.reduceRegion({
    reducer: minReducer,
    geometry: geo,
    bestEffort: true
  });
  
  var array = ["Max of ", index, " is: "];
  printer(array);
  print(maxValue.get(index));
  
  var array2 = ["Min of ", index, " is: "];
  printer(array2);
  print(minValue.get(index));
  return maxValue;
};


