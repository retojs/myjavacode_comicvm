VisualVM.PanelPlayer = {

	song: null,
	story: null,
	transitions: null,  // list of transition objects

	getnew: function(song, story, transitions) {
	
	}

	Transition: {
		
		TYPE: {
			CUT: 'CUT', 
			BLEND: 'BLEND'
		},

		getnew: function(type, duration) {
			return {
				timestamp: new Date(),
				type: type,
				duration: duration
			};
		},
		
		push: function(transition) {
			transitions.push(transition);
		},
  		
		pop: function() {
			return transitions.pop();
		}
	},
	
	play: function() {
	
	}
	
}
