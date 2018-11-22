/**
 * Created by reto on 28.06.2014.
 *
 * Methods to store and retrieve objects by a set of tags (strings)
 */

var TagStore = function () {

    this.TAG_KEY_DELIMITER = ".";

    this.TYPE_BACKGROUND = "bgr";
    this.TYPE_OBJECT = "chr";

    this.store = {};

    this.defaultResult = this.createEmptyImage();
}

TagStore.prototype.createImage = function (src) {
    var img = document.createElement('img');
    img.src = src;
    return img;
}

TagStore.prototype.createEmptyImage = function () {
    var emptyImg = document.createElement('img');
    emptyImg.src = "images/empty.png";
    emptyImg.dataset.empty = true;
    return emptyImg;
}

TagStore.prototype.isEmpty = function (img) {
    return img.dataset.empty;
}

/**
 * Adds a dummy parameter with the current time to avoid caching
 *
 * @param img
 * @returns {*}
 */
TagStore.prototype.avoidCache = function (img) {
    var src = img.src.indexOf("?dummy=") > 0 ? img.src.substring(0, img.src.lastIndexOf("?dummy=")) : img.src;
    img.src = src + "?dummy=" + Date.now() + ".png";
    return img;
}

/**
 * Deletes the tag store content
 */
TagStore.prototype.drop = function () {
    this.store = {};
}

/**
 * Store an object with tags
 */
TagStore.prototype.add = function (object, tags) {
    if (Array.isArray(tags)) {
        this.store[this.getTagKey(tags)] = object;
    } else {
        this.store[tags] = object;
    }
}

/**
 * Converts the tags to a key separated by TAG_KEY_DELIMITER
 */
TagStore.prototype.getTagKey = function (tags) {
    if (tags && Array.isArray(tags)) {
        return tags.join(this.TAG_KEY_DELIMITER).toLowerCase();
    } else {
        log("TagStore.getTagKey: tags is no array");
        return "";
    }
}

/**
 * Returns true if the specified key contains the specified tag
 *
 * @param key
 * @param tag
 * @returns {boolean}
 */
TagStore.prototype.containsTag = function (key, tag) {
    if (tag === "") {
        return true; // empty string is no filter criterion, so every key contains it.
    }
    if (tag) {
        var tags = key ? key.split(this.TAG_KEY_DELIMITER) : null;
        for (var i = 0; i < tags.length; i++) {
            if (tag.trim().toLowerCase() == tags[i].toLowerCase()) {
                return true;
            }
        }
    }
    return false;
};

/**
 * Returns true if the specified key contains all the specified tags
 *
 * @param key
 * @param tagArray
 * @returns {boolean}
 */
TagStore.prototype.containsTags = function (key, tagArray) {
    for (var i = 0; i < tagArray.length; i++) {
        if (!this.containsTag(key, tagArray[i])) {
            return false;
        }
    }
    return true;
};

TagStore.prototype.getMatchCount = function (key, tagArray) {
    if (!tagArray) {
        return 0;
    }
    var self = this;
    return tagArray.reduce(function (count, tag) {
        return self.containsTag(key, tag) ? count + 1 : count;
    }, 0);
}

TagStore.prototype.getMismatchCount = function (key, tagArray) {
    var keyTags = key.split(this.TAG_KEY_DELIMITER);
    if (!Array.isArray(tagArray)) {
        return keyTags.length;
    }
    var tagArrayAsKey = tagArray.join(this.TAG_KEY_DELIMITER);
    var self = this;
    return keyTags.reduce(function (count, keyTag) {
        return !self.containsTag(tagArrayAsKey, keyTag) ? count + 1 : count;
    }, 0);
}

TagStore.prototype.getStoreKeys = function () {
    var result = [];
    $.each(this.store, function (key, image) {
        result.push(key)
    });
    return result;
}

TagStore.prototype.getKeysWithMostMatches = function (keys, tags) {
    if (!keys) {
        return [];
    }
    var self = this;
    var keysByMatchCount = {};
    var maxMatchCount = 0;
    $.each(keys, function (i, key) {
        var matchCount = self.getMatchCount(key, tags);
        if (matchCount >= maxMatchCount) {
            maxMatchCount = matchCount;
            var keys4Count = keysByMatchCount[matchCount];
            if (!keys4Count) {
                keys4Count = [];
                keysByMatchCount[matchCount] = keys4Count;
            }
            keys4Count.push(key);
        }
    });
    return keysByMatchCount[maxMatchCount];
}

TagStore.prototype.getKeysWithLeastMismatches = function (keys, tags) {
    if (!keys) {
        return [];
    }
    var self = this;
    var keysByMismatchCount = {};
    var minMismatchCount = Number.MAX_VALUE;
    $.each(keys, function (i, key) {
        var mismatchCount = self.getMismatchCount(key, tags);
        if (mismatchCount <= minMismatchCount) {
            minMismatchCount = mismatchCount;
            var keys4Count = keysByMismatchCount[mismatchCount];
            if (!keys4Count) {
                keys4Count = [];
                keysByMismatchCount[mismatchCount] = keys4Count;
            }
            keys4Count.push(key);
        }
    });
    return keysByMismatchCount[minMismatchCount];
}

TagStore.prototype.getBestMatch_ = function (haveToMatchTags, niceToMatchTags, furtherTags) {
    Array.isArray(haveToMatchTags) || (haveToMatchTags = [haveToMatchTags]);
    Array.isArray(niceToMatchTags) || (niceToMatchTags = [niceToMatchTags]);
    Array.isArray(furtherTags) || (furtherTags = [furtherTags]);

    // 1. filter all keys by haveToMatchTags
    var self = this;
    var storeKeys = $.grep(this.getStoreKeys(), function (key) {
        return self.containsTags(key, haveToMatchTags);
    });

    // 2. find keys with the most matching niceToMatchTags
    var keysWithMostMatches = this.getKeysWithMostMatches(storeKeys, niceToMatchTags);

    // 3. if necessary further reduce the result set to those keys with most matching furtherTags
    if (keysWithMostMatches && keysWithMostMatches.length > 1 && furtherTags) {
        keysWithMostMatches = this.getKeysWithMostMatches(keysWithMostMatches, furtherTags);
    }

    // 4. reduce result set to those keys with the least mismatches
    var result = this.getKeysWithLeastMismatches(keysWithMostMatches, haveToMatchTags.concat(niceToMatchTags).concat(furtherTags));

    if (result && result.length > 0) {
        return this.store[result[0]];
    } else {
        return this.defaultResult
    }
};

/**
 * All arguments are interpreted as tags.
 * The first argument are have-to-match tags, the other arguments are nice-to-match tags
 * The can be single strings or array of strings
 * This method returns only a single match, not an array.
 */
TagStore.prototype.getBestMatch = function () {
    var haveToMatchTags = arguments[0];
    var niceToMatchTags = [];
    for (var i = 1; i < arguments.length; i++) {
        var argument = Array.isArray(arguments[i]) ? arguments[i] : [arguments[i]]
        niceToMatchTags.push.apply(niceToMatchTags, argument);
    }
    log("TagStore.getBestMatch(): haveToMatchTags=" + haveToMatchTags + ", niceToMatchTags=" + niceToMatchTags, "tagStore");
    return this.getBestMatch_(haveToMatchTags, niceToMatchTags);
}

function test_tagstore() {

    var tagStore = new TagStore();

    var logFilterBackup = LOG_FILTER;
    LOG_FILTER = "tagStore.test";

    log("tag key test " + tagStore.getTagKey(["c", "b", "a"]), "tagStore.test");

    tagStore.add("o1", ["a", "b", "c"]);
    tagStore.add("o2", ["c", "d"]);
    tagStore.add("o3", ["a", "c", "d"]);
    log("getBestMatch_ 'a,c,d' should be o3, is " + tagStore.getBestMatch_([], ["d", "a", "c"]), "tagStore.test");
    log("getBestMatch_ 'c,d' should be o2, is " + tagStore.getBestMatch_([], ["d", "c"]), "tagStore.test");
    log("getBestMatch_ 'a,c,x' should be o1 or o3, is " + tagStore.getBestMatch_([], ["a", "c", "x"]), "tagStore.test");
    tagStore.add("o4", ["a"]);
    log("getBestMatch_ 'a' should be o4, is " + tagStore.getBestMatch_([], ["a"]), "tagStore.test");

    log("getBestMatch_ must='a', nice='c,d' should be o3, is " + tagStore.getBestMatch_(["a"], ["c", "d"]), "tagStore.test");
    tagStore.add("o5", ["b", "c"]);
    log("getBestMatch_ must='b', nice='c,d' should be o5, is " + tagStore.getBestMatch_(["b"], ["c", "d"]), "tagStore.test");

    log("getBestMatch(name='a', tags='c,x' should be o1,o3, is " + tagStore.getBestMatch("a", ["c", "x"]), "tagStore.test");

    LOG_FILTER = logFilterBackup;
}

//test_tagstore();

var tagStore = new TagStore();

