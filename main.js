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
            "/": async req => {
                let [template, dt, source] = await Promise.all([
                    Bun.file("public/index.html").text(),
                    Bun.file("public/dt.js").text(),
                    Bun.file("public/main.js").text()
                ]);

                let params = new URL(req.url).searchParams;
                let usingSearchParam = searchParamIsValid(params.get("day"));
                let firstDay = Temporal.Instant.from("2026-04-17T00:00Z");
                let functionDay = ~~(usingSearchParam ? Number(params.get("day")) : Temporal.Now.instant().since(firstDay).total("days"));
                let functionDate = firstDay.add({ hours: 24 * functionDay }).toString();

                jsc.setRandomSeed(Number(Bun.hash(functionDay.toString())));
                let functionIndex = ~~(Math.random() * functions.length);
                let functionData = functions[functionIndex];

                template = template.replace("{{dt}}", () => dt);
                template = template.replace("{{source}}", () => source);

                if (usingSearchParam) {
                    template = template.replaceAll("{{description}}", `Daily GD Function #${functionDay}: ${functionData.namespace == "" ? "" : `${functionData.namespace}::`}${functionData.className}::${functionData.name}!`);
                } else {
                    template = template.replaceAll("{{description}}", "What is today's daily Geometry Dash function?");
                }

                template = template.replace("{{data}}", () => JSON.stringify({
                    functionData, classes, functionIndex, functionDate, functionDay
                }))

                return new Response(
                    template,
                    {
                        headers: {
                            "Content-Type": "text/html",
                            "Cache-Control": "no-cache, no-store, max-age=-1"
                        }
                    }
                );
            },

            "/style.css": Bun.file("public/style.css"),
            "/favicon.svg": Bun.file("public/favicon.svg"),
            "/gh-icon.png": Bun.file("public/gh-icon.png"),
        },

        port: port
    });

    console.log(`Hosting Daily GD Function on port ${port}`);
}

main();
