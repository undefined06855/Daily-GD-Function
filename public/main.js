const searchParamsDay = new URL(window.location.href).searchParams.get("day");
const res = await fetch(`/today${searchParamsDay ? `?day=${searchParamsDay}` : ""}`);
const data = await res.json();

const today = data.today;
const classes = data.classes;
const index = data.index;
const days = data.days;

const functionNameWrapper = document.querySelector("#function-name");
const functionParamsWrapper = document.querySelector("#function-params");
const functionReturnWrapper = document.querySelector("#function-return");
const functionNumberWrapper = document.querySelector("#function-number");
const addressesWrapper = document.querySelector("#addresses");
const footer = document.querySelector("footer");
const supportsTemporal = typeof Temporal !== "undefined";

/**
 * @param {string} typeString
 * @param {string} paramName
 */
function createType(typeString, paramName = "") {
    let [ namespace, name ] = typeString.split("::");
    if (!name) {
        name = namespace;
        namespace = "";
    }

    const match = name.match(/^(.*?)([*&]+)?$/);
    const type = match[1];
    const suffixes = match[2] ? match[2].split('') : [];

    let wrapper = $`span`();

    wrapper.appendChild($`span.namespace-name`(namespace));
    if (namespace != "") wrapper.appendChild($`span.white`("::"));

    let className;
    if (namespace != "") className = "type-class";
    else className = classes.includes(type) ? "type-class" : "type-generic";
    wrapper.appendChild($`span.${className}`(type));

    for (let suffix of suffixes) {
        wrapper.appendChild($`span.white`(suffix));
    }

    wrapper.appendChild($`span`("\u00A0"));
    wrapper.appendChild($`span.white`(paramName));

    return wrapper;
}

if (today.const) functionReturnWrapper.appendChild(createType("const"));
if (today.static) functionReturnWrapper.appendChild(createType("static"));
if (today.virtual) functionReturnWrapper.appendChild(createType("virtual"));
functionReturnWrapper.appendChild(createType(today.return));

if (today.namespace != "") {
    functionNameWrapper.appendChild($`span.namespace-name`(today.namespace));
    functionNameWrapper.appendChild($`span.white`("::"));
}

functionNameWrapper.appendChild($`span.type-class`(today.className));
functionNameWrapper.appendChild($`span.white`("::"));
functionNameWrapper.appendChild($`span.function-name`(today.name));

for (let arg of today.args) {
    let wrapper = createType(arg.type, arg.name);
    wrapper.classList.add("param");
    functionParamsWrapper.appendChild(wrapper);
}

function generateAnchorSource(content) {
    let url = new URL(window.location.href);
    url.searchParams.set("day", days);
    return `<a href="${url.href}">${content}</a>`;
}

if (supportsTemporal) {
    let now = Temporal.Now.instant().toZonedDateTimeISO("UTC").toPlainDate();
    let toOrdinal = n => n + (["th", "st", "nd", "rd"][(n % 100 - 20) % 10] || ["th", "st", "nd", "rd"][n % 100] || "th");
    const dateString = `${toOrdinal(now.day)} ${new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(now)}`;
    functionNumberWrapper.innerHTML = generateAnchorSource(`Function #${index} on ${dateString} (#${days})`);
} else {
    functionNumberWrapper.innerHTML = generateAnchorSource(`Function #${index} (#${days})`);
}

for (let [ platform, address ] of Object.entries(today.bindings)) {
    if (!address) continue;

    if (address == "link") address = "(linked)";
    else if (address == "inline") address = "(inlined)";
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
