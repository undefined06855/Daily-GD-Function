// requires functionData, classes, functionIndex, functionDate, functionDay to be defined

const main = document.querySelector("main");
const functionClassWrapper = document.querySelector("#class-name");
const functionClassNameSeparator = document.querySelector("#class-function-double-colon");
const functionNameWrapper = document.querySelector("#function-name");
const copyButton = document.querySelector("#copy-button");
const functionParamsWrapper = document.querySelector("#function-params");
const functionReturnWrapper = document.querySelector("#function-return");
const functionNumberWrapper = document.querySelector("#function-number");
const addressesWrapper = document.querySelector("#addresses");
const footer = document.querySelector("#footer-content");
const supportsTemporal = typeof Temporal !== "undefined";

/**
 * @param {string} typeString
 * @param {string} [paramName=""]
 * @returns {HTMLSpanElement}
 */
function createType(typeString, paramName = "") {
    let [ namespace, name, third ] = typeString.split("::");
    let secondary;
    if (third) {
        secondary = name;
        name = third;
    }

    if (!name) {
        name = namespace;
        namespace = undefined;
    }

    const match = name.match(/^(.*?)([*&]+)?$/);
    const type = match[1];
    const suffixes = match[2] ? match[2].split('') : [];

    let wrapper = $`span`();

    if (namespace) {
        wrapper.appendChild($`span.namespace-name`(...breakOnCamelCase(namespace)));
        wrapper.appendChild($`span.white`("::"));
    }

    if (secondary) {
        wrapper.appendChild($`span.type-class`(...breakOnCamelCase(secondary)));
        wrapper.appendChild($`span.white`("::"));
    }

    let className;
    if (namespace) className = "type-class";
    else className = classes.includes(type) ? "type-class" : "type-generic";
    wrapper.appendChild($`span.${className}`(...breakOnCamelCase(type)));

    for (let suffix of suffixes) {
        wrapper.appendChild($`span.white`(suffix));
    }

    wrapper.appendChild($`span`("\u00A0"));
    wrapper.appendChild($`span.white`(...breakOnCamelCase(paramName)));

    return wrapper;
}

/**
 * @param {string} typeString
 * @returns {Array<(Text|HTMLWBRElement)>}
 */
function breakOnCamelCase(typeString) {
    let ret = [];

    let currentSlice = "";
    for (let char of typeString.split("")) {
        if (char.toUpperCase() == char) {
            ret.push(document.createTextNode(currentSlice));
            ret.push($`wbr`());
            currentSlice = "";
        }

        currentSlice += char;
    }

    ret.push(document.createTextNode(currentSlice));

    return ret;
}

let fullClassName = functionData.className;
if (functionData.namespace != "") {
    fullClassName = `${functionData.namespace}::${fullClassName}`;
}

if (functionData.const) functionReturnWrapper.appendChild(createType("const"));
if (functionData.static) functionReturnWrapper.appendChild(createType("static"));
if (functionData.virtual) functionReturnWrapper.appendChild(createType("virtual"));
if (functionData.kind != "normal") functionReturnWrapper.appendChild(createType(`(${functionData.kind})`));
functionReturnWrapper.appendChild(createType(functionData.return));

if (functionData.namespace != "") {
    functionClassWrapper.appendChild($`span.namespace-name`(...breakOnCamelCase(functionData.namespace)));
    functionClassWrapper.appendChild($`span.white`("::"));
}

functionClassWrapper.appendChild($`span.type-class`(...breakOnCamelCase(functionData.className)));
functionClassNameSeparator.appendChild($`span.white`("::"));
functionNameWrapper.appendChild($`span.function-name`(...breakOnCamelCase(functionData.name)));
functionClassWrapper.href = `https://docs.geode-sdk.org/classes/${fullClassName.replaceAll("::", "/")}`;
functionNameWrapper.href = `https://docs.geode-sdk.org/classes/${fullClassName.replaceAll("::", "/")}#${functionData.name}`;

let timeout;
copyButton.addEventListener("click", () => {
    navigator.clipboard.writeText(`${fullClassName}::${functionData.name}`);
    copyButton.style.backgroundImage = "url(static/check.png)";
    clearTimeout(timeout);
    timeout = setTimeout(() => {
        copyButton.style.backgroundImage = "";
    }, 1500);
});

if (functionData.args.length == 0 && functionData.overloads == 0) {
    functionParamsWrapper.remove();
} else {
    for (let arg of functionData.args) {
        functionParamsWrapper.appendChild(
            createType(arg.type, arg.name)
                .$({
                    classList: [ "param" ]
                })
        );
    }

    if (functionData.overloads > 0) {
        functionParamsWrapper.appendChild(
            createType(`+${functionData.overloads}`, `overload${functionData.overloads == 1 ? "" : "s"}`)
                .$({
                    classList: [ "param" ],
                    id: "overloads"
                })
        );
    }
}

function generateAnchorSource(content) {
    let url = new URL(window.location.href);
    url.pathname = functionDay.toString();
    return `<a href="${url.href}">${content}</a>`;
}

if (supportsTemporal) {
    let now = Temporal.Instant.from(functionDate).toZonedDateTimeISO("UTC").toPlainDate();
    let toOrdinal = n => n + (["th", "st", "nd", "rd"][(n % 100 - 20) % 10] || ["th", "st", "nd", "rd"][n % 100] || "th");
    const dateString = `${toOrdinal(now.day)} ${new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(now)}`;
    functionNumberWrapper.innerHTML = generateAnchorSource(`Function #${functionIndex} on ${dateString} (#${functionDay})`);
} else {
    functionNumberWrapper.innerHTML = generateAnchorSource(`Function #${functionIndex} (#${functionDay})`);
}

for (let [ platform, address ] of Object.entries(functionData.bindings)) {
    if (!address) continue;

         if (address == "link") address = "(linked)";
    else if (address == "inline") address = "(inlined)";
    else if (address == "rebind") address = "(rebinded)";
    else if (address == "missing") address = "(missing)";
    else address = `0x${address.toString(16)}`;

    addressesWrapper.appendChild(
        $`div.address.${platform}`(
            $`div.address-platform`(platform),
            $`div.address-offset`(address)
        )
    );
}

function updateFooter() {
    if (!supportsTemporal) return;

    let now = Temporal.Now.instant().toZonedDateTimeISO("UTC");

    let tomorrowAtMidnight = now
        .add({ days: 1 })
        .with({ hour: 0, minute: 0, second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 });

    let diff = now.until(tomorrowAtMidnight, { largestUnit: "hours" });

    footer.innerHTML = `
        New function in
        ${diff.hours} hour${diff.hours == 1 ? "" : "s"},
        ${diff.minutes} minute${diff.minutes == 1 ? "" : "s"} and
        ${diff.seconds} second${diff.seconds == 1 ? "" : "s"}.
    `;

    if (diff.hours == 0 && diff.minutes == 0 && diff.seconds == 0) {
        window.location.reload();
    }
}

setInterval(updateFooter, 1000);
updateFooter();

main.classList.remove("no-javascript");
