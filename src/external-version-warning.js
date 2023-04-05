import { library, icon } from "@fortawesome/fontawesome-svg-core";
import {
  faCircleXmark,
  faCodePullRequest,
} from "@fortawesome/free-solid-svg-icons";
import { html, nothing, render, LitElement } from "lit";

import styleSheet from "./warning.css";

export class WarningElement extends LitElement {
  /** @static @property {string} - registered HTML element tag name */
  static elementName = "readthedocs-warning";

  /** @static @property {Object} - Lit reactive properties */
  static properties = {
    config: {
      state: true,
      // Update derived fields from config data
      // TODO the URLs here should come from a backend API instead
      hasChanged: (before, after) => {
        if (after && Object.keys(after).length) {
          this.urls = {
            build: `${window.location.protocol}//${after.domains.dashboard}/projects/${after.project.slug}/builds/${after.build.id}/`,
            external: `${after.project.repository_url}/pull/${after.version.slug}`,
          };
        }
      },
    },
    urls: { state: true },
  };

  /** @static @property {Object} - Lit stylesheets to apply to elements */
  static styles = styleSheet;

  constructor() {
    super();

    this.className = this.className || "raised floating";
    this.config = {};
    this.urls = {
      build: null,
      external: null,
    };
  }

  loadConfig(config) {
    this.config = config;
  }

  render() {
    // The element doesn't yet have our config, don't render it.
    if (!this.config) {
      // nothing is a special Lit response type
      return nothing;
    }

    if (
      this.config.features.external_version_warning.enabled &&
      this.config.version.external
    ) {
      return this.renderExternalVersionWarning();
    }

    // TODO support the outdated version warning
  }

  renderExternalVersionWarning() {
    library.add(faCircleXmark);
    library.add(faCodePullRequest);
    const xmark = icon(faCircleXmark, {
      title: "Close",
    });
    const iconPullRequest = icon(faCodePullRequest, {
      title: "This version is a pull request version",
      classes: ["header", "icon"],
    });

    return html`
      <div>
        ${iconPullRequest.node[0]}
        <div class="title">
          This page was created from a pull request build
          <div class="right" @click=${this.closeWarning}>${xmark.node[0]}</div>
        </div>
        <div class="content">
          This page
          <a href="${this.urls.build}">was created</a>
          from a pull request (<a href="${this.urls.external}"
            >#${this.config.version.slug}</a
          >).
        </div>
      </div>
    `;
  }

  closeWarning(e) {
    // TODO add cookie to allow closing this warning for all page views on this
    // PR build.
    this.remove();
  }
}

/**
 * Inject a warning informing the documentation comes from an external version (e.g. pull request)
 */
export function injectExternalVersionWarning(config) {
  // TODO drop this function and move this logic to index.js instead. This
  // function can go away once all addons share a similar interface for common
  // logic, like checking if an addon is enabled and customizing the adddon.
  if (WarningAddon.is_enabled) {
    return new WarningAddon(config);
  }
}

/**
 * Warning addon
 *
 * Currently this addon is used to warn readers that the documentation is built
 * from a pull request.
 *
 * The default implementation is a floating element, but this can also be hard
 * coded into the page from the author or theme author. If there is a hardcoded
 * element, we do not inject a new element, but the web component is
 * initialized as normal by the browser.
 *
 * We load the param ``config`` into the elements after creation and API
 * response, as this is needed to give hardcoded elements access to ``config``
 *
 * @param {Object} config - Addon configuration object
 */
export class WarningAddon {
  constructor(config) {
    // Load this first as it is illegal to instantiate the element class without
    // defining the custom element first.
    customElements.define("readthedocs-warning", WarningElement);

    // If there are no elements found, inject one
    let elems = document.querySelectorAll("readthedocs-warning");
    if (!elems.length) {
      elems = [new WarningElement()];
      render(elems[0], document.body);
    }

    for (const elem of elems) {
      elem.loadConfig(config);
    }
  }

  /**
   * Test if addon is enabled in the configuration
   *
   * @param {Object} config - Addon configuration object
   */
  static is_enabled(config) {
    // TODO support the outdated version warning feature here too.
    return (
      config.features &&
      config.features.external_version_warning.enabled &&
      config.version.external
    );
  }
}
