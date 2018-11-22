function defineMatchersWithMessage() {

    function matcherWithMessage(passFn, failureMessageFn) {
        return function (util, customEqualityTesters) {
            return {
                compare: function (actual, expected, message) {
                    var result = {};
                    result.pass = passFn(actual, expected, util, customEqualityTesters);
                    if (!result.pass) {
                        result.message = failureMessageFn(actual, expected, message);
                    }
                    return result;
                }
            }
        };
    }

    function matcherWithMessageNoExpectedArg(passFn, failureMessageFn) {
        return function (util, customEqualityTesters) {
            return {
                compare: function (actual, message) {
                    var result = {};
                    result.pass = passFn(actual, util, customEqualityTesters);
                    if (!result.pass) {
                        result.message = failureMessageFn(actual, message);
                    }
                    return result;
                }
            }
        };
    }

    var passFunctions = {
        toBe: function (actual, expected) {
            return actual === expected
        },
        toBeCloseTo: function (actual, expected, precision) {
            if (precision !== 0) {
                precision = precision || 2;
            }
            return Math.abs(expected - actual) < (Math.pow(10, -precision) / 2);
        },
        toBeDefined: function (actual) {
            return typeof actual !== 'undefined'
        },
        toBeFalsy: function (actual) {
            return !!!actual
        },
        toBeGreaterThan: function (actual, expected) {
            return actual > expected
        },
        toBeLessThan: function (actual, expected) {
            return actual < expected
        },
        toBeNaN: function (actual) {
            return (actual !== actual)
        },
        toBeNull: function (actual) {
            return actual === null
        },
        toBeTruthy: function (actual) {
            return !!actual
        },
        toBeUndefined: function (actual) {
            return void 0 === actual
        },
        toMatch: function (actual, expected) {
            var regexp = new RegExp(expected);
            return regexp.test(actual);
        },
        toEqual: function (actual, expected, util, customEqualityTesters) {
            return util.equals(actual, expected, customEqualityTesters);
        }
    };

    function getMessageFn(toBeWhat) {
        return function (actual, expected, message) {
            return "Expected " + actual + " " + toBeWhat + " " + expected + " (" + message + ")";
        }
    }

    function getMessageFnNoExpectedArg(toBeWhat) {
        return function (actual, message) {
            return "Expected " + actual + " " + toBeWhat + " (" + message + ")";
        }
    }


    var matchers = {

        toBe_msg: matcherWithMessage(
            passFunctions.toBe,
            getMessageFn("to be")),

        toBeDefined_msg: matcherWithMessageNoExpectedArg(
            passFunctions.toBeDefined,
            getMessageFnNoExpectedArg("to be defined")),

        toBeNaN_msg: matcherWithMessageNoExpectedArg(
            passFunctions.toBeNaN,
            getMessageFnNoExpectedArg("to be NaN")),

        toBeTruthy_msg: matcherWithMessageNoExpectedArg(
            passFunctions.toBeTruthy,
            getMessageFnNoExpectedArg("to be truthy")),

        toBeFalsy_msg: matcherWithMessageNoExpectedArg(
            passFunctions.toBeFalsy,
            getMessageFnNoExpectedArg("to be falsy")),

        toBeLessThan_msg: matcherWithMessage(
            passFunctions.toBeLessThan,
            getMessageFn("to be less than")),

        toBeGraterThan_msg: matcherWithMessage(
            passFunctions.toBeGreaterThan,
            getMessageFn("to be greater than")),

        toEqual_msg: matcherWithMessage(
            passFunctions.toEqual,
            getMessageFn("to be equal"))
    };

    jasmine.addMatchers(matchers);

}