/**
 * This singleton object defines the editor with its buttons on the top right side of the comic preview.
 */

;var comicVM = comicVM || {};

comicVM.Editor = {

    id: {
        EDIT: '#edit',

        PANEL: '#panel',
        BGR: '#bgr',
        SCENE: '#scene',

        PARAM: {
            DEFAULT: '#param-default',
            PANEL: '#param-panel',
            BGR: '#param-bgr',
            SCENE: '#param-scene'
        },

        PAINT_OPTIONS: '#paint-options',

        YELLOW: '#yellow',
        INK: '#ink',
        LARGE: '#large',
        PAINT_BGR: '#paint-bgr'
    },

    PAINT_OPTION: {
        PRINT: {
            YELLOW: 'YELLOW',
            INK: 'INK',
            EDITOR: 'EDITOR'
        },
        SIZE: {
            LARGE: 'LARGE',
            SMALL: 'SMALL'
        }
    },

    editMode: null,

    editTarget: null,

    viewParam: null,

    paintOptionPrint: null,
    paintOptionBackground: null,

    setEditTarget: function (target) {
        this.editTarget = target;
        comicVM.EditorElements.editTargetChanged(this.editTarget);
    },

    applyViewParam: function () {
        switch (this.viewParam) {
            case this.id.SCENE:
                OPTIONS.PANEL.paintMode.setScene();
                this.setEditTarget(this.id.SCENE);
                break;
            case this.id.BGR:
                OPTIONS.PANEL.paintMode.setBgr();
                this.setEditTarget(this.id.BGR);
                break;
            case this.id.PANEL:
                OPTIONS.PANEL.paintMode.setPanel();
                this.setEditTarget(this.id.PANEL);
                break;
            default:
                OPTIONS.PANEL.paintMode.setDefault();
                this.setEditTarget(null);
        }
        comicVM.EditorElements.editTargetChanged(this.editTarget);

        if (comicVM.PanelPainter.repaintPanelsOfScene) {
            comicVM.PanelPainter.repaintPanelsOfScene(LayoutParser.scene);
        }
    },

    /**
     * Repaints the whole scene without recalculation of positions (call comicVM.PanelPainter.repaint for that.)
     */
    repaint: function () {

        $('#image').html('');

        if (this.editMode) {
            comicVM.PanelPainter.setPaintStyleEDITOR();
        } else {
            switch (this.paintOptionPrint) {
                case this.PAINT_OPTION.PRINT.EDITOR:
                    comicVM.PanelPainter.setPaintStyleEDITOR();
                    break;
                case this.PAINT_OPTION.PRINT.YELLOW:
                    comicVM.PanelPainter.setPaintStyleYELLOW();
                    break;
                default:
                    comicVM.PanelPainter.setPaintStyleINK();
                    break;
            }
        }

        paint();

        function paint() {
            var angularScope = angular.element('body').scope();
            if (angularScope) {
                angularScope.paint();
            }
        }
    }
};