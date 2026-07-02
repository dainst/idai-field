import "phoenix_html";

import Feature from "ol/Feature.js";
import Overlay from "ol/Overlay.js";
import Map from "ol/Map.js";

import { ViewHook } from "../../../../deps/phoenix_live_view/assets/js/phoenix_live_view";

export default class PreviewOverlay {
    hook: ViewHook;
    map: Map;
    overlay: Overlay;
    projectKey: string;
    projectDraftDate: string;
    constructor(
        hook: any,
        map: Map,
        container: HTMLElement,
        projectKey: string,
        projectDraftDate: string,
    ) {
        this.hook = hook;
        this.map = map;
        this.projectKey = projectKey;
        this.projectDraftDate = projectDraftDate;

        this.overlay = new Overlay({
            element: container,
            offset: [5, 5],
        });

        this.map.addOverlay(this.overlay);

        this.hide();
    }

    public update(
        features: Feature[],
        categoryLabels: { [key: string]: { [key: string]: string } },
        coordinate: number[],
        selectedLanguage: string,
        pinned: boolean = false,
    ) {
        const contentNode = this.overlay.getElement();

        while (contentNode.firstChild) {
            contentNode.removeChild(contentNode.firstChild);
        }

        if (features.length > 0) {
            contentNode.appendChild(
                this.renderPreviewList(
                    selectedLanguage,
                    categoryLabels,
                    features,
                    pinned,
                ),
            );

            const anchorPixel = this.map.getPixelFromCoordinate(coordinate);
            const mapSize = this.map.getSize();

            const right = anchorPixel[0] > mapSize[0] * 0.5 ? "right" : "left";
            const bottom = anchorPixel[1] > mapSize[1] * 0.5 ? "bottom" : "top";

            const offsetX = right == "right" ? -5 : 5;
            const offsetY = bottom == "bottom" ? -5 : 5;

            this.overlay.setPositioning(`${bottom}-${right}`);
            this.overlay.setOffset([offsetX, offsetY]);
            this.overlay.setPosition(coordinate);

            const _this = this;
            this.map
                .getTargetElement()
                .addEventListener("pointerleave", function (e) {
                    // Hides the overlay when mouse is completely off the map.
                    _this.hide();
                });
        }
    }

    public hide() {
        this.overlay.setPosition(undefined);
    }

    private renderPreviewList(
        preferredLanguage: string,
        categoryLabels: { [key: string]: { [key: string]: string } },
        features: Feature[],
        addButton: boolean,
    ) {
        const container = document.createElement("div");

        container.classList.add("flex", "gap-0.5");

        const list = document.createElement("div");
        list.classList.add("flex", "flex-col", "gap-0.5", "overflow-y-auto");

        list.style.maxHeight = `${this.hook.el.clientHeight * 0.5}px`;

        if (features.length == 0) {
            return list;
        }

        for (let feature of features) {
            if (validFeature(feature))
                list.appendChild(
                    this.renderPreviewIcon(
                        preferredLanguage,
                        categoryLabels,
                        feature,
                    ),
                );
        }

        container.appendChild(list);

        if (addButton) {
            const closeButton = document.createElement("button");

            closeButton.classList.add(
                "cursor-pointer",
                "bg-primary",
                "hover:bg-primary-hover",
                "text-primary-inverse",
                "hover:text-primary-inverse-hover",
                "p-1",
                "border",
                "border-black",
            );

            closeButton.appendChild(document.createTextNode("x"));
            closeButton.onclick = (e) => {
                window.dispatchEvent(
                    new CustomEvent(
                        `phx:close-preview-list-${this.hook.el.getAttribute("id")}`,
                    ),
                );
            };
            container.appendChild(closeButton);
        }
        return container;
    }

    private renderPreviewIcon(
        preferredLanguage: string,
        categoryLabels: { [key: string]: { [key: string]: string } },
        feature: Feature,
    ) {
        const properties = feature.getProperties();

        const preview = document.createElement("div");
        preview.classList.add("border", "border-black", "flex");

        preview.style.maxWidth = `${this.hook.el.clientWidth * 0.5 - 10}px`;

        const categoryLabel = document.createElement("div");
        categoryLabel.classList.add(
            "h-full",
            "bg-white/60",
            "p-1",
            "font-thin",
        );

        categoryLabel.appendChild(
            document.createTextNode(
                `${pickTranslation(categoryLabels[properties.category], preferredLanguage)}`,
            ),
        );

        const categoryInfo = document.createElement("div");
        categoryInfo.classList.add("pl-2", "text-black");
        categoryInfo.style.background = `hsl(from ${properties.color} h calc(s * 0.5) l)`;

        categoryInfo.appendChild(categoryLabel);

        const documentInfo = document.createElement("div");
        documentInfo.classList.add(
            "document-info",
            "grow",
            "p-1",
            "h-full",
            "bg-white",
            "cursor-pointer",
        );

        let documentInfoText = properties.identifier;

        if (Object.keys(properties.description).length > 0) {
            documentInfoText += ` | ${pickTranslation(properties.description, preferredLanguage)}`;
        }

        documentInfo.appendChild(document.createTextNode(documentInfoText));

        const _this = this;

        documentInfo.addEventListener("click", function (event) {
            return _this.hook
                .js()
                .navigate(
                    `/projects/${_this.projectKey}/${_this.projectDraftDate}/${properties.uuid}`,
                );
        });

        preview.appendChild(categoryInfo);
        preview.appendChild(documentInfo);

        return preview;
    }
}

function pickTranslation(options: { [key: string]: string }, selected: string) {
    if (options[selected]) return options[selected];
    if (options["en"]) return options["en"];

    return options[Object.keys(options)[0]];
}

function validFeature(feature: Feature) {
    const properties = feature.getProperties();
    return (
        properties.uuid &&
        properties.identifier &&
        properties.color &&
        properties.category
    );
}
