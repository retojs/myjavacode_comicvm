describe("entities/Panel.js", function () {

    var scene;
    var panelDimensions;

    beforeEach(function () {
        scene = new Scene();
        panelDimensions = {x: 0, y: 0, w: 100, h: 100};
        PlotParser.parsed.characterNames = ['Mickey', 'Goofy'];
    });

    describe("Panel.sortPlotItems()", function () {

        it("adds the desc property of plot items with a non-empty desc property into the Panel's descList", function () {

            var plotItem = PlotItem({
                desc: 'desc'
            });
            var panel = new Panel(0, panelDimensions, scene);

            panel.plotItems = [plotItem];
            panel.sortPlotItems();
            expect(panel.descList.length).toBe(1);
            expect(panel.descList[0]).toBe(plotItem.desc);
        });

        it("adds the does property of plot items with actionType='does' into the Panel's descList", function () {

            var plotItem = PlotItem({
                who: 'Mickey',
                actionType: PlotItem.ACTION_TYPE.does,
                action: 'does stuff'
            });
            var panel = new Panel([plotItem], panelDimensions, scene);

            panel.plotItems = [plotItem];
            panel.sortPlotItems();
            expect(panel.descList.length).toBe(1);
            expect(panel.descList[0]).toBe(plotItem.does);
        });

        it("adds the told property of plot items with acting character=STORY_TELLER into the Panel's toldList", function () {

            var plotItem = PlotItem({
                who: PlotParser.STORY_TELLER,
                action: 'told'
            });
            var panel = new Panel([plotItem], panelDimensions, scene);

            panel.plotItems = [plotItem];
            panel.sortPlotItems();
            expect(panel.toldList.length).toBe(1);
            expect(panel.toldList[0]).toBe(plotItem.told);
        });

        it("adds the acting character of plot items with type 'action' to the Panel's actingCharacterList", function () {

            var plotItem = PlotItem({
                who: 'Mickey',
                says: 'Hi'
            });
            var panel = new Panel([plotItem], panelDimensions, scene);

            panel.plotItems = [plotItem];
            panel.sortPlotItems();
            expect(panel.actingCharacterList.length).toBe(1);
            expect(panel.actingCharacterList[0].who).toBe('Mickey');
        });

        it("adds the 'says' and 'who' properties of plot items with type 'action' to the Panel's bubbleList", function () {

            var plotItem = PlotItem({
                who: 'Mickey',
                says: 'Hi'
            });
            var panel = new Panel([plotItem], panelDimensions, scene);

            panel.plotItems = [plotItem];
            panel.sortPlotItems();
            expect(panel.bubbleList.length).toBe(1);
            expect(panel.bubbleList[0]).toEqual({
                who: 'Mickey',
                says: 'Hi'
            });
        });

        it("adds 'says' and 'who' properties of subsequent plot items for the same character to the same item in bubbleList", function () {

            var plotItems = [
                PlotItem({
                    who: 'Mickey',
                    says: 'Hi.'
                }),
                PlotItem({
                    who: 'Mickey',
                    says: 'Whats up?'
                })
            ];
            var panel = new Panel(plotItems, panelDimensions, scene);
            panel.plotItems = plotItems;
            panel.sortPlotItems();
            expect(panel.bubbleList[0].says).toBe('Hi. Whats up?');
        });
    });

    describe("Panel.applyCharacterQualifiers()", function () {

        var characterList;

        beforeEach(function () {
            characterList = {
                Mickey: {
                    who: 'Mickey',
                    how: 'happy'
                },
                Goofy: {
                    who: 'Goofy',
                    how: 'tired'
                }
            };
        });

        it("adds the characters 'how' qualifier", function () {

            var plotItem = PlotItem({
                who: 'Mickey',
                how: 'surprised'
            });
            var panel = new Panel(1, panelDimensions, scene);

            panel.allCharacterList = characterList;
            panel.plotItems = [plotItem];
            panel.applyCharacterQualifiers();
            expect(characterList.Mickey).toBeDefined();
            expect(characterList.Goofy).toBeDefined();
            expect(characterList.Mickey.how).toEqual(['surprised', 'happy']);
        });
    });
});
