
;comicVM = (comicVM || {});

comicVM.LayoutGenerator = {

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
		}),

		_.each(pageStrips, function(layout, pageStrip) {
			_.each(pageStrip.letters, function(letter) {
				layout.pages.push(strips[letter]);
			});
		});
		
		// TODO leere Zeilen als Panel-Break zu plotItemCount dazurechnen

	}
};