class Automaton {

    constructor() {
        this.transitions = new Transitions().definitions;
        this.states      = {
            DEFAULT  : new DefaultState(this),
            EMPTY    : new EmptyState(this),
            CHARACTER: new CharacterState(this)
        }
    }

    execute(plotContent) {
        var nextState   = this.states.DEFAULT;
        var transitions = new Transitions();

        plotContent.split('\n').forEach(function (i, line) {
            transitions.definitions().forEach(function (transition) {
                if (transition.test(line)) {
                    nextState = nextState.next(transition.type, transition.input(line));
                }
            });
        });
    }
}
