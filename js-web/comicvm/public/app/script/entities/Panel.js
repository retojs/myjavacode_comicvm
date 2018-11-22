/**
 * Each Panel gets a list of plot items, dimensions (width height position defining the frame) and options (which are in fact optional.)
 */
var Panel = function (id, dimensions, scene) {

    this.id = id;

    this.pageNr = 0;

    this.dim = dimensions;
    this.scene = scene;

    this.place = PlotParser.getPlace();
    this.bgr; // Bgr object
    this.plotItems; // = plotItems;

    /**
     * accessors to the panel properties defined in the layout
     */
    this.layoutGet = {
        plotItemCount: function () {
            return getLayoutProperty(id, 'plotItemCount');
        },
        bgrQualifier: function () {
            return getLayoutProperty(id, 'bgrQualifier');
        },
        characterQualifier: function () {
            return getLayoutProperty(id, 'characterQualifier');
        },
        characterPosition: function () {
            return getLayoutProperty(id, 'characterPosition');
        },
        zoom: function () {
            return getLayoutProperty(id, 'zoom');
        },
        pan: function () {
            return getLayoutProperty(id, 'pan');
        }
    };

    function getLayoutProperty(panelId, propertyName) {
        return LayoutParser.getPanelProperty(panelId, propertyName);
    }

    // positions will be 1. individual, 2. background, 3. panel positions, depending on the step in the rendering process
    this.actingCharacterPositions = null;

    this.charactersDefaultPositions = null;
    this.charactersIndividualPositions = null;
    this.charactersBackgroundPositions = null;
    this.charactersPanelPositions = null;

    this.calcDefaultPositions = null; // flag to indicate if default positions need to be calculated (step 0)
    this.calcIndividualPositions = true; // flag to indicate if individual positions need to be calculated (1st step)
    this.calcBackgroundPositions = true; // flag to indicate if background positions need to be calculated (2nd step)
    this.calcPanelPositions = true; // flag to indicate if panel positions need to be calculated (3d step)

    this.charactersDefaultBBox = null; // bounding box of all characters at their default positions to fit the background image
    this.charactersBackgroundBBox = null; // bounding box of all characters at their default positions including the configuration in the background
    this.charactersPanelBBox = null; // bounding box of all characters at their default positions including the configuration in the panel
    this.actingCharactersBBox = null; // bounding box of all acting* characters (* acting in this panel)

    Panel.prototype.recalcPositions = function () {
        this.calcDefaultPositions = true;
        this.calcIndividualPositions = true;
        this.calcBackgroundPositions = true;
        this.calcPanelPositions = true;

        this.charactersDefaultBBox = null;
        this.charactersBackgroundBBox = null;
        this.charactersPanelBBox = null;
        this.actingCharactersBBox = null;
    };

    // actingCharacterList contains the characters who are acting in this panel
    // elements of this array contain 2 properties: { who: 'Name', how: 'list of qualifiers' }
    this.actingCharacterList = [];
    // allCharacterList contains all characters who appear in this scene,
    // i.e. key-value pairs [character name -> Character object]
    this.allCharacterList = {};
    // what someone says is printed inside a bubble connected to the character,
    // elements of this array contain 2 properties: { who: 'Name', says: 'plain text content' }
    this.bubbleList = [];
    // what someone does or what happens is (optionally) printed as text
    // elements of this array are plain text
    this.descList = [];
    // what the narrator tells is printed inside frames.
    this.toldList = [];

    Panel.prototype.resetLists = function () {
        this.actingCharacterList = [];
        this.allCharacterList = {};
        this.bubbleList = [];
        this.descList = [];
        this.toldList = [];
    }
};

/**
 * @param name: character's name
 * @returns true if the character with the specifier name is an acting character
 */
Panel.prototype.isActingCharacter = function (name) {
    return this.actingCharacterList.reduce(function (prev, current) {
        return prev || (current.who.toLowerCase() === name.toLowerCase());
    }, false);
};

Panel.prototype.resetPlotItem = function (plotItem) {
    for (var i = 0; i < this.plotItems.length; i++) {
        if (this.plotItems[i].id === plotItem.id) {
            plotItem.panel = this;
            this.plotItems[i] = plotItem;
        }
    }
    this.sortPlotItems();
};

Panel.prototype.setPlotItems = function (plotItems) {
    this.plotItems = plotItems;
    for (var i = 0; i < this.plotItems.length; i++) {
        this.plotItems[i].panel = this;
    }
    this.sortPlotItems();
};

/**
 * Sorts all relevant plot item properties into actingCharacterList, bubbleList, descList, toldList
 */
Panel.prototype.sortPlotItems = function () {
    this.resetLists();

    this.initAllCharacterList();
    this.applyCharacterQualifiers();

    if (this.plotItems && this.plotItems.length > 0) {
        var currentCharacter = {}; // successive plot items for the same character will be combined...

        for (var p = 0; p < this.plotItems.length; p++) {
            var plotItem = this.plotItems[p];

            if (plotItem.type === PlotItem.TYPE.action) {
                this.sortActionPlotItem(plotItem, currentCharacter);
                if (plotItem.actionType === PlotItem.ACTION_TYPE.does) {
                    this.descList.push(plotItem.action);
                }
            }

            if (plotItem.type === PlotItem.TYPE.desc) {
                if (plotItem.desc) {
                    this.descList.push(plotItem.desc);
                }
            }

            if (plotItem.type === PlotItem.TYPE.told) {
                this.toldList.push(plotItem.told);
            }
        }
    }
};

Panel.prototype.initAllCharacterList = function () {
    this.allCharacterList = {};
    this.allCharacterList.all = new Character('all'); // for single-image

    var allNames = PlotParser.getCharacterNames();
    if (allNames) {
        for (i = 0; i < allNames.length; i++) {
            var name = allNames[i];
            if (!this.allCharacterList[name]) {
                this.allCharacterList[name] = new Character(name);
            }
        }
    }
};

Panel.prototype.applyCharacterQualifiers = function () {
    for (var p = 0; p < this.plotItems.length; p++) {
        var plotItem = this.plotItems[p];
        if (plotItem.qualifiers) {
            var qualifiers = _.isArray(plotItem.qualifiers) ? plotItem.qualifiers : [plotItem.qualifiers];
            for (var i = 0; i < qualifiers.length; i++) {
                var q = qualifiers[i],
                    ch = this.getCharacterByName(q.who);
                this.addCharacterQualifier(ch, q.how);
            }
        }
    }
};

Panel.prototype.sortActionPlotItem = function (plotItem, currentCharacter) {
    var character;
    if (Array.isArray(plotItem.who)) {
        character = [];
        for (var i = 0; i < plotItem.who.length; i++) {
            var ch = this.getCharacterByName(plotItem.who[i]);
            ch.isActing = true;
            character.push(ch);
            this.actingCharacterList.push(ch);
        }
    } else {
        character = this.getCharacterByName(plotItem.who);
        character.isActing = true;
        this.actingCharacterList.push(character);
    }
    if (!character) {
        log('character is null for a plotItem in panel ' + this.id, 'panel');
        log(plotItem)
    }

    if (plotItem.whoWith) {  // add characters involved in the plot item's action to the list of acting characters
        if (Array.isArray(plotItem.whoWith)) {
            for (var i = 0; i < plotItem.whoWith.length; i++) {
                var ch = this.getCharacterByName(plotItem.whoWith[i]);
                ch.isActing = true;
                this.actingCharacterList.push(ch);
            }
        } else {
            var ch = this.getCharacterByName(plotItem.whoWith);
            ch.isActing = true;
            this.actingCharacterList.push(ch);
        }
    }

    if (plotItem.says) {
        if (currentCharacter && currentCharacter.who === character.who) { // combine plot items for same character
            this.bubbleList.push({
                who: character.who,
                says: this.bubbleList.pop().says + ' ' + plotItem.says
            });
        } else {
            this.bubbleList.push({
                who: character.who,
                says: plotItem.says
            });
            currentCharacter.who = character.who;
        }
    }
};

Panel.prototype.getBgrImg = function () {
    if (!this.bgrImg || typeof this.bgrImg !== 'object') {
        this.bgrImg = Bgr.getBgrImage(this.layoutGet.bgrQualifier());
    }
    return this.bgrImg;
};

/**
 * @returns {string} The image name with all other URL stuff stripped off
 */
Panel.prototype.getBgrImgName = function () {
    return this.getImageName(this.getBgrImg());
}

Panel.prototype.isBgrReverse = function () {
    return this.bgr.layoutGet.reverse() ? true : false;
};

Panel.prototype.getZoom = function () {
    var zoom = 1;
    if (OPTIONS.PANEL.calcPos.zoom.scene) {
        zoom *= this.scene.layoutGet.zoom();
    }
    if (OPTIONS.PANEL.calcPos.zoom.bgr) {
        zoom *= this.bgr.layoutGet.zoom();
    }
    if (OPTIONS.PANEL.calcPos.zoom.panel) {
        zoom *= this.layoutGet.zoom();
    }
    return zoom;
};

Panel.prototype.getPan = function () {
    var result = {
        x: 0,
        y: 0
    };
    if (OPTIONS.PANEL.calcPos.pan.scene) {
        result.x += this.scene.layoutGet.pan()[0];
        result.y += this.scene.layoutGet.pan()[1];
    }
    if (OPTIONS.PANEL.calcPos.pan.bgr) {
        result.x += this.bgr.layoutGet.pan()[0];
        result.y += this.bgr.layoutGet.pan()[1];
    }
    if (OPTIONS.PANEL.calcPos.pan.panel) {
        result.x += this.layoutGet.pan()[0];
        result.y += this.layoutGet.pan()[1];
    }
    return result;
};

Panel.prototype.getImagePosition = function (name) {
    if (name && this.layoutGet.characterPosition() && this.layoutGet.characterPosition()[name]) {
        return this.layoutGet.characterPosition()[name].img;
    }
};

Panel.prototype.getAdjustedImageDimensions = function (imgDim, name) {
    if (name) {
        var characterSize = this.bgr.defaults.characterWidth * this.getZoom();
        var adjust = this.getImagePosition(name);
        if (adjust) {
            return {
                x: imgDim.x + (adjust.x ? adjust.x * characterSize : 0) - (adjust.size ? imgDim.w / 2 * (adjust.size - 1) : 0),
                y: imgDim.y + (adjust.y ? adjust.y * characterSize : 0) - (adjust.size ? imgDim.h / 2 * (adjust.size - 1) : 0),
                w: imgDim.w * (adjust.size ? adjust.size : 1),
                h: imgDim.h * (adjust.size ? adjust.size : 1)
            };
        }
    }
    return imgDim;
};

Panel.prototype.getActingCharacterNames = function () {
    if (this.actingCharacterList) {
        return _.map(this.actingCharacterList, function (character) {
            return character.who;
        });
    }
    return [];
};

Panel.prototype.getCharacterByName = function (name) {
    return this.allCharacterList[name];
};

Panel.prototype.getCharactersArray = function () {
    var self = this;
    return _.map(PlotParser.getCharacterNames(), function (name) {
        return self.getCharacterByName(name);
    });
};

/**
 * Overwrites the specified character's how property with the specified value.
 * This turned out to produce a more intuitive behaviour than if previous qualifiers are preserved.
 *
 * problematic use case:
 *
 *   Papa says to Mariel: Hey look!
 *   Mariel is surprised.
 *
 *   Papa continues: Here is your new backpack
 *   Mariel cheers.
 *
 *  if this is split up into 2 panels,
 *  in the second panel Mariel will have
 *  the qualifiers:
 *   * surprosed (from whoWith in Papa's plot item)
 *   * cheers
 *  the tag store will then not prefer an image
 *  with tag cheers over an image with tag surprised
 *  and will not return the image you wanted.
 *
 * @param character
 * @param how
 */
Panel.prototype.addCharacterQualifier = function (character, how) {
    if (character) {
        if (how) {
            if (!Array.isArray(how)) {
                how = [how];
            }
            character.how = how.concat(character.how);
        }
    }
};

Panel.prototype.getConfiguredCharacterQualifiers = function (name) {
    var combinedQualifiers = this.layoutGet.characterQualifier() + ',' + this.bgr.layoutGet.characterQualifier() + ',' + this.scene.layoutGet.characterQualifier();
    if (combinedQualifiers) {
        return combinedQualifiers.replace('undefined', '').split(',');
    }
};

/**
 * Returns additional qualifiers specified in the layout file
 *
 * @param name
 */
Panel.prototype.getCharacterQualifiers = function (name) {
    var result = [];
    $.each(this.getConfiguredCharacterQualifiers(), function (i, qualifierStr) {
        var name_ = qualifierStr.substr(0, qualifierStr.indexOf(':')).trim();
        if (name_ === name || name_.toLowerCase() === 'all') {
            result.push(qualifierStr.substr(qualifierStr.indexOf(':') + 1).trim());
        }
    });
    return result;
};

Panel.prototype.hasSingleImageQualifier = function () {
    return this.getConfiguredCharacterQualifiers().reduce(function (previousValue, current) {
        return previousValue || current.trim().toLowerCase().indexOf('single-image') >= 0;
    }, false);
};

Panel.prototype.saysAnything = function (who) {
    return $.grep(this.bubbleList, function (bubble, i) {
            return bubble.who === who;
        }).length > 0;
};

Panel.prototype.isHidden = function (who) {
    return -1 < this.getCharacterQualifiers(who).indexOf('hide');
};

Panel.prototype.getCharacterTags = function (characterName) {
    var character = this.getCharacterByName(characterName);
    var tags = [
        this.place,
        this.layoutGet.bgrQualifier(),
        this.isBgrReverse() ? 'reverse' : '',
        this.saysAnything(character.who) && OPTIONS.PAINTER.qualifier.say ? 'say' : ''
    ];
    tags = tags.concat(Array.isArray(character.how) ? character.how : [character.how]);
    tags = tags.concat(this.getCharacterQualifiers(character.who));
    return tags.filter(function (tag) {
        return tag && /\S/.test(tag);
    });
};

Panel.prototype.getMustMatchTags = function (characterName) {
    var character = this.getCharacterByName(characterName);
    var result = [tagStore.TYPE_OBJECT, character.who];
    var characterQualifier = this.getCharacterQualifiers(character.who);
    if (characterQualifier.indexOf('hide') >= 0 && characterQualifier.indexOf('nohide') < 0) {
        result.push('hide');
    }
    return result;
};

Panel.prototype.getCharacterImage = function (characterName) {
    var character = this.getCharacterByName(characterName);
    if (!character.image || typeof character.image !== 'object') {
        if (this.hasSingleImageQualifier()) {
            character.image = tagStore.getBestMatch(this.getMustMatchTags('all'), this.getCharacterTags('all'));
        } else {
            character.image = tagStore.getBestMatch(this.getMustMatchTags(character.who), this.getCharacterTags(character.who));
        }
    }
    return character.image;
};

/**
 * @returns {string} The image name with all other URL stuff stripped off
 */
Panel.prototype.getCharacterImageName = function (characterName) {
    return this.getImageName(this.getCharacterImage(characterName));
};

/**
 * @returns {string} The image name with all other URL stuff stripped off
 */
Panel.prototype.getImageName = function (image) {
    var src = image.src,
        pos = {
            from: src.lastIndexOf("/") + 1,
            to: src.lastIndexOf('?')
        }
    return src.substring(pos.from, (pos.to > -1) ? pos.to : src.length);
};

Panel.prototype.resetImages = function () {
    delete this.bgrImg;
    for (var name in this.allCharacterList) {
        var character = this.allCharacterList[name];
        delete character.image;
    }
};

/**
 * Returns an object with character-name-properties associated with their default positions relative to the group (not to the panel).
 *
 * @returns {null|*}
 */
Panel.prototype.getCharactersDefaultPositions = function () {
    if (this.calcDefaultPositions || this.charactersDefaultPositions === null) {
        this.calcDefaultPositions = false;
        this.charactersDefaultPositions = {};
        var characterSize = this.bgr.defaults.characterWidth * this.getZoom();
        var characterNames = PlotParser.getCharacterNames(this.isBgrReverse());
        for (var i = 0; i < characterNames.length; i++) {
            var characterName = characterNames[i];
            var pos = {
                x: i * 2 * characterSize,
                y: 0,
                size: characterSize
            };
            this.charactersDefaultPositions[characterName] = pos;
        }
    }
    return this.charactersDefaultPositions;
};

/**
 * Returns an object with character-name-properties associated with their individual positions relative to the group (not to the panel).
 *
 * @returns {{character-name-1: {x: number, y: number, size: number}, character-name-2: {x: ... }}
 */
Panel.prototype.getCharactersIndividualPositions = function () {
    if (this.calcIndividualPositions || this.charactersIndividualPositions === null) {
        this.calcIndividualPositions = false;
        this.charactersIndividualPositions = {};
        this.charactersIndividualPositions = $.extend(true, {}, this.getCharactersDefaultPositions());

        var characterNames = PlotParser.getCharacterNames(this.isBgrReverse());
        for (var i = 0; i < characterNames.length; i++) {
            var characterName = characterNames[i];

            var pos = this.charactersIndividualPositions[characterName];

            // individual positions configured in the scene
            if (OPTIONS.PANEL.calcPos.individual.scene) {
                var characterPosition = this.scene.layoutGet.characterPosition() ? this.scene.layoutGet.characterPosition()[characterName] : null;
                pos = this.adjustCharacterPosition(pos, characterPosition);
            }

            // individual positions configured in the background
            if (OPTIONS.PANEL.calcPos.individual.bgr) {
                characterPosition = this.bgr.layoutGet.characterPosition() ? this.bgr.layoutGet.characterPosition()[characterName] : null;
                pos = this.adjustCharacterPosition(pos, characterPosition);
            }

            // individial positions configured in the panel are applied after Scene.fitBackgrounds(), to avoid interference with background positioning

            this.charactersIndividualPositions[characterName] = pos;
        }
    }

    return this.charactersIndividualPositions;
};

/**
 * Copies the positions from this.charactersIndividualPositions into this.actingCharacterPositions,
 * or - if no characters are acting in this panel - just returns a copy of charactersIndividualPositions.
 *
 * @returns actingCharacterPositions
 */
Panel.prototype.initActingCharactersPositions = function () {

    this.actingCharacterPositions = {};

    var characterNames = this.getActingCharacterNames();
    if (characterNames.length > 0) {
        for (var i = 0; i < characterNames.length; i++) {
            var name = characterNames[i];
            if (name !== OPTIONS.PANEL.calcPos.bbox.excludeCharacter) {
                if (this.getCharactersIndividualPositions().hasOwnProperty(name) && characterNames.indexOf(name) >= 0) {
                    this.actingCharacterPositions[name] = $.extend({}, this.getCharactersIndividualPositions()[name]);
                }
            }
        }
        return this.actingCharacterPositions;
    } else {
        // if no characters are acting in this scene use all characters
        return $.extend({}, true, this.getCharactersIndividualPositions());
    }
};

/**
 * Sets the property Panel.characterBackgroundPositions to each characters position in the panel.
 * First all acting* characters (* acting in this panel) are placed in the center of the panel
 * Second the offsets configured in characterPosition in the scene or a background are added.
 */
Panel.prototype.getCharactersBackgroundPositions = function () {

    if (this.calcBackgroundPositions || this.charactersBackgroundPositions === null) {
        this.calcBackgroundPositions = false;
        this.charactersBackgroundPositions = $.extend(true, {}, this.getCharactersIndividualPositions());

        var actingCharacterPositions = this.initActingCharactersPositions();
        var actingCharactersBBox = this.getCharactersBBox(actingCharacterPositions);
        var oldPos = {
            x: actingCharactersBBox.x,
            y: actingCharactersBBox.y
        };
        alignCentered(actingCharactersBBox, this.dim);

        // adjust character positions

        var allCharacters = PlotParser.getCharacterNames(this.isBgrReverse());
        for (var i = 0; i < allCharacters.length; i++) {
            var characterName = allCharacters[i];
            var pos = this.charactersBackgroundPositions[characterName];

            var adjust = {
                x: actingCharactersBBox.x - oldPos.x,
                y: actingCharactersBBox.y - oldPos.y,
                size: pos.size
            };

            // add offset configured in scene and set configured character size
            if (OPTIONS.PANEL.calcPos.all.scene) {
                adjust = this.adjustCharacterPosition(adjust, this.scene.layoutGet.characterPosition());
            }

            // add offset configured in background and set configured character size
            if (OPTIONS.PANEL.calcPos.all.bgr) {
                adjust = this.adjustCharacterPosition(adjust, this.bgr.layoutGet.characterPosition());
            }

            // add panning
            adjust = this.adjustCharacterPosition(adjust, this.getPan());

            pos.x += adjust.x;
            pos.y += adjust.y;
            pos.size *= adjust.size / pos.size;

            if (this.actingCharacterPositions[characterName]) {
                this.actingCharacterPositions[characterName] = pos;
            }
        }
    }

    return this.charactersBackgroundPositions;
};

Panel.prototype.getActingCharactersPositions = function () {
    this.getCharactersBackgroundPositions(); // will calculate actingCharacterPositions
    return this.actingCharacterPositions;
};

/**
 * The character positions configured in the panel are applied separately because they shouldn't affect background positioning.
 */
Panel.prototype.getCharactersPanelPositions = function () {
    if (this.calcPanelPositions || this.charactersPanelPositions === null) {
        this.calcPanelPositions = false;

        this.charactersPanelPositions = $.extend(true, {}, this.getCharactersBackgroundPositions());
        var self = this;
        $.each(PlotParser.getCharacterNames(this.isBgrReverse()), function (i, name) {

            // add offset configured in this panel for all characters
            if (OPTIONS.PANEL.calcPos.all.panel) {
                self.charactersPanelPositions[name] = self.adjustCharacterPosition(self.charactersPanelPositions[name], self.layoutGet.characterPosition());
            }

            // add offset configured in this panel for individual characters
            if (OPTIONS.PANEL.calcPos.individual.panel) {
                var characterPosition = self.layoutGet.characterPosition() ? self.layoutGet.characterPosition()[name] : null;
                self.charactersPanelPositions[name] = self.adjustCharacterPosition(self.charactersPanelPositions[name], characterPosition);
            }
        });
    }

    return this.charactersPanelPositions;
};

Panel.prototype.adjustCharacterPosition = function (pos, characterPosition) {
    if (characterPosition) {
        var characterSize = this.bgr.defaults.characterWidth * this.getZoom();
        var configuredSize = characterPosition.size ? characterPosition.size * pos.size : pos.size;
        return {
            x: pos.x + (characterPosition.x ? characterPosition.x * characterSize : 0) - (configuredSize - pos.size) / 2,
            y: pos.y + (characterPosition.y ? characterPosition.y * characterSize : 0) - (configuredSize - pos.size) / 2,
            size: configuredSize
        }
    }
    return pos;
};

Panel.prototype.getCharactersBBox = function (characterPositions) {

    var boundingBox = {};

    for (var name in characterPositions) {
        if (OPTIONS.PANEL.calcPos.bbox.excludeCharacter !== name) {
            var pos = characterPositions[name];
            boundingBox = {
                x1: typeof boundingBox.x1 === 'undefined' || boundingBox.x1 > pos.x ? pos.x : boundingBox.x1,
                y1: typeof boundingBox.y1 === 'undefined' || boundingBox.y1 > pos.y ? pos.y : boundingBox.y1,
                x2: typeof boundingBox.x2 === 'undefined' || boundingBox.x2 < pos.x + pos.size ? pos.x + pos.size : boundingBox.x2,
                y2: typeof boundingBox.y2 === 'undefined' || boundingBox.y2 < pos.y + pos.size ? pos.y + pos.size : boundingBox.y2
            }
        }
    }
    return {
        x: n0(boundingBox.x1),
        y: n0(boundingBox.y1),
        w: n0(boundingBox.x2) - n0(boundingBox.x1),
        h: n0(boundingBox.y2) - n0(boundingBox.y1)
    }
};

Panel.prototype.getCharactersDefaultBBox = function () {
    if (this.calcDefaultPositions || !this.charactersDefaultBBox) {
        this.charactersDefaultBBox = this.getCharactersBBox(this.getCharactersDefaultPositions());
    }
    return this.charactersDefaultBBox;
};

Panel.prototype.getCharactersBackgroundBBox = function () {
    if (this.calcBackgroundPositions || !this.charactersBackgroundBBox) {
        this.charactersBackgroundBBox = this.getCharactersBBox(this.getCharactersBackgroundPositions());
    }
    return this.charactersBackgroundBBox;
};

Panel.prototype.getActingCharactersBBox = function () {
    if (this.calcBackgroundPositions || !this.actingCharactersBBox) {
        this.actingCharactersBBox = this.getCharactersBBox(this.getActingCharactersPositions());
    }
    return this.actingCharactersBBox;
};

Panel.prototype.getCharactersPanelBBox = function () {
    if (this.calcPanelPositions || !this.charactersPanelBBox) {
        this.charactersPanelBBox = this.getCharactersBBox(this.getCharactersPanelPositions());
    }
    return this.charactersPanelBBox;
};

/**
 * Returns the bounding box of all acting characters except the specified one at their current positions.
 *
 * @param characterName
 * @returns {*}
 */
Panel.prototype.getOtherActingCharactersCurrentBBox = function (characterName) {
    var allActing = this.getActingCharactersPositions();
    var otherActing = {};
    for (var name in allActing) {
        if (name !== characterName) {
            otherActing[name] = allActing[name];
        }
    }
    return this.getCharactersBBox(otherActing);
};

/**
 * Returns the *centered* bounding box of all acting characters except the specified one.
 *
 * @param character
 * @returns {null|*}
 */
Panel.prototype.getOtherActingCharactersBBox = function (characterName) {
    this.calcBackgroundPositions = true;
    OPTIONS.PANEL.calcPos.bbox.excludeCharacter = characterName;
    var othersBBox = this.getCharactersBBox(this.getActingCharactersPositions());
    OPTIONS.PANEL.calcPos.bbox.excludeCharacter = null;
    return othersBBox;
};
