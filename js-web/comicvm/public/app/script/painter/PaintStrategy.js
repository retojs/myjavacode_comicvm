/**
 * function PaintStrategy.apply applies all properties of this PaintStrategy to comicVM.PanelPainter
 *
 * @type {{strategyEnableCondition: boolean, apply: Function}}
 */
var PaintStrategy = {

    /**
     * strategy is enabled if this condition is true
     */
    strategyEnableCondition: function () {
        return true;
    },

    /**
     * Replaces all methods in comicVM.PanelPainter with a matching method name in this PaintStrategy
     * with a conditional function which calls the PaintStrategy method if strategyEnableCondition returns true.
     * Otherwise it calls the comicVM.PanelPainter method.
     */
    apply: function () {
        var painter = comicVM.PanelPainter;

        if (painter.PAINT_STRATEGY != this.PAINT_STRATEGY) { // TODO what is this.PAINT_STRATEGY??
            for (prop in this) {
                if (painter.hasOwnProperty(prop)) {
                    painter["super_" + prop] = painter[prop]; // rename and keep the overridden prop
                }
                if (typeof this[prop] === 'function') {
                    painter["this_" + prop] = this[prop];
                    painter[prop] = getConditionalFn(painter["this_" + prop], painter["super_" + prop])
                } else {
                    painter[prop] = this[prop];
                }
            }
        }

        var self = this;

        function getConditionalFn(thisFn, superFn) {
            return function () {
                if (self.strategyEnableCondition() || !superFn) {
                    thisFn.apply(painter, arguments);
                } else {
                    superFn.apply(painter, arguments);
                }
            }
        }

    }
};
