function getAutofillElements() {
  const inputEls = Array.from(document.getElementsByTagName("input"));
  const autofillResultsByForms = FormAutofillHeuristics.getFormInfo(inputEls, false);
  return autofillResultsByForms.flatMap((form) => {
    const elements = form.fieldDetails.map((formEl) => ({ ...formEl }));
    const shownElements = elements.map((el) => ({
      fieldName: el.fieldName,
      element: el.element,
      isShown: isShown(el.element),
    }));
    return shownElements;
  });
}

function _hasLabelMatchingRegex(element, regex) {
  if (element.labels && element.labels.length) {
    for (const label of element.labels) {
      if (regex.test(label.textContent)) {
        return true;
      }
    }
  }

  return false;
}

function isInferredUsernameField(element) {
  const expr =
    /user\.name|username|display\.name|displayname|user\.id|userid|screen\.name|screenname|benutzername|benutzer\.name|nickname|profile\.name|profilename/i;

  if (element.autocomplete && element.autocomplete.fieldName === "username") {
    return true;
  }

  if (
    _elementAttrsMatchRegex(element, expr) ||
    _hasLabelMatchingRegex(element, expr)
  ) {
    return true;
  }

  return false;
}

function _elementAttrsMatchRegex(element, regex) {
  if (
    regex.test(element.id) ||
    regex.test(element.name) ||
    regex.test(element.className)
  ) {
    return true;
  }

  const placeholder = element.getAttribute("placeholder");
  if (placeholder && regex.test(placeholder)) {
    return true;
  }

  return false;
}

function getUsernameFields() {
  const inputElements = document.getElementsByTagName("input");
  return Array.from(inputElements)
    .filter(isInferredUsernameField)
    .map((element) => ({
      fieldName: "username",
      element,
      isShown: isShown(element),
    }));
}

function getPasswordFields() {
  return [...document.querySelectorAll("input[type=password]")].map((element) => ({
    fieldName: "password",
    element,
    isShown: isShown(element),
  }));
}

function getEmailsByFathom() {
  try {
    return [...detectEmailInputs(document)].map((element) => ({
      fieldName: "email",
      element,
      isShown: isShown(element),
    }));
  } catch (error) {
    console.log(`Error occured while finding email elements: ${error.message}`);
    return [];
  }
}

function getAllPIIFields(isShown) {
  const autofillFields = getAutofillElements();
  const usernameFields = getUsernameFields();
  const emailFieldsByFathom = getEmailsByFathom();
  const passwordFields = getPasswordFields();

  const allPIIFields = [
    ...autofillFields,
    ...usernameFields.filter(
      (obj) => autofillFields.map((el) => el.element).indexOf(obj.element) === -1
    ),
    ...emailFieldsByFathom.filter(
      (obj) =>
        allPIIFields.map((el) => el.element).indexOf(obj.element) === -1
    ),
    ...passwordFields,
  ];

  return isShown ? allPIIFields.filter((element) => element.isShown) : allPIIFields;
}
