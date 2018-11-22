describe("resource/PlotParser.js", function () {

    beforeAll(function () {
        defineMatchersWithMessage();
    });

    beforeEach(function () {
        PlotParser.reset();
    });

    describe("The PlotParser", function () {

        it("defines a function getPlace() returning the place (string after keyword 'place:')", function () {
            var place = 'ThePlace';
            PlotParser.input = 'This is a test plot.\nplace: ' + place;
            expect(PlotParser.getPlace()).toBe(place);
        });

        it("defines a function getPlotContent() returning the plot content (text after keyword 'plot:')", function () {
            var plot = 'This plot has no content';
            PlotParser.input = 'This is a test plot.\nplot: ' + plot;
            expect(PlotParser.getPlotContent()).toBe(plot);
        });

        it("defines a function getCharacterNames() returning the list of characters", function () {
            var characters = ['Doc', 'Dopey', 'Bashful', 'Grumpy', 'Sneezy', 'Sleepy', 'Happy'];
            var charactersString = characters.join(', ');
            log("charactersString " + charactersString);
            PlotParser.input = 'This is a test plot.\nChaRacterS: ' + charactersString + '\n\nplot: bla bla bla\n';
            expect(PlotParser.getCharacterNames()).toEqual(characters);
        });

    });

    describe("The PlotParser state machine", function () {

        it("has two states DEFAULT and CHARACTER", function () {
            expect(PlotParser.STATE.DEFAULT).toBeDefined();
            expect(PlotParser.STATE.CHARACTER).toBeDefined();
        });

        it("knows the input types character, qualifier, dialog and description", function () {
            expect(PlotParser.INPUT_TYPE.qualifier).toBeDefined();
            expect(PlotParser.INPUT_TYPE.dialog).toBeDefined();
            expect(PlotParser.INPUT_TYPE.character).toBeDefined();
            expect(PlotParser.INPUT_TYPE.description).toBeDefined();
        });
    });

    describe("The DEFAULT state", function () {

        it("defines functions onQualifier, onDialog, onCharacter, onDescription", function () {
            expect(PlotParser.STATE.DEFAULT.onQualifier).toBeDefined();
            expect(PlotParser.STATE.DEFAULT.onDialog).toBeDefined();
            expect(PlotParser.STATE.DEFAULT.onCharacter).toBeDefined();
            expect(PlotParser.STATE.DEFAULT.onDescription).toBeDefined();
        });

        it("defines a function next()", function () {
            expect(PlotParser.STATE.DEFAULT.next).toBeDefined();
            expect(typeof PlotParser.STATE.DEFAULT.next).toBe('function');
        });

        describe("The DEFAULT state's function next()", function () {

            var input = 'input';

            it("calls the onQualifier handler for each input of type INPUT_TYPE.qualifier", function () {
                spyOn(PlotParser.STATE.DEFAULT, 'onQualifier');
                PlotParser.STATE.DEFAULT.next(PlotParser.INPUT_TYPE.qualifier, input);
                expect(PlotParser.STATE.DEFAULT.onQualifier).toHaveBeenCalledWith(input);
            });
            it("calls the onDialog handler for each input of type INPUT_TYPE.dialog", function () {
                spyOn(PlotParser.STATE.DEFAULT, 'onDialog');
                PlotParser.STATE.DEFAULT.next(PlotParser.INPUT_TYPE.dialog, input);
                expect(PlotParser.STATE.DEFAULT.onDialog).toHaveBeenCalledWith(input);
            });
            it("calls the onCharacter handler for each input of type INPUT_TYPE.character", function () {
                spyOn(PlotParser.STATE.DEFAULT, 'onCharacter');
                PlotParser.STATE.DEFAULT.next(PlotParser.INPUT_TYPE.character, input);
                expect(PlotParser.STATE.DEFAULT.onCharacter).toHaveBeenCalledWith(input);
            });
            it("calls the onDescription handler for each input of type INPUT_TYPE.description", function () {
                spyOn(PlotParser.STATE.DEFAULT, 'onDescription');
                PlotParser.STATE.DEFAULT.next(PlotParser.INPUT_TYPE.description, input);
                expect(PlotParser.STATE.DEFAULT.onDescription).toHaveBeenCalledWith(input);
            });
        });
    });

    describe("The CHARACTER state", function () {

        var input = 'input';

        it("defines functions onQualifier, onDialog", function () {
            expect(PlotParser.STATE.CHARACTER.onQualifier).toBeDefined();
            expect(PlotParser.STATE.CHARACTER.onDialog).toBeDefined();
        });

        it("defines a function next() that forwards to DEFAULT.next()", function () {
            spyOn(PlotParser.STATE.DEFAULT, 'next');
            PlotParser.STATE.CHARACTER.next(PlotParser.INPUT_TYPE.qualifier, input);
            expect(PlotParser.STATE.DEFAULT.next).toHaveBeenCalledWith(PlotParser.INPUT_TYPE.qualifier, input);
        });

        describe("The function next()", function () {

            it("calls the CHARACTER state's onQualifier handler, since it is defined", function () {
                spyOn(PlotParser.STATE.CHARACTER, 'onQualifier');
                PlotParser.STATE.CHARACTER.next(PlotParser.INPUT_TYPE.qualifier, input);
                expect(PlotParser.STATE.CHARACTER.onQualifier).toHaveBeenCalledWith(input);
            });
            it("calls the CHARACTER state's onDialog handler, since it is defined", function () {
                spyOn(PlotParser.STATE.CHARACTER, 'onDialog');
                PlotParser.STATE.CHARACTER.next(PlotParser.INPUT_TYPE.dialog, input);
                expect(PlotParser.STATE.CHARACTER.onDialog).toHaveBeenCalledWith(input);
            });

            it("calls the DEFAULT state's onCharacter handler, since it is not defined in the CHARACTER state", function () {
                spyOn(PlotParser.STATE.DEFAULT, 'onCharacter');
                PlotParser.STATE.DEFAULT.next(PlotParser.INPUT_TYPE.character, input);
                expect(PlotParser.STATE.DEFAULT.onCharacter).toHaveBeenCalledWith(input);
            });

            it("calls the DEFAULT state's onDescription handler, since it is not defined in the CHARACTER state", function () {
                spyOn(PlotParser.STATE.DEFAULT, 'onDescription');
                PlotParser.STATE.DEFAULT.next(PlotParser.INPUT_TYPE.description, input);
                expect(PlotParser.STATE.DEFAULT.onDescription).toHaveBeenCalledWith(input);
            });
        });
    });

    describe("The PlotParser automaton", function () {

        var input;

        beforeEach(function () {
            input = 'this is a test plot\r\n'
            + 'characters: Mickey, Goofy\r\n'
            + 'plot:\r\n';
        });

        describe("when parsing a description", function () {

            it("calls STATE.DEFAULT.onDescription", function () {

                var desc = 'It is sunny day.';
                input += desc + '\r\n';

                spyOn(PlotParser.STATE.DEFAULT, 'onDescription');
                PlotParser.automaton.exec(input);
                expect(PlotParser.STATE.DEFAULT.onDescription).toHaveBeenCalledWith(desc);
            });


            it("creates a plot item with a description", function () {

                var desc = 'It is sunny day.';
                input += desc + '\r\n';

                var expectedPlotItem = {
                    desc: desc
                };

                PlotParser.automaton.exec(input);
                checkPlotItem(PlotParser.parsed.currentPlotItem, expectedPlotItem);
            });

            it("creates two plot items if a character declaration follows a description (bugfix, only one plot item was created)", function () {

                var lines = [];
                lines[0] = 'It was a sunny day in Duckburg.';
                lines[1] = 'Goofy:';
                lines[3] = '\tWhat\'s up, Mickey?';

                input = addLines(input, lines);

                var expectedPlotItems = [
                    {
                        desc: lines[0].trim()
                    },
                    {
                        who: 'Goofy',
                        says: lines[3].trim()
                    }];

                PlotParser.automaton.exec(input);
                expect(PlotParser.parsed.plotItems.length).toBe(expectedPlotItems.length);
                for (var i = 0; i < PlotParser.parsed.plotItems.length; i++) {
                    checkPlotItem(PlotParser.parsed.plotItems[i], expectedPlotItems[i]);
                }
            });
        });

        describe("when parsing a character declaration", function () {

            it("calls STATE.DEFAULT.onCharacter", function () {

                var line = 'Mickey and Goofy:';
                input += line + '\r\n';

                spyOn(PlotParser.STATE.DEFAULT, 'onCharacter');
                PlotParser.automaton.exec(input);
                expect(PlotParser.STATE.DEFAULT.onCharacter).toHaveBeenCalledWith({
                    who: 'Mickey',
                    whoWith: ['Goofy'],
                    line: line
                });
            });

            it("creates a plot item with action type 'says', if the character declaration ends with a colon", function () {

                input += 'Mickey:\r\n';

                var expectedPlotItem = {
                    who: 'Mickey',
                    actionType: PlotItem.ACTION_TYPE.says
                };

                PlotParser.automaton.exec(input);
                checkPlotItem(PlotParser.parsed.currentPlotItem, expectedPlotItem);
            });

            it("creates a plot item with action type 'does' when the character declaration does NOT end with a colon", function () {

                var line = 'Mickey meets Goofy on the street.';
                input += line + '\r\n';

                var expectedPlotItem = {
                    who: 'Mickey',
                    actionType: PlotItem.ACTION_TYPE.does,
                    action: line,
                    does: line
                };

                PlotParser.automaton.exec(input);
                checkPlotItem(PlotParser.parsed.currentPlotItem, expectedPlotItem);
            });

            it("creates a plot item with multiple 'who' acting characters, if multiple character declaration follow each other", function () {

                var lines = [];
                lines[1] = 'Mickey:';
                lines[2] = 'Goofy:';
                lines[3] = '\tHey buddy!';
                input = addLines(input, lines);

                var expectedPlotItem = {
                    who: ['Mickey', 'Goofy'],
                    actionType: PlotItem.ACTION_TYPE.says,
                    action: lines[3].trim(),
                    says: lines[3].trim()
                };

                PlotParser.automaton.exec(input);
                checkPlotItem(PlotParser.parsed.currentPlotItem, expectedPlotItem);
            });

            it("creates a plot item with multiple 'who' acting characters, ONLY if multiple character declaration follow each other directly", function () {

                var lines = [];
                lines[0] = 'Mickey:';
                lines[1] = '\tHi Goofy:';
                lines[2] = 'Goofy:';
                lines[3] = '\tHey Mickey!';
                input = addLines(input, lines);

                var expectedPlotItem = {
                    who: 'Goofy',
                    actionType: PlotItem.ACTION_TYPE.says,
                    action: lines[3].trim(),
                    says: lines[3].trim()
                };

                PlotParser.automaton.exec(input);
                checkPlotItem(PlotParser.parsed.currentPlotItem, expectedPlotItem);
            });

            it("creates a plot item with a 'told' property, if the acting character is STORY_TELLER", function () {

                var lines = [];
                lines[1] = PlotParser.STORY_TELLER + ":";
                lines[2] = '\tWhen Mickey went for a walk he spotted Goofy on the street';
                input = addLines(input, lines);

                var expectedPlotItem = {
                    who: PlotParser.STORY_TELLER,
                    told: lines[2].trim()
                };

                PlotParser.automaton.exec(input);
                checkPlotItem(PlotParser.parsed.currentPlotItem, expectedPlotItem);
            });
        });

        describe("when parsing a character qualifier", function () {

            it("calls STATE.CHARACTER.onQualifier", function () {

                input += 'Mickey:\r\n'
                + '(surprised)';

                spyOn(PlotParser.STATE.CHARACTER, 'onQualifier').and.callThrough();
                PlotParser.automaton.exec(input);
                expect(PlotParser.STATE.CHARACTER.onQualifier).toHaveBeenCalledWith('surprised');
            });

            it("creates a plot item with a how qualifier", function () {

                input += 'Mickey:\r\n'
                + '(surprised)';

                var expectedPlotItem = {
                    who: 'Mickey',
                    how: 'surprised'
                };

                PlotParser.automaton.exec(input);
                checkPlotItem(PlotParser.parsed.currentPlotItem, expectedPlotItem);
            });

            it("ignores empty qualifiers", function () {

                input += 'Mickey:\r\n'
                + '()\r\n'
                + '\tHey Goofy!';

                var expectedPlotItem = {
                    who: 'Mickey',
                    how: undefined,
                    says: 'Hey Goofy!'
                };

                PlotParser.automaton.exec(input);
                checkPlotItem(PlotParser.parsed.currentPlotItem, expectedPlotItem);
            });

            it("creates a plot item with an array of how qualifiers", function () {

                input += 'Mickey:\r\n'
                input += '(surprised, smiling)';

                var expectedPlotItem = {
                    who: 'Mickey',
                    how: ['surprised', 'smiling']
                };

                PlotParser.automaton.exec(input);
                checkPlotItem(PlotParser.parsed.currentPlotItem, expectedPlotItem);
            });

            it("creates a plot item with a how qualifier if the qualifier is assigned to the acting character", function () {

                input += 'Mickey:\r\n'
                input += '(Mickey: surprised)';

                var expectedPlotItem = {
                    who: 'Mickey',
                    how: 'surprised'
                };

                PlotParser.automaton.exec(input);
                checkPlotItem(PlotParser.parsed.currentPlotItem, expectedPlotItem);
            });

            it("creates a plot item with a how qualifier and a qualified whoWith if the qualifier is assigned to a different character", function () {

                input += 'Mickey to Goofy:\r\n'
                input += '(surprised, Goofy: surprised)';

                var expectedPlotItem = {
                    who: 'Mickey',
                    how: 'surprised',
                    whoWith: 'Goofy',
                    qualifiers: [
                        {who: 'Mickey', how: 'surprised'},
                        {who: 'Goofy', how: 'surprised'}
                    ]
                };

                PlotParser.automaton.exec(input);
                checkPlotItem(PlotParser.parsed.currentPlotItem, expectedPlotItem);
            });

            it("creates a plot item with an array of acting characters if the qualifier is assigned to multiple acting characters", function () {

                var lines = [];
                lines[0] = 'Mickey:';
                lines[1] = 'Goofy:';
                lines[2] = '(cheerful)';
                lines[3] = '\tWhat\'s up?';
                input = addLines(input, lines);

                var expectedPlotItem = {
                    who: ['Mickey', 'Goofy'],
                    how: 'cheerful',
                    qualifiers: {
                        who: ['Mickey', 'Goofy'],
                        how: 'cheerful'
                    }
                };

                PlotParser.automaton.exec(input);
                checkPlotItem(PlotParser.parsed.currentPlotItem, expectedPlotItem);
            });

            it("adds character qualifiers that don't follow a character declaration to the current plot item containing the last text line", function () {

                var lines = [];
                lines[0] = 'Mickey:';
                lines[1] = '(surprised)';
                lines[2] = '\tWhat\'s up, Goofy?';
                lines[3] = '\tI haven\'t seen you for days.';
                lines[4] = '(Goofy: thinking)';
                input = addLines(input, lines);

                var expectedPlotItems = [
                    {
                        who: 'Mickey',
                        how: 'surprised',
                        says: lines[2].trim(),
                        qualifiers: {
                            who: 'Mickey',
                            how: 'surprised'
                        }
                    },
                    {
                        who: 'Mickey',
                        how: 'surprised',
                        says: lines[3].trim(),
                        whoWith: 'Goofy',
                        qualifiers: [
                            {
                                who: 'Mickey',
                                how: 'surprised'
                            },
                            {
                                who: 'Goofy',
                                how: 'thinking'
                            }
                        ]
                    }];

                PlotParser.automaton.exec(input);
                expect(PlotParser.parsed.plotItems.length).toBe(expectedPlotItems.length);
                for (var i = 0; i < PlotParser.parsed.plotItems.length; i++) {
                    checkPlotItem(PlotParser.parsed.plotItems[i], expectedPlotItems[i]);
                }
            });
        });

        describe("when parsing a character's line of text", function () {

            it("calls STATE.CHARACTER.onDialog", function () {

                input += 'Mickey:\r\n'
                input += '\tHey Goofy!';

                spyOn(PlotParser.STATE.CHARACTER, 'onDialog');
                PlotParser.automaton.exec(input);
                expect(PlotParser.STATE.CHARACTER.onDialog).toHaveBeenCalledWith('Hey Goofy!');
            });

            it("creates a plot item with action and says properties", function () {

                input += 'Mickey:\r\n'
                input += '\tHey Goofy!';

                var expectedPlotItem = {
                    who: 'Mickey',
                    actionType: PlotItem.ACTION_TYPE.says,
                    action: 'Hey Goofy!',
                    says: 'Hey Goofy!'
                };

                PlotParser.automaton.exec(input);
                checkPlotItem(PlotParser.parsed.currentPlotItem, expectedPlotItem);
            });
        });

        describe("when parsing a little sample plot", function () {

            it("creates an array of plot items with expected content", function () {

                var lines = [];

                lines[1] = 'It was a sunny day in Duckburg.';

                lines[2] = PlotParser.STORY_TELLER + ':';
                lines[3] = '\tWhen Mickey went for a walk he spotted Goofy on the street';

                lines[4] = 'Mickey:';
                lines[5] = '(surprised)';
                lines[6] = '\tHi Goofy:';
                lines[7] = 'Goofy:';
                lines[8] = '(smiling, Mickey: smiling):';
                lines[9] = '\tHey Mickey!';

                lines[10] = 'Mickey:';
                lines[11] = 'Goofy:';
                lines[12] = '(cheerful)';
                lines[13] = '\tWhat\'s up?';

                lines[14] = 'Mickey and Goofy both laugh out loud.';

                input = addLines(input, lines);

                var expectedPlotItems = [
                    {
                        desc: lines[1]
                    },
                    {
                        who: PlotParser.STORY_TELLER,
                        told: lines[3].trim()
                    },
                    {
                        who: 'Mickey',
                        how: 'surprised',
                        says: lines[6].trim()
                    },
                    {
                        who: 'Goofy',
                        how: 'smiling',
                        says: lines[9].trim(),
                        whoWith: 'Mickey',
                        qualifiers: [
                            {
                                who: 'Goofy',
                                how: 'smiling'
                            },
                            {
                                who: 'Mickey',
                                how: 'smiling'
                            }
                        ]
                    },
                    {
                        who: ['Mickey', 'Goofy'],
                        how: 'cheerful',
                        qualifiers: {
                            who: ['Mickey', 'Goofy'],
                            how: 'cheerful'
                        },
                        says: lines[13].trim()
                    },
                    {
                        who: 'Mickey',
                        does: lines[14].trim(),
                        whoWith: 'Goofy'
                    }
                ];

                PlotParser.automaton.exec(input);
                expect(PlotParser.parsed.plotItems).toBeDefined();
                expect(PlotParser.parsed.plotItems.length).toBe(expectedPlotItems.length);
                for (var i = 0; i < PlotParser.parsed.plotItems.length; i++) {
                    checkPlotItem(PlotParser.parsed.plotItems[i], expectedPlotItems[i]);
                }
            });
        });

        function addLines(input, lines) {
            for (var i = 0; i < lines.length; i++) {
                var line = (lines[i] === null || typeof lines[i] === 'undefined') ? '' : lines[i];
                input += line + '\r\n';
            }
            return input;
        }

        function checkPlotItem(actual, expected) {
            var keys = Object.keys(expected);
            for (var i = 0; i < keys.length; i++) {
                expect(actual[keys[i]]).toEqual_msg(expected[keys[i]], 'property = ' + keys[i] + ', expected plot item = ' + JSON.stringify(expected));
            }
        }
    });


    describe("PlotParser helper functions", function () {

        describe("array2ORRegExp", function () {

            it("creates a reg exp matching all characters", function () {
                var input = ['Mickey', 'Goofy', PlotParser.STORY_TELLER];
                var regexp = array2ORRegExp(input);
                expect(regexp).toBe('Mickey|Goofy|' + PlotParser.STORY_TELLER);
            });
            it("allows to add a prefix to each value", function () {
                var input = ['Mickey', 'Goofy', PlotParser.STORY_TELLER];
                var regexp = array2ORRegExp(input, '^');
                expect(regexp).toBe('^Mickey|^Goofy|^' + PlotParser.STORY_TELLER);
            });
        });

        describe("RegExp", function () {

            it("/a|b|c/ matches single characters a, b and c", function () {

                var regexp = new RegExp('a|b|c');

                var match = regexp.exec('a');
                expect(match[0]).toBe('a');
                var match = regexp.exec('b');
                expect(match[0]).toBe('b');
                var match = regexp.exec('c');
                expect(match[0]).toBe('c');
            });

            it("/(a|b|c)/ matches single characters a, b and c, but returns two matches", function () {

                var regexp = new RegExp('(a|b|c)');

                var match = regexp.exec('a');
                expect(match[0]).toBe('a');
                expect(match.length).toBe(2);
                var match = regexp.exec('b');
                expect(match[0]).toBe('b');
                expect(match.length).toBe(2);
                var match = regexp.exec('c');
                expect(match[0]).toBe('c');
                expect(match.length).toBe(2);
            });

            it("/a|b|c/ matches multiple characters, returning a single match", function () {

                var regexp = new RegExp('a|b|c');

                var match = regexp.exec('aaa');
                expect(match[0]).toBe('a');
                expect(match.length).toBe(1);
                var match = regexp.exec('aab');
                expect(match[0]).toBe('a');
                expect(match.length).toBe(1);
                var match = regexp.exec('abc');
                expect(match[0]).toBe('a');
                expect(match.length).toBe(1);
                var match = regexp.exec('xya');
                expect(match[0]).toBe('a');
                expect(match.length).toBe(1);
            });

            it("/^a|b|c/ does not match 'xa', but matches 'xb'", function () {

                var regexp = new RegExp('^a|b|c');

                var match = regexp.exec('xa');
                expect(match).toBe(null);
                var match = regexp.exec('xb');
                expect(match[0]).toBe('b');
            });

            it("/^a|^b|^c/ does not match 'xa', 'xb', 'xc', but matches 'ax', 'bx', 'cx'", function () {

                var regexp = new RegExp('^a|^b|^c');

                var match = regexp.exec('xa');
                expect(match).toBe(null);
                var match = regexp.exec('xb');
                expect(match).toBe(null);
                var match = regexp.exec('xa');
                expect(match).toBe(null);

                var match = regexp.exec('ax');
                expect(match[0]).toBe('a');
                var match = regexp.exec('bx');
                expect(match[0]).toBe('b');
                var match = regexp.exec('cx');
                expect(match[0]).toBe('c');
            });
        });
    });
});