class Transitions {

  constructor() {
    this.test = {
      empty: function(line) {
        return !line || !line.trim()
      },
      character: function(line) {
        var matchingCharacters = parser.getMatchingCharacters(line.trim(), characterNames);
        return (matchingCharacters && matchingCharacters.length > 0);
      },
      qualifier: function(line) {
        return line.match(/\(.*\)/i);
      },
      dialog: function(line) {
        return line.match(/^\s/);
      },
      description: function(line) {
        return typeof line === 'string';
      }
    };

    this.input = {
      empty: function(line) {},
      character: function(line) {
        var matchingCharacters = parser.getMatchingCharacters(line.trim(), characterNames);
        if (matchingCharacters && matchingCharacters.length > 0) {
          var who = matchingCharacters[0];
          var whoWith = matchingCharacters.slice(1);
          return {
            who: who,
            whoWith: whoWith,
            line: line
          };
        }
      },
      qualifier: function(line) {
        var qualifiers = line.match(/\(.+\)/i);
        if (qualifiers && qualifiers.length > 0) {
          return qualifiers[0].replace('(', '').replace(')', '');
        }
      },
      dialog: function(line) {
        return line.trim();
      },
      description: function(line) {
        return line.trim();
      }
    };


    this.definitions = function() {
      return [{
        type: INPUT_TYPE.empty,
        test: this.test.empty,
        input: this.input.empty
      },
        {
          type: INPUT_TYPE.character,
          test: this.test.character,
          input: this.input.character
        },
        {
          type: INPUT_TYPE.qualifier,
          test: this.test.qualifier,
          input: this.input.qualifier
        },
        {
          type: INPUT_TYPE.dialog,
          test: this.test.dialog,
          input: this.input.dialog
        },
        {
          type: INPUT_TYPE.description,
          test: this.test.description,
          input: this.input.description
        }
      ]
    }
  }
}
