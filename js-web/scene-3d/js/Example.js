
var canvas = document.getElementById('myCanvas');
var ctx = canvas.getContext('2d');

//ctx.fillText("ComicVM", 100, 100);

// These: 
//  units relativ zum referenzpunkt des zugehoerigen objekts
//  erleichtern die wiederverwendbarkeit.
// begruendung:
//  so lassen sich bgr-units als scene-units verwenden

// Debugging Options

// black
DEBUG_PANEL = false;
DEBUG_HORIZON = true;
// red
DEBUG_PERSPECTIVE = false;
// green
DEBUG_BGR_UNIT = false;
// grey
DEBUG_OBJ_UNIT = false;
// cyan
DEBUG_IMAGE = false;

// Object Declarations
//
// ( Tipp: 
//   die Unit-Groessen (size, x, y) eines Objekts entsprechen visuell 
//   einem Kreis in normal-Koordinaten relativ zum Objekt-Bild.
//   Indem dieser Kreis in den Kreis der Perspektive eingepasst wird,
//   ergibt sich die Groesse eines Objekts am Nullpunkt des 
//   raeumlichen Koordinaten-Systems
// )

// TODO: verifiziere, dass die Darstellung sich korrekt an folgende Werte anpasst:

var TEST_OBJ_IMG_SIZE = 2;
var TEST_OBJ_SIT_X = 	1;
var TEST_OBJ_SIT_Y = 	0;

function setUpObj() {
	return new Obj(
		"meerkat",
		{
			"size":	TEST_OBJ_IMG_SIZE, 
			"x": 	TEST_OBJ_SIT_X,
			"y":	TEST_OBJ_SIT_Y
		}
	);
}

// TODO: verifiziere, dass die Darstellung sich korrekt an folgende Werte anpasst:

var TEST_OBJ_X =  0;
var TEST_OBJ_Y =  0;
var TEST_OBJ_Z =  0;

function getObjs() { // create objects
	result = new Array();
	
	var LINES = 8;
	var ROWS = 	4;
	for (var i = 0; i < LINES; i++) {
		for (var r = 0; r < ROWS; r++) {
			result[i * ROWS + r] = obj_meerkat.clone();
			result[i * ROWS + r].pos =	new Position3D( 
												TEST_OBJ_X + r - (ROWS-1)/2, 
												TEST_OBJ_Y, 
												TEST_OBJ_Z + i);
		}
	}
	return result;
}

// Scene Declaration
//
// ( Tipp:
//	 die Unit-Groessen der Perspektive (size, y) bzw. (size, x, y) entsprechen visuell 
//   einem Kreis in normal-Koordinaten relativ zum Panel bzw. zum Hintergrund.
//   Indem in diesen Kreis der Kreis des Objektes am Nullpunkt des 
//   raeumlichen Koordinaten-Systems eingepasst wird, 
//   ergibt sich die Groesse der Objekte im Raum. 
// )

// TODO: verifiziere, dass die Darstellung sich korrekt an folgende Werte anpasst:

var TEST_BGR_FLUCHT_X =  	 0;
var TEST_BGR_FLUCHT_Y =  	 0;

var TEST_PANEL_FLUCHT_X = 	 0;
var TEST_PANEL_FLUCHT_Y = 	-0;

var TEST_BGR_UNIT_SIZE = 	 1;
var TEST_BGR_UNIT_Y = 	 	 0;

var TEST_PANEL_UNIT_SIZE = 	  1;
var TEST_PANEL_UNIT_X = 	  0;


function setUpPanel() {

	var scene_karoo = new Scene(
		new Bgr(
			'karoo', 
			
			new Flucht(
					TEST_BGR_FLUCHT_X, 
					TEST_BGR_FLUCHT_Y
			),
	
			newBgrUnit({
				"size": TEST_BGR_UNIT_SIZE,
				"y":	TEST_BGR_UNIT_Y
			})
		),
		getObjs()
	);
	
	// Panel Declaration
	
	var panel = new Panel(
		new Text("Hilo! :)"),
		scene_karoo,
		new Perspective(
			new Flucht(
					TEST_PANEL_FLUCHT_X, 
					TEST_PANEL_FLUCHT_Y
			),
					
			// Tipp: 
			// 	Um kongruente Units von Bgr und Perspective zu gewaehrleisten
			//	uebernimmt man am besten die Unit des Bgr...
			scene_karoo.bgr.bgrUnit.clone()
					.setX(TEST_PANEL_UNIT_X)
					.setSize(TEST_PANEL_UNIT_SIZE)
		)
	);
	
	return panel;
}

var obj_meerkat;
var panel;

function drawExample() {
	obj_meerkat = setUpObj();
	panel = setUpPanel();
	panel.draw(ctx, new Rectangle(20, 20, 400, 300));
}

window.onload = function() {
	drawExample();
	initConfig();
};

$('#parameters input').change(function() {
	configureExample();
	drawExample();
});

//$(document).ready(function() {});

