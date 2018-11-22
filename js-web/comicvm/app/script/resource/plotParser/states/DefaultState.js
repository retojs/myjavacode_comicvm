class DefaultState {

  constructor(automaton) {
    this.automaton = automaton;

    this.transitions = _.object ([
      [INPUT_TYPE.empty, this.onEmpty],
      [INPUT_TYPE.qualifier, this.onQualifier],
      [INPUT_TYPE.dialog, this.onDialog],
      [INPUT_TYPE.character, this.onCharacter],
      [INPUT_TYPE.description, this.onDescription]
    ]);
  }

  next(type, input) {
    return this.transitions[type](input);
  }

  onEmpty() {
    return this.automaton.states.EMPTY;
  }
  /**
   * @param input { who: acting character name
   *                whoWith: acting characters with no line of text
   *                line: the whole parsed line containing the character declaration
   *              }
   * @returns state CHARACTER
   */
  onCharacter(input) {
    var item = parser.parsed.currentPlotItem;
    if (!item || !item.who || item.action) { // create a new plot item if (a) none exists or (b) it has no acting character or (c) it has an action already
      parser.addPlotItem({
        who: input.who,
        whoWith: input.whoWith.length > 0 ? input.whoWith : undefined,
        actionType: input.line.indexOf(':') > 0 ? PlotItem.ACTION_TYPE.says : PlotItem.ACTION_TYPE.does,
        action: input.line.indexOf(':') > 0 ? undefined : input.line
      });
    } else {
      item.extend({
        who: input.who,
        whoWith: input.whoWith.length > 0 ? input.whoWith : undefined
      });
    }

    return this.automaton.states.CHARACTER;
  }

  onDescription(line) {
    parser.addPlotItem({
      desc: line.trim()
    });

    return this.automaton.states.DEFAULT;
  }

  onQualifier() {
    return this;
  }

  onDialog() {
    return this;
  }
}
