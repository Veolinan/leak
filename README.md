# LeakInspector 🎇

LeakInspector is an add-on that warns and protects against personal data exfiltration. We developed LeakInspector to help publishers and end-users to audit third parties that harvest personal information from online forms without their knowledge or consent.

It has the following features:
 1. Blocks requests containing personal data extracted from the web forms and highlights related form fields by showing add-on's icon.
 2. Logs technical details of the detected sniff and leak attempts to console to enable technical audits. The logged information includes the value and XPath of the sniffed input element, the origin of the sniffer script, and details of the leaky request such as the URL and the POST data.
 3. A user interface where recent sniff and leak attempts are listed, along with the tracker domain, company and tracker category. The user interface module is based on code taken from [DuckDuckGo’s Privacy Essentials add-on](https://chrome.google.com/webstore/detail/duckduckgo-privacy-essent/bkdgflcldnnnapblkhphbgpggdiikppg?hl=en).
 

