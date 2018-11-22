describe("entities/PlotItem.js", function () {

    var plotItem;

    beforeEach(function () {
        plotItem = PlotItem({
            who: 'who',
            how: ['sad', 'happy'],
            qualifiers: {
                who: 'who-q', how: 'how-q'
            }
        });
    });

    describe("PlotItem.normalize()", function () {

        it("normalizes the plot item properties", function () {
            plotItem.normalize();
            expect(
                _.isEqual(
                    plotItem.getSpec(),
                    {
                        who: 'who',
                        how: ['sad', 'happy'],
                        qualifiers: [
                            {
                                who: 'who-q',
                                how: 'how-q'
                            },
                            {
                                who: 'who',
                                how: ['sad', 'happy']
                            }
                        ],
                        whoWith: 'who-q'
                    }
                )).toBe(true);
        });

        it("applies the 'action' value to the 'does' property, if actionType is 'does'", function () {

            plotItem.actionType = PlotItem.ACTION_TYPE.does;
            plotItem.action = 'action';

            plotItem.normalize();
            expect(plotItem.does).toBe(plotItem.action);
        });

        it("applies the 'action' value to the 'says' property, if actionType is 'says'", function () {

            plotItem.actionType = PlotItem.ACTION_TYPE.says;
            plotItem.action = 'action';

            plotItem.normalize();
            expect(plotItem.says).toBe(plotItem.action);
        });

        it("applies the STORYTELLER's action to the 'told' property", function () {

            plotItem.who = PlotParser.STORY_TELLER;
            plotItem.action = 'action';

            plotItem.normalize();
            expect(plotItem.told).toBe(plotItem.action);
            expect(plotItem.who).toBe(PlotParser.STORY_TELLER);
        });

        it("sets the plot item's type to PlotItem.TYPE.told if STORYTELLER is the acting character", function () {

            plotItem.who = PlotParser.STORY_TELLER;
            plotItem.action = 'action';

            plotItem.normalize();
            expect(plotItem.type).toBe(PlotItem.TYPE.told);
        });

        it("sets the plot item's type to PlotItem.TYPE.desc if its 'desc' property is set", function () {

            plotItem.desc = 'desc';

            plotItem.normalize();
            expect(plotItem.type).toBe(PlotItem.TYPE.desc);
        });

        it("sets the plot item's type to PlotItem.TYPE.action in all other cases", function () {

            plotItem.who = 'Mickey';
            plotItem.actionType = PlotItem.ACTION_TYPE.says;
            plotItem.action = "Hi!";

            plotItem.normalize();
            expect(plotItem.type).toBe(PlotItem.TYPE.action);
        });

        it("sets the 'how' property according to qualifiers", function () {

            plotItem.qualifiers = {who: 'who', how: 'smiling'};

            plotItem.normalize();
            expect(plotItem.how).toEqual(['sad', 'happy', 'smiling']);
        });

        it("syncs qualifiers and 'whoWith' characters", function () {

            plotItem.qualifiers = {who: 'Goofy', how: 'smiling'};

            plotItem.normalize();
            expect(plotItem.whoWith).toEqual(['who-q', 'Goofy']);
        });

        it("unwrap arrays with a single value", function () {

            plotItem.who = ['who'];
            plotItem.qualifiers = [{who: 'Goofy', how: 'smiling'}];
            plotItem.how = undefined; // avoid adding qualifiers in normalize

            plotItem.normalize();
            expect(plotItem.who).toEqual('who');
            expect(plotItem.qualifiers).toEqual({who: 'Goofy', how: 'smiling'});
        });

        it("can be called multiple times with the same result", function () {

            plotItem.who = [plotItem.who];  // should be unwrapped
            plotItem.actionType = PlotItem.ACTION_TYPE.does;
            plotItem.action = 'action';  // should be copied to 'does' property

            var initial = _.extend({}, plotItem);
            var normalized = _.extend({}, plotItem.normalize());
            expect(_.isEqual(initial, normalized)).toBeFalsy();

            plotItem.normalize();
            plotItem.normalize();
            expect(plotItem).toEqual(normalized);
        });
    });

    describe("PlotItem.addPropertyValue(property, value)", function () {

        // property values can usually be strings or array of strings

        it("can add a string to an empty property", function () {
            var property = 'empty',
                value = 'string';

            plotItem.addPropertyValue(property, value);
            expect(plotItem[property]).toBe(value);
        });

        it("can add an object to an empty property", function () {
            var property = 'empty',
                value = {a: 'a', b: 'b'};

            plotItem.addPropertyValue(property, value);
            expect(plotItem[property]).toBe(value);
        });

        it("can add a string to a single string value property", function () {
            var property = 'who',
                value = 'whoElse',
                existingValue = plotItem[property];

            plotItem.addPropertyValue(property, value);
            expect(plotItem[property]).toEqual([existingValue, value]);
        });

        it("can add a string to a single string value property eliminating duplicates", function () {
            var property = 'who',
                value = 'who';

            plotItem.addPropertyValue(property, value);
            expect(plotItem[property]).toBe(value);
        });

        it("can add an object to a single object value property", function () {
            var property = 'who',
                value = 'who-qElse',
                existingValue = plotItem[property];

            plotItem.addPropertyValue(property, value);
            expect(plotItem[property]).toEqual([existingValue, value]);
        });

        it("can add an object to a single object value property eliminating duplicates", function () {
            var property = 'qualifiers',
                value = {who: 'who-q', how: 'how-q'};

            plotItem[property] = value;
            plotItem.addPropertyValue(property, value);
            expect(plotItem[property]).toEqual(value);
        });

        it("can add a string to an array of strings", function () {
            var property = 'how',
                value = 'glad';

            plotItem.addPropertyValue(property, value);
            expect(plotItem[property]).toEqual(['sad', 'happy', 'glad']);
        });

        it("can add a string to an array of strings eliminating duplicates", function () {
            var property = 'how',
                value = 'sad';

            plotItem.addPropertyValue(property, value);
            expect(plotItem[property]).toEqual(['sad', 'happy']);
        });

        it("can add an array of strings to a single string", function () {
            var property = 'who',
                value = ['Mickey', 'Goofy'];

            plotItem.addPropertyValue(property, value);
            expect(plotItem[property]).toEqual(['who', 'Mickey', 'Goofy']);
        });

        it("can add an array of strings to a single string eliminating duplicates", function () {
            var property = 'who',
                value = ['Mickey', 'who'];

            plotItem.addPropertyValue(property, value);
            expect(plotItem[property]).toEqual(['who', 'Mickey']);
        });

        it("can add an array of strings to an array of strings", function () {
            var property = 'how',
                value = ['glad', 'mad'];

            plotItem.addPropertyValue(property, value);
            expect(plotItem[property]).toEqual(['sad', 'happy', 'glad', 'mad']);
        });

        it("can add an array of strings to an array of strings eliminating duplicates", function () {
            var property = 'how',
                value = ['glad', 'sad'];

            plotItem.addPropertyValue(property, value);
            expect(plotItem[property]).toEqual(['sad', 'happy', 'glad']);
        });

        it("can add an array of objects to an array of objects eliminating duplicates", function () {
            var property = 'qualifiers',
                value = [
                    {who: '1', how: '2'},
                    {who: '3', how: '4'}
                ],
                existingValue = [
                    {who: '3', how: '4'},
                    {who: '5', how: '6'}
                ];

            plotItem[property] = existingValue;
            plotItem.addPropertyValue(property, value);
            expect(plotItem[property]).toEqual([
                {who: '3', how: '4'},
                {who: '5', how: '6'},
                {who: '1', how: '2'}
            ]);
        });
    });

    describe("PlotItem.isEqual()", function () {
        var plotItemSpec;

        beforeEach(function () {
            plotItemSpec = {
                who: 'who',
                whoWith: 'whoWith',
                how: 'how',
                qualifiers: 'qualifiers',

                action: 'action',
                actionType: 'actionType',
                says: 'says',
                does: 'does',

                desc: 'desc',

                told: 'told'
            };
        });

        it("returns true if all relevant properties are equal", function () {
            var p1 = PlotItem(plotItemSpec),
                p2 = PlotItem(plotItemSpec);

            expect(p1.equals(p2)).toBeTruthy();
            expect(p2.equals(p1)).toBeTruthy();
        });

        it("returns false if any relevant property differs", function () {
            var p1 = PlotItem(plotItemSpec);
            plotItemSpec.whoWith += ' ';
            var p2 = PlotItem(plotItemSpec);

            expect(p1.equals(p2)).toBeFalsy();
            expect(p2.equals(p1)).toBeFalsy();
        });


    });
});