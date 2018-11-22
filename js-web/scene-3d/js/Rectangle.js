function Rectangle(x, y, w, h) {
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
	
	// Pixel coordinates of the normalized origin 
	this.origin = new Point2D(this.x + this.w/2, this.y + this.h/2);
	// unit size in pixels
	this.size = this.h/2;
}

/**
 * Converts normalized 2d-coordinates into pixels
 */
Rectangle.prototype.normalizedCoordsToPixel = function(x, y) {
	return new Point2D(
			this.origin.x + x * this.size, 
			this.origin.y - y * this.size);
};

/**
 * Converts a 2D point from normalized into pixel coordinates
 */
Rectangle.prototype.normalizedPointToPixel = function(point2D) {
	return this.normalizedCoordsToPixel(point2D.x, point2D.y);
};

/** 
 * Converts a unit from normalized into pixel coordinates 
 */
Rectangle.prototype.normalizedUnitToPixel = function(unit) {
	var result = this.normalizedCoordsToPixel(unit.x, unit.y);
	result.size = unit.size * this.size;
	return result;
};
