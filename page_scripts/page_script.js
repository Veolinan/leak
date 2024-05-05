let minLogoPath;

function sendMessageToContentScript(message, eventName) {
  try {
    document.dispatchEvent(
      new CustomEvent(eventName, { detail: message })
    );
  } catch (error) {
    console.error("Error dispatching event: ", error);
  }
}

document.addEventListener("modifyInputElementSetterGetter", (e) => {
  const { detail: inputElement } = e;
  if (!inputElement) {
    console.error("Input element not found");
    return;
  }

  const realHTMLInputElement = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value"
  );

  if (!realHTMLInputElement) {
    console.error("Real HTML input element not found");
    return;
  }

  Object.defineProperty(inputElement, "value", {
    enumerable: true,
    configurable: true,
    set: realHTMLInputElement.set,
    get: function () {
      const elValue = realHTMLInputElement.get.call(this);
      const xpath = getXPath(inputElement);
      const fieldName = inputElement.getAttribute("leaky-field-name");
      const stack = new Error().stack.split("\n");
      stack.shift();

      let response;
      switch (true) {
        case stack.length > 1 && stack[1].startsWith('    at HTMLInputElement.recordInput (chrome-extension://'):
        case stack.length > 1 && stack[1].startsWith('    at HTMLInputElement.recordInput (moz-extension://'):
          return elValue;
        default:
          const timeStamp = Date.now();
          let sniffValue = elValue;

          if (fieldName === "password") {
            sniffValue = elValue.replace(/./g, "*");
          }

          sendMessageToContentScript(
            { elValue: sniffValue, xpath, fieldName, stack, timeStamp },
            "inputSniffed",
            ({ leakedField }) => {
              if (leakedField) {
                highlightInputField(inputField, leakedField);
              }
            }
          );

          return elValue;
      }
    },
  });
});

function getXPath(el) {
  try {
    if (typeof el === "string") {
      return document.evaluate(el, document, null, 0, null);
    }
    if (!el || el.nodeType !== 1) {
      return "";
    }
    if (el.id) {
      return `//*[@id='${el.id}']`;
    }
    const elTagName = el.tagName;
    const sames = Array.from(el.parentNode.children).filter(
      (x) => x.tagName === elTagName
    );
    return (
      getXPath(el.parentElement) +
      `/${elTagName.toLowerCase()}${sames.length > 1 ? `[${sames.indexOf(el) + 1}]` : ""}`
    );
  } catch (error) {
    console.error("Exception occured while getting xpath of element.", el);
    return "";
  }
}

function highlightInputField(inputField, leakedField) {
  if (minLogoPath && inputField.style) {
    if (!inputField.style.background.includes('icons/logo_min.png')) {
      inputField.style.background = `url("${minLogoPath}") 97.25% 10px no-repeat`;
    }
  }
}

document.addEventListener("passMinLogoPath", (e) => {
  minLogoPath = e.detail;
});

function getElementByXpath(xpath) {
  return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

