describe("painter/LayoutRepaint.js", function () {

    beforeAll(function () {
        defineMatchersWithMessage();
    });

    var oldLayout,
        newLayout;

    beforeEach(function () {
        oldLayout = {
            'panelProperties': [
                'plotItemCount',
                'bgrQualifier',
                'characterQualifier',
                'characterPosition',
                'zoom',
                'pan'],

            'pages': [
                [  // page 1
                    [  // strip 1
                        [1, '', 'Mariel:so', {}, 1.5, [0, -0.5]],  // panel 0
                        [1, '', 'Mariel:so', {}, 1.5, [0, -0.5]],  // panel 1
                        [1, '', 'Mariel:so', {}, 1.5, [0, -0.5]]   // panel 2
                    ],
                    [  // strip 2
                        [1, 'bgr-1', 'Mariel:so', {}, 1.5, [0, -0.5]],  // panel 3
                        [1, 'bgr-1', 'Mariel:so', {}, 1.5, [0, -0.5]],  // panel 4
                        [1, 'bgr-1', 'Mariel:so', {}, 1.5, [0, -0.5]]   // panel 5
                    ],
                    [  // strip 3
                        [1, 'bgr-2', 'Mariel:so', {}, 1.5, [0, -0.5]],  // panel 6
                        [1, 'bgr-2', 'Mariel:so', {}, 1.5, [0, -0.5]],  // panel 7
                        [1, 'bgr-2', 'Mariel:so', {}, 1.5, [0, -0.5]]   // panel 8
                    ]
                ], [  // page 2
                    {"hStrips": [0.667, 0.333]},
                    [  // strip 1
                        [1, '', 'Mariel:so', {}, 1.5, [0, -0.5]],  // panel 9
                        [1, '', 'Mariel:so', {}, 1.5, [0, -0.5]],  // panel 10
                        [1, '', 'Mariel:so', {}, 1.5, [0, -0.5]]   // panel 11
                    ],
                    [  // strip 2
                        {"wPanels": [0.4, 0.6]},
                        [1, 'bgr-1', 'Mariel:so', {}, 1.5, [0, -0.5]],  // panel 12
                        [1, 'bgr-1', 'Mariel:so', {}, 1.5, [0, -0.5]],  // panel 13
                        [1, 'bgr-1', 'Mariel:so', {}, 1.5, [0, -0.5]]   // panel 14
                    ],
                    [  // strip 3
                        [1, 'bgr-2', 'Mariel:so', {}, 1.5, [0, -0.5]],  // panel 15
                        [1, 'bgr-2', 'Mariel:so', {}, 1.5, [0, -0.5]],  // panel 16
                        [1, 'bgr-2', 'Mariel:so', {}, 1.5, [0, -0.5]]   // panel 17
                    ]
                ]
            ],
            'backgrounds': {
                '': {
                    'zoom': 1.5,
                    'pan': [-0.5, -0.5]
                },
                'bgr-1': {
                    'zoom': 1.5,
                    'pan': [-0.5, -0.5]
                }
            },
            'scene': {
                'zoom': 1.25
            }
        };

        newLayout = _.cloneDeep(oldLayout);
    });

    describe("LayoutRepaint.layoutChange(oldLayout, newLayout)", function () {

        it("returns an empty object if the layout has not changed", function () {
            var change = LayoutRepaint.layoutChange(oldLayout, newLayout);
            expect(change.all).toBeFalsy_msg('change.all');
            expect(change).toEqual({});
            expect(change.rest).toBeFalsy_msg('change.rest');
        });

        describe("returns { all: true } ", function () {

            it("if the scene has changed", function () {
                newLayout.scene.zoom += 1;
                var change = LayoutRepaint.layoutChange(oldLayout, newLayout);
                expect(change.all).toBeTruthy_msg('change.all');
            });

            it("if the panelProperties changed", function () {
                newLayout.panelProperties = oldLayout.panelProperties.slice(2, 1);
                var change = LayoutRepaint.layoutChange(oldLayout, newLayout);
                expect(change.all).toBeTruthy_msg('change.all');
            });

            it("if the layout has changed but no panels to repaint were detected (since we may have missed something...)", function () {
                newLayout.foo = 'bar';
                var change = LayoutRepaint.layoutChange(oldLayout, newLayout);
                expect(change.all).toBeTruthy_msg('change.all');
            });
        });

        describe("returns the panels of all backgrounds specified in the background property", function () {

            it("if the background property was removed", function () {
                newLayout.backgrounds = undefined;
                var change = LayoutRepaint.layoutChange(oldLayout, newLayout);
                expect(change.all).toBeFalsy_msg('change.all');
                expect(change.panelIds.sort()).toEqual([/* page 1 */ 0, 1, 2, 3, 4, 5, /* page 2*/  9, 10, 11, 12, 13, 14].sort());
                expect(change.rest).toBeFalsy_msg('change.rest');
            });

            it("if the background property was added", function () {
                oldLayout.backgrounds = undefined;
                var change = LayoutRepaint.layoutChange(oldLayout, newLayout);
                expect(change.all).toBeFalsy_msg('change.all');
                expect(change.panelIds.sort()).toEqual([/* 'bgr-1' and '' in page 1 */ 0, 1, 2, 3, 4, 5, /* in page 2*/  9, 10, 11, 12, 13, 14].sort());
                expect(change.rest).toBeFalsy_msg('change.rest');
            });
        });

        describe("returns the panels of all backgrounds with added or removed layout", function () {

            it("if a background key was added to or removed from the background property", function () {
                newLayout.backgrounds['bgr-2'] = newLayout.backgrounds['bgr-1'];
                delete newLayout.backgrounds['bgr-1'];
                var change = LayoutRepaint.layoutChange(oldLayout, newLayout);
                expect(change.all).toBeFalsy_msg('change.all');
                expect(change.panelIds.sort()).toEqual([/* 'bgr-1' and 'bgr-2' in page 1 */ 3, 4, 5, 6, 7, 8, /* in page 2*/ 12, 13, 14, 15, 16, 17].sort());
                expect(change.rest).toBeFalsy_msg('change.rest');
            });
        });

        describe("returns all panels of a background", function () {

            it("if a new background is specified in the background property", function () {
                newLayout.backgrounds['bgr-2'] = {
                    "reverse": true
                };
                var change = LayoutRepaint.layoutChange(oldLayout, newLayout);
                expect(change.all).toBeFalsy_msg('change.all');
                expect(change.panelIds).toEqual([6, 7, 8, 15, 16, 17]);
                expect(change.rest).toBeFalsy_msg('change.rest');
            });
        });

        describe("checkPages:", function () {

            it("returns change.all === true if number of pages changed", function () {
                newLayout.pages.push([[[1]]]);
                var change = LayoutRepaint.layoutChange(oldLayout, newLayout);
                expect(change.all).toBeTruthy_msg('change.all');
            });

            it("returns all panels of a page if strip dimensions were added or removed", function () {
                newLayout.pages[0].splice(0, 0, {"hStrips": [0.667, 0.333]});
                var change = LayoutRepaint.layoutChange(oldLayout, newLayout);
                expect(change.all).toBeFalsy_msg('change.all');
                expect(change.panelIds).toBeUndefined();
                expect(change.pages).toEqual([{pageNr: 0}]);
                expect(change.rest).toBeFalsy_msg('change.rest');
            });

            it("returns all panels of a page if strip dimensions have changed", function () {
                newLayout.pages[1].splice(0, 1, {"hStrips": [0.5, 0.5]});
                var change = LayoutRepaint.layoutChange(oldLayout, newLayout);
                expect(change.all).toBeFalsy_msg('change.all');
                expect(change.panelIds).toBeUndefined();
                expect(change.pages).toEqual([{pageNr: 1}]);
                expect(change.rest).toBeFalsy_msg('change.rest');
            });
        });

        describe("checkStrips:", function () {

            it("if the number of strips has changed in a page, returns all panels from the current page to the end", function () {
                newLayout.pages[1].splice(1, 1);
                var change = LayoutRepaint.layoutChange(oldLayout, newLayout);
                expect(change.all).toBeFalsy_msg('change.all');
                expect(change.pages).toEqual([{pageNr: 1}]);
                expect(change.rest).toBeTruthy_msg('change.rest');
            });

            it("returns all panels of strip if panel dimensions were added or removed", function () {
                newLayout.pages[0][1].splice(0, 0, {"wPanels": [0.4, 0.6]});
                var change = LayoutRepaint.layoutChange(oldLayout, newLayout);
                expect(change.all).toBeFalsy_msg('change.all');
                expect(change.strips).toEqual([{pageNr: 0, stripNr: 1}]);
                expect(change.rest).toBeFalsy_msg('change.rest');
            });

            it("returns all panels of strip if panel dimensions have changed", function () {
                newLayout.pages[1][2].splice(0, 0, {"wPanels": [0.2, 0.8]});
                var change = LayoutRepaint.layoutChange(oldLayout, newLayout);
                expect(change.all).toBeFalsy_msg('change.all');
                expect(change.strips).toEqual([{pageNr: 1, stripNr: 2}]);
                expect(change.rest).toBeFalsy_msg('change.rest');
            });
        });

        describe("checkPanels:", function () {

            it("if the number of panels has changed in a strip, returns the strip and rest === true", function () {
                newLayout.pages[0][2].splice(1, 1);
                var change = LayoutRepaint.layoutChange(oldLayout, newLayout);
                expect(change.all).toBeFalsy_msg('change.all');
                expect(change.strips).toEqual([{pageNr: 0, stripNr: 2}]);
                expect(change.rest).toBeTruthy();
            });
        });

        describe("checkPanelProperties:", function () {

            it("if plotItemCount has changed in a panel, returns the panel and rest === true", function () {
                newLayout.pages[1][1][2][0] = 2;
                var change = LayoutRepaint.layoutChange(oldLayout, newLayout);
                expect(change.all).toBeFalsy_msg('change.all');
                expect(change.panelIds).toEqual([11]);
                expect(change.rest).toBeTruthy();
            });

            it("if bgrQualifier has changed in a panel, returns all panels of old and new background", function () {
                newLayout.pages[0][1][0][1] = 'bgr-2';
                var change = LayoutRepaint.layoutChange(oldLayout, newLayout);
                expect(change.all).toBeFalsy_msg('change.all');
                expect(change.panelIds.sort()).toEqual(_.range(3, 9).concat(_.range(12, 18)).sort());  // all panels with bgrQualifier = 'bgr-1' or 'bgr-2'
                expect(change.rest).toBeFalsy_msg('change.rest');
            });

            it("if characterQualifier has changed in a panel, returns this panel", function () {
                newLayout.pages[0][1][0][2] = 'Mariel:anders';
                var change = LayoutRepaint.layoutChange(oldLayout, newLayout);
                expect(change.all).toBeFalsy_msg('change.all');
                expect(change.panelIds).toEqual([3]);
                expect(change.rest).toBeFalsy_msg('change.rest');
            });

            it("if characterPosition has changed in a panel, returns this panel", function () {
                newLayout.pages[0][1][1][3] = {x: 0.5};
                var change = LayoutRepaint.layoutChange(oldLayout, newLayout);
                expect(change.all).toBeFalsy_msg('change.all');
                expect(change.panelIds).toEqual([4]);
                expect(change.rest).toBeFalsy_msg('change.rest');
            });

            it("if zoom has changed in a panel, returns all the panels with the same background", function () {
                newLayout.pages[0][1][2][4] = 2; // bgr-1
                var change = LayoutRepaint.layoutChange(oldLayout, newLayout);
                expect(change.all).toBeFalsy_msg('change.all');
                expect(change.panelIds).toEqual([3, 4, 5, 12, 13, 14]);
                expect(change.rest).toBeFalsy_msg('change.rest');
            });

            it("if pan has changed in a panel, returns all the panels with the same background", function () {
                newLayout.pages[0][1][2][5] = [0, 0.5]; // bgr-1
                var change = LayoutRepaint.layoutChange(oldLayout, newLayout);
                expect(change.all).toBeFalsy_msg('change.all');
                expect(change.panelIds).toEqual([3, 4, 5, 12, 13, 14]);
                expect(change.rest).toBeFalsy_msg('change.rest');
            });
        });
    });
});