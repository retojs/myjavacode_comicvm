PanelInfo = {

    panel: null,
    pageNr: null,

    infoElement: function () {
        return $('#panel-info-content div');
    },

    /**
     * Toggels the displayed panel info between
     *  - plot items
     *  - characters
     *  - character positions
     *
     * @param panelAndPage: the panel and the pageNr that were clicked
     */
    show: function (panelAndPage) {
        if (panelAndPage && panelAndPage.panel) {
            var panel = panelAndPage.panel;
            var pageNr = panelAndPage.pageNr;

            switch (OPTIONS.PANEL_INFO.current.info) {

                case OPTIONS.PANEL_INFO.CHARACTERS:
                    this.showPanelCharacterInfo(panel, pageNr);
                    break;
                case OPTIONS.PANEL_INFO.POSITIONS:
                    this.showCharacterPositions(panel);
                    break;
                default:
                    this.showPanelPlotItemInfo(panel, pageNr);
            }
        }
    },

    hide: function () {
        this.infoElement().html('');
    },

    // HTML formatter functions

    h: function (level, str) {
        switch (level) {
            case 1:
                return '<h1>' + str + '</h1>';
            case 2:
                return '<h2>' + str + '</h2>';
            case 3:
                return '<h3>' + str + '</h3>';
            case 4:
                return '<h4>' + str + '</h4>';
            case 5:
                return '<h5>' + str + '</h5>';
        }
    },

    b: function (str) {
        return '<b>' + str + '</b>';
    },

    p: function (str) {
        return '<p>' + str + '</p>';
    },

    pre: function pre(str) {
        return '<pre>' + str + '</pre>';
    },

    br: function (howMany) {
        return Array(howMany + 1).join('<br/>');
    },

    hr: function () {
        return '<hr/>';
    },

    s: function (howMany) {
        return Array(howMany + 1).join(' ');
    },

    maxLength: function (strings) {
        return _.reduce(strings, function (memo, string) {
            return memo < string.length ? string.length : memo;
        }, 0);
    },

    remainingSpace: function (string, strings) {
        return this.maxLength(strings) - string.length;
    },

    indentLines: function (string, indent) {
        var indentSpace = this.s(indent);
        return _.reduce(string.split('\n'), function (result, line) {
            return result + '<br/>' + indentSpace + line;
        });
    },

    stringifyWithIndent: function (obj, indent) {
        return this.indentLines(JSON.stringify(obj, null, 3), indent);
    },

    // build info HTML content

    getHowToInfo: function () {
        return (function (h, b, br) {

            var howToInfo =
                h(3, 'Panel auswählen:')
                + 'Klicke auf ein Panel im Comic ganz links.'
                + br(1)
                + 'Klicke mehrmals auf dasselbe Panel, um zur nächsten Info-Seiten zu wechseln.';

            return howToInfo;

        })(this.h, this.b, this.br);
    },

    getImageInfo: function (panel) {
        return (function (self, b, p, pre, br, hr, s) {
            var imageURLs = b('## background image:')
                + br(2)
                + '   ' + s(self.maxLength(PlotParser.parsed.characterNames))
                + '  '
                + '<a target="_blank" href="' + panel.getBgrImg().src + '">' + panel.getBgrImgName() + '</a>'
                + br(2);

            if (Object.keys(panel.allCharacterList).length > 0) {
                imageURLs = imageURLs
                    + b('## character images:')
                    + br(2);

                for (var i = 0; i < PlotParser.parsed.characterNames.length; i++) {
                    var name = PlotParser.parsed.characterNames[i],
                        remainingSpace = self.remainingSpace(name, PlotParser.parsed.characterNames);
                    imageURLs = imageURLs
                        + '   ' + s(remainingSpace)
                        + name + ': '
                        + '<a target="_blank" href="' + panel.getCharacterImage(name).src + '">' + panel.getCharacterImageName(name) + '</a>'
                        + br(1);
                }
            }
            imageURLs += br(2);

            var imageTags = b('## image tags:') + br(2);

            var place = panel.place;
            var bgrQualifier = panel.layoutGet.bgrQualifier();
            var backgroundTags = place.split('.').concat(bgrQualifier.split('.'));

            imageTags += b(' - background') + ' must match: [ ' + backgroundTags.join(', ') + ']' + br(2);

            for (i = 0; i < PlotParser.parsed.characterNames.length; i++) {
                var name = PlotParser.parsed.characterNames[i],
                    allTags = panel.getCharacterTags(name),
                    mustMatchTags = panel.getMustMatchTags(name),
                    noMustMatchTags = _.difference(allTags, mustMatchTags);

                mustMatchTags = _.filter(mustMatchTags, function (tag) {
                    return tag !== tagStore.TYPE_OBJECT;
                });

                imageTags += ' - ' + b(name) + s(self.remainingSpace(name, PlotParser.parsed.characterNames))
                    + ' must match: [ ' + mustMatchTags.join(', ') + ' ]' + br(1);

                if (noMustMatchTags.length > 0) {
                    imageTags += '   ' + s(self.maxLength(PlotParser.parsed.characterNames))
                        + ' just match: [ ' + noMustMatchTags.join(', ') + ' ]' + br(1);
                }
            }
            imageTags += br(2);

            return imageTags + hr() + imageURLs;

        })(this, this.b, this.p, this.pre, this.br, this.hr, this.s);
    },

    showPanelPlotItemInfo: function (panel, pageNr) {
        return (function (self, h, b, p, s, pre, br, hr) {
            var title = h(3, '# 1 - PLOT ITEMS AND LAYOUT in Panel ' + panel.id);

            var panelInfo =
                h(3, '## Plot Items (' + panel.plotItems.length + ')')

                + _.map(panel.plotItems, function (plotItem) {
                        return b(' ' + plotItem.id + ':')
                            + br(1)
                            + plotItemToString(plotItem)
                            + br(1);
                    })
                    .join(br(1))
                + br(2);

            var layoutInfo = h(3, '## Layout Properties')
                + b('### panel:  ') + br(2)
                + panelLayoutToString(panel)
                + br(2)
                + b('### background:  ')
                + br(2)
                + s(4) + self.stringifyWithIndent(LayoutParser.removeDefaults(LayoutParser.getBackground(panel.layoutGet.bgrQualifier())), 4)
                + br(2)
                + b('### scene:  ')
                + br(2)
                + s(4) + self.stringifyWithIndent(LayoutParser.removeDefaults(LayoutParser.getScene()), 4)
                + br(2);

            var dimensions = h(3, '## Panel Dimensions')
                + '   x = ' + panel.dim.x
                + '   w = ' + panel.dim.w + br(1)
                + '   y = ' + panel.dim.y
                + '   h = ' + panel.dim.h + br(3);

            var howToInfo = self.getHowToInfo(panel);

            self.infoElement().html(pre(
                title
                + hr()
                + panelInfo
                + hr()
                + layoutInfo
                + hr()
                + dimensions
                + hr()
                + howToInfo
            ));

            function plotItemToString(plotItem) {
                var separator = br(1);

                var plotItemString = ''
                    + '    type: ' + plotItem.type
                    + separator
                    + '     who: ' + plotItem.who
                    + separator
                    + '    ' + plotItem.actionType + ': ' + plotItem.action;

                if (plotItem.whoWith) {
                    plotItemString += ''
                        + separator
                        + '    with: ' + (_.isArray(plotItem.whoWith) ? plotItem.whoWith.join(', ') : plotItem.whoWith);
                }
                if (plotItem.qualifiers) {
                    plotItemString += ''
                        + separator
                        + '     how: ' + qualifiersToString(plotItem.qualifiers);
                }

                return plotItemString;
            }

            function qualifiersToString(qualifiers) {
                return _.map(wrap(qualifiers), function (qualifier, index) {
                    return qualifier.who + ' = ' + qualifier.how;
                }).join(', ')
            }

            function panelLayoutToString(panel) {
                var layout = LayoutParser.layout,
                    panelLayout = LayoutParser.getPanelLayout(panel.id);

                return _.map(layout.panelProperties, function (propName, index) {
                    var propValue = panelLayout[index];
                    if (typeof propValue === 'object') {
                        if (_.isArray(propValue)) {
                            propValue = json(propValue);
                        } else {
                            propValue = self.stringifyWithIndent(propValue, 4 + self.maxLength(layout.panelProperties));
                        }
                    }
                    return '  '
                        + s(self.remainingSpace(propName, layout.panelProperties))
                        + propName + ': '
                        + (_.isUndefined(propValue) ? '' : propValue)
                }).join(br(1));
            }

            function wrap(value) {
                return (Array.isArray(value) || typeof value === 'undefined') ? value : [value];
            }

        })(this, this.h, this.b, this.p, this.s, this.pre, this.br, this.hr);
    },

    showPanelCharacterInfo: function (panel) {
        return (function (self, h, b, p, pre, br, hr) {
            var panelInfo = h(3, '# 2 - BACKGROUND AND CHARACTERS in Panel ' + panel.id)
                + hr()
                + b('## place:')
                + '  ' + PlotParser.getPlace()
                + br(2)
                + b('## background qualifier:')
                + '  ' + (panel.layoutGet.bgrQualifier().trim() == '' ? 'DEFAULT' : panel.layoutGet.bgrQualifier())

                + br(2)
                + b('## characters')
                + br(2)
                + charactersToString(panel.getCharactersArray())
                + br(2);

            var imageInfo = self.getImageInfo(panel);

            self.infoElement().html(
                pre(panelInfo + hr() + imageInfo)
            );

            function charactersToString(characters) {
                return _.map(characters, characterToString).join(br(1));
            }

            function characterToString(character) {
                var result = character.who
                    + (character.how ? ' (' + character.how + ')' : '');
                return character.isActing ? b(' * ' + result) : '   ' + result;
            }

        })(this, this.h, this.b, this.p, this.pre, this.br, this.hr);
    },

    showCharacterPositions: function (panel) {
        return (function (self, h, b, p, pre, br, hr, s) {
            function copy(pos) {
                return {
                    x: pos ? pos.x : '',
                    y: pos ? pos.y : '',
                    size: pos ? pos.size : '',
                    tag: pos ? pos.tag : ''
                };
            }

            function attr(name, value, otherNames) {
                if (Array.isArray(value)) {
                    value = json(value);
                }
                var indent = otherNames ? self.remainingSpace(name, otherNames) : 0;
                return s(indent) + b(name + ': ') + value + '\n';
            }

            var sceneLayoutGet = panel.scene.layoutGet;
            var bgrLayoutGet = panel.bgr.layoutGet;
            var panelLayoutGet = panel.layoutGet;

            var scenePos = sceneLayoutGet.characterPosition();
            var bgrPos = bgrLayoutGet.characterPosition();
            var panelPos = panelLayoutGet.characterPosition();

            var characterPositionText = b('## character positions') + br(1);
            var zoomPanText = b('## zoom and panning in panel ' + panel.id) + br(1);

            var indent = '  ';

            var positionInfoAll = '';
            if (OPTIONS.PANEL.calcPos.all.scene) {
                positionInfoAll += attr('#### scene', br(2) + s(5) + self.stringifyWithIndent(copy(scenePos), 5) + br(2));
            }
            if (OPTIONS.PANEL.calcPos.all.bgr) {
                positionInfoAll += attr('#### background \"' + panel.bgr.qualifier + '\"', br(2) + s(5) + self.stringifyWithIndent(copy(bgrPos), 5) + br(2));
            }
            if (OPTIONS.PANEL.calcPos.all.panel) {
                positionInfoAll += attr('#### panel ' + panel.id, br(2) + s(5) + self.stringifyWithIndent(copy(panelPos), 5) + br(2))
            }

            var positionInfoIndividual = {};
            for (var i = 0; i < PlotParser.parsed.characterNames.length; i++) {
                var name = PlotParser.parsed.characterNames[i];
                positionInfoIndividual[name] = {};
                if (OPTIONS.PANEL.calcPos.individual.scene) {
                    positionInfoIndividual[name].scene = scenePos ? scenePos[name] : '';
                }
                if (OPTIONS.PANEL.calcPos.individual.bgr) {
                    positionInfoIndividual[name].background = bgrPos ? bgrPos[name] : '';
                }
                if (OPTIONS.PANEL.calcPos.individual.panel) {
                    positionInfoIndividual[name].panel = panelPos ? panelPos[name] : '';
                }
            }


            var zoom = b('zoom:') + '\n',
                pan = b('pan:') + '\n',
                labels = ['scene', '\"' + panel.bgr.qualifier + '\"' + ' background', 'panel'];

            if (OPTIONS.PANEL.calcPos.zoom.scene) {
                zoom += indent + attr(labels[0], sceneLayoutGet.zoom(), labels);
            }
            if (OPTIONS.PANEL.calcPos.zoom.bgr) {
                zoom += indent + attr(labels[1], bgrLayoutGet.zoom(), labels);
            }
            if (OPTIONS.PANEL.calcPos.zoom.panel) {
                zoom += indent + attr(labels[2], panelLayoutGet.zoom(), labels);
            }

            if (OPTIONS.PANEL.calcPos.pan.scene) {
                pan += indent + attr(labels[0], sceneLayoutGet.pan(), labels);
            }
            if (OPTIONS.PANEL.calcPos.pan.bgr) {
                pan += indent + attr(labels[1], bgrLayoutGet.pan(), labels);
            }
            if (OPTIONS.PANEL.calcPos.pan.panel) {
                pan += indent + attr(labels[2], panelLayoutGet.pan(), labels);
            }

            self.infoElement().html(pre(
                h(3, '# 3 - CHARACTER POSITIONS in Panel ' + panel.id)
                + hr()
                + characterPositionText
                + br(1)
                + p(b('### all characters:'))
                + positionInfoAll
                + p(b('### individual characters:'))
                + s(4) + self.stringifyWithIndent(positionInfoIndividual, 4)
                + br(2)
                + hr()
                + p(zoomPanText)
                + p(zoom + br(1) + pan, null, 3)
            ));

        })(this, this.h, this.b, this.p, this.pre, this.br, this.hr, this.s);
    }
};

