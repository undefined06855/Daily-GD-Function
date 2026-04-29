// requires history to be defined

const main = document.querySelector("main");
const scroll = document.querySelector("#scroll");
const shadowTop = document.querySelector("#top-shadow");
const shadowBottom = document.querySelector("#bottom-shadow");
const supportsTemporal = typeof Temporal !== "undefined";

let day = 1;
for (let data of history) {
    let nameWrapper = $`div.name-wrapper`();
    if (data.namespace != "") {
        nameWrapper.appendChild($`span.namespace-name`(data.namespace));
        nameWrapper.appendChild($`span.white`("::"));
    }

    nameWrapper.appendChild($`span.type-class`(data.className));
    nameWrapper.appendChild($`span.white`("::"));

    nameWrapper.appendChild($`span.function-name`(data.name));

    let url = new URL(window.location.href);
    url.pathname = day.toString();

    let date = $`div.white.date`();

    if (supportsTemporal) {
        let now = Temporal.Instant.from(data.date).toZonedDateTimeISO("UTC").toPlainDate();
        let toOrdinal = n => n + (["th", "st", "nd", "rd"][(n % 100 - 20) % 10] || ["th", "st", "nd", "rd"][n % 100] || "th");
        date.innerText = `${toOrdinal(now.day)} ${new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(now)}`;
    }

    scroll.appendChild($`a.day`(
        $`div.white`(`#${day}`),
        nameWrapper,
        date
    ).$({
        href: url.href
    }));

    day += 1;
}

scroll.addEventListener("scroll", () => {
    if (scroll.scrollTop == 0) {
        shadowTop.style.display = "none";
    } else {
        shadowTop.style.display = "";
    }

    if (scroll.scrollTop == (scroll.scrollHeight - scroll.offsetHeight)) {
        shadowBottom.style.display = "none";
    } else {
        shadowBottom.style.display = "";
    }
});

shadowTop.style.display = "none";
if (scroll.scrollHeight - scroll.offsetHeight == 0) {
    shadowBottom.style.display = "none";
}

main.classList.remove("no-javascript");
