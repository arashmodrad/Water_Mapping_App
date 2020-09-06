//__________________________________________Initialize_____________________________________________//
//Map.addLayer(table, {color: 'FF0000'}, 'Imported Shapefile', false);
Map.setOptions('satellite');

var Chosen_Index;
var Chosen_Geometry;
var Chosen_Geometry_M;
var Chosen_Geometry_H; 
var T_Method;
var Export_Method = 'Google Drive';
var ID = 0;

// Create a panel with vertical flow layout.
var panel = ui.Panel({
  layout: ui.Panel.Layout.flow('vertical'),
  style: {width: '400px'}
});
var panel1 = ui.Panel({
  layout: ui.Panel.Layout.flow('vertical'),
  style: {width: '500px'}
});

//__________________________________________Panel_____________________________________________//

var label_O = ui.Label('Water Mapping App', {fontSize: '50px', fontWeight: 'bold', whiteSpace: 'pre'});
panel1.add(label_O);

var label1_O = ui.Label('\nChoose among water indices:', {fontWeight: 'bold', whiteSpace: 'pre'});
panel1.add(label1_O);

var Indices = {
  ANDWI: 'aNDWI',
  MNDWI: 'mNDWI',
  NDWI: 'NDWI',
  AWEInsh: 'AWEInsh',
  AWEIsh: 'AWEIsh',
  WI: 'WI',
};

var select_O = ui.Select({
  items: Object.keys(Indices),
  style: {stretch: 'horizontal',
          fontSize : 50
  },
  onChange: function(key) {
    Chosen_Index = Indices[key];
  }
}); 

select_O.setPlaceholder('Choose Water Index');
panel1.add(select_O);

var label2_O = ui.Label('\nDraw shapefiles:', {fontWeight: 'bold', whiteSpace: 'pre'});
panel1.add(label2_O);


var checkbox_GS = ui.Checkbox('Select "StudyArea" layer and draw');
checkbox_GS.onChange(function(checked) {
                Map.drawingTools().setLinked(false);
                Map.drawingTools().setDrawModes(['rectangle']);
                Map.drawingTools().addLayer([], 'StudyArea', 'red').setShown(checked);
                Map.drawingTools().setShape('rectangle');
                Map.drawingTools().draw();
                
                var getPolygon = ui.util.debounce(function() {
                  Chosen_Geometry = Map.drawingTools().layers().get(0).toGeometry();
                }, 100);

                Map.drawingTools().onDraw(getPolygon);
});
panel1.add(checkbox_GS);

var checkbox_GV = ui.Checkbox('Select "Validation_Polygon" layer and draw');
checkbox_GV.onChange(function(checked) {
                Map.drawingTools().setLinked(false);
                Map.drawingTools().setDrawModes(['rectangle']);
                Map.drawingTools().addLayer([], 'Validation_Polygon', 'blue').setShown(checked);
                Map.drawingTools().setShape('rectangle');
                Map.drawingTools().draw();

                var getPolygon_M = ui.util.debounce(function() {
                  Chosen_Geometry_M = Map.drawingTools().layers().get(1).toGeometry();
                }, 100);

                Map.drawingTools().onDraw(getPolygon_M);
});
panel1.add(checkbox_GV);


var checkbox_GO = ui.Checkbox('Select "Otsu_Polygon" layer and draw');
checkbox_GO.onChange(function(checked) {
                Map.drawingTools().setLinked(false);
                Map.drawingTools().setDrawModes(['rectangle']);
                Map.drawingTools().addLayer([], 'Otsu_Polygon', 'green').setShown(checked);
                Map.drawingTools().setShape('rectangle');
                Map.drawingTools().draw();

                var getPolygon_O = ui.util.debounce(function() {
                  Chosen_Geometry_H= Map.drawingTools().layers().get(2).toGeometry();
                }, 100);

                Map.drawingTools().onDraw(getPolygon_O);
});
panel1.add(checkbox_GO);/**/

var label3_O = ui.Label('\nSelect method of thresholding:', {fontWeight: 'bold', whiteSpace: 'pre'});
panel1.add(label3_O);

var Thresh = {
  Hard: 'Hard',
  Dynamic: 'Dynamic'
};

var select_O_2 = ui.Select({
  items: Object.keys(Thresh),
  style: {stretch: 'horizontal',
  },
  onChange: function(key) {
    T_Method = Thresh[key];
    
  }
});

select_O_2.setPlaceholder('Choose thresholding method', {fontWeight: 'bold'});
panel1.add(select_O_2);

var Exports = {
  Google_Drive: 'Google Drive',
  Google_Assets: 'Google Assets'
};

var select_O_3 = ui.Select({
  items: Object.keys(Exports),
  style: {stretch: 'horizontal',
  },
  onChange: function(key) {
    Export_Method = Exports[key];
  }
});

var label3_1_O = ui.Label('\nSelect method of storage of shape files:', {fontWeight: 'bold', whiteSpace: 'pre'});
panel1.add(label3_1_O);

select_O_3.setPlaceholder('Choose storage method', {fontWeight: 'bold'});
panel1.add(select_O_3);

var textbox = ui.Textbox({
  placeholder: 'Enter water feature ID',
  onChange: function(text) {
    ID = parseInt(text, 10);
    //print(typeof ID);
  }
});
panel1.add(textbox);


var label4_O = ui.Label('\n\n\n Compute historical water body area in hectares:', {fontWeight: 'bold', whiteSpace: 'pre'});
panel1.add(label4_O);

var Button_GV_O = ui.Button({label: 'Run WMA', 
                              onClick: function() {
                                require('users/Water_Delineation/water:Main')
                                .init(Chosen_Index, Chosen_Geometry, Chosen_Geometry_M, Chosen_Geometry_H, T_Method, Export_Method, ID);
                              },
                              style: {stretch: 'horizontal',
                                     color: '#FF0000',
                                     fontWeight: 'bold',
                             },
});
panel1.add(Button_GV_O);


ui.root.add(panel1);
