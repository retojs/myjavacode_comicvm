/**
 * A domain-specific name for Point2D
 *  
 * @param x
 * @param y
 * @returns
 */
function Flucht(x, y) {
	this.x = x;
	this.y = y;
}

Flucht.prototype.clone = function() {
	return new Flucht(this.x, this.y);
};

/**
 * A size combined with a 2D position (x, y).
 * 
 * @param size
 * @param x
 * @param y
 * @returns
 */
function Unit(size, x, y) {
	this.size = size;
	this.x = x;
	this.y = y;
}

Unit.prototype.clone = function() {
	return new Unit(this.size, this.x, this.y);
};


/**
 * A size combined with a vertical distance y.
 *
 * @param size
 * @param y
 * @returns
 */
function BgrUnit(size, y) {
	this.size = size;
	this.y = y;
}

function newBgrUnit(bgrUnit) {
	return new BgrUnit(bgrUnit.size, bgrUnit.y);
}

BgrUnit.prototype.clone = function() {
	result = newBgrUnit(this);
	result.setX(this.x);
	return result;
};

BgrUnit.prototype.setX = function(x) {
	this.x = x;
	return this;
};

BgrUnit.prototype.setY = function(y) {
	this.y = y;
	return this;
};

BgrUnit.prototype.setSize = function(size) {
	this.size = size;
	return this;
};

