function Point3D(x, y, z) {
	this.x = x || 0;
	this.y = y || 0;
	this.z = z || 0;
}

Point3D.prototype.toString = function() {
	return "(" + this.x + ", " + this.y + ", " + this.z + ")";
};

Point3D.prototype.clone = function() {
	return new Point3D(this.x, this.y, this.z);
};

Point3D.prototype.translate = function(point3D) {
	this.x += point3D.x;
	this.y += point3D.y;
	this.z += point3D.z;
	return this;
};

Point3D.prototype.scale = function(scale) {
	this.x *= scale;
	this.y *= scale;
	this.z *= scale;
	return this;
};

/**
 * A domain-specific name for Point3D
 * 
 * @param x
 * @param y
 * @param z
 * @returns
 */
function Position3D(x, y, z) {
	this.x = x;
	this.y = y;
	this.z = z;
}