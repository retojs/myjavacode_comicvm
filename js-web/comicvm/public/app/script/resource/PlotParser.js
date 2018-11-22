var PlotParser = {

    INPUT_TYPE: {
        character: 'character', // starting with one of the declared characters
        qualifier: 'qualifier', // in parentheses ( )
        continued: 'continued', // line starting with white-space
        description: 'description'  // none of the above
    },

    STORY_TELLER: 'STORYTELLER',

    input: null,

    parsed: {
        characterNames: null,
        plotItems: [],
        currentPlotItem: null
    },

    reset: function () {
        this.input = null;
        this.parsed.characterNames = null;
        this.parsed.plotItems = [];
        this.parsed.currentPlotItem = null;
    },

    parse: function (input) {
        this.reset();
        this.input = input;
        this.automaton.exec();
    },

    addPlotItem: function (plotItemSpec) {
        plotItemSpec.id = this.parsed.plotItems.length;
        this.parsed.currentPlotItem = PlotItem(plotItemSpec);
        this.parsed.plotItems.push(this.parsed.currentPlotItem);
    },

    STATE: {

        /**
         * The DEFAULT state contains default implementations for all input type handlers
         * but delegates to the handlers of the specific state ('this'), if they are defined.
         */
        DEFAULT: {

            id: 'DEFAULT',

            /**
             * usage if forwarded from another state:
             *  STATE.next.call(this, type, input)
             *  where 'this' is the current state
             */
            next: function (type, input) {
                switch (type) {
                    case PlotParser.INPUT_TYPE.qualifier:
                        if (this.onQualifier) {
                            return this.onQualifier(input);
                        } else {
                            return PlotParser.STATE.DEFAULT.onQualifier(input);
                        }
                        break;
                    case PlotParser.INPUT_TYPE.continued:
                        if (this.onContinued) {
                            return this.onContinued(input);
                        } else {
                            return PlotParser.STATE.DEFAULT.onContinued(input);
                        }
                        break;
                    case PlotParser.INPUT_TYPE.character:
                        if (this.onCharacter) {
                            return this.onCharacter(input);
                        } else {
                            return PlotParser.STATE.DEFAULT.onCharacter(input);
                        }
                        break;
                    case PlotParser.INPUT_TYPE.description:
                        if (this.onDescription) {
                            return this.onDescription(input);
                        } else {
                            return PlotParser.STATE.DEFAULT.onDescription(input);
                        }
                        break;
                }
            },

            /**
             * @param input { who: acting character name
             *                whoWith: acting characters with no line of text
             *                line: the whole parsed line containing the character declaration
             *              }
             * @returns state CHARACTER
             */
            onCharacter: function (input) {
                var item = PlotParser.parsed.currentPlotItem;
                if (!item || !item.who || item.action) {  // create a new plot item if (a) none exists or (b) it has no acting character or (c) it has an action already
                    PlotParser.addPlotItem({
                        who: input.who,
                        whoWith: input.whoWith.length > 0 ? input.whoWith : undefined,
                        actionType: input.line.indexOf(':') > 0 ? PlotItem.ACTION_TYPE.says : PlotItem.ACTION_TYPE.does,
                        action: input.line.indexOf(':') > 0 ? undefined : input.line
                    });
                } else {
                    item.extend({
                        who: input.who,
                        whoWith: input.whoWith.length > 0 ? input.whoWith : undefined
                    });
                }

                return PlotParser.STATE.CHARACTER;
            },

            onDescription: function (line) {
                PlotParser.addPlotItem({
                    desc: line.trim()
                });

                return PlotParser.STATE.DEFAULT;
            },

            onQualifier: function (qualifierStr) {
                return this;
            },

            onContinued: function (line) {
                return this;
            }
        },

        CHARACTER: {

            id: 'CHARACTER',

            next: function (type, line) {
                return PlotParser.STATE.DEFAULT.next.call(PlotParser.STATE.CHARACTER, type, line);
            },

            onQualifier: function (qualifierStr) {
                var item = PlotParser.parsed.currentPlotItem;
                var qualifiers = [];
                $.each(qualifierStr.split(','), function (i, qualifierStr) {
                    if (qualifierStr.indexOf(':') >= 0) {
                        // current qualifier is assigned to a name like 'name:qualifier'
                        var qualifier = qualifierStr.substr(qualifierStr.indexOf(':') + 1).trim();
                        var name = qualifierStr.substr(0, qualifierStr.indexOf(':')).trim();
                        qualifiers.push({who: name, how: qualifier});
                    } else {
                        // current qualifier is not assigned to a name
                        qualifiers.push({who: item.who, how: qualifierStr.trim()});
                    }
                });
                item.extend({
                    qualifiers: qualifiers
                });

                return PlotParser.STATE.CHARACTER;
            },

            onContinued: function (line) {
                var item = PlotParser.parsed.currentPlotItem;
                if (item.action) {  // create a new plot item for each line
                    PlotParser.addPlotItem({
                        who: item.who,
                        how: item.how,
                        whoWith: item.whoWith,
                        actionType: item.actionType,
                        action: line,
                        qualifiers: item ? item.qualifiers : undefined
                    });
                } else {
                    item.extend({action: line});  // append the first line after character declaration to the existing plot item
                }

                return PlotParser.STATE.CHARACTER;
            }
        }
    },

    automaton: {

        exec: function (input) {
            if (input) {
                PlotParser.input = input;
            }
            var plotContent = PlotParser.getPlotContent(),
                nextState = PlotParser.STATE.DEFAULT;

            PlotParser.parsed.place = PlotParser.getPlace();
            PlotParser.parsed.characterNames = PlotParser.getCharacterNames();
            var characterNames = PlotParser.parsed.characterNames.concat([PlotParser.STORY_TELLER]); // special character
            var matchAnyCharacter = array2ORRegExp(characterNames, '^');  // reg exp to match all characters

            PlotParser.parsed.plotItem = {};

            $.each(plotContent.split('\n'), function (i, line) {

                if (!line.trim()) {
                    return;  // skip empty lines
                }

                // qualifiers
                if (line.match(/\(.*\)/i)) {
                    var qualifiers = line.match(/\(.+\)/i);
                    if (qualifiers && qualifiers.length > 0) {
                        var nextParam = qualifiers[0].replace('(', '').replace(')', '');
                        nextState = nextState.next(PlotParser.INPUT_TYPE.qualifier, nextParam);
                    }
                }

                // starts with whitespace -> associate with last plot item
                else if (line.match(/^\s/)) {
                    nextState = nextState.next(PlotParser.INPUT_TYPE.continued, line.trim());
                }

                // character declaration or description
                else {
                    var matchingCharacters = getMatchingCharacters(line.trim(), characterNames);
                    if (matchingCharacters && matchingCharacters.length > 0) {
                        var who = matchingCharacters[0];
                        var whoWith = matchingCharacters.slice(1);

                        nextState = nextState.next(PlotParser.INPUT_TYPE.character, {
                            who: who,
                            whoWith: whoWith,
                            line: line
                        });
                    }

                    // no characters -> description
                    else {
                        nextState = nextState.next(PlotParser.INPUT_TYPE.description, line.trim());
                    }
                }
            });

            /**
             * Returns all character names which occur in the specified line.
             * The first element in the result array is the first character in the line.
             *
             * @param line
             * @param characterNames
             * @returns {!ElementArrayFinder|*|Array.<T>}
             */
            function getMatchingCharacters(line, characterNames) {
                var first = _.filter(characterNames, function (name) {
                        var regexp = new RegExp('^' + name + '[^\w]*');
                        return regexp.test(line);
                    }),
                    others = _.filter(characterNames, function (name) {
                        var regexp = new RegExp('.+' + name + '[^\w]*');
                        return regexp.test(line);
                    });

                return first.concat(others);
            }
        }
    },

    /**
     * The place is specified after the keyword 'place:'
     */
    getPlace: function () {
        var matchPlace = /place:(.*)/i;
        if (this.input && this.input.match(matchPlace)) {
            return this.input.match(matchPlace)[1].trim();
        } else {
            return '';
        }
    },

    /**
     * The plot content starts after the keyword 'plot:'
     */
    getPlotContent: function () {
        if (this.input) {
            return this.input.split(/plot:/i)[1].trim();
        } else {
            return '';
        }
    },

    /**
     * Characters are declared after the keyword 'Characters:'
     * @param reverse: if true the character names are returned in reverse order.
     * @returns this scene's characters' names in the order specified or in reverse order.
     */
    getCharacterNames: function (reverse) {
        if (!this.parsed.characterNames) {

            var characterDeclaration = this.input.split(/characters:/i)[1];
            characterDeclaration = characterDeclaration.split(/\n/)[0].trim();

            var characterList = characterDeclaration.split(/,/g);
            characterList = _.map(characterList, function (name) {
                return (name && name.length > 0) ? name.trim() : null;
            });
            this.parsed.characterNames = _.compact(characterList);
        }
        return reverse ? this.parsed.characterNames.slice().reverse() : this.parsed.characterNames;
    },

    /**
     * @param including: list of character names that need to be included in the slice
     * @returns a slice from the list of character names (in the order specified in the plot after the keyword 'Characters:')
     *          The slice is defined by a sample of characters that need to be contained in the slice
     *          (usually the acting characters that need to be visible in a panel).
     */
    getCharacterNamesSlice: function (includingNames) {
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
    }

};
