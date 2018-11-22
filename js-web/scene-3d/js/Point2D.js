/**
 * Represents a point in the image plane.
 * 
 * (Don't expect a complete implementation of a 2d-point,
 *  there's only what we really need.)
 *  
 * The method from4DMatrix(f) converts a point in homogeneous coordinates into 2d cartesian coordinates
 * 
 * @param x
 * @param y
 * @returns
 */
function Point2D(x, y) {
	this.x = x || 0;
	this.y = y || 0;
}

Point2D.prototype.toString = function() {
	return "(" + this.x + ", " + this.y + ")";
};

Point2D.prototype.clone = function() {
	return new Point2D(this.x, this.y);
};

Point2D.prototype.translate = function(x, y) {
	this.x += x;
	this.y += y;
	return this;
};

Point2D.prototype.add = function(point2D) {
	return this.translate(point2D.x, point2D.y);
};

Point2D.prototype.subtract = function(point2D) {
	return this.translate(-point2D.x, -point2D.y);
};

Point2D.prototype.scale = function(scale) {
	this.x *= scale;
	this.y *= scale;
	return this;
};

/**
 * A domain-specific name for Point2D
 * 
 * @param x
 * @param y
 * @returns
 */
function Position(x, y) {
	this.x = x;
	this.y = y;
}

