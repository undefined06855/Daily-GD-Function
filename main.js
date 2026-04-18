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
            "/": async req => {
                let template = await Bun.file("index.html").text();
                let functionNumber = Temporal.Now.plainDateISO().since(Temporal.PlainDate.from("2026-04-14"), { largestUnit: "days" });

                let days = functionNumber.total("days");
                jsc.setRandomSeed(Number(Bun.hash(days.toString())));
                let index = ~~(Math.random() * functions.length);
                let todayFunction = functions[index];

                return new Response(
                    template.replace("/* filled by server */", `today=${JSON.stringify(todayFunction)}; classes=${JSON.stringify(classes)}; index=${index}; days=${days}; `),
                    {
                        headers: { "Content-Type": "text/html" }
                    }
                );
            },

            "/style.css": Bun.file("style.css"),
            "/favicon.svg": Bun.file("favicon.svg")
        },

        port: process.env.PORT ?? 2002
    });

    console.log(`Hosting Daily GD Function on port ${process.env.PORT ?? 2002}`);
}

main();
