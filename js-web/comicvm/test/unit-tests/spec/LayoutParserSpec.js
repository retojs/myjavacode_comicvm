/**
 * LayoutParser features:
 *
 *               - Provide an array of panels with _qualified accessors_ to the panel properties defined in the layout
 *               - Provide pages each containing arrays with their panels
 *               - Provide the layout declaration specified in the layout for
 *                     - panels on pages
 *                     - backgrounds
 *                     - the scene
 *               - Allows changing layout properties
 *                 The layout data structure is only modified when necessary,
 *                 i.e. no default values are inserted for missing panelProperties
 *
 */

describe("resource/LayoutParser.js", function () {

    beforeAll(function () {
        defineMatchersWithMessage();
    });

    var LAYOUT = {

        minimal: {
            'panelProperties': [],
            'pages': [],
            'backgrounds': {},
            'scene': {}
        },

        simple: {
            'panelProperties': [
                "plotItemCount",
                "bgrQualifier",
                "zoom",
                "pan",
                "characterQualifier",
                "characterPosition"
            ],
            'pages': [
                [  // page 1
                    [  // strip 1
                        [1, 'bgrQualifier'],  // panel id=0
                        [2, 'bgrQualifier', 1.23, [4.56, 7.89], 'characterQualifier', {}]  // panel id=1
                    ]
                ],
                [  // page 2
                    [  // strip 1
                        [3, 'bgrQualifier-2']  // panel id=2
                    ]
                ]
            ]
        },

        sceneAndBackgroundProperties: {
            'panelProperties': [
                "plotItemCount",
                "bgrQualifier",
                "zoom",
                "pan",
                "characterQualifier",
                "characterPosition"
            ],
            'pages': [
                [  // page 1
                    [  // strip 1
                        [1, 'bgr-1']  // panel id=0
                    ],
                    [  // strip 2
                        [2, '', 1, [0, 0], {}],  // panel id=1
                        [2, '', 1, [0, 0], {}]  // panel id=2
                    ]
                ]
            ],
            'backgrounds': {
                "bgr-1": {
                    "reverse": true
                },
                "": {
                    "zoom": 1.2
                }
            },
            'scene': {
                "characterPosition": {
                    "size": 1.4
                }
            }
        },

        zoomPan: {
            closeToDefaults: {
                'panelProperties': ["zoom", "pan"],
                'pages': [
                    [  // page 1
                        [  // strip 1
                            [1.04, [0.04, -0.04]]
                        ]
                    ]
                ],
                'backgrounds': {
                    "": {
                        "zoom": 1.04,
                        "pan": [-0.04, -0.04]
                    }
                },
                'scene': {
                    "zoom": 0.96,
                    "pan": [0.04, 0.04]
                }
            },
            distinctFromDefaults: {
                'panelProperties': ["zoom", "pan"],
                'pages': [
                    [  // page 1
                        [  // strip 1
                            [1.05, [0.05, -0.05]]
                        ]
                    ]
                ],
                'backgrounds': {
                    "": {
                        "zoom": 1.06,
                        "pan": [-0.06, -0.06]
                    }
                },
                'scene': {
                    "zoom": 0.95,
                    "pan": [0.07, 0.07]
                }
            }
        },

        twoPages9x9Panels: {
            'panelProperties': [
                'plotItemCount',
                'bgrQualifier'
            ],
            'pages': [
                [  // page 1
                    [  // strip 1
                        [1, ''],  // panel 0
                        [1, ''],  // panel 1
                        [1, '']   // panel 2
                    ],
                    [  // strip 2
                        [1, 'bgr-1'],  // panel 3
                        [1, 'bgr-1'],  // panel 4
                        [1, 'bgr-1']   // panel 5
                    ],
                    [  // strip 3
                        [1, 'bgr-2'],  // panel 6
                        [1, 'bgr-2'],  // panel 7
                        [1, 'bgr-2']   // panel 8
                    ]
                ], [  // page 2
                    [  // strip 1
                        [1, ''],  // panel 9
                        [1, ''],  // panel 10
                        [1, '']   // panel 11
                    ],
                    [  // strip 2
                        [1, 'bgr-1'],  // panel 12
                        [1, 'bgr-1'],  // panel 13
                        [1, 'bgr-1']   // panel 14
                    ],
                    [  // strip 3
                        [1, 'bgr-2'],  // panel 15
                        [1, 'bgr-2'],  // panel 16
                        [1, 'bgr-2']   // panel 17
                    ]
                ]
            ]
        }
    };

    describe("LayoutParser.parse(jsonString)", function () {

        it("parses a layout JSON string and applies the layout object to this.layout", function () {

            var layout = LAYOUT.minimal;
            var jsonString = JSON.stringify(layout);

            LayoutParser.parse(jsonString);
            expect(LayoutParser.layout).toEqual(layout);
        });
    });

    describe("LayoutParser.createPanels(scene)", function () {

        beforeEach(function () {
            LayoutParser.layout = LAYOUT.simple;

            LayoutParser.createPanels(null);
        });

        it("creates an array of panels with _qualified accessors_ to the panel properties defined in the layout", function () {

            expect(LayoutParser.panels).toBeDefined('');
            expect(LayoutParser.panels.length).toBe(3);

            expect(LayoutParser.panels[0].layoutGet.plotItemCount()).toBe(1);
            expect(LayoutParser.panels[0].layoutGet.bgrQualifier()).toBe('bgrQualifier');

            expect(LayoutParser.panels[1].layoutGet.plotItemCount()).toBe(2);
            expect(LayoutParser.panels[1].layoutGet.bgrQualifier()).toBe('bgrQualifier');
            expect(LayoutParser.panels[1].layoutGet.zoom()).toBe(1.23);
            expect(LayoutParser.panels[1].layoutGet.pan()[0]).toBe(4.56);
            expect(LayoutParser.panels[1].layoutGet.pan()[1]).toBe(7.89);
            expect(LayoutParser.panels[1].layoutGet.characterQualifier()).toBe('characterQualifier');
            expect(LayoutParser.panels[1].layoutGet.characterPosition()).toEqual({});
        });

        it("assigns default values to panel properties which are not set in the layout file", function () {
            expect(LayoutParser.panels[0].layoutGet.zoom()).toBe(OPTIONS.LAYOUT.defaultGet.zoom());
            expect(LayoutParser.panels[0].layoutGet.pan()).toEqual(OPTIONS.LAYOUT.defaultGet.pan());
            expect(LayoutParser.panels[0].layoutGet.characterQualifier()).toBe(OPTIONS.LAYOUT.defaultGet.characterQualifier());
            expect(LayoutParser.panels[0].layoutGet.characterPosition()).toEqual(OPTIONS.LAYOUT.defaultGet.characterPosition());
        });

        it("creates an array of pages each containing arrays with their panels", function () {
            expect(LayoutParser.pagePanels).toBeDefined();
            expect(LayoutParser.getPageCount()).toBe_msg(2, 'LayoutParser.getPageCount()');

            expect(LayoutParser.pagePanels[0].length).toBe_msg(2, 'LayoutParser.pagePanels[0].length');
            expect(LayoutParser.pagePanels[0][0]).toEqual(LayoutParser.panels[0]);
            expect(LayoutParser.pagePanels[0][1]).toEqual(LayoutParser.panels[1]);

            expect(LayoutParser.pagePanels[1].length).toBe(1);
            expect(LayoutParser.pagePanels[1][0]).toEqual(LayoutParser.panels[2]);
        });

        it("assigns the specified scene to all panels", function () {
            var scene = new Scene('plot:', JSON.stringify(LAYOUT.simple));
            LayoutParser.createPanels(scene);

            expect(LayoutParser.panels.length).toBe(3);
            for (var i = 0; i < LayoutParser.panels.length; i++) {
                expect(LayoutParser.panels[i].scene).toEqual(scene);
            }
        });
    });

    describe("Getting layout declarations", function () {

    });

    describe("Setting Layout declarations", function () {

        beforeEach(function () {
            LayoutParser.layout = LAYOUT.sceneAndBackgroundProperties;

            LayoutParser.createPanels(null);
        });

        describe("LayoutParser.getPanelProperty", function () {

            it("does not add missing panel array elements, just returns the right default value", function () {
                var characterPosition = LayoutParser.getPanelProperty(0, 'characterPosition');
                expect(characterPosition).toEqual(OPTIONS.LAYOUT.defaultGet.characterPosition());
                expect(LayoutParser.getPanelLayout(0).length).toBe(2);
            });
        });

        describe("LayoutParser.setPanelProperty", function () {

            it("does not add missing elements if the value did not change (default equals missing)", function () {
                LayoutParser.setPanelProperty(0, 'characterPosition', {});
                expect(LayoutParser.getPanelLayout(0).length).toBe(2);
            });

            it("Deletes trailing array elements with default or undefined values", function () {
                LayoutParser.setPanelProperty(0, 'characterPosition', {x: 1});
                LayoutParser.setPanelProperty(0, 'characterPosition', {});
                expect(LayoutParser.getPanelLayout(0).length).toBe(2);
            });
        });
    });

    describe("LayoutParser.cleanUpLayoutProperties", function () {

        var panel;

        beforeEach(function () {
            LayoutParser.layout = LAYOUT.zoomPan.closeToDefaults;

            panel = new Panel(0);
        });

        it("Sets panel properties with values close to default values to default values (+/- 0.05)", function () {
            LayoutParser.cleanUpLayoutProperties(panel);
            expect(LayoutParser.getPanelLayout(0)[0]).toBe(1);  // check panel property with index 0, i.e. 'zoom'
            expect(LayoutParser.getPanelLayout(0)[1]).toEqual([0, 0]);  // check panel property with index 1, i.e. 'pan'
        });

        it("Deletes background properties with values close to default values  (+/- 0.05)", function () {
            LayoutParser.cleanUpLayoutProperties(panel);
            expect(LayoutParser.getBackground('').zoom).toBeUndefined();
            expect(LayoutParser.getBackground('').pan).toBeUndefined();
        });

        it("Deletes scene properties with values close to default values  (+/- 0.05)", function () {
            LayoutParser.cleanUpLayoutProperties(panel);
            expect(LayoutParser.getScene().zoom).toBeUndefined();
            expect(LayoutParser.getScene().pan).toBeUndefined();
        });

        it("Leaves panel, background and scene properties with non-default values untouched", function () {

            LayoutParser.layout = LAYOUT.zoomPan.distinctFromDefaults;

            LayoutParser.cleanUpLayoutProperties(panel);

            expect(LayoutParser.getPanelLayout(0)[0]).toBe(1.05);  // check panel property with index 0, i.e. 'zoom'
            expect(LayoutParser.getPanelLayout(0)[1]).toEqual([0.05, -0.05]);  // check panel property with index 1, i.e. 'pan'

            expect(LayoutParser.getBackground('').zoom).toBe(1.06);
            expect(LayoutParser.getBackground('').pan).toEqual([-0.06, -0.06]);

            expect(LayoutParser.getScene().zoom).toBe(0.95);
            expect(LayoutParser.getScene().pan).toEqual([0.07, 0.07]);
        });
    });

    describe("LayoutParser.removeDefaults(layoutFragment)", function () {
        it("returns a new layout fragment where default values are removed", function () {
            var layoutFragment = {
                zoom: 1,
                pan: [
                    0,
                    0
                ],
                characterQualifier: '',
                reverse: false
            };

            var rt = {
                size: 1,
                x: 0,
                y: 0
            };

            layoutFragment = LayoutParser.removeDefaults(layoutFragment);
            expect(layoutFragment.zoom).toBeUndefined();
            expect(layoutFragment.pan).toBeUndefined();
            expect(layoutFragment.characterQualifier).toBeUndefined();

        });
    });

    describe("LayoutParser.cleanUpCharacterPosition", function () {

        it("Removes character position properties with default values and returns false if no properties are left", function () {
            var characterPosition = {
                x: 0,
                y: 0,
                size: 1
            };

            var anyPropertyLeft = LayoutParser.cleanUpCharacterPosition(characterPosition);
            expect(anyPropertyLeft).toBeFalsy();
            expect(characterPosition.x).toBeUndefined();
            expect(characterPosition.y).toBeUndefined();
            expect(characterPosition.size).toBeUndefined();
        });

        it("Removes character position properties with values close to default values as well (+/- 0.05)", function () {
            var characterPosition = {
                x: 0.04,
                y: -0.04,
                size: 0.96
            };

            var anyPropertyLeft = LayoutParser.cleanUpCharacterPosition(characterPosition);
            expect(anyPropertyLeft).toBeFalsy();
            expect(characterPosition.x).toBeUndefined();
            expect(characterPosition.y).toBeUndefined();
            expect(characterPosition.size).toBeUndefined();
        });

        it("Leaves character position properties with non-default values untouched and returns true if any character position property is left", function () {
            var characterPosition = {
                x: 0.05,
                y: 0.05,
                size: 0.95
            };

            var anyPropertyLeft = LayoutParser.cleanUpCharacterPosition(characterPosition);
            expect(anyPropertyLeft).toBeTruthy();
            expect(characterPosition.x).toBe(0.05);
            expect(characterPosition.y).toBe(0.05);
            expect(characterPosition.size).toBe(0.95);
        });
    });

    describe("LayoutParser.getPagePanelIds", function () {

        beforeEach(function () {
            LayoutParser.layout = LAYOUT.twoPages9x9Panels;
        });

        it("returns the panel ids for a page number", function () {
            var panelIds = LayoutParser.getPagePanelIds(0);
            expect(panelIds).toEqual_msg([0, 1, 2, 3, 4, 5, 6, 7, 8], 'panel.id = 0');
            panelIds = LayoutParser.getPagePanelIds(1);
            expect(panelIds).toEqual_msg([9, 10, 11, 12, 13, 14, 15, 16, 17], 'panel.id = 1');
        });

        it("returns an empty array if no panel has the specified background qualifier", function () {
            var panelIds = LayoutParser.getPagePanelIds(99);
            expect(panelIds).toEqual([]);
        });

        it("accepts a layout argument and works on that if it's defined", function () {
            var layout = LayoutParser.layout;
            LayoutParser.layout = {};
            var panelIds = LayoutParser.getPagePanelIds(0, layout);
            expect(panelIds).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
        });
    });

    describe("LayoutParser.getBackgroundPanelIds", function () {

        beforeEach(function () {
            LayoutParser.layout = LAYOUT.twoPages9x9Panels;
        });

        it("returns the panel ids for a background qualifier", function () {
            var panelIds = LayoutParser.getBackgroundPanelIds('');
            expect(panelIds).toEqual([0, 1, 2, 9, 10, 11]);
            panelIds = LayoutParser.getBackgroundPanelIds('bgr-1');
            expect(panelIds).toEqual([3, 4, 5, 12, 13, 14]);
            panelIds = LayoutParser.getBackgroundPanelIds('bgr-2');
            expect(panelIds).toEqual([6, 7, 8, 15, 16, 17]);
        });

        it("returns an empty array if no panel has the specified background qualifier", function () {
            var panelIds = LayoutParser.getBackgroundPanelIds('unknown');
            expect(panelIds).toEqual([]);
        });

        it("accepts a layout argument and works on that if it's defined", function () {
            var layout = LayoutParser.layout;
            LayoutParser.layout = {};
            var panelIds = LayoutParser.getBackgroundPanelIds('bgr-1', layout);
            expect(panelIds).toEqual([3, 4, 5, 12, 13, 14]);
        });
    });

    describe("LayoutParser.getRemaining", function () {

        beforeEach(function () {
            LayoutParser.layout = LAYOUT.twoPages9x9Panels;
        });

        it("getRemainingPanels", function () {
            var panelIds = LayoutParser.getRemainingPanels(0, 1, 3);
            expect(panelIds).toEqual([4, 5]);

            panelIds = LayoutParser.getRemainingPanels(0, 1, 99);  // invalid panelId
            expect(panelIds).toEqual([]);
        });

        it("getRemainingStrips", function () {
            var strips = LayoutParser.getRemainingStrips(1, 0);
            expect(strips).toEqual([1, 2]);

            strips = LayoutParser.getRemainingStrips(1, 99);  // invalid stripNr
            expect(strips).toEqual([]);
        });

        it("getRemainingPages", function () {
            var pages = LayoutParser.getRemainingPages(0);
            expect(pages).toEqual([1]);

            pages = LayoutParser.getRemainingPages(1);
            expect(pages).toEqual([]);

            pages = LayoutParser.getRemainingPages(99);  // invalid pageNr
            expect(pages).toEqual([]);
        });
    });
});

