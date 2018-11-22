var PlotItem = createPlotItem;

PlotItem.TYPE = {
    desc: 'desc',
    told: 'told',
    action: 'action'
};

PlotItem.ACTION_TYPE = {
    says: 'says',
    does: 'does'
};

function createPlotItem(spec) {

    var plotItem = {

        // properties

        id: spec.id,

        who: spec.who,
        whoWith: spec.whoWith,
        how: spec.how,
        qualifiers: spec.qualifiers,

        action: spec.action,
        actionType: spec.actionType,
        says: spec.says,
        does: spec.does,

        desc: spec.desc,

        told: spec.told,

        // methods

        getSpec: getSpec,

        normalize: normalize,
        extend: extend,

        addPropertyValue: addPropertyValue,
        hasValue: hasValue,

        equals: equals,

        toString: toString
    };

    return plotItem.normalize();

    /**
     * Adds some syntactic sugar to this plot item
     *
     * @returns this plot item
     */
    function normalize() {
        var self = this;

        this.action = this.action ? this.action.trim() : undefined;

        // apply action to 'does' or 'says' property
        this[this.actionType] = this.action;

        // apply STORY_TELLER's action to the 'told' property
        if (hasValue(this.who, PlotParser.STORY_TELLER)) {
            this.told = this.action;
        }

        // set plot item type
        if (this.told) {
            this.type = PlotItem.TYPE.told;
        } else if (this.desc) { // || plotItem.actionType === PlotItem.ACTION_TYPE.does) {
            this.type = PlotItem.TYPE.desc;
        } else {
            this.type = PlotItem.TYPE.action;
        }

        // unwrap arrays with a single value
        var keys = Object.keys(this);
        for (var i = 0; i < keys.length; i++) {
            this[keys[i]] = unwrap(this[keys[i]]);
        }

        return normalizeQualifiers(this);

        function normalizeQualifiers(plotItem) {

            // wrap qualifiers for iteration
            plotItem.qualifiers = wrap(plotItem.qualifiers)

            // unwrap qualifier properties for comparisons
            _.each(plotItem.qualifiers, function (qualifier) {
                qualifier.who = unwrap(qualifier.who);
                qualifier.how = unwrap(qualifier.how);
            });

            // normalize qualifiers
            _.each(plotItem.qualifiers, function (qualifier) {
                // set 'how' property according to qualifiers
                if (_.isEqual(self.who, qualifier.who)) {
                    addPropertyValue('how', qualifier.how);
                }
                // sync qualifiers and whoWith characters
                else if (!hasValue(self.whoWith, qualifier.who)) {
                    addPropertyValue('whoWith', qualifier.who);
                }
            });

            // add how to qualifiers if not present
            if (self.who && self.how
                && _.filter(plotItem.qualifiers, {who: self.who, how: self.how}).length === 0) {
                if (_.isEmpty(plotItem.qualifiers)) {
                    plotItem.qualifiers = [];
                }
                plotItem.qualifiers.push({who: self.who, how: self.how});
            }

            // unwrap qualifiers again
            plotItem.qualifiers = unwrap(plotItem.qualifiers);

            return plotItem;
        }
    }

    function getSpec() {
        return _.omit(
            {
                id: this.id,

                who: this.who,
                whoWith: this.whoWith,
                how: this.how,
                qualifiers: this.qualifiers,

                action: this.action,
                actionType: this.actionType,
                says: this.says,
                does: this.does,

                desc: this.desc,

                told: this.told
            },
            _.isUndefined); // removes all undefined properties

    }

    /**
     * Applies the specified properties to this plot item
     *
     * @param spec
     * @returns this plot item
     */
    function extend(spec) {
        var keys = Object.keys(spec);
        for (var i = 0; i < keys.length; i++) {
            this.addPropertyValue(keys[i], spec[keys[i]]);
        }
        return this.normalize();
    }

    /**
     * Assigns the specified value to the specified property.
     * Converts a single property value to an array if necessary
     *
     * @param property
     * @param value
     */
    function addPropertyValue(property, value) {
        if (plotItem[property]) {
            if (Array.isArray(plotItem[property])) {  // current value is an array
                if (Array.isArray(value)) {  // new value is an array
                    plotItem[property] = plotItem[property].concat(value);
                } else {
                    plotItem[property].push(value);
                }
            } else {  // current value is a single value
                if (Array.isArray(value)) {  // new value is an array
                    plotItem[property] = [plotItem[property]].concat(value);
                } else {
                    plotItem[property] = [plotItem[property], value];
                }
            }
            plotItem[property] = distinct(plotItem[property]);
        } else {
            plotItem[property] = value;
        }
    }

    /**
     * Checks if the specified value is assigned to the specified property
     *
     * @param propertyValue
     * @param value
     * @returns true if either the property value is an array containing the specified value or the values are equal.
     */
    function hasValue(propertyValue, value) {
        return propertyValue === value || (Array.isArray(propertyValue) && propertyValue.indexOf(value) >= 0);
    }

    /**
     * Removes duplicates from the specified array using _.isEqual to determine equality.
     * If the resulting array contains only a single element it's returned unwrapped from the array.
     *
     * @param array
     * @returns array containing the distinct array values or a single value
     */
    function distinct(array) {
        var result = [];
        _.each(array, function (item) {
            if (!_.any(result, function (uniqueItem) {
                    return _.isEqual(uniqueItem, item);
                })
            ) result.push(item);
        });

        return unwrap(result);
    }

    /**
     * Returns the specified value wrapped into an array if it was not yet an array
     *
     * @param value
     * @returns an array containing or being the specified value
     */
    function wrap(value) {
        return (Array.isArray(value) || typeof value === 'undefined') ? value : [value];
    }

    /**
     * @param value
     * @returns The value or if it's an array with a single value just this single value
     */
    function unwrap(value) {
        if (Array.isArray(value)) {
            return (value.length === 1) ? value[0] : value;
        } else {
            return value;
        }
    }

    function equals(plotItem) {
        var self = this;
        return _.every([
            'who',
            'whoWith',
            'how',
            'qualifiers',
            'action',
            'actionType',
            'says',
            'does',
            'desc',
            'told'
        ], function (property) {
            return _.isEqual(self[property], plotItem[property]);
        })
    }
}


