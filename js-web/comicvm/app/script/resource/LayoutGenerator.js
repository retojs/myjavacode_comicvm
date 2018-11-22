
;comicVM = (comicVM || {});

comicVM.LayoutGenerator = {

	pages: [],

	/**
	* Generates the JSON from the plot text
	*/
	fromPlotItems: function(plotitems) {
		var page = [];	
		var strip = [];
		page.push(strip);	
	    this.pages.push(page);
	
		plot.split('\n')
		.map(function(line){
			if (line.trim() === '][') {
				return 'page break';
			}
			if (line === '') {
				return 'strip break';
			}
			return line;
		})
		.each(function(line) {
			switch (line) {
				case 'page break':
					pageBreak();
					break;
				case 'strip break':
					if (page.length === 3) { // new page after 3 strips
						pageBreak();
					}	
					stripBreak();
					break;
				default:
					strip.push(line);
			}
		});
		
		this.pages.each(function(page){
			page.each(function(strip){
				this.createPanels(strip);
			});
		});

		function pageBreak() {
				page = [];
				pages.push(page);
		}

		function stripBreak() {
				strip = [];
				page.push(strip);
		}
	},

	createPanels: function(strip){
		if (strip.length < 2) {
			strip.push([strip.length]);
		} else if (strip.length % 2 === 0) {
			strip.push([strip.length / 2]);
			strip.push([strip.length / 2]);
		} else {
			var min = strip.length - (strip.length % 3) / 3;
			if (strip.length % 3 === 0) {
				strip.push.apply(strip, [min], [min], [min]);
			} else if (strip.length % 3 === 1) {
				strip.push.apply(strip, [min], [min + 1], [min]);
			} else {
				strip.push.apply(strip, [min+ 1], [min], [min + 1]);
			}
		}
	},
	
	// first idea, not purely default

	default: {
		getStrips: function() {
			return {
				A: [[1],[1],[1]],
				B: [[3]],
				C: [[2],[2]],
				A2: [{wPanels:[0.25, 0.5, 0.25]},[1],[1],[1]],
			};
		},
		
		getPages: function() {
			return [
				"A B A",
				"C B C",
				"C A B",
				[{hStrips: [0.6, 0.4]}, "B", "C"]
			];
		},
		
		getLayout: function() {
			return {
				layoutProperties: [
					"plotItemCount", 
					"bgrQualifier",
					"characterQualifier",
					"characterPositions",
					"zoom",
					"pan"
				],
				pages: [],
				backgrounds: {},
				scene: {}
			};
		}
	},
		
	gen: function(pattern) {
		var strips = pattern.strips || this.default.getStrips(),
		pages = pattern.pages || this.default.getPages(),
		layout = pattern.layout || this.default.getLayout(),

		pageStrips = _.map(pages, function(page){
			var pageStrip = {
				page: page
			};
			
			if (page.isArray()) {
				pageStrip.letters = _.filter(page, function(letter){
					return typeof letter === 'string';
				});
			} else if (typeof page === 'string') {
				pageStrip.letters = page.split(/\n/);
			}
			
			return pageStrip;
		});

		_.each(pageStrips, function(layout, pageStrip) {
			_.each(pageStrip.letters, function(letter) {
				layout.pages.push(strips[letter]);
			});
		});
		
		// TODO leere Zeilen als Panel-Break zu plotItemCount dazurechnen

	}
};