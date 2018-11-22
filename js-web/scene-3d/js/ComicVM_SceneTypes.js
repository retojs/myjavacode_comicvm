/**
 * 
 * @param imgId
 * @param flucht
 * @param ratio
 * @returns
 */
function Bgr(imgId, flucht, bgrUnit) {
	this.img = new SceneImage(imgId);
	this.flucht = flucht || new Flucht(0, 0);
	this.bgrUnit = bgrUnit || new BgrUnit(1, 0);
}

Bgr.prototype.draw = function(canvasCtx, perspective, dimensions) {

	// 1. Skalierung Bgr
	
	// Ueberlegung:
	//  1.a Perspective-unit-size in Pixel
	var perspectiveUnitSizePx = perspective.unit.size * dimensions.size;
	//  1.b Bgr-unit-size in Pixel
	var bgrUnitSize = this.bgrUnit.size * this.img.size; 
	//  1.c Die Skalierung des Hintergrunds entspricht dem Verhaeltnis der beiden Groessen 
	var scale = perspectiveUnitSizePx / bgrUnitSize;
	
	// 2. Position Bgr
	// Ueberlegung:
	//  Die Positionen der beiden Fluchtpunkte (1. Perspektive, 2. Bgr) in Pixel 
	//  muessen voneinander subtrahiert werden.
	//  Dazu skalieren wir Bgr in die Groesse der Perspektive bzw. des Panels.
	//
	//  2.a Position des Perspective-Fluchtpunkts in Pixel
	var perspectiveFlucht = dimensions.normalizedCoordsToPixel(
												perspective.flucht.x, 
												perspective.flucht.y);
	//  2.b Position des Bgr-Fluchtpunkts in Pixel, skaliert auf die Panel-Groesse
	var bgrFluchtScaled = new Point2D(this.flucht.x * this.img.size * scale, 
									  this.flucht.y * this.img.size * scale);
	//  2.c Der Offset des Bgr-Mittelpunkts entspricht der Differenz der beiden Fluchtpunkte
	var bgrCenter = perspectiveFlucht.clone().subtract(bgrFluchtScaled);
	
	this.img.draw(canvasCtx, bgrCenter.x, bgrCenter.y, scale);
		
	if (DEBUG_BGR_UNIT) {
		canvasCtx.strokeStyle = DEBUG_BGR_UNIT_COLOR;
		canvasCtx.fillStyle = DEBUG_BGR_UNIT_COLOR;

		var bgrUnitScaled = new Point2D(bgrFluchtScaled.x, bgrFluchtScaled.y);
		bgrUnitScaled.translate(0, this.bgrUnit.y * this.img.size * scale);
		var bgrUnitCenter = perspectiveFlucht.clone().subtract(bgrUnitScaled);
		drawCircle(canvasCtx, 
				   bgrUnitCenter, 
				   this.img.size * scale);
		drawDot(canvasCtx, 
				bgrUnitCenter,
				5);
	}
};

/**
 * @param unit: sitz-punkt und groesse
 */
function Obj(imgId, unit) {
	this.img = new SceneImage(imgId);
	this.unit = unit || new Unit(1, 0, 0);
	
	this.pos = new Position3D(0, 0, 0);	
}

Obj.prototype.clone = function() {
	return new Obj(this.img.id, this.unit, this.pos);
};

Obj.prototype.project = function(perspective) {
	// an Position z = 0 soll w == 1 sein 
	var w = 1 + this.pos.z;
	
	var x = (this.pos.x + perspective.unit.x) / w;
	var _x = (this.pos.x + 1 + perspective.unit.x) / w;
	var y = (this.pos.y + perspective.unit.y) / w;

	// Die Distanz zwischen x und _x betraegt 1 und gibt somit die Skalierung an
	return new Unit((_x - x) * perspective.unit.size, x, y);
};
 
Obj.prototype.draw = function(canvasCtx, perspective, dimensions) {
	var projected = this.project(perspective);
 	var projected_px = dimensions.normalizedUnitToPixel(projected);
 	
	if (DEBUG_OBJ_UNIT) {
		if (this.isAtOrigin()) {
			canvasCtx.fillStyle = DEBUG_OBJ_UNIT_COLOR;
			drawDot(canvasCtx, projected_px, projected_px.size);
			canvasCtx.fillStyle = "#fff";
			drawDot(canvasCtx, projected_px, 5);
		}
	}
	
	// Ueberlegung:
	//  1. Verhaeltnis von object-unit-size zu image-size: 
	var objectToimageScale = projected_px.size / this.img.size;
	//  2. Verhaeltnis von image-size zu image-unit-size: 
	var imageUnitSize = 1 / this.unit.size;
	//  3. Die Image-Skalierung (image-unit-size zu object-unit-size) 
	//     entspricht dem Produkt (Konkatenation) der beiden Verhaeltnisse
	var scale = objectToimageScale * imageUnitSize;
	
	//  4. die Objekt-Position wird in der Object-unit gemessen 
	var x = projected_px.x - this.unit.x * projected_px.size * imageUnitSize;
	var y = projected_px.y + this.unit.y * projected_px.size * imageUnitSize;
	
	this.img.draw(canvasCtx, x, y, scale);
};

Obj.prototype.isAtOrigin = function() {
	return this.pos.x == 0 && this.pos.y == 0 && this.pos.z == 0;
};

function SceneImage(id) {
	this.id = id;
	this.img = document.getElementById(id);
	//alert("img " + this.img)
	this.size = this.img.naturalHeight / 2;
}



/**
 * Draws the image into the canvas such that the center of the image is at (x, y)
 * 
 * @param canvasCtx
 * @param x
 * @param y
 * @param scale
 */
SceneImage.prototype.draw = function(canvasCtx, x, y, scale) {
	if (this.renderer) {
		this.renderer.draw(canvasCtx, x, y, scale);
	} else {
		if (DEBUG_IMAGE) {
			canvasCtx.strokeStyle = DEBUG_IMAGE_COLOR;
			drawCircle(canvasCtx, new Point2D(x, y), this.size * scale);
		}
		
		// Das Bild wird so plaziert, dass sein Mittelpunkt an Position (x, y) zu liegen kommt
		var w = this.img.naturalWidth * scale;
		var h = this.img.naturalHeight * scale;
		canvasCtx.drawImage(this.img, x - w/2, y - h/2, w, h);

		if (DEBUG_IMAGE) {
			canvasCtx.fillStyle = "#fff";
			drawDot(canvasCtx, new Point2D(x, y), 5);
		}
	}
};
