/**
 * Created by reto on 22.06.2014.
 */

var LOG_ENABLED = true;
var LOG_FILTER = "events";

/**
 * logs the specified text, if LOG_ENABLED = true and the specified filter contains the string LOG_FILTER
 * Example:
 *
 *        LOG_ENABLED = true
 *        LOG_FILTER = "paint"
 *        log("drawing border (0, 0, 40, 40)", "paint.border");
 *
 * will log "drawing border (0, 0, 40, 40)";
 */
function log(msg, filter) {
    if (LOG_ENABLED && (filter == null || LOG_FILTER != null && filter.toLowerCase().indexOf(LOG_FILTER.toLowerCase()) >= 0)) {
        if (filter) {
            console.log(filter + ": ");
        }
        console.log(msg);
    }
}

function json(obj, replacer, space) {
    return JSON.stringify(obj, replacer, space);
}

function logjson(obj, replacer, space) {
    log(json(obj, replacer, space));
}
