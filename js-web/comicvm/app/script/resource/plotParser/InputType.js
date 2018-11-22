const INPUT_TYPE = {
    empty      : 0,
    character  : 1, // starting with one of the declared characters
    qualifier  : 2, // in parentheses ( )
    dialog     : 3, // line starting with white-space
    description: 4  // none of the above
};
