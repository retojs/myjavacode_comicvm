describe("angular/painter/painter.js", function () {

    beforeAll(function () {
        defineMatchersWithMessage();
    });

    var layout,
        layoutJson;

    beforeEach(module('comicvm'));

    beforeEach(function () {
        layout = {
            'panelProperties': [
                "plotItemCount",
                "bgrQualifier",
                "characterPosition"
            ],
            'pages': [
                [  // page
                    [  // strip
                        [1, 'beach', {size: 2}]  // panel
                    ]
                ]

            ],
            'backgrounds': {
                "": {
                    "characterPosition": {
                        "x": 1,
                        "y": 2,
                        "size": 3
                    }
                },
                "beach": {
                    "reverse": true
                }
            },
            'scene': {
                "characterPosition": {
                    "x": 4,
                    "y": 5,
                    "size": 6
                }
            }
        };

        layoutJson = JSON.stringify(layout);
    });

    describe("function repaintLayout(layout)", function () {

        var cvmPainter;

        beforeEach(inject(function (_cvmPainter_) {
            cvmPainter = _cvmPainter_;
            cvmPainter.scene = new Scene();
            cvmPainter.scene.setup = angular.noop;
            cvmPainter.scene.repaintSinglePanel = angular.noop;
            ComicVM.scene = cvmPainter.scene;  // TODO: clearly not a good solution

            LayoutParser.layout = layout;
            LayoutParser.createPanels(cvmPainter.scene);
            LayoutParser.distributePlotItemsIntoPanels(PlotParser.parsed.plotItems);
        }));
    });
});
