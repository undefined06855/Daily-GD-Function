import { Temporal } from "@js-temporal/polyfill";
import * as jsc from "bun:jsc"

async function main() {
    console.log("Fetching codegen data...");
    let res = await fetch("https://prevter.github.io/bindings-meta/CodegenData-2.2081.json");
    let data = (await res.json()).classes;
    let functions = [];
    let classes = [];

    for (let classData of data) {
        let split = classData.name.split("::");
        let namespace, className;
        if (split.length == 2) {
            namespace = split[0];
            className = split[1];
        } else {
            namespace = "";
            className = split[0];
        }

        for (let functionData of classData.functions) {
            functions.push({
                ...functionData,
                namespace, className
            });
        }

        classes.push(className);
    }

    let port = process.env.PORT ?? 443;

    function searchParamIsValid(param) {
        if (!param) return false;
        if (isNaN(Number(param))) return false;
        if (Number(param) <= 0) return false;
        return true;
    }

    Bun.serve({
        routes: {
            "/": async () => {
                return new Response(await Bun.file("public/index.html").text(), { headers: { "Content-Type": "text/html" } });
            },

            "/today": async req => {
                let params = new URL(req.url).searchParams;
                let days = ~~(searchParamIsValid(params.get("day")) ? Number(params.get("day")) : Temporal.Now.instant().since(Temporal.Instant.from("2026-04-17T00:00Z")).total("days"));

                jsc.setRandomSeed(Number(Bun.hash(days.toString())));
                let index = ~~(Math.random() * functions.length);
                let today = functions[index];

                return new Response(JSON.stringify({ today, classes, index, days }), { headers: { "Content-Type": "application/json" } });
            },

            "/style.css": Bun.file("public/style.css"),
            "/favicon.svg": Bun.file("public/favicon.svg"),

            "/dt.js": Bun.file("public/dt.js"),

            // allow top level await
            "/main.js": async () => new Response(`!(async () => { ${await Bun.file("public/main.js").text()} })();`, { headers: { "Content-Type": "application/json" } }),
        },

        port: port
    });

    console.log(`Hosting Daily GD Function on port ${port}`);
}

main();
