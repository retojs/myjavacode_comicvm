class CharacterState extends DefaultState {

  constructor(automaton) {
    super(automaton);
  }

  onQualifier(qualifierStr) {
    var item = parser.parsed.currentPlotItem;
    var qualifiers = [];

    $.each(qualifierStr.split(','), function(i, qualifierStr) {
      if (qualifierStr.indexOf(':') >= 0) {
        // a name is specified for this qualifier ("name:qualifier")
        qualifiers.push(parseNamedQualifier(qualifierStr));
      } else {
        // no name is specified for this qualifier, so it is associated with the plotitem's subject
        qualifiers.push({
          who: item.who,
          how: qualifierStr.trim()
        });
      }
    });

    item.extend({
      qualifiers: qualifiers
    });

    return this.states.CHARACTER;

    function parseNamedQualifier(qualifierStr) {
      // current qualifier is assigned to a name like
      var qualifier = qualifierStr.substr(qualifierStr.indexOf(':') + 1).trim();
      var name = qualifierStr.substr(0, qualifierStr.indexOf(':')).trim();
      return {
        who: name,
        how: qualifier
      };
    }
  }

  onDialog(line) {
    var item = parser.parsed.currentPlotItem;
    if (item.action) {
      // create a new plot item for each new line...
      parser.addPlotItem({
        who: item.who,
        how: item.how,
        whoWith: item.whoWith,
        actionType: item.actionType,
        action: line,
        qualifiers: item ? item.qualifiers : undefined
      });
    } else {
      // ...but append the first line after a character declaration to the existing plot item
      item.extend({
        action: line
      });
    }

    return this.states.CHARACTER;
  }
}
