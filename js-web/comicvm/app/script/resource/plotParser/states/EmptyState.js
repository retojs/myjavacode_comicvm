class EmptyState extends DefaultState {

  constructor(automaton) {
    super(automaton);
  }

  onEmpty() {
    parser.parsed.currentPlotItem.extend({
      layout: 'strip break'
    });
    return this.automaton.states.DEFAULT;
  }

  onDescription(line) {
    if (line.trim() === '---') {
      parser.parsed.currentPlotItem.extend({
        layout: 'page break'
      });
      return this.automaton.states.DEFAULT;
    } else {
      return super.onDescription();
    }
  }
}
