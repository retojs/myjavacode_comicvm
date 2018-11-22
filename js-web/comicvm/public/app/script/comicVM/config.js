var OPTIONS = {

    SOURCE: {

        host: 'localhost',
        port: 3000,

        storiesDir: 'stories',
        backgroundsDir: 'images/bgr',
        charactersDir: 'images/chr',

        story: 'Mariel',
        scene: localStorage.getItem('story') || null,
        scenes: [],

        imageList: 'list/images',

        content: {
            plot: null,
            layout: null
        }
    },

    LAYOUT: {
        defaultGet: {
            plotItemCount: function () {
                return 0;
            },
            bgrQualifier: function () {
                return '';
            },
            characterQualifier: function () {
                return '';
            },
            characterPosition: function () {
                return {};
            },
            zoom: function () {
                return 1.0;
            },
            pan: function () {
                return [0, 0];
            },
            reverse: function () {
                return false;
            }
        }
    },

    PAGE: {
        pageWidth: 545,
        pageHeight: 760,

        pagePadding: {x: 30, y: 40},
        panelPadding: {x: 10, y: 10},

        colorPageNr: '#000'
    },

    PANEL: {

        PAINT_MODE: {
            DEFAULT: "DEFAULT",
            SCENE: "SCENE",
            BGR: "BGR",
            PANEL: "PANEL"
        },

        paintMode: {

            val: "PANEL",

            setDefault: function () {
                OPTIONS.PANEL.paintMode.val = OPTIONS.PANEL.PAINT_MODE.DEFAULT;

                OPTIONS.PANEL.calcPos.individual.scene = false;
                OPTIONS.PANEL.calcPos.individual.bgr = false;
                OPTIONS.PANEL.calcPos.individual.panel = false;

                OPTIONS.PANEL.calcPos.all.scene = false;
                OPTIONS.PANEL.calcPos.all.bgr = false;
                OPTIONS.PANEL.calcPos.all.panel = false;

                OPTIONS.PANEL.calcPos.zoom.scene = false;
                OPTIONS.PANEL.calcPos.zoom.bgr = false;
                OPTIONS.PANEL.calcPos.zoom.panel = false;

                OPTIONS.PANEL.calcPos.pan.scene = false;
                OPTIONS.PANEL.calcPos.pan.bgr = false;
                OPTIONS.PANEL.calcPos.pan.panel = false;
            },
            setScene: function () {
                this.setDefault();
                OPTIONS.PANEL.paintMode.val = OPTIONS.PANEL.PAINT_MODE.SCENE;

                OPTIONS.PANEL.calcPos.individual.scene = true;
                OPTIONS.PANEL.calcPos.all.scene = true;
                OPTIONS.PANEL.calcPos.zoom.scene = true;
                OPTIONS.PANEL.calcPos.pan.scene = true;
            },
            setBgr: function () {
                this.setScene();
                OPTIONS.PANEL.paintMode.val = OPTIONS.PANEL.PAINT_MODE.BGR;

                OPTIONS.PANEL.calcPos.individual.bgr = true;
                OPTIONS.PANEL.calcPos.all.bgr = true;
                OPTIONS.PANEL.calcPos.zoom.bgr = true;
                OPTIONS.PANEL.calcPos.pan.bgr = true;
            },
            setPanel: function () {
                this.setBgr();
                OPTIONS.PANEL.paintMode.val = OPTIONS.PANEL.PAINT_MODE.PANEL;

                OPTIONS.PANEL.calcPos.individual.panel = true;
                OPTIONS.PANEL.calcPos.all.panel = true;
                OPTIONS.PANEL.calcPos.zoom.panel = true;
                OPTIONS.PANEL.calcPos.pan.panel = true;
            }
        },

        calcPos: {
            individual: {
                scene: true,
                bgr: true,
                panel: true
            },
            all: {
                scene: true,
                bgr: true,
                panel: true
            },

            zoom: {
                scene: true,
                bgr: true,
                panel: true
            },
            pan: {
                scene: true,
                bgr: true,
                panel: true
            },

            bbox: {
                excludeCharacter: null
            }
        },

        layoutPropertyTypes: {
            plotItemCount: 'number',
            bgrQualifier: 'string',
            characterQualifier: 'string',
            characterPosition: 'object',
            zoom: 'number',
            pan: 'object'
        }
    },

    PANEL_INFO: {

        PLOT_ITEMS: 1,
        CHARACTERS: 2,
        POSITIONS: 3,

        current: {
            info: 0,
            panelId: null
        },

        next: function (panelId) {

            if (OPTIONS.PANEL_INFO.current.panelId === null || OPTIONS.PANEL_INFO.current.panelId === panelId) {
                switch (OPTIONS.PANEL_INFO.current.info) {
                    case OPTIONS.PANEL_INFO.PLOT_ITEMS:
                        OPTIONS.PANEL_INFO.current.info = OPTIONS.PANEL_INFO.CHARACTERS;
                        break;
                    case OPTIONS.PANEL_INFO.CHARACTERS:
                        OPTIONS.PANEL_INFO.current.info = OPTIONS.PANEL_INFO.POSITIONS;
                        break;
                    default:
                        OPTIONS.PANEL_INFO.current.info = OPTIONS.PANEL_INFO.PLOT_ITEMS;
                }
            }

            OPTIONS.PANEL_INFO.current.panelId = panelId;
        }
    },

    PAINTER: {
        paintSinglePanel: -1,
        paintSingleBackground: null,

        displayPositionHelper: false,

        HELPER: {
            ID: 'css-helper',
            ID_CSS: '#css-helper',

            get: function () {
                return $(this.ID_CSS);
            }
        },

        qualifier: {
            say: true,  // if true a qualifier 'say' is added when getting the bitmap from the TagStore.

            DEFAULT_BGR: 'DEFAULT'
        }
    },

    EDITOR: {

        editMode: false,

        debug: {
            adjustActiveDoubles: true
        }
    },

    Z_INDEX: {

        // TODO: Move z-index into the comicVM.Editor

        Editor: {
            bgr: 59,
            bbox: {
                enabled: 60,
                disabled: 51,
                active: {
                    enabled: 59,
                    disabled: 51
                }
            },
            character: {
                enabled: 61,
                disabled: 51,
                active: {
                    enabled: 61,
                    disabled: 51
                },
                bitmap: 59
            },
            activeDouble: {
                enabled: 62,
                disabled: 51
            }
        },

        Painter: {
            canvas: 1,
            image: 1
        },

        sceneOverlay: 12,
        helperDiv: 0
    }
};

console.log('all options in config.js read:');
console.log(OPTIONS);