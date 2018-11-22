'use strict';

angular.module('editor').directive('cvmToolBar', [function () {
    return {
        templateUrl: 'script/angular/editor/directives/toolBar.html',
        controller: ['$scope', function ($scope) {

            $scope.editMode = comicVM.Editor.editMode = OPTIONS.EDITOR.editMode;

            $scope.$watch('editMode', function (newValue, oldValue) {
                if (newValue !== oldValue) {
                    if ($scope.editMode) {
                        comicVM.Editor.paintOptionBackground = false;
                        $scope.paintBgr = false;
                    }
                    comicVM.Editor.editMode = $scope.editMode;
                    comicVM.Editor.repaint($scope.content.scene);
                }
            });

            $scope.EDIT_TARGET = {
                SCENE: comicVM.Editor.id.SCENE,
                BGR: comicVM.Editor.id.BGR,
                PANEL: comicVM.Editor.id.PANEL
            };

            $scope.editTarget = $scope.EDIT_TARGET.PANEL;

            $scope.$watch('editTarget', function (newValue, oldValue) {
                comicVM.Editor.editTarget = $scope.editTarget;
                if (newValue !== oldValue) {
                    comicVM.EditorElements.editTargetChanged(comicVM.Editor.editTarget);
                }
            });

            $scope.PAINT_STYLE = {
                INK: comicVM.Editor.PAINT_OPTION.PRINT.INK,
                YELLOW: comicVM.Editor.PAINT_OPTION.PRINT.YELLOW,
                EDITOR: comicVM.Editor.PAINT_OPTION.PRINT.EDITOR
            };

            $scope.paintStyle = $scope.PAINT_STYLE.INK;

            $scope.$watch('paintStyle', function (newValue, oldValue) {
                comicVM.Editor.paintOptionPrint = $scope.paintStyle ? $scope.paintStyle : $scope.PAINT_STYLE.EDITOR;
                if (newValue !== oldValue) {
                    comicVM.Editor.repaint();
                }
            });

            $scope.paintBgr = false;

            $scope.$watch('paintBgr', function (newValue, oldValue) {
                if (newValue !== oldValue) {
                    comicVM.Editor.paintOptionBackground = $scope.paintBgr;
                    comicVM.Editor.repaint();
                }
            });

            $scope.doPrint = false;

            $scope.LAYOUT = $scope.EDIT_TARGET;
            $scope.LAYOUT.DEFAULT = 'DEFAULT';

            $scope.layout = $scope.LAYOUT.PANEL;

            $scope.$watch('layout', function (newValue, oldValue) {
                $scope.editTarget = $scope.layout;
                comicVM.Editor.viewParam = $scope.layout;
                comicVM.Editor.applyViewParam();
                if (newValue !== oldValue) {
                    comicVM.Editor.repaint();
                }
            })
        }],
        link: function () {
            $(document).on('keypress', function (event) {
                if (event.ctrlKey && event.charCode === 26) { // Ctrl + Z
                    DragResize.undo.pop();
                }
            });
        }
    }
}]);