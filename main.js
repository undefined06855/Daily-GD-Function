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

    Bun.serve({
        routes: {
            "/": async () => {
                return new Response(await Bun.file("index.html").text(), { headers: { "Content-Type": "text/html" } });
            },

            "/today": async req => {
                let params = new URL(req.url).searchParams;
                let days = ~~(params.has("day") ? Number(params.get("day")) : Temporal.Now.instant().since(Temporal.Instant.from("2026-04-17T00:00Z")).total("days"));

                jsc.setRandomSeed(Number(Bun.hash(days.toString())));
                let index = ~~(Math.random() * functions.length);
                let today = functions[index];

                return new Response(`let today=${JSON.stringify(today)}; classes=${JSON.stringify(classes)}; index=${index}; days=${days}; `)
            },

            "/style.css": Bun.file("style.css"),
            "/favicon.svg": Bun.file("favicon.svg")
        },

        port: process.env.PORT ?? 443
    });

    console.log(`Hosting Daily GD Function on port ${process.env.PORT ?? 443}`);
}

main();
