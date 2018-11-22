function Plot_Parser() {
    this.STORY_TELLER = 'STORYTELLER';

    this.input = null;

    this.parsed = {
        characterNames : null,
        plotItems      : [],
        currentPlotItem: null
    };

    this.matchAnyCharacter = /any.character/;

    this.automaton = new Automaton();
}

Plot_Parser.prototype.init = function (input) {
    if (input) {
        this.input = input;
    }
    this.parsed.plotItem       = {};
    this.parsed.place          = this.getPlace();
    this.parsed.characterNames = this.getCharacterNames();
    if (this.parsed.characterNames.indexOf(this.STORY_TELLER) > -1) {
        this.parsed.characterNames = parser.parsed.characterNames.concat([this.STORY_TELLER]); // special character
    }
    this.matchAnyCharacter = (this.parsed.characterNames, '^'); // reg exp to match all characters
};

Plot_Parser.prototype.parse = function (input) {
    this.reset();
    this.init(input);
    this.automaton.execute(input);
};

Plot_Parser.prototype.reset = function () {
    this.input                  = null;
    this.parsed.characterNames  = null;
    this.parsed.plotItems       = [];
    this.parsed.currentPlotItem = null;
};

Plot_Parser.prototype.addPlotItem = function (plotItemSpec) {
    plotItemSpec.id             = this.parsed.plotItems.length;
    this.parsed.currentPlotItem = PlotItem(plotItemSpec);
    this.parsed.plotItems.push(this.parsed.currentPlotItem);
};

/**
 * The place is specified after the keyword 'place:'
 */
Plot_Parser.prototype.getPlace = function () {
    var matchPlace = /place:(.*)/i;
    if (this.input && this.input.match(matchPlace)) {
        return this.input.match(matchPlace)[1].trim();
    } else {
        return '';
    }
};

/**
 * The plot content starts after the keyword 'plot:'
 */
Plot_Parser.prototype.getPlotContent = function () {
    if (this.input) {
        return this.input.split(/plot:/i)[1].trim();
    } else {
        return '';
    }
};

/**
 * Characters are declared after the keyword 'Characters:'
 * @param reverse: if true the character names are returned in reverse order.
 * @returns this scene's characters' names in the order specified or in reverse order.
 */
Plot_Parser.prototype.getCharacterNames = function (reverse) {
    if (!this.parsed.characterNames) {
        var characterDeclaration   = this.input.split(/characters:/i)[1];
        characterDeclaration       = characterDeclaration.split(/\n/)[0].trim();
        var characterList          = characterDeclaration.split(/,/g);
        characterList              = _.map(characterList, function (name) {
            return (name && name.length > 0) ? name.trim() : null;
        });
        this.parsed.characterNames = _.compact(characterList);
    }
    return reverse ? this.parsed.characterNames.slice().reverse() : this.parsed.characterNames;
};

/**
 * @param including: list of character names that need to be included in the slice
 * @returns a slice from the list of character names (in the order specified in the plot after the keyword 'Characters:')
 *          The slice is defined by a sample of characters that need to be contained in the slice
 *          (usually the acting characters that need to be visible in a panel).
 */
Plot_Parser.prototype.getCharacterNamesSlice = function (includingNames) {
    if (includingNames && Array.isArray(includingNames)) {
        var indexes = [];
        _.each(this.parsed.characterNames, function (name, i) {
            indexes[name] = i;
        });

        var min = Number.MAX_VALUE;
        var max = -1;
        _.each(includingNames, function (name, i) {
            var index = indexes[name];
            if (index < min) {
                min = index;
            }
            if (index > max) {
                max = index;
            }
        });

        return this.parsed.characterNames.slice(min, max + 1);
    } else {
        return this.parsed.characterNames;
    }
};

/**
 * Returns all character names which occur in the specified line.
 * The first element in the result array is the first character in the line.
 *
 * @param line
 * @param characterNames
 * @returns {!ElementArrayFinder|*|Array.<T>}
 */
Plot_Parser.prototype.getMatchingCharacters = function (line, characterNames) {
    var first  = _.filter(characterNames, function (name) {
            var regexp = new RegExp('^' + name + '[^\w]*');
            return regexp.test(line);
        }),
        others = _.filter(characterNames, function (name) {
            var regexp = new RegExp('.+' + name + '[^\w]*');
            return regexp.test(line);
        });

    return first.concat(others);
};
