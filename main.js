import { Temporal } from "@js-temporal/polyfill";
import * as jsc from "bun:jsc"

const firstDay = Temporal.Instant.from(process.env.FIRST_DAY ?? "2000-01-01T00:00Z");

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

    /**
     * @param {string | number} param
     * @returns {boolean}
     */
    function searchParamIsValid(param) {
        param = Number(param);
        if (isNaN(param)) return false;
        if (~~param != param) return false;
        if (~~param <= 0) return false;
        return true;
    }

    /**
     * @returns {number}
     */
    function getCurrentDay() {
        return ~~(Temporal.Now.instant().since(firstDay).total("days"));
    }

    /**
     * @param {string | null} day
     * @returns {Response}
     */
    async function serve(day) {
        if (!searchParamIsValid(day)) {
            return Response.redirect(`/${getCurrentDay()}`);
        }

        let functionDay = Number(day);

        if (functionDay > getCurrentDay()) {
            return Response.redirect(`/${getCurrentDay()}`);
        }

        let [ template, dt, source ] = await Promise.all([
            Bun.file("public/index.html").text(),
            Bun.file("public/dt.js").text(),
            Bun.file("public/main.js").text()
        ]);

        let functionDate = firstDay.add({ hours: 24 * functionDay }).toString();

        jsc.setRandomSeed(Number(Bun.hash(functionDay.toString())));
        let functionIndex = ~~(Math.random() * functions.length);
        let functionData = functions[functionIndex];

        template = template.replace("{{dt}}", () => dt);
        template = template.replace("{{source}}", () => source);

        template = template.replaceAll("{{description}}", `Daily GD Function #${functionDay}: ${functionData.namespace == "" ? "" : `${functionData.namespace}::`}${functionData.className}::${functionData.name}!`);

        template = template.replace("{{data}}", () => JSON.stringify({
            functionData, classes, functionIndex, functionDate, functionDay
        }))

        return new Response(
            template,
            {
                headers: { "Content-Type": "text/html" }
            }
        );
    }

    Bun.serve({
        routes: {
            "/:day": async req => serve(req.params.day),
            "/": async () => serve(getCurrentDay().toString()),

            "/static/:content": async req => {
                const file = Bun.file(`public/static/${req.params.content}`);
                return new Response(file);
            }
        },

        port: port,
        development: process.env.DEVELOPMENT == "true",
    });

    console.log(`Hosting Daily GD Function on port ${port}`);
}

main();
