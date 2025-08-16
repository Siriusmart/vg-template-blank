const yaml = require("js-yaml");

class BlankTemplate {
    constructor() {}

    postProcess(dom) {
        for (let [name, { listener, params }] of Object.entries(
            this.components ?? {},
        )) {
            dom.window.document
                .querySelectorAll(`pre code.language-${name}`)
                .forEach((elem) => {
                    let inSettings = params.hasSettings ?? true;
                    let settingsLines = [];
                    let contentLines = [];

                    for (let line of elem.innerHTML.split("\n")) {
                        if (inSettings) {
                            if (line == "---") {
                                inSettings = false;
                                continue;
                            }

                            settingsLines.push(line);
                        } else {
                            contentLines.push(line);
                        }
                    }

                    let settings = yaml.load(settingsLines.join("\n")) ?? {};
                    let content = contentLines.join("\n");

                    let producedElem = listener({
                        content,
                        options: settings,
                        elem,
                        dom,
                        window: dom.window,
                        document: dom.window.document,
                    });

                    if (typeof producedElem == "string") {
                        elem.parentNode.outerHTML = producedElem;
                    } else if (producedElem != undefined) {
                        if (!Array.isArray(producedElem)) {
                            producedElem = [producedElem];
                        }

                        elem.parentNode.outerHTML = producedElem
                            .flat(Infinity)
                            .map((elem) =>
                                typeof elem == "string" ? elem : elem.outerHTML,
                            )
                            .join("");
                    }
                });
        }

        for (let [query, { listener, params }] of Object.entries(
            this.mappers ?? {},
        )) {
            dom.window.document.querySelectorAll(query).forEach((elem) =>
                listener(
                    {
                        elem,
                        dom,
                        window: dom.window,
                        document: dom.window.document,
                    },
                    params,
                ),
            );
        }
    }

    registerMapper(query, listener, params = {}) {
        this.mappers ??= [];
        this.mappers.push([query, { listener, params }]);
    }

    registerComponent(name, listener, params = {}) {
        this.components ??= {};
        this.components[name] = { listener, params };
    }
}

module.exports = BlankTemplate;
