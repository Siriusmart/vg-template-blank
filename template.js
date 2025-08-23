const yaml = require("js-yaml");

class BlankTemplate {
    constructor() {}

    async toHTML(_markdown, _resources) {}

    postProcess(postProcParams) {
        this.redo = false;

        let dom = postProcParams.dom;

        dom.window.document
            .querySelectorAll(`pre code[class^="language-"]`)
            .forEach((elem) => {
                elem.classList.forEach((className) => {
                    if (!className.startsWith("language-")) return;
                    let name = className.slice(9);

                    for (let { listener, params } of this.components[name] ??
                        []) {
                        dom.window.document
                            .querySelectorAll(`pre code.language-${name}`)
                            .forEach((elem) => {
                                let inSettings =
                                    params.hasSettings ??
                                    ((params.settingsOptional ?? true)
                                        ? elem.innerHTML
                                              .split("\n")
                                              .includes("---")
                                        : true);

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

                                let settings =
                                    yaml.load(settingsLines.join("\n")) ?? {};
                                let content = contentLines.join("\n");

                                let producedElem = listener({
                                    ...postProcParams,
                                    content,
                                    options: settings,
                                    elem,
                                    dom,
                                    window: dom.window,
                                    document: dom.window.document,
                                });

                                if (producedElem != undefined) {
                                    if (!Array.isArray(producedElem)) {
                                        producedElem = [producedElem];
                                    }

                                    elem.parentNode.outerHTML = producedElem
                                        .flat(Infinity)
                                        .map((elem) =>
                                            typeof elem == "string"
                                                ? elem
                                                : elem.outerHTML == undefined
                                                  ? elem
                                                  : elem.outerHTML,
                                        )
                                        .join("");
                                }
                            });
                    }
                });
            });

        for (let [query, { listener, params }] of Object.entries(
            this.mappers ?? {},
        )) {
            dom.window.document.querySelectorAll(query).forEach((elem) =>
                listener({
                    ...postProcParams,
                    ...params,
                    elem,
                    dom,
                    window: dom.window,
                    document: dom.window.document,
                }),
            );
        }

        return this.redo;
    }

    registerMapper(query, listener, params = {}) {
        this.mappers ??= [];
        this.mappers.push([query, { listener, params }]);
    }

    registerComponent(name, listener, params = {}) {
        this.components ??= {};
        this.components[name] ??= [];
        this.components[name].push({ listener, params });
    }
}

module.exports = BlankTemplate;
