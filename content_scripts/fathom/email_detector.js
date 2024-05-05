import {
  Element,
  Ruleset,
  Rule,
  Score,
  Out,
  FNode,
  Type,
  Dom,
  IsVisible,
  Utils,
} from 'fathom-core';

const { isVisible } = Utils;

/**
 * Returns the number of occurrences of a string or regex in another string.
 */
function numRegexMatches(regex: RegExp, str: string | null): number {
  if (str === null) {
    return 0;
  }
  return (str.match(regex) || []).length;
}

/**
 * Returns true if at least one attribute of `element` (from a given list of
 * attributes `attrs`) match `regex`. Use a regex that matches the entire line
 * to test only exact matches.
 */
function attrsMatch(element: Element, attrs: string[], regex: RegExp): boolean {
  return attrs.some((attr) => regex.test(element.getAttribute(attr) || ''));
}

/**
 * Tries to find a <label> element in the form containing `element` and return
 * the number of matches for the given regex in its inner text.
 */
function labelForInputMatches(element: Element, regex: RegExp): boolean {
  // First check for labels correctly associated with the <input> element
  for (const label of Array.from(element.labels || [])) {
    if (numRegexMatches(regex, label.innerText) > 0) {
      return true;
    }
  }

  // Then check for a common mistake found in the training set: using the
  // <input>'s `name` attribute instead of its `id` to associate with a label
  const form = element.form;
  if (form !== null && element.name.length > 0) {
    for (const label of Array.from(form.getElementsByTagName('label') || [])) {
      if (
        label.htmlFor.length > 0 &&
        label.htmlFor === element.name &&
        numRegexMatches(regex, label.innerText) > 0
      ) {
        return true;
      }
    }
  }

  return false;
}

const emailRegex = /email|e-mail/gi;
const emailRegexMatchLine = /^(email|e-mail)$/i;

const emailDetectorRuleset = Ruleset<Dom, Type, Score, Out, FNode>(
  [
    Rule(
      Dom('input[type=text],input[type=""],input:not([type])').when(isVisible),
      Type('email')
    ),

    Rule(
      Type('email'),
      Score((fnode) =>
        attrsMatch(fnode.element, ['id', 'name', 'autocomplete'], emailRegexMatchLine)
      ),
      { name: 'inputAttrsMatchEmailExactly' }
    ),

    Rule(
      Type('email'),
      Score((fnode) =>
        attrsMatch(fnode.element, ['placeholder', 'aria-label'], emailRegex)
      ),
      { name: 'inputPlaceholderMatchesEmail' }
    ),

    Rule(
      Type('email'),
      Score((fnode) =>
        labelForInputMatches(fnode.element, emailRegex)
      ),
      { name: 'labelForInputMatchesEmail' }
    ),

    Rule(Type('email'), Out('email')),
  ],
  new Map<string, number>([
    ['inputAttrsMatchEmailExactly', 9.416913986206055],
    ['inputPlaceholderMatchesEmail', 6.740292072296143],
    ['labelForInputMatchesEmail', 10.197700500488281],
  ]),
  [['email', -3.907843589782715]]
);

function* detectEmailInputs(domRoot: Dom): Generator<Element, void, unknown> {
  // First return <input type='email'>
  const typeEmailInputs = Array.from(
    domRoot.querySelectorAll('input[type="email"]')
  );
  for (const input of typeEmailInputs) {
    yield input;
  }

  // Then run ruleset and return detected fields
  const detectedInputs = emailDetectorRuleset.against(domRoot).get('email');
  for (const input of detectedInputs) {
    if (input.scoreFor('email') > 0.5) {
      yield input.element;
    }
  }
}
