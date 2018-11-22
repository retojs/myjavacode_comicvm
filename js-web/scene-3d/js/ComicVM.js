var DEBUG_PANEL = true;
var DEBUG_HORIZON = true;
var DEBUG_PERSPECTIVE = true;
var DEBUG_OBJ_UNIT = true;
var DEBUG_IMAGE = true;

// black
var DEBUG_PANEL_COLOR = "#000";
// red
var DEBUG_PERSPECTIVE_COLOR = "#f00";
// green
var DEBUG_BGR_UNIT_COLOR = "#0f0";
// grey
var DEBUG_OBJ_UNIT_COLOR = "#888";
// cyan
var DEBUG_IMAGE_COLOR = "#0ff";


/**
 * A Panel displays a scene from a certain perspective and overlays some text
 * 
 * @param text
 * @param scene
 * @param perspective
 * @returns
 */
function Panel(text, scene, perspective) {
	this.text = text;
	this.scene = scene;
	this.perspective = perspective;
}

Panel.prototype.draw = function(canvasCtx, dimensions) {
	
	clipRect(canvasCtx, dimensions);
	canvasCtx.clearRect(dimensions.x, dimensions.y, dimensions.w, dimensions.h);
	
	this.scene.draw(canvasCtx, this.perspective, dimensions);
	this.text.draw(canvasCtx, dimensions);

	canvasCtx.strokeStyle = "#000";
	canvasCtx.strokeRect(dimensions.x, dimensions.y, dimensions.w, dimensions.h);
	
	if(DEBUG_PANEL) {
		// draw panel coordinate system
		var panelNormalSize = dimensions.h / 2;
		var panelCenter = new Point2D(
				dimensions.x + dimensions.w / 2, 
				dimensions.y + dimensions.h / 2
		);
		canvasCtx.strokeStyle = DEBUG_PANEL_COLOR;
		drawCircle(
				canvasCtx, 
				panelCenter,
				panelNormalSize);
	}
};

/**
 * 
 * @param flucht:	Fluchtpunkt
 * @param unit:		definiert Einheitsgroesse und Ursprung des Objekt-Koordinatensystems
 * @param rotation:	Rotation des Horizonts
 * @returns
 */
function Perspective(flucht, unit, rotation) {
	this.flucht = flucht || new Flucht(0, 0);
	this.unit = unit || new Unit(1, 0, 0);
	this.rotation = rotation || 0;
}

/**
 * 
 * @param bgr
 * @param objs
 * @returns
 */
function Scene(bgr, objs) {
	this.bgr = bgr;
	this.objs = objs;
}

Scene.prototype.draw = function(canvasCtx, perspective, dimensions) {	
	
	this.bgr.draw(canvasCtx, perspective, dimensions);
	
	if (DEBUG_PERSPECTIVE) {
		var unit = dimensions.normalizedUnitToPixel(perspective.unit);
		canvasCtx.fillStyle = DEBUG_PERSPECTIVE_COLOR;
		drawDot(canvasCtx, unit, unit.size);
		canvasCtx.fillStyle = "#fff";
		drawDot(canvasCtx, unit, 5);
		//alert("unit.x " + unit.x + ", unit.y " + unit.y + ", unit.size " + unit.size);
	}
	
	if (DEBUG_HORIZON) {
		var flucht = dimensions.normalizedPointToPixel(perspective.flucht);
		canvasCtx.strokeStyle = DEBUG_PANEL_COLOR;
		canvasCtx.fillStyle = DEBUG_PANEL_COLOR;
		drawDot(canvasCtx, flucht, 5);
		drawLine(canvasCtx, 
			 	 dimensions.x, flucht.y, 
				 dimensions.x + dimensions.w, flucht.y);
	}
	
	var objsSorted = this.sortByZ(this.objs);
	for (var i = 0; i < objsSorted.length; i++) {
		obj = objsSorted[i];
		obj.draw(canvasCtx, perspective, dimensions);
	}
};

Scene.prototype.sortByZ = function(objs) {
	return objs.sort(function(a, b) {return b.pos.z - a.pos.z;});
};

function Text(content) {
	this.content = content;
}

Text.prototype.draw = function(canvasCtx, dimensions) {
	// draw bubble
	if (this.renderer) {
		// TODO 
		this.renderer.draw(canvasCtx);
	}
	// TODO draw content
};