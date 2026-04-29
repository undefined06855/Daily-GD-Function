import { Temporal } from "@js-temporal/polyfill";
import * as jsc from "bun:jsc";

import dayTemplate from "./public/day.html" with { type: "text" };
import daySource from "./public/day.js" with { type: "text" };
import historyTemplate from "./public/history.html" with { type: "text" };
import historySource from "./public/history.js" with { type: "text" };
import utils from "./public/dt.js" with { type: "text" };

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

    for (let functionData of functions) {
        let overloadCount = functions.filter(data => data.name == functionData.name && data.className == functionData.className && data.namespace == functionData.namespace).length - 1;
        functionData.overloads = overloadCount;
    }

    let port = process.env.PORT ?? 443;

    /**
     * @returns {number}
     */
    function getCurrentDay() {
        return ~~(Temporal.Now.instant().since(firstDay).total("days"));
    }

    /**
     * @param {number} day
     * @returns {number}
     */
    function functionIndexForDay(day) {
        jsc.setRandomSeed(Number(Bun.hash(day.toString())));
        let index = ~~(Math.random() * functions.length);
        return index;
    }

    /**
     * @param {number} day
     * @returns {Object}
     */
    function generateHistoryData(day) {
        let data = functions[functionIndexForDay(day)];
        return {
            ...data,
            day,
            date: firstDay.add({ hours: 24 * day })
        };
    }

    let cachedHistory = [];
    for (let i = 1; i <= getCurrentDay(); i++) {
        cachedHistory.push(generateHistoryData(i));
    }

    /**
     * @param {string | number} param
     * @returns {boolean}
     */
    function searchParamIsValid(param) {
        param = Number(param);
        if (isNaN(param)) return false;
        if (~~param != param) return false;
        if (~~param <= 0) return false;
        if (~~param > getCurrentDay()) return false;
        return true;
    }

    /**
     * @param {string} day
     * @param {bool} explicitDay
     * @returns {Response}
     */
    async function serve(day, explicitDay) {
        if (!searchParamIsValid(day)) {
            return Response.redirect(`/${getCurrentDay()}`);
        }

        let functionDay = Number(day);
        let functionIndex = functionIndexForDay(functionDay);
        let functionData = functions[functionIndex];
        let functionDate = firstDay.add({ hours: 24 * day }).toString();

        let rewriter = new HTMLRewriter()
            .on(".rewrite-description", {
                element(e) {
                    if (!explicitDay) {
                        e.setAttribute("content", "What is today's Daily GD Function? Well I don't know, I'm just an embed, just click the link and find out!");
                    } else {
                        e.setAttribute("content", `Daily GD Function #${functionDay}: ${functionData.namespace == "" ? "" : `${functionData.namespace}::`}${functionData.className}::${functionData.name}!`);
                    }
                }
            })
            .on(".rewrite-script", {
                element(e) {
                    e.setInnerContent(`
                        ${utils}

                        for (let [ key, value ] of Object.entries(
                            ${JSON.stringify({
                                functionData, classes, functionIndex, functionDate, functionDay
                            })}
                        )) {
                            window[key] = value;
                        }

                        ${daySource}
                    `, { html: true });
                }
            })
            .on(".rewrite-title", {
                element(e) {
                    if (!explicitDay) {
                        e.setInnerContent("Daily GD Function");
                    } else {
                        e.setInnerContent(`Daily GD Function | ${functionDay}`);
                    }
                }
            });

        return new Response(
            rewriter.transform(dayTemplate),
            {
                headers: { "Content-Type": "text/html" }
            }
        );
    }

    /**
     * @param {string} day
     * @param {bool} explicitDay
     * @returns {Response}
     */
    async function serveAPI(day, explicitDay) {
        if (!searchParamIsValid(day)) {
            return new Response(JSON.stringify({ error: "day is not valid" }));
        }

        let functionDay = Number(day);
        let functionDate = firstDay.add({ hours: 24 * functionDay }).toString();
        let functionIndex = functionIndexForDay(functionDate);

        let functionData = functions[functionIndex]

        return new Response(JSON.stringify({
            current_day: functionDay,
            current_date: functionDate,
            current_index: functionIndex,
            current_function: functionData,

            total_count: functions.length,
            explicit_day: explicitDay,

            jsc_seed: Bun.hash(day.toString()).toString(),
        }), {
            headers: { "Content-Type": "application/json" }
        });
    }

    /**
     * @returns {Response}
     */
    async function serveHistory() {
        let history = cachedHistory;

        while (history.length < getCurrentDay()) {
            history.push(generateHistoryData(history.length + 1));
        }

        let rewriter = new HTMLRewriter()
            .on(".rewrite-description", {
                element(e) {
                    e.setAttribute("content", `History of all Daily Geometry Dash functions. Find them here. Click the link. Do it!!! Click it!!!!!! COME ON!!!!! SEEE THE HISTORY!!!!!!! NOWWWW!!!!!!`);
                }
            })
            .on(".rewrite-script", {
                element(e) {
                    e.setInnerContent(`
                        ${utils}

                        let history = ${JSON.stringify(history.slice(0, getCurrentDay()))};

                        ${historySource}
                    `, { html: true });
                }
            });

        return new Response(
            rewriter.transform(historyTemplate),
            {
                headers: { "Content-Type": "text/html" }
            }
        );
    }

    Bun.serve({
        routes: {
            "/": async () => serve(getCurrentDay().toString(), false),
            "/:day": async req => serve(req.params.day, true),

            "/api": async () => serveAPI(getCurrentDay().toString(), false),
            "/api/:day": async req => serveAPI(req.params.day, true),

            "/history": async () => serveHistory(),

            "/static/:content": async req => new Response(Bun.file(`public/static/${req.params.content}`)),
            "/favicon.ico": Response.redirect("static/favicon.svg")
        },

        port: port,
        development: process.env.DEVELOPMENT == "true",
    });

    console.log(`Hosting Daily GD Function on port ${port}`);
}

main();
